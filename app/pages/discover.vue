<script setup lang="ts">
useSeoMeta({ title: 'Descoperă — UpNext' })

const STREAMING_PROVIDERS = [
  { label: 'Netflix', value: '8' },
  { label: 'HBO Max', value: '384' },
  { label: 'Amazon Prime', value: '119' },
  { label: 'Disney+', value: '337' },
  { label: 'Apple TV+', value: '2' }
]

const MOVIE_SORT_OPTIONS = [
  { label: 'Popularitate', value: 'popularity.desc' },
  { label: 'Rating', value: 'vote_average.desc' },
  { label: 'Cele mai noi', value: 'release_date.desc' },
  { label: 'Cele mai vechi', value: 'release_date.asc' }
]

const TV_SORT_OPTIONS = [
  { label: 'Popularitate', value: 'popularity.desc' },
  { label: 'Rating', value: 'vote_average.desc' },
  { label: 'Cele mai noi', value: 'first_air_date.desc' },
  { label: 'Cele mai vechi', value: 'first_air_date.asc' }
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

const mediaType = ref<'movie' | 'tv'>('movie')
const isMovie = computed(() => mediaType.value === 'movie')

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
const selectedGenre = ref<string | undefined>(undefined)
const selectedProvider = ref<string | undefined>(undefined)
const selectedSort = ref('popularity.desc')
const selectedYear = ref<string | undefined>(undefined)
const page = ref(1)

const isSearching = computed(() => search.value.trim().length > 0)

const { data, pending } = await useFetch<MediaListResponse>(() => {
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

const results = computed(() => {
  return (data.value?.results ?? []).map(item => ({
    ...item,
    media_type: item.media_type ?? mediaType.value
  }))
})
const totalPages = computed(() => Math.min(data.value?.total_pages ?? 1, 500))

watch([search, selectedGenre, selectedProvider, selectedSort, selectedYear, mediaType], () => {
  page.value = 1
})

watch(mediaType, () => {
  selectedGenre.value = undefined
  selectedSort.value = 'popularity.desc'
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
          Descoperă
        </h1>
        <div class="flex rounded-lg overflow-hidden border border-default">
          <button
            class="px-4 py-1.5 text-sm font-medium transition-colors"
            :class="isMovie ? 'bg-primary text-white' : 'text-muted hover:text-default'"
            @click="mediaType = 'movie'"
          >
            Filme
          </button>
          <button
            class="px-4 py-1.5 text-sm font-medium transition-colors"
            :class="!isMovie ? 'bg-primary text-white' : 'text-muted hover:text-default'"
            @click="mediaType = 'tv'"
          >
            Seriale
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <UInput
          v-model="search"
          :placeholder="isMovie ? 'Caută un film...' : 'Caută un serial...'"
          icon="i-lucide-search"
          size="md"
          class="lg:col-span-1"
        />

        <USelect
          v-model="selectedGenre"
          :items="genres"
          placeholder="Gen"
          size="md"
          :disabled="isSearching"
        />

        <USelect
          v-if="isMovie"
          v-model="selectedProvider"
          :items="STREAMING_PROVIDERS"
          placeholder="Platformă"
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
            placeholder="An"
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
      </div>

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
          <p>Niciun rezultat găsit. Încearcă alte filtre.</p>
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
