export default defineEventHandler(async (event) => {
  const { page = 1 } = getQuery(event)
  return tmdbFetch('/movie/top_rated', { page: Number(page) })
})
