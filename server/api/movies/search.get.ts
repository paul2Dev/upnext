export default defineEventHandler(async (event) => {
  const { query, page = 1 } = getQuery(event)

  if (!query) {
    throw createError({ statusCode: 400, message: 'Query parameter is required' })
  }

  return tmdbFetch('/search/movie', {
    query: String(query),
    page: Number(page),
    include_adult: false
  })
})
