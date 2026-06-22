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
