<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'UpNext — Set Up Your Profile' })

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
const movieChoices = ref<Record<number, 1 | 5>>({})

const { data: genresData } = await useFetch<{ genres: Genre[] }>('/api/movies/genres')
const genres = computed(() => genresData.value?.genres ?? [])

const { data: popularData, execute: fetchPopular } = useLazyFetch<{ results: Movie[] }>('/api/movies/top-rated', { immediate: false })
const popularMovies = computed(() => popularData.value?.results?.slice(0, 12) ?? [])

watch(() => step.value, (s) => {
  if (s === 2 && !popularData.value) fetchPopular()
})

function toggleGenre(id: number) {
  const idx = selectedGenres.value.indexOf(id)
  if (idx >= 0) selectedGenres.value.splice(idx, 1)
  else selectedGenres.value.push(id)
}

function isGenreSelected(id: number) {
  return selectedGenres.value.includes(id)
}

function setChoice(movieId: number, choice: 1 | 5) {
  if (movieChoices.value[movieId] === choice) {
    movieChoices.value = Object.fromEntries(
      Object.entries(movieChoices.value).filter(([k]) => Number(k) !== movieId)
    ) as Record<number, 1 | 5>
  } else {
    movieChoices.value = { ...movieChoices.value, [movieId]: choice }
  }
}

const posterUrl = (path: string | null) =>
  path ? `https://image.tmdb.org/t/p/w300${path}` : null

async function finish() {
  saving.value = true
  try {
    const watchedMovies = popularMovies.value
      .filter(m => movieChoices.value[m.id] !== undefined)
      .map(m => ({
        id: m.id,
        media_type: 'movie' as const,
        rating: movieChoices.value[m.id],
        tmdb_data: {
          title: m.title,
          poster_path: m.poster_path,
          genre_ids: m.genre_ids ?? [],
          release_date: m.release_date,
          vote_average: m.vote_average
        }
      }))

    await $fetch('/api/user/onboarding', {
      method: 'POST',
      body: { genres: selectedGenres.value, watched_movies: watchedMovies }
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
          What genres do you like?
        </h1>
        <p class="text-muted">
          Select at least 3 favorite genres.
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
          {{ selectedGenres.length }} selected
        </span>
        <UButton
          label="Continue"
          icon="i-lucide-arrow-right"
          trailing
          :disabled="selectedGenres.length < 3"
          @click="step = 2"
        />
      </div>
    </template>

    <!-- Step 2: Rate popular movies -->
    <template v-else>
      <div class="space-y-2 mb-8">
        <h1 class="text-3xl font-bold">
          Have you seen any of these movies?
        </h1>
        <p class="text-muted">
          Help us understand your taste. You can skip this step.
        </p>
      </div>

      <div
        v-if="!popularMovies.length"
        class="flex justify-center py-16"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="text-3xl text-muted animate-spin"
        />
      </div>

      <div
        v-else
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8"
      >
        <div
          v-for="movie in popularMovies"
          :key="movie.id"
          class="flex flex-col gap-2"
        >
          <!-- Poster -->
          <div class="relative rounded-lg overflow-hidden">
            <img
              v-if="posterUrl(movie.poster_path)"
              :src="posterUrl(movie.poster_path)!"
              :alt="movie.title"
              class="w-full aspect-2/3 object-cover"
            >
            <div
              v-else
              class="w-full aspect-2/3 bg-elevated flex items-center justify-center text-xs text-muted p-2 text-center"
            >
              {{ movie.title }}
            </div>
            <!-- Selected overlay -->
            <div
              v-if="movieChoices[movie.id]"
              class="absolute inset-0 flex items-center justify-center"
              :class="movieChoices[movie.id] === 5 ? 'bg-green-500/20' : 'bg-red-500/20'"
            />
          </div>

          <!-- 3 buttons -->
          <div class="flex gap-1 justify-center">
            <UTooltip text="I liked it">
              <button
                class="flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center justify-center"
                :class="movieChoices[movie.id] === 5
                  ? 'bg-green-500/20 border-green-400 text-green-400'
                  : 'border-default text-muted hover:border-green-400/50 hover:text-green-400'"
                @click="setChoice(movie.id, 5)"
              >
                <UIcon
                  name="i-lucide-thumbs-up"
                  class="size-3.5"
                />
              </button>
            </UTooltip>

            <UTooltip text="Not for me">
              <button
                class="flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center justify-center"
                :class="movieChoices[movie.id] === 1
                  ? 'bg-red-500/20 border-red-400 text-red-400'
                  : 'border-default text-muted hover:border-red-400/50 hover:text-red-400'"
                @click="setChoice(movie.id, 1)"
              >
                <UIcon
                  name="i-lucide-thumbs-down"
                  class="size-3.5"
                />
              </button>
            </UTooltip>
          </div>
        </div>
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
            Skip
          </button>
        </div>
        <UButton
          label="Done"
          icon="i-lucide-check"
          trailing
          :loading="saving"
          @click="finish"
        />
      </div>
    </template>
  </UContainer>
</template>
