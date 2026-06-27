const SKIP_PATHS = ['/login', '/confirm', '/onboarding']

export default defineNuxtRouteMiddleware(async (to) => {
  if (SKIP_PATHS.includes(to.path)) return

  const user = useSupabaseUser()
  if (!user.value) return

  const profileCache = useState<{ onboarding_done: boolean } | null>('profile-cache', () => null)

  if (!profileCache.value) {
    try {
      profileCache.value = await $fetch('/api/user/profile')
    } catch {
      return
    }
  }

  if (profileCache.value && !profileCache.value.onboarding_done) {
    return navigateTo('/onboarding')
  }
})
