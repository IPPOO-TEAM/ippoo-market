/* ═══════════════════════════════════════════
   IPPOO — Store d'engagement Blog
   Persiste localement : favoris d'articles, abonnement
   newsletter, abonnements par article, votes "utile",
   réponses, avis utilisateurs et compteurs de vues.
   Utilise useSyncExternalStore pour rester réactif.
   ═══════════════════════════════════════════ */

import { useSyncExternalStore } from "react";
import { scopedGetItem, scopedSetItem } from "../lib/scoped-storage";

const BOOKMARKS_KEY = "ippoo:blog:bookmarks";
const SUBSCRIBED_ARTICLES_KEY = "ippoo:blog:subscribed-articles";
const NEWSLETTER_KEY = "ippoo:blog:newsletter";
const NOTIFY_FLAG_KEY = "ippoo:blog:notify";
const HELPFUL_KEY = "ippoo:blog:helpful";
const REPLIES_KEY = "ippoo:blog:replies";
const USER_REVIEWS_KEY = "ippoo:blog:user-reviews";
const VIEWS_KEY = "ippoo:blog:views";

export type UserReview = {
  id: string;
  articleId: number;
  name: string;
  rating: number;
  text: string;
  date: string;
  helpful: number;
};

export type UserReply = {
  id: string;
  reviewKey: string;
  name: string;
  text: string;
  date: string;
};

type State = {
  bookmarks: number[];
  subscribedArticles: number[];
  newsletterEmail: string | null;
  notifyEnabled: boolean;
  /** map reviewKey -> count delta from the user (each user can like once per key). */
  helpful: Record<string, number>;
  replies: UserReply[];
  userReviews: UserReview[];
  views: Record<number, number>;
};

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = scopedGetItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson<T>(key: string, value: T) {
  scopedSetItem(key, JSON.stringify(value));
}

let state: State = {
  bookmarks: readJson<number[]>(BOOKMARKS_KEY, []),
  subscribedArticles: readJson<number[]>(SUBSCRIBED_ARTICLES_KEY, []),
  newsletterEmail: scopedGetItem(NEWSLETTER_KEY),
  notifyEnabled: scopedGetItem(NOTIFY_FLAG_KEY) === "1",
  helpful: readJson<Record<string, number>>(HELPFUL_KEY, {}),
  replies: readJson<UserReply[]>(REPLIES_KEY, []),
  userReviews: readJson<UserReview[]>(USER_REVIEWS_KEY, []),
  views: readJson<Record<number, number>>(VIEWS_KEY, {}),
};

function persist() {
  writeJson(BOOKMARKS_KEY, state.bookmarks);
  writeJson(SUBSCRIBED_ARTICLES_KEY, state.subscribedArticles);
  if (state.newsletterEmail != null) scopedSetItem(NEWSLETTER_KEY, state.newsletterEmail);
  scopedSetItem(NOTIFY_FLAG_KEY, state.notifyEnabled ? "1" : "0");
  writeJson(HELPFUL_KEY, state.helpful);
  writeJson(REPLIES_KEY, state.replies);
  writeJson(USER_REVIEWS_KEY, state.userReviews);
  writeJson(VIEWS_KEY, state.views);
}

function setState(updater: (s: State) => State) {
  state = updater(state);
  persist();
  emit();
}

/* ── Bookmarks ── */
export function isBookmarked(articleId: number): boolean {
  return state.bookmarks.includes(articleId);
}
export function toggleBookmark(articleId: number): boolean {
  const exists = state.bookmarks.includes(articleId);
  setState((s) => ({ ...s, bookmarks: exists ? s.bookmarks.filter((x) => x !== articleId) : [articleId, ...s.bookmarks] }));
  return !exists;
}

/* ── Subscriptions par article ── */
export function isSubscribed(articleId: number): boolean {
  return state.subscribedArticles.includes(articleId);
}
export function toggleSubscribe(articleId: number): boolean {
  const exists = state.subscribedArticles.includes(articleId);
  setState((s) => ({ ...s, subscribedArticles: exists ? s.subscribedArticles.filter((x) => x !== articleId) : [articleId, ...s.subscribedArticles] }));
  return !exists;
}

/* ── Newsletter ── */
export function getNewsletterEmail(): string | null { return state.newsletterEmail; }
export function setNewsletterEmail(email: string | null) {
  setState((s) => ({ ...s, newsletterEmail: email }));
}

/* ── Notifications blog ── */
export function isNotifyEnabled(): boolean { return state.notifyEnabled; }
export function toggleNotify(): boolean {
  const next = !state.notifyEnabled;
  setState((s) => ({ ...s, notifyEnabled: next }));
  return next;
}

/* ── Votes "Utile" ── */
export function isHelpfulLiked(reviewKey: string): boolean {
  return (state.helpful[reviewKey] ?? 0) > 0;
}
export function toggleHelpful(reviewKey: string): boolean {
  const liked = isHelpfulLiked(reviewKey);
  setState((s) => {
    const next = { ...s.helpful };
    if (liked) delete next[reviewKey];
    else next[reviewKey] = 1;
    return { ...s, helpful: next };
  });
  return !liked;
}

/* ── Réponses ── */
export function getReplies(reviewKey: string): UserReply[] {
  return state.replies.filter((r) => r.reviewKey === reviewKey);
}
export function addReply(reviewKey: string, name: string, text: string): UserReply {
  const reply: UserReply = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    reviewKey, name, text, date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
  };
  setState((s) => ({ ...s, replies: [...s.replies, reply] }));
  return reply;
}

/* ── Avis utilisateurs ── */
export function getUserReviews(articleId: number): UserReview[] {
  return state.userReviews.filter((r) => r.articleId === articleId);
}
export function addUserReview(articleId: number, name: string, rating: number, text: string): UserReview {
  const review: UserReview = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    articleId, name, rating, text,
    date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
    helpful: 0,
  };
  setState((s) => ({ ...s, userReviews: [review, ...s.userReviews] }));
  return review;
}

/* ── Vues ── */
export function getViews(articleId: number): number {
  return state.views[articleId] ?? 0;
}
export function incrementViews(articleId: number) {
  setState((s) => ({ ...s, views: { ...s.views, [articleId]: (s.views[articleId] ?? 0) + 1 } }));
}

/* ── Hook React ── */
export function useBlogEngagement(): State {
  return useSyncExternalStore(subscribe, () => state, () => state);
}
