import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface WatchedMovie {
  id: number
  media_type: 'movie' | 'tv'
  rating?: number | null
  tmdb_data: Record<string, unknown>
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody<{ genres: number[], watched_movies?: WatchedMovie[] }>(event)
  if (!body.genres?.length) {
    throw createError({ statusCode: 400, message: 'genres is required' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = await serverSupabaseClient(event) as any

  const { error: profileError } = await client
    .from('profiles')
    .upsert({ id: user.id, preferred_genres: body.genres, onboarding_done: true })

  if (profileError) throw createError({ statusCode: 500, message: profileError.message })

  if (body.watched_movies?.length) {
    const movieIds = body.watched_movies.map(m => m.id)

    await client
      .from('watched')
      .delete()
      .eq('user_id', user.id)
      .in('movie_id', movieIds)

    const rows = body.watched_movies.map(m => ({
      user_id: user.id,
      movie_id: m.id,
      media_type: m.media_type,
      tmdb_data: m.tmdb_data,
      rating: m.rating ?? null
    }))

    const { error: watchedError } = await client.from('watched').insert(rows)
    if (watchedError) throw createError({ statusCode: 500, message: watchedError.message })
  }

  return { success: true }
})
