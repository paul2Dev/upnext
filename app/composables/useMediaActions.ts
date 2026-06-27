interface TmdbData {
  id: number
  media_type: 'movie' | 'tv'
  title?: string
  name?: string
  poster_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_average?: number
  overview?: string
}

interface WatchlistRow {
  id: string
  movie_id: number
  media_type: string
  tmdb_data: TmdbData
  added_at: string
}

interface WatchedRow {
  id: string
  movie_id: number
  media_type: string
  rating: number
  watched_at: string
}

export function useMediaActions(mediaId: number, mediaType: 'movie' | 'tv', tmdbData: TmdbData) {
  const user = useSupabaseUser()
  const toast = useToast()

  const inWatchlist = ref(false)
  const isWatched = ref(false)
  const userRating = ref<number | null>(null)
  const loadingWatchlist = ref(false)
  const loadingWatched = ref(false)

  async function fetchStatus() {
    if (!user.value) return

    const [watchlistRes, ratingsRes] = await Promise.all([
      $fetch<WatchlistRow[]>('/api/user/watchlist').catch(() => []),
      $fetch<WatchedRow[]>('/api/user/ratings').catch(() => [])
    ])

    inWatchlist.value = watchlistRes.some(
      r => r.movie_id === mediaId && r.media_type === mediaType
    )

    const watched = ratingsRes.find(
      r => r.movie_id === mediaId && r.media_type === mediaType
    )
    isWatched.value = !!watched
    userRating.value = watched?.rating ?? null
  }

  async function toggleWatchlist() {
    if (!user.value || loadingWatchlist.value) return
    loadingWatchlist.value = true
    try {
      if (inWatchlist.value) {
        await $fetch('/api/user/watchlist', {
          method: 'DELETE',
          body: { movie_id: mediaId, media_type: mediaType }
        })
        inWatchlist.value = false
      } else {
        await $fetch('/api/user/watchlist', {
          method: 'POST',
          body: { movie_id: mediaId, media_type: mediaType, tmdb_data: tmdbData }
        })
        inWatchlist.value = true
      }
    } catch {
      toast.add({ title: 'Eroare', description: 'Nu s-a putut actualiza watchlist-ul.', color: 'error' })
    } finally {
      loadingWatchlist.value = false
    }
  }

  async function setRating(rating: number) {
    if (!user.value || loadingWatched.value) return
    loadingWatched.value = true
    try {
      if (userRating.value === rating) {
        await $fetch('/api/user/ratings', {
          method: 'DELETE',
          body: { movie_id: mediaId, media_type: mediaType }
        })
        userRating.value = null
        isWatched.value = false
      } else {
        await $fetch('/api/user/ratings', {
          method: 'POST',
          body: { movie_id: mediaId, media_type: mediaType, rating, tmdb_data: tmdbData }
        })
        userRating.value = rating
        isWatched.value = true
      }
    } catch {
      toast.add({ title: 'Eroare', description: 'Nu s-a putut salva ratingul.', color: 'error' })
    } finally {
      loadingWatched.value = false
    }
  }

  onMounted(fetchStatus)

  return { user, inWatchlist, isWatched, userRating, loadingWatchlist, loadingWatched, toggleWatchlist, setRating }
}
