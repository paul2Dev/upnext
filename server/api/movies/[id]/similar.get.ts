export default defineEventHandler(async (event) => {
  const id = getMovieId(event)
  return tmdbFetch(`/movie/${id}/similar`)
})
