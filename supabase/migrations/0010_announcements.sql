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
