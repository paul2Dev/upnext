<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [
    { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
    { rel: 'icon', href: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' }
  ],
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({
  title: 'UpNext — Find Your Next Watch',
  description: 'Personal watchlist, recommendations based on your taste and streaming platform availability.'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

const profileCache = useState<{ onboarding_done: boolean, preferred_genres?: number[] } | null>('profile-cache', () => null)

watch(user, async (u) => {
  if (u && !profileCache.value) {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_done, preferred_genres')
      .eq('id', u.id)
      .single()
    if (data) profileCache.value = data
  }
}, { immediate: true })

const mobileMenuOpen = ref(false)
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

const navLinks = [
  { label: 'Discover', to: '/discover', icon: 'i-lucide-compass' },
  { label: 'People', to: '/people', icon: 'i-lucide-users' },
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
    label: 'My Profile',
    icon: 'i-lucide-user',
    to: '/profile'
  }
], [
  {
    label: 'Sign out',
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
    <NuxtLoadingIndicator />

    <!-- Mobile nav drawer -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-50 md:hidden"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="mobileMenuOpen = false"
        />
        <Transition
          enter-active-class="transition-transform duration-200"
          enter-from-class="-translate-x-full"
          enter-to-class="translate-x-0"
          leave-active-class="transition-transform duration-200"
          leave-from-class="translate-x-0"
          leave-to-class="-translate-x-full"
        >
          <nav
            v-if="mobileMenuOpen"
            class="absolute left-0 top-0 h-full w-64 bg-default border-r border-default flex flex-col p-4 gap-1"
          >
            <div class="flex items-center justify-between mb-4 px-2">
              <AppLogo size="size-5" />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-x"
                size="sm"
                @click="mobileMenuOpen = false"
              />
            </div>
            <UButton
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              :icon="link.icon"
              :label="link.label"
              color="neutral"
              variant="ghost"
              class="justify-start"
            />
            <div class="mt-auto pt-4 border-t border-default">
              <template v-if="user">
                <NuxtLink
                  to="/profile"
                  class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-elevated transition-colors"
                >
                  <UAvatar
                    :alt="user.email ?? 'User'"
                    :src="user.user_metadata?.avatar_url"
                    size="sm"
                  />
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate">
                      {{ user.user_metadata?.full_name ?? user.email }}
                    </p>
                    <p class="text-xs text-muted truncate">
                      {{ user.email }}
                    </p>
                  </div>
                </NuxtLink>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-log-out"
                  label="Sign out"
                  class="justify-start w-full mt-1"
                  @click="async () => { await supabase.auth.signOut(); await navigateTo('/login') }"
                />
              </template>
              <UButton
                v-else
                to="/login"
                label="Sign in"
                icon="i-lucide-log-in"
                class="w-full justify-start"
                color="neutral"
                variant="ghost"
              />
            </div>
          </nav>
        </Transition>
      </div>
    </Transition>

    <UHeader :ui="{ toggle: 'hidden' }">
      <template #left>
        <UButton
          class="md:hidden"
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          aria-label="Menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        />

        <NuxtLink to="/">
          <AppLogo />
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
            label="Sign in"
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
