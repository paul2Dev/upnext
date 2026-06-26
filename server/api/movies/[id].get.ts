export default defineEventHandler(async (event) => {
  const id = getMovieId(event)

  const [details, providers] = await Promise.all([
    tmdbFetch<Record<string, unknown>>(`/movie/${id}`, { append_to_response: 'credits,videos' }),
    tmdbFetch<{ results?: Record<string, Record<string, unknown>> }>(`/movie/${id}/watch/providers`)
  ])

  return {
    ...details,
    watch_providers: providers.results?.[WATCH_REGION] ?? null
  }
})
