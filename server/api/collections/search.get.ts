export default defineEventHandler(async (event) => {
  const { query, page } = getQuery(event)
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Query required' })
  }
  return tmdbFetch('/search/collection', {
    query: query.trim().slice(0, 200),
    page: Math.max(1, Math.min(Number(page) || 1, 500))
  })
})
