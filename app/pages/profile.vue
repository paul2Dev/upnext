<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Profilul meu — UpNext' })

interface Genre { id: number, name: string }
interface WatchlistRow {
  id: string
  movie_id: number
  media_type: string
  tmdb_data: { id: number, title?: string, name?: string, poster_path?: string | null, vote_average?: number, media_type?: string }
  added_at: string
}
interface WatchedRow {
  id: string
  movie_id: number
  media_type: string
  rating: number
  tmdb_data: { id: number, title?: string, name?: string, poster_path?: string | null, vote_average?: number, media_type?: string }
  watched_at: string
}

const RATING_MAP: Record<number, { icon: string, class: string, label: string }> = {
  1: { icon: 'i-lucide-thumbs-down', class: 'text-red-400', label: 'Not for me' },
  3: { icon: 'i-lucide-thumbs-up', class: 'text-green-400', label: 'I like this' },
  5: { icon: 'i-lucide-thumbs-up', class: 'text-pink-400', label: 'Love this' }
}

const editingGenres = ref(false)
const savingGenres = ref(false)
const selectedGenres = ref<number[]>([])

const [{ data: profile }, { data: genresData }, { data: watchlist }, { data: watched }] = await Promise.all([
  useFetch<{ preferred_genres: number[], onboarding_done: boolean }>('/api/user/profile'),
  useFetch<{ genres: Genre[] }>('/api/movies/genres'),
  useFetch<WatchlistRow[]>('/api/user/watchlist'),
  useFetch<WatchedRow[]>('/api/user/ratings')
])

const allGenres = computed(() => genresData.value?.genres ?? [])
const genreMap = computed(() => Object.fromEntries(allGenres.value.map(g => [g.id, g.name])))
const preferredGenres = computed(() => profile.value?.preferred_genres ?? [])

function startEditGenres() {
  selectedGenres.value = [...preferredGenres.value]
  editingGenres.value = true
}

function toggleGenre(id: number) {
  const idx = selectedGenres.value.indexOf(id)
  if (idx >= 0) selectedGenres.value.splice(idx, 1)
  else selectedGenres.value.push(id)
}

async function saveGenres() {
  savingGenres.value = true
  try {
    await $fetch('/api/user/onboarding', {
      method: 'POST',
      body: { genres: selectedGenres.value }
    })
    if (profile.value) profile.value.preferred_genres = [...selectedGenres.value]
    const profileCache = useState('profile-cache')
    profileCache.value = null
    editingGenres.value = false
  } finally {
    savingGenres.value = false
  }
}

const posterUrl = (path?: string | null) =>
  path ? `https://image.tmdb.org/t/p/w200${path}` : null

const mediaLink = (item: { media_type: string, movie_id?: number, id?: number }) => {
  const mediaId = item.movie_id ?? item.id
  return item.media_type === 'tv' ? `/tv/${mediaId}` : `/movie/${mediaId}`
}
</script>

<template>
  <UContainer class="py-10 max-w-5xl space-y-12">
    <!-- Genuri favorite -->
    <section>
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-xl font-bold">
          Genuri favorite
        </h2>
        <UButton
          v-if="!editingGenres"
          variant="ghost"
          size="sm"
          icon="i-lucide-pencil"
          label="Editează"
          @click="startEditGenres"
        />
        <div
          v-else
          class="flex items-center gap-2"
        >
          <UButton
            variant="ghost"
            size="sm"
            label="Anulează"
            @click="editingGenres = false"
          />
          <UButton
            size="sm"
            label="Salvează"
            icon="i-lucide-check"
            trailing
            :loading="savingGenres"
            :disabled="selectedGenres.length < 1"
            @click="saveGenres"
          />
        </div>
      </div>

      <!-- View mode -->
      <div
        v-if="!editingGenres"
        class="flex flex-wrap gap-2"
      >
        <span
          v-for="id in preferredGenres"
          :key="id"
          class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
        >
          {{ genreMap[id] ?? id }}
        </span>
        <span
          v-if="!preferredGenres.length"
          class="text-muted text-sm"
        >
          Niciun gen selectat.
        </span>
      </div>

      <!-- Edit mode -->
      <div
        v-else
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="genre in allGenres"
          :key="genre.id"
          class="px-3 py-1.5 rounded-full border text-sm font-medium transition-colors"
          :class="selectedGenres.includes(genre.id)
            ? 'bg-primary border-primary text-white'
            : 'border-default hover:border-primary/50 text-default'"
          @click="toggleGenre(genre.id)"
        >
          {{ genre.name }}
        </button>
      </div>
    </section>

    <!-- Filme văzute -->
    <section>
      <h2 class="text-xl font-bold mb-5">
        Filme văzute
        <span class="text-muted font-normal text-base ml-2">{{ watched?.length ?? 0 }}</span>
      </h2>

      <div
        v-if="!watched?.length"
        class="text-muted text-sm"
      >
        Nu ai dat rating niciunui film încă.
      </div>

      <div
        v-else
        class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
      >
        <NuxtLink
          v-for="item in watched"
          :key="item.id"
          :to="mediaLink({ media_type: item.media_type, movie_id: item.movie_id })"
          class="group relative rounded-lg overflow-hidden"
        >
          <img
            v-if="posterUrl(item.tmdb_data?.poster_path)"
            :src="posterUrl(item.tmdb_data?.poster_path)!"
            :alt="item.tmdb_data?.title ?? item.tmdb_data?.name"
            class="w-full aspect-[2/3] object-cover group-hover:opacity-80 transition-opacity"
          >
          <div
            v-else
            class="w-full aspect-[2/3] bg-elevated flex items-center justify-center text-xs text-muted p-2 text-center"
          >
            {{ item.tmdb_data?.title ?? item.tmdb_data?.name }}
          </div>
          <div
            v-if="RATING_MAP[item.rating]"
            class="absolute top-1 right-1 size-6 rounded-full bg-black/70 flex items-center justify-center"
          >
            <UIcon
              :name="RATING_MAP[item.rating]!.icon"
              class="size-3.5"
              :class="RATING_MAP[item.rating]!.class"
            />
          </div>
        </NuxtLink>
      </div>
    </section>

    <!-- Watchlist -->
    <section>
      <h2 class="text-xl font-bold mb-5">
        Watchlist
        <span class="text-muted font-normal text-base ml-2">{{ watchlist?.length ?? 0 }}</span>
      </h2>

      <div
        v-if="!watchlist?.length"
        class="text-muted text-sm"
      >
        Watchlist-ul tău este gol.
      </div>

      <div
        v-else
        class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
      >
        <NuxtLink
          v-for="item in watchlist"
          :key="item.id"
          :to="mediaLink({ media_type: item.media_type, movie_id: item.movie_id })"
          class="group"
        >
          <img
            v-if="posterUrl(item.tmdb_data?.poster_path)"
            :src="posterUrl(item.tmdb_data?.poster_path)!"
            :alt="item.tmdb_data?.title ?? item.tmdb_data?.name"
            class="w-full aspect-[2/3] object-cover rounded-lg group-hover:opacity-80 transition-opacity"
          >
          <div
            v-else
            class="w-full aspect-[2/3] bg-elevated rounded-lg flex items-center justify-center text-xs text-muted p-2 text-center"
          >
            {{ item.tmdb_data?.title ?? item.tmdb_data?.name }}
          </div>
        </NuxtLink>
      </div>
    </section>
  </UContainer>
</template>
