-- ═══════════════════════════════════════════════════════════════
-- IPPOO Market — Migration 0005 : messagerie
-- À exécuter UNE FOIS dans Supabase → SQL Editor (après 0004).
-- Repli KV automatique tant que les tables n'existent pas.
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
create index if not exists conversations_participants_idx on public.conversations using gin (participants);
create index if not exists conversations_updated_idx       on public.conversations (updated_at desc);

create table if not exists public.messages (
  id          text primary key,
  conv_id     text not null references public.conversations(id) on delete cascade,
  sender_id   text not null,
  sender_email text,
  type        text not null default 'text',
  text        text not null default '',
  attachment  jsonb,
  ts          bigint not null default 0
);
create index if not exists messages_conv_idx on public.messages (conv_id, ts);

create table if not exists public.conversation_reads (
  conv_id      text not null,
  user_id      text not null,
  last_read_at bigint not null default 0,
  primary key (conv_id, user_id)
);

alter table public.conversations      enable row level security;
alter table public.messages           enable row level security;
alter table public.conversation_reads enable row level security;
