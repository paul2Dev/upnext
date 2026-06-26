<script setup lang="ts">
useSeoMeta({ title: 'Actori — UpNext' })

interface PersonItem {
  id: number
  name: string
  profile_path: string | null
  known_for_department: string
  known_for: { title?: string, name?: string, media_type: string }[]
}

const search = ref('')
const page = ref(1)
const isSearching = computed(() => search.value.trim().length > 0)

const { data, pending } = await useFetch<{ results: PersonItem[], total_pages: number }>(() => {
  if (isSearching.value) {
    return `/api/people/search?query=${encodeURIComponent(search.value)}&page=${page.value}`
  }
  return `/api/people/popular?page=${page.value}`
}, { watch: [page, search] })

const people = computed(() => data.value?.results ?? [])
const totalPages = computed(() => Math.min(data.value?.total_pages ?? 1, 20))

watch(search, () => {
  page.value = 1
})
</script>

<template>
  <UContainer class="py-10">
    <div class="flex items-center justify-between mb-6 gap-4">
      <h1 class="text-2xl font-bold shrink-0">
        Actori
      </h1>
      <UInput
        v-model="search"
        placeholder="Caută un actor sau regizor..."
        icon="i-lucide-search"
        size="md"
        class="max-w-sm w-full"
      />
    </div>

    <div
      v-if="pending"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
    >
      <div
        v-for="n in 18"
        :key="n"
        class="aspect-2/3 rounded-lg bg-elevated animate-pulse"
      />
    </div>

    <template v-else>
      <div
        v-if="people.length"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <NuxtLink
          v-for="person in people"
          :key="person.id"
          :to="`/person/${person.id}`"
          class="group block"
        >
          <div class="relative overflow-hidden rounded-lg bg-elevated aspect-2/3">
            <img
              v-if="person.profile_path"
              :src="`https://image.tmdb.org/t/p/w342${person.profile_path}`"
              :alt="person.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            >
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-user"
                class="size-12 text-muted"
              />
            </div>
          </div>
          <div class="mt-2 px-0.5">
            <p class="font-medium text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {{ person.name }}
            </p>
            <p class="text-xs text-muted">
              {{ person.known_for_department }}
            </p>
            <p
              v-if="person.known_for?.length"
              class="text-xs text-muted line-clamp-1"
            >
              {{ person.known_for.map(k => k.title ?? k.name).join(', ') }}
            </p>
          </div>
        </NuxtLink>
      </div>

      <div
        v-else
        class="text-center py-16 text-muted"
      >
        <UIcon
          name="i-lucide-user-x"
          class="size-12 mx-auto mb-3"
        />
        <p>Niciun rezultat pentru „{{ search }}".</p>
      </div>

      <div
        v-if="totalPages > 1"
        class="flex justify-center mt-10"
      >
        <UPagination
          v-model:page="page"
          :total="totalPages * 20"
          :items-per-page="20"
        />
      </div>
    </template>
  </UContainer>
</template>
