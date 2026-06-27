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
  86311, // The Avengers
  84, // Indiana Jones
  264, // Back to the Future
  8091, // Alien
  528, // Terminator
  263, // The Dark Knight
  304, // Ocean's
  230, // Shrek
  8354, // Ice Age
  556, // Spider-Man (Sam Raimi)
  8650, // Transformers
  131635, // The Hunger Games
  2490, // Batman (Burton)
  399, // Predator
  748, // X-Men
  86033, // Despicable Me
  310194, // How to Train Your Dragon
  77816, // Kung Fu Panda
  87118, // Cars
  56945, // Madagascar
  5039, // Rambo
  4146, // Scream
  656, // Saw
  9888, // Home Alone
  2980, // Lethal Weapon
  121938, // The Hobbit
  173710, // Planet of the Apes (reboot)
  313086, // The Conjuring Universe
  9735, // Friday the 13th
  5765, // A Nightmare on Elm Street
  91361, // Halloween
  31562, // Bourne
  284433, // Guardians of the Galaxy
  374430, // Ant-Man
  131296, // Avatar
  422834, // Fantastic Beasts
  468552 // Wizarding World
]

const PAGE_SIZE = 20

export default defineEventHandler(async (event) => {
  const { page = 1 } = getQuery(event)
  const pageNum = Math.max(1, Number(page))
  const uniqueIds = [...new Set(POPULAR_COLLECTION_IDS)]
  const totalPages = Math.ceil(uniqueIds.length / PAGE_SIZE)
  const pageIds = uniqueIds.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE)

  const results = await Promise.all(
    pageIds.map(id =>
      tmdbFetch<Record<string, unknown>>(`/collection/${id}`).catch(() => null)
    )
  )

  return {
    results: results.filter(Boolean),
    total_pages: totalPages,
    page: pageNum
  }
})
