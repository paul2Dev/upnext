import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.public.featureSemanticSearch) {
    throw createError({ statusCode: 404, message: 'Feature not enabled.' })
  }

  const { secret } = getQuery(event)
  if (!config.seedSecret || secret !== config.seedSecret) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = serverSupabaseServiceRole<any>(event)

  const results = { inserted: 0, skipped: 0, errors: 0 }

  const sources: { mediaType: 'movie' | 'tv', endpoint: string }[] = [
    // { mediaType: 'movie', endpoint: 'movie/popular' },
    // { mediaType: 'movie', endpoint: 'movie/top_rated' },
    { mediaType: 'tv', endpoint: 'tv/popular' },
    { mediaType: 'tv', endpoint: 'tv/top_rated' }
  ]

  for (const { mediaType, endpoint } of sources) {
    for (let page = 1; page <= 500; page++) {
      let data: { results: TmdbMedia[] }
      try {
        data = await $fetch<{ results: TmdbMedia[] }>(
          `https://api.themoviedb.org/3/${endpoint}?api_key=${config.tmdbApiKey}&language=en-US&page=${page}`
        )
      } catch {
        break
      }

      if (!data.results?.length) break

      for (const item of data.results) {
        const title = item.title ?? item.name ?? ''
        if (!item.overview || !title) {
          results.skipped++
          continue
        }

        const { data: existing } = await supabase
          .from('media_embeddings')
          .select('movie_id')
          .eq('movie_id', item.id)
          .eq('media_type', mediaType)
          .single()

        if (existing) {
          results.skipped++
          continue
        }

        try {
          const embedding = await generateEmbedding(buildMediaEmbeddingText(title, item.overview))

          const { error } = await supabase.from('media_embeddings').insert({
            movie_id: item.id,
            title,
            overview: item.overview,
            media_type: mediaType,
            embedding: JSON.stringify(embedding)
          })

          if (error) throw new Error(error.message)
          results.inserted++
        } catch {
          results.errors++
        }

        await new Promise(r => setTimeout(r, 50))
      }
    }
  }

  return results
})

interface TmdbMedia {
  id: number
  title?: string
  name?: string
  overview: string
}
