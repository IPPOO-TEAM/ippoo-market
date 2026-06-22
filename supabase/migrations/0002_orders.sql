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
