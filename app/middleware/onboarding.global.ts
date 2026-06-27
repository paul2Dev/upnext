const SKIP_PATHS = ['/login', '/confirm', '/onboarding']

export default defineNuxtRouteMiddleware(async (to) => {
  if (SKIP_PATHS.includes(to.path)) return

  const user = useSupabaseUser()
  if (!user.value) return

  const profileCache = useState<{ onboarding_done: boolean, preferred_genres?: number[] } | null>('profile-cache', () => null)

  if (!profileCache.value) {
    try {
      const supabase = useSupabaseClient()
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_done, preferred_genres')
        .eq('id', user.value.id)
        .single()
      if (data) profileCache.value = data
    } catch {
      return
    }
  }

  if (profileCache.value && !profileCache.value.onboarding_done) {
    return navigateTo('/onboarding')
  }
})
