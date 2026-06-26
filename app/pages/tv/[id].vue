<script setup lang="ts">
interface CastMember { id: number, name: string, character: string, profile_path: string | null }
interface CrewMember { id: number, name: string, job: string }
interface Video { key: string, site: string, type: string, name: string }
interface Creator { id: number, name: string }
interface Season {
  id: number
  name: string
  season_number: number
  episode_count: number
  air_date: string | null
  poster_path: string | null
  overview: string
}
interface Episode {
  id: number
  name: string
  episode_number: number
  air_date: string | null
  runtime: number | null
  still_path: string | null
  overview: string
  vote_average: number
}
interface TvShow {
  id: number
  name: string
  tagline: string | null
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  number_of_seasons: number
  number_of_episodes: number
  status: string
  genres: { id: number, name: string }[]
  created_by: Creator[]
  networks: { id: number, name: string, logo_path: string | null }[]
  seasons: Season[]
  credits: { cast: CastMember[], crew: CrewMember[] }
  videos: { results: Video[] }
}
interface TvItem { id: number, name: string, poster_path: string | null, first_air_date: string, vote_average: number, overview: string, media_type: 'tv' }

const route = useRoute()
const id = route.params.id

const [{ data: show, error }, { data: similarData }] = await Promise.all([
  useFetch<TvShow>(`/api/tv/${id}`),
  useFetch<{ results: TvItem[] }>(`/api/tv/${id}/similar`)
])

if (error.value) {
  throw createError({ statusCode: 404, message: 'Serial negăsit' })
}

useSeoMeta({ title: () => show.value ? `${show.value.name} — UpNext` : 'UpNext' })

const { poster, backdrop } = useTmdbImage()

