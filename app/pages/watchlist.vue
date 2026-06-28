<script setup lang="ts">
interface TmdbData {
  id: number
  media_type: 'movie' | 'tv'
  title?: string
  name?: string
  poster_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_average?: number
  runtime?: number
  number_of_seasons?: number
}

interface WatchlistRow {
  id: string
  movie_id: number
  media_type: string
  tmdb_data: TmdbData
  added_at: string
}

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Watchlist — UpNext' })

const { data: items, refresh } = await useFetch<WatchlistRow[]>('/api/user/watchlist')

const watchlistCount = useState<number>('watchlist-count', () => 0)
watch(items, (v) => {
  watchlistCount.value = v?.length ?? 0
}, { immediate: true })

const activeFilter = ref<'all' | 'movie' | 'tv'>('all')

const movieCount = computed(() => (items.value ?? []).filter(i => i.media_type === 'movie').length)
const tvCount = computed(() => (items.value ?? []).filter(i => i.media_type === 'tv').length)

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return items.value ?? []
  return (items.value ?? []).filter(i => i.media_type === activeFilter.value)
})

const removing = ref<string | null>(null)

async function remove(item: WatchlistRow) {
  removing.value = item.id
  try {
    await $fetch('/api/user/watchlist', {
      method: 'DELETE',
      body: { movie_id: item.movie_id, media_type: item.media_type }
    })
    await refresh()
  } finally {
    removing.value = null
  }
}

const watchModal = ref(false)
const pendingWatch = ref<WatchlistRow | null>(null)
const pendingRating = ref<number | null>(null)
const markingWatched = ref(false)

const RATINGS = [
  { value: 1, icon: 'i-lucide-thumbs-down', label: 'Not for me', selectedClass: 'border-red-400 text-red-400 bg-red-400/10', hoverClass: 'hover:border-red-400/60 hover:text-red-400/60' },
  { value: 3, icon: 'i-lucide-thumbs-up', label: 'I like this', selectedClass: 'border-green-400 text-green-400 bg-green-400/10', hoverClass: 'hover:border-green-400/60 hover:text-green-400/60' },
  { value: 5, label: 'Love this', selectedClass: 'border-pink-400 text-pink-400 bg-pink-400/10', hoverClass: 'hover:border-pink-400/60 hover:text-pink-400/60' }
] as const

function openWatchModal(item: WatchlistRow) {
  pendingWatch.value = item
  pendingRating.value = null
  watchModal.value = true
}

async function markAsWatched(rating: number) {
  if (!pendingWatch.value) return
  markingWatched.value = true
  pendingRating.value = rating
  try {
    await $fetch('/api/user/ratings', {
      method: 'POST',
      body: {
        movie_id: pendingWatch.value.movie_id,
        media_type: pendingWatch.value.media_type,
        rating,
        tmdb_data: pendingWatch.value.tmdb_data
      }
    })
    await $fetch('/api/user/watchlist', {
      method: 'DELETE',
      body: { movie_id: pendingWatch.value.movie_id, media_type: pendingWatch.value.media_type }
    })
    watchModal.value = false
    await refresh()
  } finally {
    markingWatched.value = false
  }
}

