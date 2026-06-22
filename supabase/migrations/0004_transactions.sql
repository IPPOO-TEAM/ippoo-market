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
