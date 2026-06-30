import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const schema = z.object({
  movie_id: z.number().int().positive().max(999_999_999),
  media_type: z.enum(['movie', 'tv']),
  rating: z.number().int().min(1).max(5),
  tmdb_data: z.record(z.string(), z.unknown()).optional().default({})
    .refine(v => JSON.stringify(v).length <= 50_000, 'tmdb_data too large')
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

  if (error) throw createError({ statusCode: 500, message: 'Internal server error' })

  return data
})
