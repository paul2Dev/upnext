import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = await serverSupabaseClient(event) as any

  interface WatchedRow { movie_id: number, media_type: string, rating: number | null }
  interface WatchlistRow { movie_id: number, media_type: string }
  interface TmdbMovie { id: number }

  const [{ data: profile }, { data: watched }, { data: watchlist }] = await Promise.all([
    client.from('profiles').select('preferred_genres').eq('id', user.id).single(),
    client.from('watched').select('movie_id, media_type, rating').eq('user_id', user.id),
    client.from('watchlist').select('movie_id, media_type').eq('user_id', user.id)
  ])

  const watchedIds = new Set(
    (watched as WatchedRow[] ?? [])
      .filter(w => w.media_type === 'movie')
      .map(w => w.movie_id)
  )

  const likedMovieIds = (watched as WatchedRow[] ?? [])
    .filter(w => w.media_type === 'movie' && (w.rating ?? 0) >= 3)
    .map(w => w.movie_id)

  const watchlistMovieIds = (watchlist as WatchlistRow[] ?? [])
    .filter(w => w.media_type === 'movie')
    .map(w => w.movie_id)

  function pickRandom<T>(arr: T[], n: number): T[] {
    return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
  }

  const preferredGenres: number[] = profile?.preferred_genres ?? []

  const sortOptions = [
    { sort_by: 'popularity.desc' },
    { 'sort_by': 'vote_average.desc', 'vote_count.gte': 300 },
    { 'sort_by': 'primary_release_date.desc', 'vote_average.gte': 6.5 },
    { sort_by: 'revenue.desc' }
  ]

  // Pick 4 different random pages (1-10) and shuffle sort options
  const randomPages = pickRandom([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4)
  const shuffledSorts = [...sortOptions].sort(() => Math.random() - 0.5)

  const hasLiked = likedMovieIds.length > 0
  const hasWatchlist = watchlistMovieIds.length > 0

  const likedSample = pickRandom(likedMovieIds, 3)
  const watchlistSample = pickRandom(watchlistMovieIds, 3)

  const requests: Promise<{ results?: TmdbMovie[] }>[] = []

  function addGenreBucket(sortIdx: number, pageIdx: number) {
    if (preferredGenres.length) {
      requests.push(
        tmdbFetch<{ results: TmdbMovie[] }>('/discover/movie', {
          ...shuffledSorts[sortIdx % shuffledSorts.length],
          with_genres: preferredGenres.join('|'),
          include_adult: false,
          page: randomPages[pageIdx]
        })
      )
    } else {
      requests.push(
        tmdbFetch<{ results: TmdbMovie[] }>('/movie/popular', { page: randomPages[pageIdx] })
      )
    }
  }

  // Always 2 genre buckets with different pages and sorts → 40 films
  addGenreBucket(0, 0)
  addGenreBucket(1, 1)

  // Bucket 2: similar to liked movies (rating >= 3) → up to 60 films
  for (const id of likedSample) {
    requests.push(tmdbFetch<{ results: TmdbMovie[] }>(`/movie/${id}/recommendations`))
  }

  // Bucket 3: similar to watchlist → up to 60 films
  for (const id of watchlistSample) {
    requests.push(tmdbFetch<{ results: TmdbMovie[] }>(`/movie/${id}/recommendations`))
  }

  // Fallback: if no liked movies → extra genre bucket to compensate
  if (!hasLiked) {
    addGenreBucket(2, 2)
  }

  // Fallback: if no watchlist → extra genre bucket to compensate
  if (!hasWatchlist) {
    addGenreBucket(3, 3)
  }

  const settled = await Promise.allSettled(requests)

  const allMovies = settled.flatMap(r =>
    r.status === 'fulfilled' ? (r.value.results ?? []) : []
  )

  const seen = new Set<number>()
  const unique = allMovies.filter((m) => {
    if (seen.has(m.id) || watchedIds.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  unique.sort(() => Math.random() - 0.5)

  return { results: unique.slice(0, 20) }
})
