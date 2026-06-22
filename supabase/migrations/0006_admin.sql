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
