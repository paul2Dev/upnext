<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Smart Search — UpNext' })

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

const query = ref('')
const results = ref<MovieResult[]>([])
const pending = ref(false)
const error = ref('')
const lastQuery = ref('')

async function runSearch() {
  const q = query.value.trim()
  if (q.length < 3) return
  pending.value = true
  error.value = ''
  results.value = []
  lastQuery.value = q
  try {
    results.value = await $fetch<MovieResult[]>(`/api/movies/semantic-search?q=${encodeURIComponent(q)}`)
  } catch {
    error.value = 'Search failed. Please try again.'
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
  <UContainer class="py-12">
    <div class="max-w-2xl mx-auto space-y-10">
      <!-- Header -->
      <div class="space-y-2 text-center">
        <div class="flex items-center justify-center gap-2 mb-3">
          <UIcon
            name="i-lucide-sparkles"
            class="size-6 text-primary"
          />
          <h1 class="text-2xl font-bold">
            Smart Search
          </h1>
        </div>
        <p class="text-muted text-sm leading-relaxed">
          Describe the movie you're looking for in your own words — a character, a mood, a theme.
          The algorithm finds the most semantically relevant movies, even if you don't know the exact title.
        </p>
      </div>

      <!-- Search box -->
      <div class="space-y-3">
        <div class="space-y-1">
          <UTextarea
            v-model="query"
            placeholder="e.g. a film about loneliness in space, with a melancholic soundtrack..."
            :rows="3"
            autoresize
            :maxlength="150"
            class="w-full"
            @keydown.enter.exact.prevent="runSearch"
          />
          <p
            class="text-xs text-right transition-colors"
            :class="query.length >= 130 ? 'text-warning' : 'text-muted'"
          >
            {{ query.length }}/150
          </p>
        </div>
        <div class="flex justify-center">
          <UButton
            icon="i-lucide-sparkles"
            label="Find movies"
            :loading="pending"
            :disabled="query.trim().length < 3"
            size="md"
            @click="runSearch"
          />
        </div>
      </div>

      <!-- Results -->
      <div
        v-if="pending"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
      >
        <div
          v-for="n in 8"
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

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div
              v-for="item in results"
              :key="item.id"
              class="relative"
            >
              <MediaCard :item="item" />
              <span
                class="absolute top-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none"
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
</template>
