<script setup lang="ts">
useSeoMeta({ title: 'Discover — UpNext' })

const STREAMING_PROVIDERS = [
  { label: 'Netflix', value: '8' },
  { label: 'HBO Max', value: '384' },
  { label: 'Amazon Prime', value: '119' },
  { label: 'Disney+', value: '337' },
  { label: 'Apple TV+', value: '2' }
]

const MOVIE_SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity.desc' },
  { label: 'Rating', value: 'vote_average.desc' },
  { label: 'Newest', value: 'release_date.desc' },
  { label: 'Oldest', value: 'release_date.asc' }
]

const TV_SORT_OPTIONS = [
  { label: 'Popularity', value: 'popularity.desc' },
  { label: 'Rating', value: 'vote_average.desc' },
  { label: 'Newest', value: 'first_air_date.desc' },
  { label: 'Oldest', value: 'first_air_date.asc' }
]

interface Genre { id: number, name: string }
interface MediaItem {
  id: number
  media_type?: 'movie' | 'tv' | 'person'
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  overview: string
}
interface MediaListResponse { results: MediaItem[], total_pages: number }

const profileCache = useState<{ preferred_genres?: number[] } | null>('profile-cache')

const mediaType = ref<'movie' | 'tv' | 'collection'>('movie')
const isMovie = computed(() => mediaType.value === 'movie')
const isCollection = computed(() => mediaType.value === 'collection')

const [{ data: movieGenresData }, { data: tvGenresData }] = await Promise.all([
  useFetch<{ genres: Genre[] }>('/api/movies/genres'),
  useFetch<{ genres: Genre[] }>('/api/tv/genres')
])

const genres = computed(() =>
  (isMovie.value ? movieGenresData.value?.genres : tvGenresData.value?.genres ?? [])?.map(g => ({
    label: g.name,
    value: String(g.id)
  })) ?? []
)

const sortOptions = computed(() => isMovie.value ? MOVIE_SORT_OPTIONS : TV_SORT_OPTIONS)

const search = ref('')
const selectedProvider = ref<string | undefined>(undefined)
const selectedSort = ref('popularity.desc')
const selectedYear = ref<string | undefined>(undefined)
const page = ref(1)

function preferredGenreForCurrent() {
  const prefs = profileCache.value?.preferred_genres ?? []
  const available = genres.value.map(g => g.value)
  const match = prefs.find(id => available.includes(String(id)))
  return match ? String(match) : undefined
}

const selectedGenre = ref<string | undefined>(undefined)

onMounted(() => {
  selectedGenre.value = preferredGenreForCurrent()
})

const isSearching = computed(() => search.value.trim().length > 0)

const { data, pending } = await useFetch<MediaListResponse>(() => {
  if (isCollection.value) {
    if (isSearching.value) {
      return `/api/collections/search?query=${encodeURIComponent(search.value)}&page=${page.value}`
    }
    return `/api/collections/popular`
  }
  const base = isMovie.value ? '/api/movies' : '/api/tv'
  if (isSearching.value) {
    return `${base}/search?query=${encodeURIComponent(search.value)}&page=${page.value}`
  }
  const params = new URLSearchParams({ page: String(page.value), sort_by: selectedSort.value })
  if (selectedGenre.value) params.set('genre', selectedGenre.value)
  if (selectedYear.value) params.set('year', selectedYear.value)
  if (isMovie.value && selectedProvider.value) params.set('provider', selectedProvider.value)
  return `${base}/discover?${params}`
})

const results = computed(() =>
  (data.value?.results ?? []).map(item => ({
    ...item,
    media_type: item.media_type ?? (isCollection.value ? 'collection' : mediaType.value)
  }))
)
const totalPages = computed(() => Math.min(data.value?.total_pages ?? 1, 500))

watch([search, selectedGenre, selectedProvider, selectedSort, selectedYear, mediaType], () => {
  page.value = 1
})

watch(mediaType, () => {
  selectedGenre.value = preferredGenreForCurrent()
  selectedProvider.value = undefined
  selectedYear.value = undefined
  selectedSort.value = 'popularity.desc'
  search.value = ''
})

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 40 }, (_, i) => {
  const y = String(currentYear - i)
  return { label: y, value: y }
})
</script>

<template>
  <UContainer class="py-8">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">
          Discover
        </h1>
        <div class="flex rounded-lg overflow-hidden border border-default">
          <button
            class="px-4 py-1.5 text-sm font-medium transition-colors"
            :class="mediaType === 'movie' ? 'bg-primary text-white' : 'text-muted hover:text-default'"
            @click="mediaType = 'movie'"
          >
            Movies
          </button>
          <button
            class="px-4 py-1.5 text-sm font-medium transition-colors"
            :class="mediaType === 'tv' ? 'bg-primary text-white' : 'text-muted hover:text-default'"
            @click="mediaType = 'tv'"
          >
            TV Shows
          </button>
          <button
            class="px-4 py-1.5 text-sm font-medium transition-colors"
            :class="mediaType === 'collection' ? 'bg-primary text-white' : 'text-muted hover:text-default'"
            @click="mediaType = 'collection'"
          >
            Collections
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <UInput
          v-model="search"
          :placeholder="isCollection ? 'Search a collection (e.g. Marvel, Dark Knight)...' : isMovie ? 'Search a movie...' : 'Search a TV show...'"
          icon="i-lucide-search"
          size="md"
          :class="isCollection ? 'lg:col-span-4' : 'lg:col-span-1'"
        />

        <template v-if="!isCollection">
          <USelect
            v-model="selectedGenre"
            :items="genres"
            placeholder="Genre"
            size="md"
            :disabled="isSearching"
          />

          <USelect
            v-if="isMovie"
            v-model="selectedProvider"
            :items="STREAMING_PROVIDERS"
            placeholder="Platform"
            size="md"
            :disabled="isSearching"
          />

          <div
            class="flex gap-2"
            :class="!isMovie ? 'lg:col-start-3' : ''"
          >
            <USelect
              v-model="selectedYear"
              :items="years"
              placeholder="Year"
              size="md"
              class="flex-1"
              :disabled="isSearching"
            />

            <USelect
              v-model="selectedSort"
              :items="sortOptions"
              size="md"
              class="flex-1"
              :disabled="isSearching"
            />
          </div>
        </template>
      </div>

      <!-- Rezultate search / browse / popular collections -->
      <div
        v-if="pending"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        <div
          v-for="n in 20"
          :key="n"
          class="aspect-2/3 rounded-lg bg-elevated animate-pulse"
        />
      </div>

      <template v-else>
        <div
          v-if="results.length"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <MediaCard
            v-for="item in results"
            :key="item.id"
            :item="item"
          />
        </div>

        <div
          v-else
          class="text-center py-16 text-muted"
        >
          <UIcon
            name="i-lucide-film"
            class="size-12 mx-auto mb-3"
          />
          <p>No results found. Try different filters.</p>
        </div>

        <div
          v-if="totalPages > 1"
          class="flex justify-center pt-4"
        >
          <UPagination
            v-model:page="page"
            :total="totalPages * 20"
            :items-per-page="20"
            :sibling-count="1"
          />
        </div>
      </template>
    </div>
  </UContainer>
</template>
