export default defineEventHandler(() => {
  return tmdbFetch('/genre/tv/list')
})
