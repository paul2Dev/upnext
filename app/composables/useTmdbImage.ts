const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function useTmdbImage() {
  const poster = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342') =>
    path ? `${IMAGE_BASE}/${size}${path}` : null

  const backdrop = (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') =>
    path ? `${IMAGE_BASE}/${size}${path}` : null

  return { poster, backdrop }
}
