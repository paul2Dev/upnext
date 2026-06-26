export default defineEventHandler(async (event) => {
  const { page = 1, genre, year, sort_by = 'popularity.desc' } = getQuery(event)
  return tmdbFetch('/discover/tv', {
    page: Number(page),
    sort_by: String(sort_by),
    with_genres: genre ? String(genre) : undefined,
    first_air_date_year: year ? Number(year) : undefined,
    include_adult: false
  })
})
