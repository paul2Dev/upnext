const ALLOWED_TV_SORT = new Set([
  'popularity.desc', 'popularity.asc',
  'vote_average.desc', 'vote_average.asc',
  'first_air_date.desc', 'first_air_date.asc',
  'name.asc', 'name.desc'
])

export default defineEventHandler(async (event) => {
  const { page, genre, year, sort_by } = getQuery(event)

  const safePage = Math.max(1, Math.min(Number(page) || 1, 500))
  const safeSort = ALLOWED_TV_SORT.has(String(sort_by)) ? String(sort_by) : 'popularity.desc'
  const safeGenre = genre ? String(genre).replace(/[^0-9,]/g, '') : undefined
  const safeYear = year ? Math.max(1900, Math.min(Number(year), 2100)) : undefined

  return tmdbFetch('/discover/tv', {
    page: safePage,
    sort_by: safeSort,
    with_genres: safeGenre,
    first_air_date_year: safeYear,
    include_adult: false
  })
})
