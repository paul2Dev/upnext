const POPULAR_COLLECTION_IDS = [
  131292, // Marvel Cinematic Universe
  10, // Star Wars
  1241, // Harry Potter
  295, // Pirates of the Caribbean
  119, // The Lord of the Rings
  328, // Jurassic Park
  9485, // Fast & Furious
  645, // James Bond
  87359, // Mission: Impossible
  2344, // The Matrix
  404609, // John Wick
  131296, // Avatar
  1570, // Die Hard
  1575, // Rocky
  9183, // Toy Story
  86311 // The Avengers
]

export default defineEventHandler(async () => {
  const results = await Promise.all(
    POPULAR_COLLECTION_IDS.map(id =>
      tmdbFetch<Record<string, unknown>>(`/collection/${id}`).catch(() => null)
    )
  )
  return { results: results.filter(Boolean) }
})
