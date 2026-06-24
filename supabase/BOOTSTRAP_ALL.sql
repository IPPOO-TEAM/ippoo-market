-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Bootstrap COMPLET de la base (self-hosted)
-- À exécuter UNE FOIS dans Supabase Studio → SQL Editor.
-- Idempotent (create ... if not exists) : ré-exécutable sans risque.
-- ═══════════════════════════════════════════════════════════════

-- ── Table clé/valeur (cœur du backend Figma Make) ──
create table if not exists public.kv_store_cc347259 (
  key   text not null primary key,
  value jsonb not null
);
alter table public.kv_store_cc347259 enable row level security;

-- ╔════ 0001_shop_reviews.sql ════╗
-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration relationnelle 0001 : avis boutique
-- À exécuter UNE FOIS dans Supabase → SQL Editor.
-- Domaine pilote de la bascule KV → Postgres. Le backend détecte
-- automatiquement la présence de cette table et bascule dessus ;
-- tant qu'elle n'existe pas, il continue d'utiliser le KV store.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.shop_reviews (
  id           text primary key,
  shop_slug    text not null,
  author_id    uuid,
  author_name  text not null default 'Client',
  rating       smallint not null check (rating between 1 and 5),
  comment      text not null default '',
  vendor_reply text,
  status       text not null default 'pending'
               check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Index pour les requêtes les plus fréquentes (liste par boutique,
-- filtrage par statut, avis d'un auteur).
create index if not exists shop_reviews_slug_idx     on public.shop_reviews (shop_slug);
create index if not exists shop_reviews_status_idx   on public.shop_reviews (shop_slug, status);
create index if not exists shop_reviews_author_idx   on public.shop_reviews (author_id);
create index if not exists shop_reviews_created_idx  on public.shop_reviews (created_at desc);

-- RLS : seul le service-role (utilisé par l'edge function) accède aux
-- données. Aucun accès anon/authenticated direct → cohérent avec le
-- modèle actuel où tout transite par l'edge function sécurisée.
alter table public.shop_reviews enable row level security;

-- (Aucune policy pour anon/authenticated : accès refusé par défaut.
--  Le service-role contourne la RLS.)

-- ╔════ 0002_orders.sql ════╗
-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration relationnelle 0002 : commandes & escrow
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après 0001).
-- Le backend détecte ces tables et bascule dessus ; tant qu'elles
-- n'existent pas, il continue d'utiliser le KV store (zéro rupture).
-- ═══════════════════════════════════════════════════════════════

-- ── Commandes ──
create table if not exists public.orders (
  id               text primary key,
  user_id          uuid not null,
  shipping_address jsonb not null default '{}'::jsonb,
  payment_method   text not null,
  total            bigint not null default 0,
  commission       bigint not null default 0,
  vendor_shares    jsonb not null default '{}'::jsonb,
  items            jsonb not null default '[]'::jsonb,
  status           text not null default 'pending',
  escrow_status    text not null default 'held',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists orders_user_idx    on public.orders (user_id);
create index if not exists orders_created_idx  on public.orders (created_at desc);
create index if not exists orders_status_idx   on public.orders (status);

-- ── Lignes de commande (projection normalisée pour requêtes vendeur) ──
create table if not exists public.order_items (
  id          bigserial primary key,
  order_id    text not null references public.orders(id) on delete cascade,
  product_id  text not null,
  vendor_id   text not null,
  title       text not null default '',
  unit_price  bigint not null default 0,
  qty         integer not null default 1
);
create index if not exists order_items_order_idx   on public.order_items (order_id);
create index if not exists order_items_vendor_idx  on public.order_items (vendor_id);

-- ── Séquestre (escrow) ──
create table if not exists public.escrows (
  order_id      text primary key references public.orders(id) on delete cascade,
  user_id       uuid not null,
  vendor_shares jsonb not null default '{}'::jsonb,
  total         bigint not null default 0,
  status        text not null default 'held' check (status in ('held','released')),
  created_at    timestamptz not null default now(),
  released_at   timestamptz
);
create index if not exists escrows_status_idx on public.escrows (status);

-- RLS : accès réservé au service-role (edge function). Aucun accès direct.
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.escrows     enable row level security;

-- ╔════ 0003_catalog.sql ════╗
-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration relationnelle 0003 : catalogue
-- (vendeurs publics + produits publics)
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après 0002).
-- Repli KV automatique tant que les tables n'existent pas.
-- ═══════════════════════════════════════════════════════════════

-- ── Vendeurs publics (annuaire) ──
-- 1 enregistrement par propriétaire. Les champs riches/évolutifs
-- (logo, téléphone, statut boutique, etc.) sont conservés dans `data`
-- pour préserver exactement la forme renvoyée au frontend.
create table if not exists public.public_vendors (
  owner_id    uuid primary key,
  name        text not null,
  city        text,
  niche       text,
  description text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
create index if not exists public_vendors_niche_idx   on public.public_vendors (niche);
create index if not exists public_vendors_updated_idx  on public.public_vendors (updated_at desc);

-- ── Produits publics (catalogue cross-vendeurs) ──
create table if not exists public.public_products (
  owner_id    uuid not null,
  product_id  text not null,
  name        text not null,
  price       bigint not null default 0,
  category    text,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (owner_id, product_id)
);
create index if not exists public_products_owner_idx     on public.public_products (owner_id);
create index if not exists public_products_category_idx   on public.public_products (category);
create index if not exists public_products_updated_idx    on public.public_products (updated_at desc);

-- RLS : accès réservé au service-role (edge function).
alter table public.public_vendors  enable row level security;
alter table public.public_products enable row level security;

-- ╔════ 0004_transactions.sql ════╗
-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration 0004 : devis & wallet
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après 0003).
-- Repli KV automatique tant que les tables n'existent pas.
-- ═══════════════════════════════════════════════════════════════

-- ── Devis (RFQ) ── un enregistrement par devis, réponses embarquées.
create table if not exists public.devis (
  id                 text primary key,
  buyer_id           uuid not null,
  status             text not null default 'open',
  target_vendor_ids  text[] not null default '{}',
  data               jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists devis_buyer_idx   on public.devis (buyer_id);
create index if not exists devis_targets_idx  on public.devis using gin (target_vendor_ids);
create index if not exists devis_status_idx   on public.devis (status);

-- ── Wallet ──
create table if not exists public.wallets (
  user_id    uuid primary key,
  balance    bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id      text primary key,
  user_id uuid not null,
  amount  bigint not null,
  reason  text not null default '',
  meta    jsonb not null default '{}'::jsonb,
  at      timestamptz not null default now()
);
create index if not exists wallet_tx_user_idx on public.wallet_transactions (user_id, at desc);

alter table public.devis               enable row level security;
alter table public.wallets             enable row level security;
alter table public.wallet_transactions enable row level security;

-- ╔════ 0005_messaging.sql ════╗
-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration 0005 : messagerie
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après 0004).
-- Repli KV automatique tant que les tables n'existent pas.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.conversations (
  id             text primary key,
  participants   text[] not null default '{}',
  title          text,
  avatar         text,
  last_message   text not null default '',
  last_ts        bigint not null default 0,
  last_sender_id text,
  updated_at     bigint not null default 0
);
create index if not exists conversations_participants_idx on public.conversations using gin (participants);
create index if not exists conversations_updated_idx       on public.conversations (updated_at desc);

