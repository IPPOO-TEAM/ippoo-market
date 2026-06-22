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
