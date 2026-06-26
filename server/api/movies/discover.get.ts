export default defineEventHandler(async (event) => {
  const {
    page = 1,
    genre,
    year,
    provider,
    duration_max,
    sort_by = 'popularity.desc'
  } = getQuery(event)

  return tmdbFetch('/discover/movie', {
    page: Number(page),
    sort_by: String(sort_by),
    with_genres: genre ? String(genre) : undefined,
    primary_release_year: year ? Number(year) : undefined,
    ...(provider ? { with_watch_providers: String(provider), watch_region: WATCH_REGION } : {}),
    'with_runtime.lte': duration_max ? Number(duration_max) : undefined,
    include_adult: false
  })
})
