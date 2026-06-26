export default defineEventHandler(async () => {
  return tmdbFetch('/genre/movie/list')
})
