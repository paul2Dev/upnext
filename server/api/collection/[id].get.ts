export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid collection ID' })
  }
  return tmdbFetch<Record<string, unknown>>(`/collection/${id}`)
})
