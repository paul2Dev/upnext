const ALLOWED_MOVIE_SORT = new Set([
  'popularity.desc', 'popularity.asc',
  'vote_average.desc', 'vote_average.asc',
  'primary_release_date.desc', 'primary_release_date.asc',
  'release_date.desc', 'release_date.asc',
  'revenue.desc', 'revenue.asc',
  'original_title.asc', 'original_title.desc'
])

export default defineEventHandler(async (event) => {
  const { page, genre, year, provider, duration_max, sort_by } = getQuery(event)

  const safePage = Math.max(1, Math.min(Number(page) || 1, 500))
  const safeSort = ALLOWED_MOVIE_SORT.has(String(sort_by)) ? String(sort_by) : 'popularity.desc'
  const safeGenre = genre ? String(genre).replace(/[^0-9,]/g, '') : undefined
  const safeYear = year ? Math.max(1900, Math.min(Number(year), 2100)) : undefined
  const safeProvider = provider ? String(provider).replace(/[^0-9,]/g, '') : undefined
  const safeDuration = duration_max ? Math.max(1, Math.min(Number(duration_max), 999)) : undefined

  return tmdbFetch('/discover/movie', {
    'page': safePage,
    'sort_by': safeSort,
    'with_genres': safeGenre,
    'primary_release_year': safeYear,
    ...(safeProvider ? { with_watch_providers: safeProvider, watch_region: WATCH_REGION } : {}),
    'with_runtime.lte': safeDuration,
    'include_adult': false
  })
})