create table if not exists public.messages (
  id          text primary key,
  conv_id     text not null references public.conversations(id) on delete cascade,
  sender_id   text not null,
  sender_email text,
  type        text not null default 'text',
  text        text not null default '',
  attachment  jsonb,
  ts          bigint not null default 0
);
create index if not exists messages_conv_idx on public.messages (conv_id, ts);

create table if not exists public.conversation_reads (
  conv_id      text not null,
  user_id      text not null,
  last_read_at bigint not null default 0,
  primary key (conv_id, user_id)
);

alter table public.conversations      enable row level security;
alter table public.messages           enable row level security;
alter table public.conversation_reads enable row level security;

-- ╔════ 0006_admin.sql ════╗
-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration 0006 : kyc, avis génériques, support,
-- promos, payouts, catégories, plans, abonnements, audit
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après 0005).
-- Repli KV automatique tant que les tables n'existent pas.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.kyc (
  user_id    uuid primary key,
  status     text not null default 'pending',
  reason     text,
  data       jsonb not null default '{}'::jsonb,
  decided_at bigint,
  decided_by uuid,
  updated_at timestamptz not null default now()
);
create index if not exists kyc_status_idx on public.kyc (status);

-- Avis génériques (produit/vendeur) — module `reviews` (≠ shop_reviews).
create table if not exists public.reviews (
  id          text primary key,
  target_type text not null,
  target_id   text not null,
  user_id     uuid,
  user_email  text,
  rating      smallint not null check (rating between 1 and 5),
  comment     text not null default '',
  status      text not null default 'active',
  created_at  bigint not null default 0
);
create index if not exists reviews_target_idx on public.reviews (target_type, target_id);

