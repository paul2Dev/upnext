import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody<{ movie_id: number, media_type: string, rating: number, tmdb_data?: Record<string, unknown> }>(event)
  if (!body.movie_id || !body.media_type || !body.rating) {
    throw createError({ statusCode: 400, message: 'movie_id, media_type și rating sunt obligatorii' })
  }
  if (body.rating < 1 || body.rating > 5) {
    throw createError({ statusCode: 400, message: 'Rating trebuie să fie între 1 și 5' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = await serverSupabaseClient(event) as any

  await client
    .from('watched')
    .delete()
    .eq('user_id', user.id)
    .eq('movie_id', body.movie_id)
    .eq('media_type', body.media_type)

  const { data, error } = await client
    .from('watched')
    .insert({
      user_id: user.id,
      movie_id: body.movie_id,
      media_type: body.media_type,
      rating: body.rating,
      tmdb_data: body.tmdb_data ?? {}
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
