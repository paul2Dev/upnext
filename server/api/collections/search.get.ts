export default defineEventHandler(async (event) => {
  const { query, page = 1 } = getQuery(event)
  if (!query || typeof query !== 'string') {
    throw createError({ statusCode: 400, message: 'Query required' })
  }
  return tmdbFetch('/search/collection', { query, page: Number(page) })
})
