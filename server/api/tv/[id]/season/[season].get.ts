export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const season = getRouterParam(event, 'season')
  if (!id || isNaN(Number(id)) || !season || isNaN(Number(season))) {
    throw createError({ statusCode: 400, message: 'Invalid parameters' })
  }
  return tmdbFetch<Record<string, unknown>>(`/tv/${id}/season/${season}`)
})
