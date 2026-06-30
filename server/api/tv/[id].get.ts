import { serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid TV show ID' })
  }

  const region = getHeader(event, 'x-vercel-ip-country') ?? WATCH_REGION

  const [details, providers] = await Promise.all([
    tmdbFetch<{ name: string, overview: string } & Record<string, unknown>>(`/tv/${id}`, { append_to_response: 'credits,videos' }),
    tmdbFetch<{ results?: Record<string, Record<string, unknown>> }>(`/tv/${id}/watch/providers`)
  ])

  storeEmbeddingIfMissing(event, Number(id), details.name, details.overview).catch(err =>
    console.error('[embedding] tv store failed', { movie_id: id, media_type: 'tv', error: (err as Error).message })
  )

  return { ...details, watch_providers: providers.results?.[region] ?? null }
})

async function storeEmbeddingIfMissing(event: H3Event, tvId: number, name: string, overview: string) {
  if (!overview) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = serverSupabaseServiceRole(event) as any
  const { data } = await supabase
    .from('media_embeddings')
    .select('movie_id')
    .eq('movie_id', tvId)
    .eq('media_type', 'tv')
    .single()

  if (data) return

  const embedding = await generateEmbedding(buildMediaEmbeddingText(name, overview))

  const { error } = await supabase.from('media_embeddings').insert({
    movie_id: tvId,
    title: name,
    overview,
    media_type: 'tv',
    embedding: JSON.stringify(embedding)
  })
  if (error) throw new Error(error.message)
}
