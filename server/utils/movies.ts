export const WATCH_REGION = 'RO'

export function getMovieId(event: Parameters<typeof getRouterParam>[0]): number {
  const id = getRouterParam(event, 'id')
  if (!id || isNaN(Number(id))) {
    throw createError({ statusCode: 400, message: 'Invalid movie ID' })
  }
  return Number(id)
}