create table if not exists public.support_tickets (
  id         text primary key,
  user_id    uuid,
  user_email text,
  subject    text not null,
  message    text not null,
  category   text not null default 'general',
  priority   text not null default 'normal',
  status     text not null default 'open',
  replies    jsonb not null default '[]'::jsonb,
  created_at bigint not null default 0,
  updated_at bigint not null default 0
);
create index if not exists support_tickets_status_idx on public.support_tickets (status, updated_at desc);

create table if not exists public.promos (
  code       text primary key,
  data       jsonb not null default '{}'::jsonb,
  active     boolean not null default true,
  created_at bigint not null default 0,
  updated_at bigint not null default 0
);

create table if not exists public.payouts (
  id         text primary key,
  vendor_id  text not null,
  amount     bigint not null default 0,
  status     text not null default 'pending',
  data       jsonb not null default '{}'::jsonb,
  created_at bigint not null default 0,
  updated_at bigint not null default 0
);
create index if not exists payouts_vendor_idx on public.payouts (vendor_id);

create table if not exists public.categories (
  id         text primary key,
  data       jsonb not null default '{}'::jsonb,
  sort_order bigint not null default 0
);

create table if not exists public.plans (
  id         text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at bigint not null default 0
);

create table if not exists public.audit_log (
  id          text primary key,
  ts          bigint not null default 0,
  admin_id    uuid,
  admin_email text,
  action      text not null,
  meta        jsonb
);
create index if not exists audit_log_ts_idx on public.audit_log (ts desc);

alter table public.kyc             enable row level security;
alter table public.reviews         enable row level security;
alter table public.support_tickets enable row level security;
alter table public.promos          enable row level security;
alter table public.payouts         enable row level security;
alter table public.categories      enable row level security;
alter table public.plans           enable row level security;
alter table public.audit_log       enable row level security;

-- ╔════ 0007_orders_meta.sql ════╗
-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration 0007 : métadonnées paiement & facturation
-- Ajoute colonnes pour persister mobile money operator, devise,
-- TVA et numéro de facture côté serveur (validation et traçabilité).
-- ═══════════════════════════════════════════════════════════════

alter table public.orders
  add column if not exists mobile_provider text,
  add column if not exists currency        text not null default 'XOF',
  add column if not exists vat             bigint not null default 0,
  add column if not exists invoice_number  text;

create index if not exists orders_invoice_idx on public.orders (invoice_number);

-- Séquence atomique pour numéros de facture par boutique/année.
create table if not exists public.invoice_sequences (
  scope    text primary key,           -- ex. 'shop-slug:2026'
  next_seq integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.invoice_sequences enable row level security;

