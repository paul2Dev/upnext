import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'

const schema = z.object({
  genres: z.array(z.number().int().positive()).min(1).max(20),
  watched_movies: z.array(z.object({
    id: z.number().int().positive().max(999_999_999),
    media_type: z.enum(['movie', 'tv']),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    tmdb_data: z.record(z.string(), z.unknown()).optional().default({})
      .refine(v => JSON.stringify(v).length <= 50_000, 'tmdb_data too large')
  })).max(50).optional().default([])
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

  const { error: profileError } = await client
    .from('profiles')
    .upsert({ id: user.id, preferred_genres: body.genres, onboarding_done: true })

  if (profileError) throw createError({ statusCode: 500, message: 'Internal server error' })

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
    if (watchedError) throw createError({ statusCode: 500, message: 'Internal server error' })
  }

  return { success: true }
})
