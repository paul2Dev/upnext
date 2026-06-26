export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid TV show ID' })
  }
  return tmdbFetch(`/tv/${id}/similar`)
})
