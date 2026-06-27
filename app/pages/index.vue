<script setup lang="ts">
useSeoMeta({ title: 'UpNext — Descoperă filme' })

interface MovieItem {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  overview: string
}
interface AllItem {
  id: number
  media_type: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  overview: string
}

const user = useSupabaseUser()
const profileCache = useState<{ onboarding_done: boolean } | null>('profile-cache')

const [{ data: upcomingData }, { data: topRatedData }, { data: allTrendingData }] = await Promise.all([
  useFetch<{ results: MovieItem[] }>('/api/movies/upcoming'),
  useFetch<{ results: MovieItem[] }>('/api/movies/top-rated'),
  useFetch<{ results: AllItem[] }>('/api/trending/all')
])

const { data: recommendationsData, execute: fetchRecommendations } = useLazyFetch<{ results: MovieItem[] }>(
  '/api/user/recommendations',
  { immediate: false }
)

watch(
  () => !!(user.value && profileCache.value?.onboarding_done),
  (ready) => { if (ready) fetchRecommendations() },
  { immediate: true }
)

const upcomingMovies = computed(() => upcomingData.value?.results?.slice(0, 18) ?? [])
const topRatedMovies = computed(() => topRatedData.value?.results?.slice(0, 18) ?? [])
const allTrending = computed(() => (allTrendingData.value?.results ?? []).filter(i => i.media_type !== 'person').slice(0, 18))
const recommendations = computed(() => (recommendationsData.value as { results: MovieItem[] } | null)?.results ?? [])

const onboardingDone = computed(() => !!profileCache.value?.onboarding_done)

const tabs = [
  { label: 'Pentru tine', slot: 'foryou' as const },
  { label: 'Trending', slot: 'all' as const },
  { label: 'În curând', slot: 'upcoming' as const },
  { label: 'Cele mai bune', slot: 'top-rated' as const }
]
</script>

<template>
  <div>
    <div class="bg-elevated border-b border-default">
      <UContainer class="py-16 text-center space-y-4">
        <h1 class="text-4xl font-bold">
          Ce urmărești în seara asta?
        </h1>
        <p class="text-muted text-lg max-w-xl mx-auto">
          Descoperă filme și seriale noi, urmărește ce ți-a plăcut și primești recomandări personalizate.
        </p>
        <UButton
          to="/discover"
          label="Explorează"
          icon="i-lucide-compass"
          size="lg"
        />
      </UContainer>
    </div>

    <UContainer class="py-10">
      <UTabs :items="tabs">
        <template #foryou>
          <div class="pt-6">
            <!-- Not logged in -->
            <div
              v-if="!user"
              class="flex flex-col items-center gap-4 py-16 text-center"
            >
              <UIcon
                name="i-lucide-sparkles"
                class="text-4xl text-muted"
              />
              <p class="text-muted">
                Loghează-te pentru a vedea recomandări personalizate.
              </p>
              <UButton
                to="/login"
                label="Intră în cont"
              />
            </div>

            <!-- Onboarding not done -->
            <div
              v-else-if="!onboardingDone"
              class="flex flex-col items-center gap-4 py-16 text-center"
            >
              <UIcon
                name="i-lucide-user-circle"
                class="text-4xl text-muted"
              />
              <p class="text-muted">
                Completează-ți profilul pentru recomandări personalizate.
              </p>
              <UButton
                to="/onboarding"
                label="Configurează profilul"
                icon="i-lucide-arrow-right"
                trailing
              />
            </div>

            <!-- Recommendations -->
            <div
              v-else
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              <MovieCard
                v-for="movie in recommendations"
                :key="movie.id"
                :movie="movie"
              />
            </div>
          </div>
        </template>

        <template #all>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6">
            <MediaCard
              v-for="item in allTrending"
              :key="`${item.media_type}-${item.id}`"
              :item="item"
            />
          </div>
        </template>

        <template #upcoming>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6">
            <MovieCard
              v-for="movie in upcomingMovies"
              :key="movie.id"
              :movie="movie"
            />
          </div>
        </template>

        <template #top-rated>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6">
            <MovieCard
              v-for="movie in topRatedMovies"
              :key="movie.id"
              :movie="movie"
            />
          </div>
        </template>
      </UTabs>
    </UContainer>
  </div>
</template>
