import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const client = await serverSupabaseClient(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (client as any)
    .from('profiles')
    .select('preferred_genres, onboarding_done')
    .eq('id', user.id)
    .single()

  if (error) throw createError({ statusCode: 500, message: 'Internal server error' })
  return data
})
