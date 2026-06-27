<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'ro' }
})

useSeoMeta({
  title: 'UpNext — Descoperă filmul perfect',
  description: 'Watchlist personal, recomandări bazate pe gusturile tale și disponibilitate pe platformele de streaming.'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const navLinks = [
  { label: 'Descoperă', to: '/discover', icon: 'i-lucide-compass' },
  { label: 'Actori', to: '/people', icon: 'i-lucide-users' },
  { label: 'Watchlist', to: '/watchlist', icon: 'i-lucide-bookmark' }
]

const userMenuItems = computed(() => [[
  {
    label: user.value?.email ?? '',
    slot: 'account',
    disabled: true
  }
], [
  {
    label: 'Profilul meu',
    icon: 'i-lucide-user',
    to: '/profile'
  },
  {
    label: 'Preferințe',
    icon: 'i-lucide-settings',
    to: '/onboarding'
  }
], [
  {
    label: 'Deconectare',
    icon: 'i-lucide-log-out',
    onSelect: async () => {
      await supabase.auth.signOut()
      await navigateTo('/login')
    }
  }
]])
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="text-xl font-bold text-primary tracking-tight"
        >
          UpNext
        </NuxtLink>

        <nav class="hidden md:flex items-center gap-1 ml-6">
          <UButton
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            :icon="link.icon"
            :label="link.label"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </nav>
      </template>

      <template #right>
        <UColorModeButton />

        <template v-if="user">
          <UDropdownMenu :items="userMenuItems">
            <UAvatar
              :alt="user.email ?? 'User'"
              :src="user.user_metadata?.avatar_url"
              size="sm"
              class="cursor-pointer"
            />
          </UDropdownMenu>
        </template>

        <template v-else>
          <UButton
            to="/login"
            size="sm"
            label="Autentificare"
          />
        </template>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          UpNext © {{ new Date().getFullYear() }}
        </p>
      </template>
    </UFooter>
  </UApp>
</template>
