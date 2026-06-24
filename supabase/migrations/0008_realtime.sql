-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration 0008 : activer Realtime sur toutes les tables
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après 0007).
-- Ajoute chaque table publique à la publication `supabase_realtime`
-- afin que les changements (INSERT/UPDATE/DELETE) soient diffusés.
--
-- Idempotent : on ignore l'erreur "déjà membre de la publication".
-- REPLICA IDENTITY FULL → les events UPDATE/DELETE incluent l'ancienne
-- ligne complète (utile pour le filtrage côté client).
-- ═══════════════════════════════════════════════════════════════

-- Crée la publication si elle n'existe pas (self-hosted fraîche).
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare
  t text;
  tables text[] := array[
    'kv_store_cc347259',
    'shop_reviews',
    'orders', 'order_items', 'escrows',
    'public_vendors', 'public_products',
    'devis', 'wallets', 'wallet_transactions',
    'conversations', 'messages', 'conversation_reads',
    'kyc', 'reviews', 'support', 'promos', 'payouts',
    'categories', 'plans', 'subscriptions', 'audit_log'
  ];
begin
  foreach t in array tables loop
    -- Ne traite que les tables réellement présentes.
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      -- REPLICA IDENTITY FULL pour des events complets.
      execute format('alter table public.%I replica identity full', t);
      -- Ajout à la publication (ignore si déjà membre).
      begin
        execute format('alter publication supabase_realtime add table public.%I', t);
      exception
        when duplicate_object then null;  -- déjà dans la publication
        when others then null;            -- tolérant (table absente, etc.)
      end;
    end if;
  end loop;
end $$;
