interface WatchlistRow {
  movie_id: number
  media_type: string
}

export function watchlistKey(movieId: number, mediaType: string) {
  return `${mediaType}:${movieId}`
}

export function useWatchlist() {
  const user = useSupabaseUser()
  const ids = useState<Set<string>>('watchlist-ids', () => new Set())

  async function refresh() {
    if (!user.value) {
      ids.value = new Set()
      return
    }
    const data = await $fetch<WatchlistRow[]>('/api/user/watchlist').catch(() => [])
    ids.value = new Set(data.map(r => watchlistKey(r.movie_id, r.media_type)))
  }

  function has(movieId: number, mediaType: string) {
    return ids.value.has(watchlistKey(movieId, mediaType))
  }

  async function toggle(movieId: number, mediaType: 'movie' | 'tv', tmdbData: object) {
    const key = watchlistKey(movieId, mediaType)
    if (ids.value.has(key)) {
      await $fetch('/api/user/watchlist', {
        method: 'DELETE',
        body: { movie_id: movieId, media_type: mediaType }
      })
      const next = new Set(ids.value)
      next.delete(key)
      ids.value = next
    } else {
      await $fetch('/api/user/watchlist', {
        method: 'POST',
        body: { movie_id: movieId, media_type: mediaType, tmdb_data: tmdbData }
      })
      const next = new Set(ids.value)
      next.add(key)
      ids.value = next
    }
  }

  return { ids, count: computed(() => ids.value.size), refresh, has, toggle }
}
