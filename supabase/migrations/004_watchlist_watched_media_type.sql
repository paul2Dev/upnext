-- UpNext — Documentează media_type + restrânge unique constraint
-- Rulează acest fișier în Supabase Dashboard > SQL Editor
--
-- Context (security-audit-3, punct [2]):
-- watchlist și watched au live o coloană media_type (text, default 'movie')
-- care nu apare în 001_initial_schema.sql — a fost adăugată direct pe remote,
-- fără migration file. Unique constraint a rămas (user_id, movie_id), deci un
-- film și un serial cu același TMDB ID nu pot coexista în watchlist/watched
-- ale aceluiași user (coliziune pe constraint). Codul din server/api/user/
-- tratează deja (user_id, movie_id, media_type) ca cheie naturală (vezi
-- watchlist.post.ts, ratings.post.ts) — doar constraint-ul din DB e în urmă.

-- Documentează coloana media_type (idempotent — nu face nimic dacă există deja)
ALTER TABLE public.watchlist
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'movie';

ALTER TABLE public.watched
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'movie';

-- Restrânge unique constraint la (user_id, movie_id, media_type).
-- Caută dinamic numele constraint-ului existent pe (user_id, movie_id) —
-- nu presupune numele implicit, ca să funcționeze indiferent cum a fost
-- denumit istoric pe remote.
DO $$
DECLARE
  old_name text;
BEGIN
  SELECT tc.constraint_name INTO old_name
  FROM information_schema.table_constraints tc
  JOIN (
    SELECT constraint_name, array_agg(column_name::text ORDER BY column_name) AS cols
    FROM information_schema.key_column_usage
    WHERE table_schema = 'public' AND table_name = 'watchlist'
    GROUP BY constraint_name
  ) kcu ON kcu.constraint_name = tc.constraint_name
  WHERE tc.table_schema = 'public' AND tc.table_name = 'watchlist'
    AND tc.constraint_type = 'UNIQUE'
    AND kcu.cols = ARRAY['movie_id', 'user_id'];

  IF old_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.watchlist DROP CONSTRAINT %I', old_name);
  END IF;
END $$;

ALTER TABLE public.watchlist
  ADD CONSTRAINT watchlist_user_id_movie_id_media_type_key
  UNIQUE (user_id, movie_id, media_type);

DO $$
DECLARE
  old_name text;
BEGIN
  SELECT tc.constraint_name INTO old_name
  FROM information_schema.table_constraints tc
  JOIN (
    SELECT constraint_name, array_agg(column_name::text ORDER BY column_name) AS cols
    FROM information_schema.key_column_usage
    WHERE table_schema = 'public' AND table_name = 'watched'
    GROUP BY constraint_name
  ) kcu ON kcu.constraint_name = tc.constraint_name
  WHERE tc.table_schema = 'public' AND tc.table_name = 'watched'
    AND tc.constraint_type = 'UNIQUE'
    AND kcu.cols = ARRAY['movie_id', 'user_id'];

  IF old_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.watched DROP CONSTRAINT %I', old_name);
  END IF;
END $$;

ALTER TABLE public.watched
  ADD CONSTRAINT watched_user_id_movie_id_media_type_key
  UNIQUE (user_id, movie_id, media_type);
