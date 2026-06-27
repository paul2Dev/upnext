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
</script>

<template>
  <UContainer class="py-10">
    <h1 class="text-2xl font-bold mb-8">
      Watchlist
    </h1>

    <div
      v-if="!items?.length"
      class="flex flex-col items-center justify-center py-24 text-center gap-4"
    >
      <UIcon
        name="i-lucide-bookmark"
        class="size-16 text-muted"
      />
      <p class="text-muted text-lg">
        Nu ai nimic în watchlist încă.
      </p>
      <UButton
        to="/discover"
        variant="soft"
      >
        Explorează filme
      </UButton>
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="relative group"
      >
        <MediaCard :item="{ ...item.tmdb_data, media_type: item.media_type as 'movie' | 'tv' }" />
        <button
          class="absolute top-1.5 left-1.5 size-6 rounded-full bg-white text-black flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition-colors z-10"
          :disabled="removing === item.id"
          @click.prevent="remove(item)"
        >
          <UIcon
            name="i-lucide-x"
            class="size-3.5"
          />
        </button>
      </div>
    </div>
  </UContainer>
</template>
