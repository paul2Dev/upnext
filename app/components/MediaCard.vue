<script setup lang="ts">
interface MediaItem {
  id: number
  media_type?: 'movie' | 'tv' | 'person' | 'collection'
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  poster_path?: string | null
  profile_path?: string | null
  vote_average?: number
  overview?: string
}

const { item, showWatchlistButton = true } = defineProps<{ item: MediaItem, showWatchlistButton?: boolean }>()

const { poster } = useTmdbImage()
const user = useSupabaseUser()
const { has, toggle } = useWatchlist()

const mediaType = computed(() => item.media_type ?? 'movie')
const displayTitle = computed(() => item.title ?? item.name ?? '—')
const displayYear = computed(() => (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? '—')
const imagePath = computed(() => item.poster_path ?? item.profile_path ?? null)
const imageUrl = computed(() => poster(imagePath.value))
const link = computed(() => {
  if (mediaType.value === 'tv') return `/tv/${item.id}`
  if (mediaType.value === 'person') return `/person/${item.id}`
  if (mediaType.value === 'collection') return `/collection/${item.id}`
  return `/movie/${item.id}`
})

const isWatchable = computed(() => mediaType.value === 'movie' || mediaType.value === 'tv')
const inWatchlist = computed(() => has(item.id, mediaType.value))
const togglingWatchlist = ref(false)

async function onToggleWatchlist(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  if (!user.value || togglingWatchlist.value) return
  togglingWatchlist.value = true
  try {
    await toggle(item.id, mediaType.value as 'movie' | 'tv', item)
  } finally {
    togglingWatchlist.value = false
  }
}
</script>

<template>
  <NuxtLink
    :to="link"
    class="group block"
  >
    <div class="relative overflow-hidden rounded-lg bg-elevated aspect-2/3">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="displayTitle"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      >
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
      >
        <UIcon
          :name="mediaType === 'person' ? 'i-lucide-user' : 'i-lucide-clapperboard'"
          class="size-12 text-muted"
        />
      </div>

      <button
        v-if="isWatchable && showWatchlistButton && user"
        class="absolute top-2 left-2 size-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-50"
        :disabled="togglingWatchlist"
        :aria-label="inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'"
        @click="onToggleWatchlist"
      >
        <UIcon
          :name="inWatchlist ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark-plus'"
          class="size-4"
          :class="inWatchlist ? 'text-primary' : 'text-white'"
        />
      </button>

      <div class="absolute bottom-2 right-2">
        <UBadge
          v-if="item.vote_average"
          color="neutral"
          variant="solid"
          class="backdrop-blur-sm bg-black/60 text-white font-semibold"
        >
          <UIcon
            name="i-lucide-star"
            class="size-3 text-yellow-400 mr-1"
          />
          {{ item.vote_average.toFixed(1) }}
        </UBadge>
      </div>
    </div>

    <div class="mt-2 space-y-0.5 px-0.5">
      <p class="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {{ displayTitle }}
      </p>
      <p
        v-if="mediaType !== 'person'"
        class="text-xs text-muted"
      >
        {{ displayYear }}
      </p>
    </div>
  </NuxtLink>
</template>
