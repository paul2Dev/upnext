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
  const dailyLimit = config.searchDailyLimit

  const embedding = await generateEmbedding(q.trim())

  if (!Array.isArray(embedding) || embedding.length !== 1536 || !embedding.every(n => Number.isFinite(n))) {
    throw createError({ statusCode: 500, message: 'Invalid embedding returned from OpenAI.' })
  }

  const { data: usageCount, error: usageError } = await supabase.rpc('increment_search_usage', {
    p_user_id: user.id,
    p_limit: dailyLimit
  })
  if (usageError) throw createError({ statusCode: 500, message: 'Internal server error' })
  if ((usageCount as number) > dailyLimit) {
    throw createError({ statusCode: 429, message: `Daily search limit reached. You have ${dailyLimit} searches per day.` })
  }

  const { data, error } = await supabase.rpc('search_media_by_embedding', {
    query_embedding: JSON.stringify(embedding),
    match_count: 20
  })

  if (error) throw createError({ statusCode: 500, message: (error as { message: string }).message })

  type ResultRow = { movie_id: number, title: string, overview: string, similarity: number, media_type: 'movie' | 'tv' }
  const rows = ((data as ResultRow[]) ?? []).filter(row => row.similarity >= 0.25)
  if (!rows.length) return []

  const enriched = await Promise.all(
    rows.map(async (item) => {
      const path = item.media_type === 'tv' ? `/tv/${item.movie_id}` : `/movie/${item.movie_id}`
      try {
        const details = await tmdbFetch<Record<string, unknown>>(path)
        return { ...details, media_type: item.media_type, _similarity: item.similarity }
      } catch {
        return null
      }
    })
  )

  return enriched.filter(Boolean)
})
