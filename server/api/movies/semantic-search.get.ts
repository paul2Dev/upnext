import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.public.featureSemanticSearch) {
    throw createError({ statusCode: 404, message: 'Feature not enabled.' })
  }

  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Trebuie să fii autentificat pentru căutarea semantică.' })
  }

  const { q } = getQuery(event)
  if (!q || typeof q !== 'string' || q.trim().length < 3) {
    throw createError({ statusCode: 400, message: 'Query prea scurt.' })
  }
  if (q.trim().length > 150) {
    throw createError({ statusCode: 400, message: 'Query too long (max 150 characters).' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await serverSupabaseClient(event) as any

  const embedding = await generateEmbedding(q.trim())

  const { data, error } = await supabase.rpc('search_movies_by_embedding', {
    query_embedding: JSON.stringify(embedding),
    match_count: 20,
    match_threshold: 0.25
  })

  if (error) throw createError({ statusCode: 500, message: (error as { message: string }).message })

  type ResultRow = { movie_id: number, title: string, overview: string, similarity: number }
  const rows = ((data as ResultRow[]) ?? []).filter(row => row.similarity >= 0.25)
  if (!rows.length) return []

  const enriched = await Promise.all(
    rows.map(item =>
      tmdbFetch<Record<string, unknown>>(`/movie/${item.movie_id}`)
        .then(details => ({ ...details, media_type: 'movie', _similarity: item.similarity }))
        .catch(() => null)
    )
  )

  return enriched.filter(Boolean)
})
