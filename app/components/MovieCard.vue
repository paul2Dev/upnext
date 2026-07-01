<script setup lang="ts">
interface Movie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  overview: string
}

const { movie, showWatchlistButton = true } = defineProps<{ movie: Movie, showWatchlistButton?: boolean }>()

const { poster } = useTmdbImage()
const posterUrl = computed(() => poster(movie.poster_path))

const user = useSupabaseUser()
const { has, toggle } = useWatchlist()
const inWatchlist = computed(() => has(movie.id, 'movie'))
const togglingWatchlist = ref(false)

async function onToggleWatchlist(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  if (!user.value || togglingWatchlist.value) return
  togglingWatchlist.value = true
  try {
    await toggle(movie.id, 'movie', movie)
  } finally {
    togglingWatchlist.value = false
  }
}
</script>

<template>
  <NuxtLink
    :to="`/movie/${movie.id}`"
    class="group block"
  >
    <div class="relative overflow-hidden rounded-lg bg-elevated aspect-2/3">
      <img
        v-if="posterUrl"
        :src="posterUrl"
        :alt="movie.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      >
      <div
        v-else
        class="w-full h-full flex items-center justify-center"
      >
        <UIcon
          name="i-lucide-clapperboard"
          class="size-12 text-muted"
        />
      </div>

      <button
        v-if="showWatchlistButton && user"
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

      <div class="absolute top-2 right-2">
        <UBadge
          color="neutral"
          variant="solid"
          class="backdrop-blur-sm bg-black/60 text-white font-semibold"
        >
          <UIcon
            name="i-lucide-star"
            class="size-3 text-yellow-400 mr-1"
          />
          {{ movie.vote_average?.toFixed(1) ?? '—' }}
        </UBadge>
      </div>
    </div>

    <div class="mt-2 space-y-0.5 px-0.5">
      <p class="font-medium text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {{ movie.title }}
      </p>
      <p class="text-xs text-muted">
        {{ movie.release_date?.slice(0, 4) ?? '—' }}
      </p>
    </div>
  </NuxtLink>
</template>
