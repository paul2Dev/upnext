export default defineEventHandler(async (event) => {
  const { page } = getQuery(event)
  return tmdbFetch('/person/popular', { page: Math.max(1, Math.min(Number(page) || 1, 500)) })
})
