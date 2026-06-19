import { useSyncExternalStore } from "react";
import { logAudit } from "./audit";
import { safeGetItem, safeSetItem } from "../lib/safe-storage";

export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: number;
  tags: string[];
};

const KEY = "ippoo:admin-media";
const MAX_BYTES = 1_500_000;

function load(): MediaAsset[] {
  try {
    const raw = safeGetItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MediaAsset[];
  } catch {
    return [];
  }
}

let state: MediaAsset[] = load();
const listeners = new Set<() => void>();

function persist() {
  safeSetItem(KEY, JSON.stringify(state));
}

function emit() { persist(); listeners.forEach((l) => l()); }

export function getMedia(): MediaAsset[] { return state; }

export function subscribeMedia(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }

export function useMedia(): MediaAsset[] {
  return useSyncExternalStore(subscribeMedia, getMedia, getMedia);
}

function readImageMeta(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

export async function uploadMedia(file: File, tags: string[] = []): Promise<{ ok: true; asset: MediaAsset } | { ok: false; error: string }> {
  if (!file.type.startsWith("image/")) return { ok: false, error: "Format non supporté (image uniquement)" };
  if (file.size > MAX_BYTES) return { ok: false, error: `Fichier trop volumineux (max ${Math.round(MAX_BYTES / 1024)} Ko)` };
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
  const meta = await readImageMeta(dataUrl);
  const asset: MediaAsset = {
    id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name: file.name,
    url: dataUrl,
    mime: file.type,
    size: file.size,
    width: meta.width,
    height: meta.height,
    uploadedAt: Date.now(),
    tags,
  };
  state = [asset, ...state];
  emit();
  logAudit("media.upload", file.name, { size: file.size, mime: file.type });
  return { ok: true, asset };
}

export async function uploadFromUrl(url: string, name = "image"): Promise<{ ok: true; asset: MediaAsset } | { ok: false; error: string }> {
  if (!/^https?:\/\//i.test(url) && !url.startsWith("data:")) return { ok: false, error: "URL invalide" };
  const meta = await readImageMeta(url);
  const asset: MediaAsset = {
    id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    name,
    url,
    mime: url.startsWith("data:") ? url.slice(5, url.indexOf(";")) : "image/external",
    size: 0,
    width: meta.width,
    height: meta.height,
    uploadedAt: Date.now(),
    tags: ["external"],
  };
  state = [asset, ...state];
  emit();
  logAudit("media.link", name, { url: url.slice(0, 60) });
  return { ok: true, asset };
}

export function deleteMedia(id: string) {
  const a = state.find((x) => x.id === id);
  state = state.filter((x) => x.id !== id);
  emit();
  if (a) logAudit("media.delete", a.name, { id });
}

export function updateMediaTags(id: string, tags: string[]) {
  state = state.map((a) => (a.id === id ? { ...a, tags } : a));
  emit();
}

export function renameMedia(id: string, name: string) {
  state = state.map((a) => (a.id === id ? { ...a, name } : a));
  emit();
}

export function clearMedia() {
  state = [];
  emit();
  logAudit("media.clear", "Médiathèque vidée");
}
