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
