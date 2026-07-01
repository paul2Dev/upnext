-- UpNext — Fix: media_embeddings are RLS activ dar 0 policies pe DB live
-- Rulează acest fișier în Supabase Dashboard > SQL Editor
--
-- Context (security-audit-3, punct [1]):
-- 002_semantic_search.sql definește un SELECT policy pentru authenticated pe
-- media_embeddings, dar 3 migrări au fost aplicate direct pe remote fără să fie
-- salvate ca fișiere (search_usage_daily_limit, fix_increment_search_usage,
-- fix_media_embeddings_composite_pk). Ultima a schimbat PK-ul la composite
-- (movie_id, media_type) și a șters silențios policy-ul original.
--
-- Azi e inofensiv din întâmplare: toate citirile trec prin RPC SECURITY DEFINER
-- (search_media_by_embedding) sau serverSupabaseServiceRole, ambele ocolesc RLS.
-- Fără acest fix, orice cod nou care citește media_embeddings via
-- serverSupabaseClient (user-scoped) ar returna 0 rânduri silențios, fără eroare.

-- Idempotent: sigur de rulat chiar dacă policy-ul există deja
DROP POLICY IF EXISTS "Authenticated users can read embeddings" ON public.media_embeddings;

CREATE POLICY "Authenticated users can read embeddings"
  ON public.media_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- Notă: PK-ul composite (movie_id, media_type) de pe remote e deja aliniat cu
-- definiția din 002_semantic_search.sql — nu necesită nicio schimbare aici.
