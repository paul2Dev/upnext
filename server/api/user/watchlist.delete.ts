import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody<{ movie_id: number, media_type: string }>(event)
  if (!body.movie_id || !body.media_type) {
    throw createError({ statusCode: 400, message: 'movie_id și media_type sunt obligatorii' })
  }

  const client = await serverSupabaseClient(event)
  const { error } = await client
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('movie_id', body.movie_id)
    .eq('media_type', body.media_type)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
