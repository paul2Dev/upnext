<script setup lang="ts">
interface CastMember { id: number, name: string, character: string, profile_path: string | null }
interface CrewMember { id: number, name: string, job: string }
interface Video { key: string, site: string, type: string, name: string }
interface MovieItem { id: number, title: string, poster_path: string | null, release_date: string, vote_average: number, overview: string }
interface Movie {
  id: number
  title: string
  tagline: string | null
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  runtime: number | null
  genres: { id: number, name: string }[]
  belongs_to_collection: { id: number, name: string } | null
  credits: { cast: CastMember[], crew: CrewMember[] }
  videos: { results: Video[] }
}

const route = useRoute()
const id = route.params.id

const [{ data: movie, error }, { data: similarData }] = await Promise.all([
  useFetch<Movie>(`/api/movies/${id}`),
  useFetch<{ results: MovieItem[] }>(`/api/movies/${id}/similar`)
])

if (error.value) {
  throw createError({ statusCode: 404, message: 'Film negăsit' })
}

useSeoMeta({ title: () => movie.value ? `${movie.value.title} — UpNext` : 'UpNext' })

const { poster, backdrop } = useTmdbImage()

const year = computed(() => movie.value?.release_date?.slice(0, 4) ?? '—')
const runtime = computed(() => {
  const mins = movie.value?.runtime
  if (!mins) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
})
const rating = computed(() => movie.value?.vote_average?.toFixed(1) ?? '—')
const voteCount = computed(() => movie.value?.vote_count?.toLocaleString('ro-RO') ?? '0')
const director = computed(() => movie.value?.credits?.crew?.find(c => c.job === 'Director')?.name ?? null)
const trailer = computed(() => movie.value?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') ?? null)
const cast = computed(() => movie.value?.credits?.cast?.slice(0, 8) ?? [])
const similarMovies = computed(() => similarData.value?.results?.slice(0, 12) ?? [])

const tmdbData = computed(() => ({
  id: movie.value!.id,
  media_type: 'movie' as const,
  title: movie.value!.title,
  poster_path: movie.value!.poster_path,
  release_date: movie.value!.release_date,
  vote_average: movie.value!.vote_average,
  overview: movie.value!.overview
}))

const { user, inWatchlist, userRating, loadingWatchlist, loadingWatched, toggleWatchlist, setRating } = useMediaActions(
  Number(id),
  'movie',
  tmdbData.value
)
</script>

<template>
  <div
    v-if="movie"
    class="relative"
  >
    <!-- Backdrop absolut — se extinde în spatele conținutului -->
    <div class="absolute inset-x-0 top-0 h-130 sm:h-160 lg:h-190 overflow-hidden">
      <img
        v-if="movie.backdrop_path"
        :src="backdrop(movie.backdrop_path)"
        :alt="movie.title"
        class="w-full h-full object-cover object-top"
      >
      <div class="absolute inset-0 bg-linear-to-b from-black/20 via-default/75 to-default" />
    </div>

    <!-- Conținut deasupra backdrop-ului faded -->
    <div class="relative">
      <div class="h-52 sm:h-64" />

      <UContainer class="py-8">
        <div class="flex flex-col sm:flex-row gap-8">
          <div class="hidden sm:block shrink-0">
            <div class="w-40 sm:w-52 aspect-2/3 rounded-xl overflow-hidden bg-elevated shadow-xl">
              <img
                v-if="movie.poster_path"
                :src="poster(movie.poster_path, 'w342')"
                :alt="movie.title"
                class="w-full h-full object-cover"
              >
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-clapperboard"
                  class="size-16 text-muted"
                />
              </div>
            </div>
          </div>

          <div class="flex-1 space-y-4 pt-2">
            <div>
              <h1 class="text-3xl font-bold leading-tight">
                {{ movie.title }}
              </h1>
              <p
                v-if="movie.tagline"
                class="text-muted italic mt-1"
              >
                {{ movie.tagline }}
              </p>
              <div class="flex flex-wrap items-center gap-3 mt-2 text-muted text-sm">
                <span>{{ year }}</span>
                <span v-if="runtime">{{ runtime }}</span>
                <UBadge
                  color="neutral"
                  variant="solid"
                  class="bg-black/60 text-white font-semibold"
                >
                  <UIcon
                    name="i-lucide-star"
                    class="size-3 text-yellow-400 mr-1"
                  />
                  {{ rating }}
                  <span class="font-normal opacity-70 ml-1">({{ voteCount }})</span>
                </UBadge>
              </div>
              <p
                v-if="director"
                class="text-sm mt-2"
              >
                <span class="text-muted">Regizor: </span>
                <span class="font-medium">{{ director }}</span>
              </p>
            </div>

            <div
              v-if="movie.genres.length"
              class="flex flex-wrap gap-2"
            >
              <UBadge
                v-for="genre in movie.genres"
                :key="genre.id"
                variant="subtle"
              >
                {{ genre.name }}
              </UBadge>
            </div>

            <NuxtLink
              v-if="movie.belongs_to_collection"
              :to="`/collection/${movie.belongs_to_collection.id}`"
              class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <UIcon
                name="i-lucide-library"
                class="size-4"
              />
              {{ movie.belongs_to_collection.name }}
            </NuxtLink>

            <div
              v-if="user"
              class="flex flex-wrap items-center gap-3 pt-1"
            >
              <UButton
                :icon="inWatchlist ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark-plus'"
                :color="inWatchlist ? 'primary' : 'neutral'"
                :variant="inWatchlist ? 'soft' : 'outline'"
                :loading="loadingWatchlist"
                size="sm"
                @click="toggleWatchlist"
              >
                {{ inWatchlist ? 'În watchlist' : 'Adaugă la watchlist' }}
              </UButton>

              <div class="flex items-center gap-1">
                <span class="text-sm text-muted mr-1">Rating:</span>
                <UButton
                  v-for="star in 5"
                  :key="star"
                  :icon="star <= (userRating ?? 0) ? 'i-lucide-star' : 'i-lucide-star'"
                  :color="star <= (userRating ?? 0) ? 'warning' : 'neutral'"
                  :variant="star <= (userRating ?? 0) ? 'soft' : 'ghost'"
                  size="xs"
                  :loading="loadingWatched && userRating === null"
                  square
                  @click="setRating(star)"
                />
              </div>
            </div>

            <p
              v-if="movie.overview"
              class="text-muted leading-relaxed"
            >
              {{ movie.overview }}
            </p>
          </div>
        </div>

        <div
          v-if="trailer"
          class="mt-10"
        >
          <h2 class="text-lg font-semibold mb-4">
            Trailer
          </h2>
          <div class="w-full rounded-xl overflow-hidden bg-black aspect-video">
            <iframe
              :src="`https://www.youtube-nocookie.com/embed/${trailer.key}`"
              :title="trailer.name"
              class="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />
          </div>
        </div>

        <div
          v-if="cast.length"
          class="mt-10"
        >
          <h2 class="text-lg font-semibold mb-4">
            Distribuție
          </h2>
          <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            <NuxtLink
              v-for="actor in cast"
              :key="actor.id"
              :to="`/person/${actor.id}`"
              class="text-center group"
            >
              <div class="aspect-square rounded-full overflow-hidden bg-elevated mx-auto mb-1 size-14 sm:size-16 ring-2 ring-transparent group-hover:ring-primary transition-all">
                <img
                  v-if="actor.profile_path"
                  :src="poster(actor.profile_path, 'w185')"
                  :alt="actor.name"
                  class="w-full h-full object-cover"
                >
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-user"
                    class="size-6 text-muted"
                  />
                </div>
              </div>
              <p class="text-xs font-medium leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                {{ actor.name }}
              </p>
              <p class="text-xs text-muted leading-tight line-clamp-1">
                {{ actor.character }}
              </p>
            </NuxtLink>
          </div>
        </div>

        <div
          v-if="similarMovies.length"
          class="mt-10"
        >
          <h2 class="text-lg font-semibold mb-4">
            Filme similare
          </h2>
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MovieCard
              v-for="similar in similarMovies"
              :key="similar.id"
              :movie="similar"
            />
          </div>
        </div>
      </UContainer>
    </div>
  </div>
</template>
