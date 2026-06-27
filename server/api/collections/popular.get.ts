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
  10194, // Toy Story
  84, // Indiana Jones
  264, // Back to the Future
  8091, // Alien
  263, // The Dark Knight
  86066 // Despicable Me
]

export default defineEventHandler(async () => {
  const results = await Promise.all(
    POPULAR_COLLECTION_IDS.map(id =>
      tmdbFetch<Record<string, unknown>>(`/collection/${id}`).catch(() => null)
    )
  )

  return {
    results: results.filter(Boolean),
    total_pages: 1,
    page: 1
  }
})
