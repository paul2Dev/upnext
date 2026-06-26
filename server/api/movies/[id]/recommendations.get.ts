export default defineEventHandler(async (event) => {
  const id = getMovieId(event)
  const { page = 1 } = getQuery(event)

  return tmdbFetch(`/movie/${id}/recommendations`, { page: Number(page) })
})
