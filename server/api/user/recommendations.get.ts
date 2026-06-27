import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = await serverSupabaseClient(event) as any

  interface WatchedRow { movie_id: number, media_type: string, rating: number | null, tmdb_data: { genre_ids?: number[] } }
  interface WatchlistRow { movie_id: number, media_type: string, tmdb_data: { genre_ids?: number[] } }
  interface TmdbMovie { id: number }

  const [{ data: profile }, { data: watched }, { data: watchlist }] = await Promise.all([
    client.from('profiles').select('preferred_genres').eq('id', user.id).single(),
    client.from('watched').select('movie_id, media_type, rating, tmdb_data').eq('user_id', user.id),
    client.from('watchlist').select('movie_id, media_type, tmdb_data').eq('user_id', user.id)
  ])

  const watchedMovieIds = new Set(
    (watched as WatchedRow[] ?? [])
      .filter(w => w.media_type === 'movie')
      .map(w => w.movie_id)
  )

  // Collect genres: preferred_genres x2, rated ≥4 x1, watchlist x0.5
  const genreCount: Record<number, number> = {}

  for (const id of (profile?.preferred_genres ?? [])) {
    genreCount[id] = (genreCount[id] ?? 0) + 2
  }

  for (const entry of (watched as WatchedRow[] ?? [])) {
    if ((entry.rating ?? 0) >= 4) {
      for (const g of (entry.tmdb_data?.genre_ids ?? [])) {
        genreCount[g] = (genreCount[g] ?? 0) + 1
      }
    }
  }

  for (const entry of (watchlist as WatchlistRow[] ?? [])) {
    for (const g of (entry.tmdb_data?.genre_ids ?? [])) {
      genreCount[g] = (genreCount[g] ?? 0) + 0.5
    }
  }

  const topGenres = Object.entries(genreCount)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([id]) => Number(id))

  if (!topGenres.length) {
    return tmdbFetch('/movie/popular', { page: 1 })
  }

  const data = await tmdbFetch<{ results: TmdbMovie[] }>('/discover/movie', {
    sort_by: 'popularity.desc',
    with_genres: topGenres.join('|'),
    include_adult: false,
    page: 1
  })

  const results = (data.results ?? []).filter(m => !watchedMovieIds.has(m.id))

  return { results: results.slice(0, 20) }
})
