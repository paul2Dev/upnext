import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody<{ movie_id: number, media_type: string, tmdb_data: Record<string, unknown> }>(event)
  if (!body.movie_id || !body.media_type) {
    throw createError({ statusCode: 400, message: 'movie_id și media_type sunt obligatorii' })
  }

  const client = await serverSupabaseClient(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (client as any)
    .from('watchlist')
    .insert({
      user_id: user.id,
      movie_id: body.movie_id,
      media_type: body.media_type,
      tmdb_data: body.tmdb_data
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
