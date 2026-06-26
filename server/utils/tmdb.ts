export async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {}
): Promise<T> {
  const config = useRuntimeConfig()

  return $fetch<T>(`https://api.themoviedb.org/3${path}`, {
    params: {
      api_key: config.tmdbApiKey,
      language: 'en-US',
      ...params
    }
  }) as unknown as Promise<T>
}
