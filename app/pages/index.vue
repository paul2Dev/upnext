<script setup lang="ts">
useSeoMeta({ title: 'UpNext — Discover Movies' })

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
  backdrop_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  overview: string
}

const user = useSupabaseUser()
const profileCache = useState<{ onboarding_done: boolean } | null>('profile-cache')
const { backdrop } = useTmdbImage()

const [{ data: upcomingData }, { data: topRatedData }, { data: allTrendingData }] = await Promise.all([
  useFetch<{ results: MovieItem[] }>('/api/movies/upcoming'),
  useFetch<{ results: MovieItem[] }>('/api/movies/top-rated'),
  useFetch<{ results: AllItem[] }>('/api/trending/all')
])

const { data: recommendationsData, pending: loadingRecommendations, execute: fetchRecommendations } = useLazyFetch<{ results: MovieItem[] }>(
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

const heroItem = computed(() => {
  const items = (allTrendingData.value?.results ?? []).filter(i => i.media_type !== 'person' && i.backdrop_path)
  if (!items.length) return null
  return items[Math.floor(Math.random() * Math.min(5, items.length))]
})
const recommendations = computed(() => ((recommendationsData.value as { results: MovieItem[] } | null)?.results ?? []).slice(0, 18))

const onboardingDone = computed(() => !!profileCache.value?.onboarding_done)

const tabs = [
  { label: 'For You', slot: 'foryou' as const },
  { label: 'Trending', slot: 'all' as const },
  { label: 'Upcoming', slot: 'upcoming' as const },
  { label: 'Top Rated', slot: 'top-rated' as const }
]
</script>

<template>
  <div class="relative">
    <!-- Backdrop -->
    <div class="absolute inset-x-0 top-0 h-100 sm:h-120 lg:h-140 overflow-hidden">
      <Transition
        enter-active-class="transition-opacity duration-1000"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
      >
        <img
          v-if="heroItem?.backdrop_path"
          :key="heroItem.id"
          :src="backdrop(heroItem.backdrop_path)"
          :alt="heroItem.title ?? heroItem.name"
          class="w-full h-full object-cover object-top"
        >
      </Transition>
      <div class="absolute inset-0 bg-linear-to-b from-black/50 via-black/40 to-default" />
    </div>

    <!-- CTA: min-h fills viewport minus header(~64px) + tabs area(~80px) + one card row(~296px) -->
    <div class="relative min-h-[calc(100svh-478px)] sm:min-h-0 flex flex-col justify-center">
      <UContainer class="py-8 text-center space-y-3">
        <h1 class="text-2xl sm:text-4xl font-bold text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.8)]">
          Stop scrolling. Start watching.
        </h1>
        <p class="text-white/90 text-base max-w-xl mx-auto [text-shadow:0_1px_6px_rgba(0,0,0,0.9)]">
          Rate what you've seen, discover what's next, and never waste an evening on a bad pick again.
        </p>
        <UButton
          to="/discover"
          label="Explore"
          icon="i-lucide-compass"
          size="lg"
        />
      </UContainer>
    </div>

    <UContainer class="relative pt-4 pb-10">
      <UTabs
        :items="tabs"
        :ui="{ trigger: 'px-2 sm:px-4 text-xs sm:text-sm' }"
      >
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
                Sign in to see personalized recommendations.
              </p>
              <UButton
                to="/login"
                label="Sign in"
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
                Set up your profile for personalized recommendations.
              </p>
              <UButton
                to="/onboarding"
                label="Set up profile"
                icon="i-lucide-arrow-right"
                trailing
              />
            </div>

            <!-- Recommendations loading -->
            <div
              v-else-if="loadingRecommendations"
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
            >
              <div
                v-for="n in 18"
                :key="n"
                class="aspect-2/3 rounded-lg bg-elevated animate-pulse"
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
