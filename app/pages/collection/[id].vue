<script setup lang="ts">
interface CollectionPart {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  vote_average: number
  overview: string
}
interface Collection {
  id: number
  name: string
  overview: string | null
  poster_path: string | null
  backdrop_path: string | null
  parts: CollectionPart[]
}

const route = useRoute()
const { data: collection, error } = await useFetch<Collection>(`/api/collection/${route.params.id}`)

if (error.value) {
  throw createError({ statusCode: 404, message: 'Colecție negăsită' })
}

useSeoMeta({ title: () => collection.value ? `${collection.value.name} — UpNext` : 'UpNext' })

const { poster, backdrop } = useTmdbImage()

const parts = computed(() =>
  [...(collection.value?.parts ?? [])].sort((a, b) =>
    (a.release_date ?? '').localeCompare(b.release_date ?? '')
  )
)
</script>

<template>
  <div v-if="collection">
    <div class="relative h-72 sm:h-96 overflow-hidden">
      <img
        v-if="collection.backdrop_path"
        :src="backdrop(collection.backdrop_path)"
        :alt="collection.name"
        class="w-full h-full object-cover"
      >
      <div class="absolute inset-0 bg-linear-to-t from-default via-default/80 to-transparent" />
    </div>

    <UContainer class="py-8">
      <div class="flex flex-col sm:flex-row gap-8 -mt-24 sm:-mt-32 relative">
        <div class="hidden sm:block shrink-0">
          <div class="w-40 sm:w-52 aspect-2/3 rounded-xl overflow-hidden bg-elevated shadow-xl">
            <img
              v-if="collection.poster_path"
              :src="poster(collection.poster_path, 'w342')"
              :alt="collection.name"
              class="w-full h-full object-cover"
            >
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-library"
                class="size-16 text-muted"
              />
            </div>
          </div>
        </div>

        <div class="flex-1 space-y-4 pt-2 sm:pt-24">
          <div>
            <UBadge
              color="neutral"
              variant="subtle"
              class="mb-2"
            >
              Colecție · {{ parts.length }} filme
            </UBadge>
            <h1 class="text-3xl font-bold leading-tight">
              {{ collection.name }}
            </h1>
          </div>
          <p
            v-if="collection.overview"
            class="text-muted leading-relaxed max-w-2xl"
          >
            {{ collection.overview }}
          </p>
        </div>
      </div>

      <div class="mt-10">
        <h2 class="text-lg font-semibold mb-6">
          Filme din colecție
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MovieCard
            v-for="part in parts"
            :key="part.id"
            :movie="part"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>
