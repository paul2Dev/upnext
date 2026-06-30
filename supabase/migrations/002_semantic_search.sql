-- UpNext — Semantic Search
-- Rulează acest fișier în Supabase Dashboard > SQL Editor
-- SAU via Supabase MCP după un fresh deploy

-- =============================================
-- EXTENSIE pgvector
-- =============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- MEDIA EMBEDDINGS
-- Vectori pentru filme și seriale (semantic search)
-- =============================================
CREATE TABLE public.media_embeddings (
  movie_id   integer NOT NULL,
  title      text    NOT NULL,
  overview   text,
  embedding  vector(1536) NOT NULL,
  media_type text    NOT NULL DEFAULT 'movie',
  PRIMARY KEY (movie_id, media_type)
);

CREATE INDEX ON public.media_embeddings USING hnsw (embedding vector_cosine_ops);

ALTER TABLE public.media_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read embeddings"
  ON public.media_embeddings FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- SEARCH USAGE
-- Contor zilnic de căutări semantice per user
-- =============================================
CREATE TABLE public.search_usage (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  date    date NOT NULL DEFAULT CURRENT_DATE,
  count   int  NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE public.search_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.search_usage FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- RPC: search_media_by_embedding
-- Căutare semantică prin cosine similarity (HNSW index)
-- =============================================
CREATE OR REPLACE FUNCTION public.search_media_by_embedding(
  query_embedding text,
  match_count     int DEFAULT 20
)
RETURNS TABLE (
  movie_id   int,
  title      text,
  overview   text,
  similarity float,
  media_type text
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    movie_id,
    title,
    overview,
    1 - (embedding <=> query_embedding::vector) AS similarity,
    media_type
  FROM media_embeddings
  ORDER BY embedding <=> query_embedding::vector
  LIMIT match_count;
$$;

-- =============================================
-- RPC: increment_search_usage
-- Increment atomic al contorului zilnic per user
-- Returnează count-ul curent după increment
-- =============================================
CREATE OR REPLACE FUNCTION public.increment_search_usage(
  p_user_id uuid,
  p_limit   int DEFAULT 15
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count int;
BEGIN
  INSERT INTO search_usage (user_id, date, count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = search_usage.count + 1
  RETURNING count INTO current_count;

  RETURN current_count;
END;
$$;
