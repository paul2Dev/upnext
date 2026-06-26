export default defineEventHandler(async (event) => {
  const { page = 1 } = getQuery(event)

  return tmdbFetch('/trending/movie/week', { page: Number(page) })
})