function formatRuntime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatRelativeDate(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

const pendingTitle = computed(() => {
  const d = pendingWatch.value?.tmdb_data
  return d?.title ?? d?.name ?? ''
})
</script>

<template>
  <UContainer class="py-10">
    <div class="flex items-baseline gap-2 mb-6">
      <h1 class="text-2xl font-bold">
        Watchlist
      </h1>
      <span
        v-if="items?.length"
        class="text-sm text-muted font-medium"
      >
        {{ items.length }} {{ items.length === 1 ? 'title' : 'titles' }}
      </span>
    </div>

    <div
      v-if="items?.length"
      class="flex items-center gap-1.5 mb-6"
    >
      <UButton
        size="sm"
        :color="activeFilter === 'all' ? 'primary' : 'neutral'"
        :variant="activeFilter === 'all' ? 'soft' : 'ghost'"
        @click="activeFilter = 'all'"
      >
        All <span class="ml-1 opacity-60">{{ items.length }}</span>
      </UButton>
      <UButton
        size="sm"
        :color="activeFilter === 'movie' ? 'primary' : 'neutral'"
        :variant="activeFilter === 'movie' ? 'soft' : 'ghost'"
        @click="activeFilter = 'movie'"
      >
        Movies <span class="ml-1 opacity-60">{{ movieCount }}</span>
      </UButton>
      <UButton
        size="sm"
        :color="activeFilter === 'tv' ? 'primary' : 'neutral'"
        :variant="activeFilter === 'tv' ? 'soft' : 'ghost'"
        @click="activeFilter = 'tv'"
      >
        TV Shows <span class="ml-1 opacity-60">{{ tvCount }}</span>
      </UButton>
    </div>

    <div
      v-if="!items?.length"
      class="flex flex-col items-center justify-center py-24 text-center gap-4"
    >
      <UIcon
        name="i-lucide-bookmark"
        class="size-16 text-muted"
      />
      <p class="text-muted text-lg">
        Nothing in your watchlist yet.
      </p>
      <UButton
        to="/discover"
        variant="soft"
      >
        Browse movies
      </UButton>
    </div>

    <div
      v-else-if="!filteredItems.length"
      class="flex flex-col items-center justify-center py-24 text-center gap-4"
    >
      <UIcon
        name="i-lucide-filter-x"
        class="size-12 text-muted"
      />
      <p class="text-muted">
        No {{ activeFilter === 'movie' ? 'movies' : 'TV shows' }} in your watchlist.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
    >
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="relative group"
      >
        <MediaCard :item="{ ...item.tmdb_data, media_type: item.media_type as 'movie' | 'tv' }" />

        <div class="mt-1 px-0.5 flex items-center justify-between gap-1">
          <p class="text-[11px] text-muted leading-tight truncate">
            <span v-if="item.tmdb_data.runtime">{{ formatRuntime(item.tmdb_data.runtime) }} · </span>
            <span v-else-if="item.tmdb_data.number_of_seasons">{{ item.tmdb_data.number_of_seasons }}{{ item.tmdb_data.number_of_seasons === 1 ? ' season' : ' seasons' }} · </span>
            {{ formatRelativeDate(item.added_at) }}
          </p>
          <div class="flex items-center shrink-0">
            <button
              class="size-6 flex items-center justify-center text-muted hover:text-red-400 transition-colors"
              :disabled="removing === item.id"
              @click.prevent="remove(item)"
            >
              <UIcon
                name="i-lucide-trash-2"
                class="size-3.5"
              />
            </button>
            <button
              class="size-6 flex items-center justify-center text-muted hover:text-green-400 transition-colors"
              @click.prevent="openWatchModal(item)"
            >
              <UIcon
                name="i-lucide-check"
                class="size-3.5"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mark as watched modal -->
    <UModal v-model:open="watchModal">
      <template #content>
        <div class="p-6 flex flex-col items-center gap-5 text-center">
          <UIcon
            name="i-lucide-circle-check"
            class="size-10 text-green-400"
          />
          <div>
            <p class="text-sm text-muted mb-1">
              How was it?
            </p>
            <p class="font-semibold text-base">
              {{ pendingTitle }}
            </p>
          </div>

          <div class="flex items-center gap-3">
            <template
              v-for="option in RATINGS"
              :key="option.value"
            >
              <div class="group/opt relative flex flex-col items-center">
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-elevated text-sm font-semibold rounded-md whitespace-nowrap opacity-0 group-hover/opt:opacity-100 transition-opacity pointer-events-none shadow z-10">
                  {{ option.label }}
                </div>
                <button
                  class="size-11 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="pendingRating === option.value
                    ? option.selectedClass
                    : `border-muted text-muted ${option.hoverClass}`"
                  :disabled="markingWatched"
                  @click="markAsWatched(option.value)"
                >
                  <UIcon
                    v-if="markingWatched && pendingRating === option.value"
                    name="i-lucide-loader-circle"
                    class="size-4 animate-spin"
                  />
                  <span
                    v-else-if="option.value === 5"
                    class="flex"
                  >
                    <UIcon
                      name="i-lucide-thumbs-up"
                      class="size-4"
                    />
                    <UIcon
                      name="i-lucide-thumbs-up"
                      class="size-4 -ml-1.5"
                    />
                  </span>
                  <UIcon
                    v-else
                    :name="option.icon"
                    class="size-4"
                  />
                </button>
              </div>
            </template>
          </div>

          <p class="text-xs text-muted">
            Selecting a rating will mark it as watched and remove it from your watchlist.
          </p>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
