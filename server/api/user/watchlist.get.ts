import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const client = await serverSupabaseClient(event)
  const { data, error } = await client
    .from('watchlist')
    .select('*')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: 'Internal server error' })

  return data
})
