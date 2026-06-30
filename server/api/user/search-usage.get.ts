import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const config = useRuntimeConfig()
  const limit = config.searchDailyLimit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await serverSupabaseClient(event) as any
  const { data } = await supabase
    .from('search_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('date', new Date().toISOString().slice(0, 10))
    .single()

  const used = (data?.count as number) ?? 0

  return { used, limit, remaining: Math.max(0, limit - used) }
})
