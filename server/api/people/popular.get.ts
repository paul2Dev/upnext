export default defineEventHandler(async (event) => {
  const { page = 1 } = getQuery(event)
  return tmdbFetch('/person/popular', { page: Number(page) })
})
