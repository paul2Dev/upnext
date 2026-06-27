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
    const rows = body.watched_movies.map(m => ({
      user_id: user.id,
      movie_id: m.id,
      media_type: m.media_type,
      tmdb_data: m.tmdb_data,
      rating: m.rating ?? null
    }))

    await client
      .from('watched')
      .upsert(rows, { onConflict: 'user_id,movie_id,media_type', ignoreDuplicates: true })
  }

  return { success: true }
})
