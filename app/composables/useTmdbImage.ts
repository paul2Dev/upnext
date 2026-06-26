export function useTmdbImage() {
  const config = useRuntimeConfig()
  const base = config.public.tmdbImageBaseUrl

  const poster = (path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342') =>
    path ? `${base}/${size}${path}` : null

  const backdrop = (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') =>
    path ? `${base}/${size}${path}` : null

  return { poster, backdrop }
}
