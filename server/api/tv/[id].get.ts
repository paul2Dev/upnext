export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid TV show ID' })
  }

  const [details, providers] = await Promise.all([
    tmdbFetch<Record<string, unknown>>(`/tv/${id}`, { append_to_response: 'credits,videos' }),
    tmdbFetch<{ results?: Record<string, Record<string, unknown>> }>(`/tv/${id}/watch/providers`)
  ])

  return { ...details, watch_providers: providers.results?.[WATCH_REGION] ?? null }
})
