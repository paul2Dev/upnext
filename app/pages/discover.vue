<script setup lang="ts">
useSeoMeta({ title: 'Descoperă filme — UpNext' })

const STREAMING_PROVIDERS = [
  { label: 'Toate platformele', value: '' },
  { label: 'Netflix', value: '8' },
  { label: 'HBO Max', value: '384' },
  { label: 'Amazon Prime', value: '119' },
  { label: 'Disney+', value: '337' },
  { label: 'Apple TV+', value: '2' }
]

const SORT_OPTIONS = [
  { label: 'Popularitate', value: 'popularity.desc' },
  { label: 'Rating', value: 'vote_average.desc' },
  { label: 'Cele mai noi', value: 'release_date.desc' },
  { label: 'Cele mai vechi', value: 'release_date.asc' }
]

const { data: genresData } = await useFetch('/api/movies/genres')
const genres = computed(() => [
  { label: 'Toate genurile', value: '' },
  ...(genresData.value?.genres ?? []).map((g: { id: number, name: string }) => ({
    label: g.name,
    value: String(g.id)
  }))
])

const search = ref('')
const selectedGenre = ref('')
const selectedProvider = ref('')
const selectedSort = ref('popularity.desc')
const selectedYear = ref('')
const page = ref(1)

const { data, pending } = await useFetch(() => {
  if (search.value.trim().length > 0) {
    return `/api/movies/search?query=${encodeURIComponent(search.value)}&page=${page.value}`
  }
  const params = new URLSearchParams({
    page: String(page.value),
    sort_by: selectedSort.value
  })
  if (selectedGenre.value) params.set('genre', selectedGenre.value)
  if (selectedProvider.value) params.set('provider', selectedProvider.value)
  if (selectedYear.value) params.set('year', selectedYear.value)
  return `/api/movies/discover?${params}`
})

const movies = computed(() => data.value?.results ?? [])
const totalPages = computed(() => Math.min(data.value?.total_pages ?? 1, 500))

watch([search, selectedGenre, selectedProvider, selectedSort, selectedYear], () => {
  page.value = 1
})

const currentYear = new Date().getFullYear()
const years = [
  { label: 'Orice an', value: '' },
  ...Array.from({ length: 40 }, (_, i) => {
    const y = String(currentYear - i)
    return { label: y, value: y }
  })
]
</script>

<template>
  <UContainer class="py-8">
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">
        Descoperă filme
      </h1>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <UInput
          v-model="search"
          placeholder="Caută un film..."
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
          v-model="selectedProvider"
          :items="STREAMING_PROVIDERS"
          placeholder="Platformă"
          size="md"
          :disabled="isSearching"
        />

        <div class="flex gap-2">
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
            :items="SORT_OPTIONS"
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
          v-if="movies.length"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <MovieCard
            v-for="movie in movies"
            :key="movie.id"
            :movie="movie"
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
          <p>Niciun film găsit. Încearcă alte filtre.</p>
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