const year = computed(() => show.value?.first_air_date?.slice(0, 4) ?? '—')
const rating = computed(() => show.value?.vote_average?.toFixed(1) ?? '—')
const voteCount = computed(() => show.value?.vote_count?.toLocaleString('ro-RO') ?? '0')
const creators = computed(() => show.value?.created_by?.map(c => c.name).join(', ') ?? null)
const trailer = computed(() => show.value?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') ?? null)
const cast = computed(() => show.value?.credits?.cast?.slice(0, 8) ?? [])
const similarShows = computed(() => (similarData.value?.results ?? []).slice(0, 12).map(s => ({ ...s, media_type: 'tv' as const })))
const seasons = computed(() => show.value?.seasons?.filter(s => s.season_number > 0) ?? [])

const openSeason = ref<number | null>(null)
const episodeCache = ref<Record<number, Episode[]>>({})
const loadingEpisodes = ref(false)

async function toggleSeason(seasonNumber: number) {
  if (openSeason.value === seasonNumber) {
    openSeason.value = null
    return
  }
  openSeason.value = seasonNumber
  if (!episodeCache.value[seasonNumber]) {
    loadingEpisodes.value = true
    try {
      const data = await $fetch<{ episodes: Episode[] }>(`/api/tv/${id}/season/${seasonNumber}`)
      episodeCache.value[seasonNumber] = data.episodes ?? []
    } finally {
      loadingEpisodes.value = false
    }
  }
}
</script>

<template>
  <div v-if="show">
    <div class="relative h-72 sm:h-96 overflow-hidden">
      <img
        v-if="show.backdrop_path"
        :src="backdrop(show.backdrop_path)"
        :alt="show.name"
        class="w-full h-full object-cover"
      >
      <div class="absolute inset-0 bg-linear-to-t from-default via-default/80 to-transparent" />
    </div>

    <UContainer class="py-8">
      <div class="flex flex-col sm:flex-row gap-8 -mt-24 sm:-mt-32 relative">
        <div class="hidden sm:block shrink-0">
          <div class="w-40 sm:w-52 aspect-2/3 rounded-xl overflow-hidden bg-elevated shadow-xl">
            <img
              v-if="show.poster_path"
              :src="poster(show.poster_path, 'w342')"
              :alt="show.name"
              class="w-full h-full object-cover"
            >
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-tv"
                class="size-16 text-muted"
              />
            </div>
          </div>
        </div>

        <div class="flex-1 space-y-4 pt-2 sm:pt-24">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <UBadge
                color="primary"
                variant="subtle"
              >
                Serial
              </UBadge>
              <UBadge
                v-if="show.status"
                color="neutral"
                variant="subtle"
                class="text-xs"
              >
                {{ show.status }}
              </UBadge>
            </div>
            <h1 class="text-3xl font-bold leading-tight">
              {{ show.name }}
            </h1>
            <p
              v-if="show.tagline"
              class="text-muted italic mt-1"
            >
              {{ show.tagline }}
            </p>
            <div class="flex flex-wrap items-center gap-3 mt-2 text-muted text-sm">
              <span>{{ year }}</span>
              <span>{{ show.number_of_seasons }} sez. · {{ show.number_of_episodes }} ep.</span>
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
              v-if="creators"
              class="text-sm mt-2"
            >
              <span class="text-muted">Creat de: </span>
              <span class="font-medium">{{ creators }}</span>
            </p>
          </div>

          <div
            v-if="show.genres.length"
            class="flex flex-wrap gap-2"
          >
            <UBadge
              v-for="genre in show.genres"
              :key="genre.id"
              variant="subtle"
            >
              {{ genre.name }}
            </UBadge>
          </div>

          <p
            v-if="show.overview"
            class="text-muted leading-relaxed max-w-2xl"
          >
            {{ show.overview }}
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
        <div
          class="relative w-full max-w-3xl rounded-xl overflow-hidden bg-black"
          style="padding-top: 56.25%"
        >
          <iframe
            :src="`https://www.youtube-nocookie.com/embed/${trailer.key}`"
            :title="trailer.name"
            class="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          />
        </div>
      </div>

      <div
        v-if="seasons.length"
        class="mt-10"
      >
        <h2 class="text-lg font-semibold mb-4">
          Sezoane
        </h2>
        <div class="space-y-2">
          <div
            v-for="season in seasons"
            :key="season.season_number"
            class="border border-default rounded-xl overflow-hidden"
          >
            <button
              class="w-full flex items-center gap-4 p-4 text-left hover:bg-elevated transition-colors"
              @click="toggleSeason(season.season_number)"
            >
              <div class="shrink-0 w-10 h-14 rounded-lg overflow-hidden bg-elevated">
                <img
                  v-if="season.poster_path"
                  :src="poster(season.poster_path, 'w185')"
                  :alt="season.name"
                  class="w-full h-full object-cover"
                >
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-tv"
                    class="size-4 text-muted"
                  />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium leading-tight">
                  {{ season.name }}
                </p>
                <p class="text-sm text-muted">
                  {{ season.episode_count }} episoade
                  <span v-if="season.air_date">· {{ season.air_date.slice(0, 4) }}</span>
                </p>
              </div>
              <UIcon
                :name="openSeason === season.season_number ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="size-4 text-muted shrink-0"
              />
            </button>

            <div v-if="openSeason === season.season_number">
              <div
                v-if="loadingEpisodes && !episodeCache[season.season_number]"
                class="p-4 text-center text-muted text-sm"
              >
                <UIcon
                  name="i-lucide-loader-circle"
                  class="size-4 animate-spin inline mr-2"
                />
                Se încarcă episoadele...
              </div>
              <div
                v-else-if="episodeCache[season.season_number]"
                class="divide-y divide-default"
              >
                <div
                  v-for="ep in episodeCache[season.season_number]"
                  :key="ep.id"
                  class="flex gap-3 p-4 hover:bg-elevated/50 transition-colors"
                >
                  <div class="shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-elevated">
                    <img
                      v-if="ep.still_path"
                      :src="poster(ep.still_path, 'w185')"
                      :alt="ep.name"
                      class="w-full h-full object-cover"
                    >
                    <div
                      v-else
                      class="w-full h-full flex items-center justify-center"
                    >
                      <UIcon
                        name="i-lucide-film"
                        class="size-4 text-muted"
                      />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2">
                      <span class="text-xs text-muted font-mono shrink-0">{{ ep.episode_number }}.</span>
                      <p class="font-medium text-sm leading-tight line-clamp-1">
                        {{ ep.name }}
                      </p>
                      <span
                        v-if="ep.runtime"
                        class="text-xs text-muted shrink-0 ml-auto"
                      >{{ ep.runtime }}m</span>
                    </div>
                    <p
                      v-if="ep.overview"
                      class="text-xs text-muted mt-1 line-clamp-2"
                    >
                      {{ ep.overview }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
        v-if="similarShows.length"
        class="mt-10"
      >
        <h2 class="text-lg font-semibold mb-4">
          Seriale similare
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MediaCard
            v-for="similar in similarShows"
            :key="similar.id"
            :item="similar"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>
