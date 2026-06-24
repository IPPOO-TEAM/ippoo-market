-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Bootstrap COMPLET de la base (self-hosted)
-- À exécuter UNE FOIS dans Supabase Studio → SQL Editor.
-- Idempotent : ré-exécutable sans risque.
-- Inclut : tables + Realtime + policies RLS + annonces.
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
-- Robuste : si une table générique `messages`/`conversations` existe
-- déjà sans les bonnes colonnes, on les ajoute (ADD COLUMN IF NOT EXISTS)
-- avant de créer les index.
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
-- Filet de sécurité si la table préexistait avec un autre schéma.
alter table public.conversations add column if not exists participants   text[] not null default '{}';
alter table public.conversations add column if not exists title          text;
alter table public.conversations add column if not exists avatar         text;
alter table public.conversations add column if not exists last_message   text not null default '';
alter table public.conversations add column if not exists last_ts        bigint not null default 0;
alter table public.conversations add column if not exists last_sender_id text;
alter table public.conversations add column if not exists updated_at     bigint not null default 0;

create index if not exists conversations_participants_idx on public.conversations using gin (participants);
create index if not exists conversations_updated_idx       on public.conversations (updated_at desc);

create table if not exists public.messages (
  id          text primary key,
  conv_id     text not null,
  sender_id   text not null,
  sender_email text,
  type        text not null default 'text',
  text        text not null default '',
  attachment  jsonb,
  ts          bigint not null default 0
);
-- Filet de sécurité si une table `messages` préexistait (sans conv_id, etc.).
alter table public.messages add column if not exists conv_id      text;
alter table public.messages add column if not exists sender_id    text;
alter table public.messages add column if not exists sender_email text;
alter table public.messages add column if not exists type         text not null default 'text';
alter table public.messages add column if not exists text         text not null default '';
alter table public.messages add column if not exists attachment   jsonb;
alter table public.messages add column if not exists ts           bigint not null default 0;

create index if not exists messages_conv_idx on public.messages (conv_id, ts);

create table if not exists public.conversation_reads (
  conv_id      text not null,
  user_id      text not null,
  last_read_at bigint not null default 0,
  primary key (conv_id, user_id)
);
alter table public.conversation_reads add column if not exists conv_id      text;
alter table public.conversation_reads add column if not exists user_id      text;
alter table public.conversation_reads add column if not exists last_read_at bigint not null default 0;

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

-- ╔════ 0008_realtime.sql ════╗
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

-- ╔════ 0009_rls_realtime_policies.sql ════╗
-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration 0009 : policies RLS pour le Realtime client
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après 0008).
--
-- Objectif : rendre le Realtime utile depuis le navigateur SANS exposer
-- les données sensibles.
--   • Catalogue public (produits, vendeurs, avis approuvés, promos,
--     catégories, annonces) → lecture anon + authenticated.
--   • Messagerie → lecture réservée aux participants de la conversation.
--   • Données sensibles (commandes, escrow, wallet, devis, kyc, support,
--     payouts, abonnements, audit, kv_store) → AUCUNE policy =
--     service-role uniquement (l'app y accède via Edge Functions).
--
-- Idempotent : chaque policy est recréée (drop if exists puis create).
-- ═══════════════════════════════════════════════════════════════

-- ── Helper : (re)crée une policy SELECT pour anon+authenticated ──
do $$
declare
  t text;
  public_tables text[] := array[
    'public_products', 'public_vendors',
    'promos', 'categories', 'plans'
  ];
begin
  foreach t in array public_tables loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t) then
      execute format('drop policy if exists %I on public.%I', t || '_read_all', t);
      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (true)',
        t || '_read_all', t
      );
    end if;
  end loop;
end $$;

-- ── Avis boutique : seuls les avis approuvés sont lisibles publiquement ──
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'shop_reviews') then
    drop policy if exists shop_reviews_read_approved on public.shop_reviews;
    create policy shop_reviews_read_approved on public.shop_reviews
      for select to anon, authenticated
      using (status = 'approved');
  end if;
end $$;

-- ── Messagerie : lecture réservée aux participants ──
-- participants est un text[] d'identifiants utilisateur (auth.uid()).
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'conversations') then
    drop policy if exists conversations_read_participants on public.conversations;
    create policy conversations_read_participants on public.conversations
      for select to authenticated
      using (auth.uid()::text = any(participants));
  end if;

  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'messages') then
    drop policy if exists messages_read_participants on public.messages;
    create policy messages_read_participants on public.messages
      for select to authenticated
      using (
        exists (
          select 1 from public.conversations c
          where c.id = messages.conv_id
            and auth.uid()::text = any(c.participants)
        )
      );
  end if;

  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'conversation_reads') then
    drop policy if exists conversation_reads_self on public.conversation_reads;
    create policy conversation_reads_self on public.conversation_reads
      for select to authenticated
      using (auth.uid()::text = user_id);
  end if;
end $$;

-- ── Avis génériques (produit/vendeur) : lecture publique des visibles ──
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'reviews') then
    drop policy if exists reviews_read_visible on public.reviews;
    -- Lecture publique ; si une colonne `status`/`hidden` existe, on filtre.
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = 'reviews' and column_name = 'status') then
      create policy reviews_read_visible on public.reviews
        for select to anon, authenticated
        using (status is distinct from 'hidden');
    else
      create policy reviews_read_visible on public.reviews
        for select to anon, authenticated using (true);
    end if;
  end if;
end $$;

-- NB : aucune policy INSERT/UPDATE/DELETE n'est créée → toute écriture
-- continue de passer exclusivement par le service-role (Edge Functions).

-- ╔════ 0010_announcements.sql ════╗
-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration 0010 : annonces plateforme (broadcast)
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après 0009).
-- Stocke les bannières d'annonce diffusées à l'audience choisie.
-- Realtime activé + lecture publique des annonces actives & en fenêtre.
-- Écriture réservée au service-role (Edge Functions admin).
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.announcements (
  id          text primary key,
  title       text not null,
  body        text not null default '',
  level       text not null default 'info'
              check (level in ('info','success','warning','critical')),
  audience    text not null default 'all'
              check (audience in ('all','buyers','vendors','admin')),
  starts_at   bigint not null default 0,
  ends_at     bigint,
  active      boolean not null default true,
  created_at  bigint not null default 0
);
create index if not exists announcements_active_idx   on public.announcements (active);
create index if not exists announcements_audience_idx  on public.announcements (audience);
create index if not exists announcements_created_idx   on public.announcements (created_at desc);

alter table public.announcements enable row level security;

-- Realtime
alter table public.announcements replica identity full;
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  begin
    alter publication supabase_realtime add table public.announcements;
  exception when duplicate_object then null; when others then null;
  end;
end $$;

-- Lecture publique des annonces actives (le filtrage fenêtre/audience fin
-- se fait côté client ; ici on n'expose que les actives, jamais les brouillons).
drop policy if exists announcements_read_active on public.announcements;
create policy announcements_read_active on public.announcements
  for select to anon, authenticated
  using (active = true);

