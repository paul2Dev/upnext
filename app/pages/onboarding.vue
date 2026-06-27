<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'UpNext — Configurează profilul tău' })

interface Genre { id: number, name: string }
interface Movie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
}

const step = ref(1)
const saving = ref(false)
const selectedGenres = ref<number[]>([])
const selectedMovies = ref<Movie[]>([])
const searchQuery = ref('')
const searchResults = ref<Movie[]>([])
const searching = ref(false)

const { data: genresData } = await useFetch<{ genres: Genre[] }>('/api/movies/genres')
const genres = computed(() => genresData.value?.genres ?? [])

function toggleGenre(id: number) {
  const idx = selectedGenres.value.indexOf(id)
  if (idx >= 0) selectedGenres.value.splice(idx, 1)
  else selectedGenres.value.push(id)
}

function isGenreSelected(id: number) {
  return selectedGenres.value.includes(id)
}

let searchTimeout: ReturnType<typeof setTimeout>
watch(searchQuery, (q) => {
  clearTimeout(searchTimeout)
  if (!q.trim()) {
    searchResults.value = []
    return
  }
  searching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const data = await $fetch<{ results: Movie[] }>('/api/movies/search', { params: { query: q } })
      searchResults.value = data.results?.slice(0, 8) ?? []
    } finally {
      searching.value = false
    }
  }, 400)
})

function toggleMovie(movie: Movie) {
  const idx = selectedMovies.value.findIndex(m => m.id === movie.id)
  if (idx >= 0) selectedMovies.value.splice(idx, 1)
  else selectedMovies.value.push(movie)
}

function isMovieSelected(id: number) {
  return selectedMovies.value.some(m => m.id === id)
}

const posterUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w200${path}` : null

async function finish() {
  saving.value = true
  try {
    await $fetch('/api/user/onboarding', {
      method: 'POST',
      body: {
        genres: selectedGenres.value,
        watched_movies: selectedMovies.value.map(m => ({
          id: m.id,
          media_type: 'movie',
          tmdb_data: {
            title: m.title,
            poster_path: m.poster_path,
            genre_ids: m.genre_ids ?? [],
            release_date: m.release_date,
            vote_average: m.vote_average
          }
        }))
      }
    })
    const profileCache = useState('profile-cache')
    profileCache.value = null
    await navigateTo('/')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UContainer class="max-w-3xl py-16">
    <!-- Progress -->
    <div class="flex items-center gap-3 mb-10">
      <div
        v-for="n in 2"
        :key="n"
        class="h-1.5 flex-1 rounded-full transition-colors"
        :class="n <= step ? 'bg-primary' : 'bg-elevated'"
      />
    </div>

    <!-- Step 1: Genres -->
    <template v-if="step === 1">
      <div class="space-y-2 mb-8">
        <h1 class="text-3xl font-bold">
          Ce genuri îți plac?
        </h1>
        <p class="text-muted">
          Selectează cel puțin 3 genuri favorite.
        </p>
      </div>

      <div class="flex flex-wrap gap-3 mb-10">
        <button
          v-for="genre in genres"
          :key="genre.id"
          class="px-4 py-2 rounded-full border text-sm font-medium transition-colors"
          :class="isGenreSelected(genre.id)
            ? 'bg-primary border-primary text-white'
            : 'border-default hover:border-primary/50 text-default'"
          @click="toggleGenre(genre.id)"
        >
          {{ genre.name }}
        </button>
      </div>

      <div class="flex items-center justify-between">
        <span class="text-sm text-muted">
          {{ selectedGenres.length }} selectate
        </span>
        <UButton
          label="Continuă"
          icon="i-lucide-arrow-right"
          trailing
          :disabled="selectedGenres.length < 3"
          @click="step = 2"
        />
      </div>
    </template>

    <!-- Step 2: Seed movies -->
    <template v-else>
      <div class="space-y-2 mb-8">
        <h1 class="text-3xl font-bold">
          Filme pe care le-ai văzut deja
        </h1>
        <p class="text-muted">
          Asta ne ajută să îți facem recomandări mai bune. Poți sări peste acest pas.
        </p>
      </div>

      <UInput
        v-model="searchQuery"
        placeholder="Caută un film..."
        icon="i-lucide-search"
        class="mb-4"
        :loading="searching"
      />

      <!-- Search results -->
      <div
        v-if="searchResults.length"
        class="grid grid-cols-4 gap-3 mb-6"
      >
        <button
          v-for="movie in searchResults"
          :key="movie.id"
          class="relative rounded-lg overflow-hidden border-2 transition-all"
          :class="isMovieSelected(movie.id) ? 'border-primary' : 'border-transparent'"
          @click="toggleMovie(movie)"
        >
          <img
            v-if="posterUrl(movie.poster_path)"
            :src="posterUrl(movie.poster_path)!"
            :alt="movie.title"
            class="w-full aspect-[2/3] object-cover"
          >
          <div
            v-else
            class="w-full aspect-[2/3] bg-elevated flex items-center justify-center text-xs text-muted p-2 text-center"
          >
            {{ movie.title }}
          </div>
          <div
            v-if="isMovieSelected(movie.id)"
            class="absolute inset-0 bg-primary/20 flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-check-circle"
              class="text-primary text-2xl"
            />
          </div>
          <div class="p-1 text-xs text-center truncate">
            {{ movie.title }}
          </div>
        </button>
      </div>

      <!-- Selected movies chips -->
      <div
        v-if="selectedMovies.length"
        class="flex flex-wrap gap-2 mb-8"
      >
        <span
          v-for="movie in selectedMovies"
          :key="movie.id"
          class="flex items-center gap-1 px-3 py-1 bg-elevated rounded-full text-sm"
        >
          {{ movie.title }}
          <button
            class="text-muted hover:text-default"
            @click="toggleMovie(movie)"
          >
            <UIcon
              name="i-lucide-x"
              class="text-xs"
            />
          </button>
        </span>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UButton
            variant="ghost"
            icon="i-lucide-arrow-left"
            @click="step = 1"
          />
          <button
            class="text-sm text-muted hover:text-default underline-offset-2 hover:underline"
            :disabled="saving"
            @click="finish"
          >
            Sari peste
          </button>
        </div>
        <UButton
          label="Gata"
          icon="i-lucide-check"
          trailing
          :loading="saving"
          @click="finish"
        />
      </div>
    </template>
  </UContainer>
</template>
