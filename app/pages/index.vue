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

const upcomingMovies = computed(() => upcomingData.value?.results?.slice(0, 20) ?? [])
const topRatedMovies = computed(() => topRatedData.value?.results?.slice(0, 20) ?? [])
const allTrending = computed(() => (allTrendingData.value?.results ?? []).filter(i => i.media_type !== 'person').slice(0, 20))

const heroItems = computed(() =>
  (allTrendingData.value?.results ?? [])
    .filter(i => i.media_type !== 'person' && i.backdrop_path)
    .slice(0, 6)
)

const heroIndex = ref(0)
const heroItem = computed(() => heroItems.value[heroIndex.value] ?? null)

let slideInterval: ReturnType<typeof setInterval> | null = null

watch(heroItems, (items) => {
  if (slideInterval) clearInterval(slideInterval)
  if (items.length > 1) {
    heroIndex.value = Math.floor(Math.random() * items.length)
    slideInterval = setInterval(() => {
      heroIndex.value = (heroIndex.value + 1) % items.length
    }, 6000)
  }
}, { immediate: true })

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval)
})
const recommendations = computed(() => ((recommendationsData.value as { results: MovieItem[] } | null)?.results ?? []).slice(0, 20))

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
    <div class="absolute inset-x-0 top-0 h-100 sm:h-[58vh] lg:h-[62vh] overflow-hidden">
      <Transition
        enter-active-class="transition-opacity duration-1000"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-1000 absolute inset-0"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
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

      <!-- Slide indicators -->
      <div
        v-if="heroItems.length > 1"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
      >
        <button
          v-for="(_, i) in heroItems"
          :key="i"
          class="h-1 rounded-full transition-all duration-300"
          :class="i === heroIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'"
          @click="heroIndex = i"
        />
      </div>
    </div>

    <!-- CTA: fixed offset from header, kept identical to /search so both hero sections align -->
    <div class="relative">
      <UContainer class="pt-16 sm:pt-24 lg:pt-32 pb-8 text-center space-y-3">
        <div class="inline-block bg-default/30 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-lg">
          <h1 class="text-2xl sm:text-3xl font-bold">
            Your personal movie guide.
          </h1>
          <p class="text-muted text-sm leading-relaxed max-w-md mx-auto mt-2">
            Track what you've watched, discover what to watch next, and find where to stream it — all in one place.
          </p>
        </div>
        <QuickSearch class="mt-2" />
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
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              <div
                v-for="n in 20"
                :key="n"
                class="aspect-2/3 rounded-lg bg-elevated animate-pulse"
              />
            </div>

            <!-- Recommendations -->
            <div
              v-else
              class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
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
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-6">
            <MediaCard
              v-for="item in allTrending"
              :key="`${item.media_type}-${item.id}`"
              :item="item"
            />
          </div>
        </template>

        <template #upcoming>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-6">
            <MovieCard
              v-for="movie in upcomingMovies"
              :key="movie.id"
              :movie="movie"
            />
          </div>
        </template>

        <template #top-rated>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-6">
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
