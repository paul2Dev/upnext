<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const router = useRouter()

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    await router.replace('/')
  } else {
    await router.replace('/login')
  }
})
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center space-y-4">
        <UIcon name="i-lucide-clapperboard" class="size-12 text-primary animate-pulse mx-auto" />
        <p class="text-muted">Se autentifică...</p>
      </div>
    </div>
  </UApp>
</template>
