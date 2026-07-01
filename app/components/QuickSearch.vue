<script setup lang="ts">
interface SearchResult {
  id: number
  media_type: 'movie' | 'tv'
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
}

const user = useSupabaseUser()
const { poster } = useTmdbImage()
const watchlistCount = useState<number>('watchlist-count', () => 0)

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const isOpen = ref(false)
const added = reactive(new Set<string>())
const pending = ref<string | null>(null)
const hoveringKey = ref<string | null>(null)
const searchEl = ref<HTMLElement | null>(null)

let debounceTimer: ReturnType<typeof setTimeout>

watch(query, (val) => {
  clearTimeout(debounceTimer)
  if (!val.trim()) {
    results.value = []
    isOpen.value = false
    loading.value = false
    return
  }
  loading.value = true
  debounceTimer = setTimeout(async () => {
    try {
      const [moviesRes, tvRes] = await Promise.all([
        $fetch<{ results: SearchResult[] }>(`/api/movies/search?query=${encodeURIComponent(val)}`),
        $fetch<{ results: SearchResult[] }>(`/api/tv/search?query=${encodeURIComponent(val)}`)
      ])
      const movies = (moviesRes.results ?? []).slice(0, 4).map(r => ({ ...r, media_type: 'movie' as const }))
      const tv = (tvRes.results ?? []).slice(0, 3).map(r => ({ ...r, media_type: 'tv' as const }))
      results.value = [...movies, ...tv].slice(0, 6)
      isOpen.value = results.value.length > 0
    } catch {
      results.value = []
      isOpen.value = false
    } finally {
      loading.value = false
    }
  }, 300)
})

async function toggleWatchlist(item: SearchResult, e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (!user.value) {
    navigateTo('/login')
    return
  }
  const key = `${item.media_type}:${item.id}`
  if (pending.value === key) return
  pending.value = key
  try {
    if (added.has(key)) {
      await $fetch('/api/user/watchlist', {
        method: 'DELETE',
        body: { movie_id: item.id, media_type: item.media_type }
      })
      added.delete(key)
      watchlistCount.value = Math.max(0, watchlistCount.value - 1)
    } else {
      await $fetch('/api/user/watchlist', {
        method: 'POST',
        body: {
          movie_id: item.id,
          media_type: item.media_type,
          tmdb_data: {
            id: item.id,
            title: item.title,
            name: item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            media_type: item.media_type
          }
        }
      })
      added.add(key)
      watchlistCount.value++
    }
  } finally {
    pending.value = null
  }
}

function handleClickOutside(e: MouseEvent) {
  if (searchEl.value && !searchEl.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

function itemLink(item: SearchResult) {
  return item.media_type === 'tv' ? `/tv/${item.id}` : `/movie/${item.id}`
}

function displayTitle(item: SearchResult) {
  return item.title ?? item.name ?? '—'
}

function displayYear(item: SearchResult) {
  return (item.release_date ?? item.first_air_date)?.slice(0, 4) ?? ''
}

function clearSearch() {
  query.value = ''
  isOpen.value = false
}

onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)
  if (user.value) {
    try {
      const items = await $fetch<{ movie_id: number, media_type: string }[]>('/api/user/watchlist')
      for (const item of items ?? []) {
        added.add(`${item.media_type}:${item.movie_id}`)
      }
    } catch (err) { void err }
  }
})

onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))
</script>

<template>
  <div
    ref="searchEl"
    class="relative w-full max-w-lg mx-auto"
  >
    <div class="relative">
      <UIcon
        name="i-lucide-search"
        class="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted pointer-events-none"
      />
      <input
        v-model="query"
        type="text"
        placeholder="Search a movie or TV show..."
        class="w-full pl-11 pr-10 py-3.5 rounded-xl bg-default/30 backdrop-blur-sm border border-default text-default font-sans placeholder:text-muted placeholder:text-sm placeholder:font-sans outline-none focus:border-white/50 transition-all text-sm"
        @focus="isOpen = results.length > 0"
        @keydown.escape="clearSearch"
      >
      <div class="absolute right-4 top-1/2 -translate-y-1/2">
        <UIcon
          v-if="loading"
          name="i-lucide-loader-circle"
          class="size-5 text-muted animate-spin"
        />
      </div>
    </div>

    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="isOpen && results.length"
        class="absolute z-50 top-full mt-2 w-full rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur-sm shadow-2xl overflow-hidden"
      >
        <NuxtLink
          v-for="item in results"
          :key="`${item.media_type}:${item.id}`"
          :to="itemLink(item)"
          class="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors"
          @click="isOpen = false"
        >
          <img
            v-if="item.poster_path"
            :src="poster(item.poster_path)"
            :alt="displayTitle(item)"
            class="w-9 h-13.5 rounded object-cover shrink-0"
          >
          <div
            v-else
            class="w-9 h-13.5 rounded bg-white/10 flex items-center justify-center shrink-0"
          >
            <UIcon
              name="i-lucide-clapperboard"
              class="size-4 text-white/40"
            />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">
              {{ displayTitle(item) }}
            </p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="text-xs text-white/50">{{ displayYear(item) }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                {{ item.media_type === 'tv' ? 'TV' : 'Movie' }}
              </span>
            </div>
          </div>

          <button
            class="shrink-0 size-8 rounded-full flex items-center justify-center transition-colors"
            :class="added.has(`${item.media_type}:${item.id}`)
              ? hoveringKey === `${item.media_type}:${item.id}`
                ? 'bg-red-500/20 text-red-400'
                : 'bg-primary/20 text-primary'
              : 'bg-white/10 text-white/70 hover:bg-primary hover:text-white'"
            :disabled="pending === `${item.media_type}:${item.id}`"
            @mouseenter="hoveringKey = `${item.media_type}:${item.id}`"
            @mouseleave="hoveringKey = null"
            @click="toggleWatchlist(item, $event)"
          >
            <UIcon
              v-if="pending === `${item.media_type}:${item.id}`"
              name="i-lucide-loader-circle"
              class="size-4 animate-spin"
            />
            <UIcon
              v-else-if="added.has(`${item.media_type}:${item.id}`) && hoveringKey === `${item.media_type}:${item.id}`"
              name="i-lucide-bookmark-x"
              class="size-4"
            />
            <UIcon
              v-else-if="added.has(`${item.media_type}:${item.id}`)"
              name="i-lucide-bookmark-check"
              class="size-4"
            />
            <UIcon
              v-else
              name="i-lucide-bookmark-plus"
              class="size-4"
            />
          </button>
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>
