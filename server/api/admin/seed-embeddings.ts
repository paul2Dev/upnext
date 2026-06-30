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

  const supabase = await serverSupabaseServiceRole<Database>(event)

  const results = { inserted: 0, skipped: 0, errors: 0 }

  const endpoints = ['popular', 'top_rated']

  for (const endpoint of endpoints) {
    for (let page = 1; page <= 500; page++) {
      let data: { results: TmdbMovie[] }
      try {
        data = await $fetch<{ results: TmdbMovie[] }>(
          `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${config.tmdbApiKey}&language=en-US&page=${page}`
        )
      } catch {
        break
      }

      if (!data.results?.length) break

      for (const movie of data.results) {
        if (!movie.overview) {
          results.skipped++
          continue
        }

        const { data: existing } = await supabase
          .from('movie_embeddings')
          .select('movie_id')
          .eq('movie_id', movie.id)
          .single()

        if (existing) {
          results.skipped++
          continue
        }

        try {
          const text = buildMovieEmbeddingText(movie.title, movie.overview)
          const embedding = await generateEmbedding(text)

          await supabase.from('movie_embeddings').insert({
            movie_id: movie.id,
            title: movie.title,
            overview: movie.overview,
            embedding: JSON.stringify(embedding)
          })

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

interface TmdbMovie {
  id: number
  title: string
  overview: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Database = any
