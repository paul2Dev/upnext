<script setup lang="ts">
interface MediaCredit {
  id: number
  title?: string
  name?: string
  poster_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  overview: string
  character?: string
  media_type: 'movie' | 'tv'
}
interface Person {
  id: number
  name: string
  biography: string
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  profile_path: string | null
  known_for_department: string
  combined_credits: { cast: MediaCredit[], crew: MediaCredit[] }
}

const route = useRoute()
const { data: person, error } = await useFetch<Person>(`/api/person/${route.params.id}`)

if (error.value) {
  throw createError({ statusCode: 404, message: 'Person not found' })
}

useSeoMeta({ title: () => person.value ? `${person.value.name} — UpNext` : 'UpNext' })

const { poster } = useTmdbImage()

const knownFor = computed(() => {
  if (!person.value) return []
  const cast = person.value.combined_credits.cast ?? []
  return [...cast]
    .filter(m => m.poster_path && (m.release_date || m.first_air_date))
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 12)
})

const age = computed(() => {
  if (!person.value?.birthday) return null
  const end = person.value.deathday ? new Date(person.value.deathday) : new Date()
  const birth = new Date(person.value.birthday)
  return Math.floor((end.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
})

const bioShort = ref(true)
const biography = computed(() => {
  const bio = person.value?.biography
  if (!bio) return null
  if (bioShort.value && bio.length > 400) return bio.slice(0, 400) + '…'
  return bio
})
</script>

<template>
  <div v-if="person">
    <UContainer class="py-10">
      <div class="flex flex-col sm:flex-row gap-8">
        <div class="shrink-0 mx-auto sm:mx-0">
          <div class="w-40 sm:w-52 aspect-2/3 rounded-xl overflow-hidden bg-elevated shadow-xl">
            <img
              v-if="person.profile_path"
              :src="poster(person.profile_path, 'w342')"
              :alt="person.name"
              class="w-full h-full object-cover"
            >
            <div
              v-else
              class="w-full h-full flex items-center justify-center"
            >
              <UIcon
                name="i-lucide-user"
                class="size-16 text-muted"
              />
            </div>
          </div>
        </div>

        <div class="flex-1 space-y-4">
          <div>
            <h1 class="text-3xl font-bold">
              {{ person.name }}
            </h1>
            <div class="flex flex-wrap gap-4 mt-2 text-sm text-muted">
              <span v-if="person.known_for_department">
                <UIcon
                  name="i-lucide-clapperboard"
                  class="size-3 inline mr-1"
                />
                {{ person.known_for_department }}
              </span>
              <span v-if="person.birthday">
                <UIcon
                  name="i-lucide-calendar"
                  class="size-3 inline mr-1"
                />
                {{ new Date(person.birthday).toLocaleDateString('en-US') }}
                <span v-if="age">({{ age }} years old)</span>
              </span>
              <span v-if="person.place_of_birth">
                <UIcon
                  name="i-lucide-map-pin"
                  class="size-3 inline mr-1"
                />
                {{ person.place_of_birth }}
              </span>
            </div>
          </div>

          <div v-if="biography">
            <p class="text-muted leading-relaxed">
              {{ biography }}
            </p>
            <UButton
              v-if="person.biography && person.biography.length > 400"
              variant="link"
              size="sm"
              class="mt-1 px-0"
              :label="bioShort ? 'Read more' : 'Show less'"
              @click="bioShort = !bioShort"
            />
          </div>
        </div>
      </div>

      <div
        v-if="knownFor.length"
        class="mt-10"
      >
        <h2 class="text-lg font-semibold mb-4">
          Known for
        </h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MediaCard
            v-for="item in knownFor"
            :key="`${item.media_type}-${item.id}`"
            :item="{ ...item, title: item.title ?? item.name ?? '', name: item.name ?? item.title ?? '', first_air_date: item.first_air_date ?? item.release_date ?? '' }"
          />
        </div>
      </div>
    </UContainer>
  </div>
</template>
