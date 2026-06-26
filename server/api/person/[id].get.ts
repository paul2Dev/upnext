export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid person ID' })
  }

  const [details, credits] = await Promise.all([
    tmdbFetch<Record<string, unknown>>(`/person/${id}`),
    tmdbFetch<Record<string, unknown>>(`/person/${id}/combined_credits`)
  ])

  return { ...details, combined_credits: credits }
})
