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
