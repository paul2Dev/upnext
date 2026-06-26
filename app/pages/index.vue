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
interface TvItem {
  id: number
  name: string
  poster_path: string | null
  first_air_date: string
  vote_average: number
  overview: string
  media_type: 'tv'
}

const [{ data: trendingData }, { data: upcomingData }, { data: topRatedData }, { data: tvTrendingData }] = await Promise.all([
  useFetch<{ results: MovieItem[] }>('/api/movies/trending'),
  useFetch<{ results: MovieItem[] }>('/api/movies/upcoming'),
  useFetch<{ results: MovieItem[] }>('/api/movies/top-rated'),
  useFetch<{ results: TvItem[] }>('/api/tv/trending')
])

const trendingMovies = computed(() => trendingData.value?.results?.slice(0, 18) ?? [])
const upcomingMovies = computed(() => upcomingData.value?.results?.slice(0, 18) ?? [])
const topRatedMovies = computed(() => topRatedData.value?.results?.slice(0, 18) ?? [])
const tvTrending = computed(() => (tvTrendingData.value?.results ?? []).slice(0, 18).map(s => ({ ...s, media_type: 'tv' as const })))

const tabs = [
  { label: 'Trending filme', slot: 'trending' as const },
  { label: 'Seriale trending', slot: 'tv' as const },
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
        <template #trending>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6">
            <MovieCard
              v-for="movie in trendingMovies"
              :key="movie.id"
              :movie="movie"
            />
          </div>
        </template>

        <template #tv>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-6">
            <MediaCard
              v-for="show in tvTrending"
              :key="show.id"
              :item="show"
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
