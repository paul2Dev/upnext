export default defineEventHandler(async (event) => {
  const id = getMovieId(event)
  const { page } = getQuery(event)

  return tmdbFetch(`/movie/${id}/recommendations`, { page: Math.max(1, Math.min(Number(page) || 1, 500)) })
})
