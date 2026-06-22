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
