import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const schema = z.object({
  movie_id: z.number().int().positive().max(999_999_999),
  media_type: z.enum(['movie', 'tv'])
})

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const raw = await readBody(event)
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Invalid input' })
  }
  const body = parsed.data

  const client = await serverSupabaseClient(event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (client as any)
    .from('watched')
    .delete()
    .eq('user_id', user.id)
    .eq('movie_id', body.movie_id)
    .eq('media_type', body.media_type)

  if (error) throw createError({ statusCode: 500, message: 'Internal server error' })
  return { success: true }
})
