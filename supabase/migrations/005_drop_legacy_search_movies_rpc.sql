-- UpNext — Elimină RPC orfan search_movies_by_embedding
-- Rulează acest fișier în Supabase Dashboard > SQL Editor
--
-- Context (security-audit-3, punct [3]):
-- search_movies_by_embedding e SECURITY DEFINER, apelabilă public de
-- anon/authenticated via /rest/v1/rpc/search_movies_by_embedding, dar
-- interoghează tabela legacy movie_embeddings, inexistentă după unificarea
-- cu TV (commit 3974959, tabela a devenit media_embeddings). Orice apel dă
-- eroare acum — impact neglijabil, dar e suprafață de atac moartă rămasă
-- din refactor. Funcția nu apare în niciun migration file existent (era
-- deja pe remote înainte de reconcilierea din 003/004).

DROP FUNCTION IF EXISTS public.search_movies_by_embedding(text, integer);
