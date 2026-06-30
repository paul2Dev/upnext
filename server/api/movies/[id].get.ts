import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event) => {
  const id = getMovieId(event)

  const region = getHeader(event, 'x-vercel-ip-country') ?? WATCH_REGION

  const [details, providers] = await Promise.all([
    tmdbFetch<{ title: string, overview: string } & Record<string, unknown>>(`/movie/${id}`, { append_to_response: 'credits,videos' }),
    tmdbFetch<{ results?: Record<string, Record<string, unknown>> }>(`/movie/${id}/watch/providers`)
  ])

  storeEmbeddingIfMissing(event, id, details.title, details.overview).catch(err => console.error('[embedding]', err))

  return {
    ...details,
    watch_providers: providers.results?.[region] ?? null
  }
})

async function storeEmbeddingIfMissing(event: H3Event, movieId: number, title: string, overview: string) {
  if (!overview) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = serverSupabaseServiceRole(event) as any
  const { data } = await supabase
    .from('media_embeddings')
    .select('movie_id')
    .eq('movie_id', movieId)
    .eq('media_type', 'movie')
    .single()

  if (data) return

  const embedding = await generateEmbedding(buildMediaEmbeddingText(title, overview))

  const { error } = await supabase.from('media_embeddings').insert({
    movie_id: movieId,
    title,
    overview,
    media_type: 'movie',
    embedding: JSON.stringify(embedding)
  })
  if (error) throw new Error(error.message)
}
