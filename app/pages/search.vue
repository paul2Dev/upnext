<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Smart Search — UpNext' })

const config = useRuntimeConfig()
if (!config.public.featureSemanticSearch) {
  await navigateTo('/')
}

interface MovieResult {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  vote_average: number
  overview: string
  media_type: 'movie' | 'tv' | 'collection' | 'person'
  _similarity: number
}

interface TrendingItem {
  id: number
  title?: string
  name?: string
  media_type: 'movie' | 'tv' | 'person'
  backdrop_path: string | null
}

const query = ref('')
const results = ref<MovieResult[]>([])
const pending = ref(false)
const error = ref('')
const lastQuery = ref('')

const { backdrop } = useTmdbImage()
const { data: trendingData } = await useFetch<{ results: TrendingItem[] }>('/api/trending/all')

const heroItems = computed(() =>
  (trendingData.value?.results ?? [])
    .filter(i => i.media_type !== 'person' && i.backdrop_path)
    .slice(0, 6)
)
const heroIndex = ref(0)
const heroItem = computed(() => heroItems.value[heroIndex.value] ?? null)

let slideInterval: ReturnType<typeof setInterval> | null = null
watch(heroItems, (items) => {
  if (slideInterval) clearInterval(slideInterval)
  if (items.length > 1) {
    heroIndex.value = Math.floor(Math.random() * items.length)
    slideInterval = setInterval(() => {
      heroIndex.value = (heroIndex.value + 1) % items.length
    }, 6000)
  }
}, { immediate: true })

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval)
})

interface UsageData { used: number, limit: number, remaining: number }
const usage = ref<UsageData | null>(null)
const { data: usageData } = await useFetch<UsageData>('/api/user/search-usage')
usage.value = usageData.value ?? null

async function runSearch() {
  const q = query.value.trim()
  if (q.length < 3) return
  pending.value = true
  error.value = ''
  results.value = []
  lastQuery.value = q
  try {
    results.value = await $fetch<MovieResult[]>(`/api/movies/semantic-search?q=${encodeURIComponent(q)}`)
    const fresh = await $fetch<UsageData>('/api/user/search-usage')
    usage.value = fresh
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 429) {
      error.value = `You've reached your daily limit of ${usage.value?.limit ?? 15} searches. Come back tomorrow!`
      if (usage.value) usage.value.remaining = 0
    } else {
      error.value = 'Search failed. Please try again.'
    }
  } finally {
    pending.value = false
  }
}

function similarityLabel(score: number) {
  const pct = Math.round(score * 100)
  if (pct >= 80) return { text: `${pct}%`, class: 'bg-green-500/90' }
  if (pct >= 60) return { text: `${pct}%`, class: 'bg-yellow-500/90' }
  return { text: `${pct}%`, class: 'bg-zinc-500/80' }
}
</script>

<template>
  <div class="relative">
    <!-- Backdrop slider -->
    <div class="absolute inset-x-0 top-0 h-100 sm:h-[58vh] lg:h-[62vh] overflow-hidden">
      <Transition
        enter-active-class="transition-opacity duration-1000"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-1000 absolute inset-0"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <img
          v-if="heroItem?.backdrop_path"
          :key="heroItem.id"
          :src="backdrop(heroItem.backdrop_path)"
          :alt="heroItem.title ?? heroItem.name"
          class="w-full h-full object-cover object-top"
        >
      </Transition>
      <div class="absolute inset-0 bg-linear-to-b from-black/50 via-black/40 to-default" />

      <!-- Slide indicators -->
      <div
        v-if="heroItems.length > 1"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5"
      >
        <button
          v-for="(_, i) in heroItems"
          :key="i"
          class="h-1 rounded-full transition-all duration-300"
          :class="i === heroIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40'"
          @click="heroIndex = i"
        />
      </div>
    </div>

    <!-- Hero: title + search box, vertically centered like the homepage -->
    <div class="relative min-h-[calc(100svh-478px)] sm:min-h-[48vh] flex flex-col justify-center">
      <UContainer class="py-8">
        <div class="max-w-2xl mx-auto space-y-3">
          <!-- Header -->
          <div class="text-center">
            <div class="inline-block bg-default/30 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-lg">
              <h1 class="text-2xl sm:text-3xl font-bold">
                Smart Search
              </h1>
              <p class="text-muted text-sm leading-relaxed max-w-md mx-auto mt-2">
                Describe a character, a mood, or a theme — we'll find the movie, even without the exact title.
              </p>
            </div>
          </div>

          <!-- Search box -->
          <UCard :ui="{ root: 'bg-default/30 backdrop-blur-sm', body: 'pt-3! sm:pt-3! space-y-3' }">
            <UTextarea
              v-model="query"
              placeholder="e.g. a film about loneliness in space, with a melancholic soundtrack..."
              :rows="3"
              autoresize
              :maxlength="150"
              color="neutral"
              class="w-full"
              :ui="{ base: 'bg-transparent! leading-relaxed font-sans! text-muted! text-sm! placeholder:text-muted! placeholder:text-sm! placeholder:font-sans!' }"
              @keydown.enter.exact.prevent="usage?.remaining !== 0 && runSearch()"
            />
            <div class="flex items-center text-xs">
              <span
                v-if="usage"
                class="text-muted"
              >
                Daily searches
                <span :class="usage.remaining === 0 ? 'text-red-400 font-medium' : usage.remaining <= 3 ? 'text-warning font-medium' : ''">
                  {{ usage.used }}/{{ usage.limit }}
                </span>
              </span>
              <span
                class="ms-auto transition-colors"
                :class="query.length >= 130 ? 'text-warning' : 'text-muted'"
              >
                {{ query.length }}/150
              </span>
            </div>

            <div class="flex justify-center pt-1">
              <UButton
                icon="i-lucide-sparkles"
                label="Find movies"
                :loading="pending"
                :disabled="query.trim().length < 3 || usage?.remaining === 0"
                size="md"
                @click="runSearch"
              />
            </div>
          </UCard>
        </div>
      </UContainer>
    </div>

    <!-- Results -->
    <UContainer class="relative pb-12">
      <div class="max-w-2xl mx-auto">
        <div
          v-if="pending"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          <div
            v-for="n in 10"
            :key="n"
            class="aspect-2/3 rounded-lg bg-elevated animate-pulse"
          />
        </div>

        <template v-else-if="results.length">
          <div class="space-y-3">
            <p class="text-sm text-muted">
              <span class="font-medium text-default">{{ results.length }} movies</span>
              found for: <span class="italic text-default">"{{ lastQuery }}"</span>
            </p>

            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div
                v-for="item in results"
                :key="item.id"
                class="relative"
              >
                <MediaCard :item="item" />
                <span
                  class="absolute top-2 right-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none"
                  :class="similarityLabel(item._similarity).class"
                >
                  {{ similarityLabel(item._similarity).text }}
                </span>
              </div>
            </div>
          </div>
        </template>

        <div
          v-else-if="error"
          class="text-center py-10 text-red-400"
        >
          <UIcon
            name="i-lucide-triangle-alert"
            class="size-8 mx-auto mb-2"
          />
          <p>{{ error }}</p>
        </div>

        <div
          v-else-if="lastQuery"
          class="text-center py-10 text-muted"
        >
          <UIcon
            name="i-lucide-film"
            class="size-8 mx-auto mb-2"
          />
          <p>No movies found. Try a different description.</p>
        </div>
      </div>
    </UContainer>
  </div>
</template>
