<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const loading = ref(false)

async function signInWithGoogle() {
  loading.value = true
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/confirm`
    }
  })
  loading.value = false
}
</script>

<template>
  <UApp>
    <div class="fixed inset-0 flex items-center justify-center bg-background px-4">
      <div class="w-full max-w-sm space-y-8">
        <div class="text-center space-y-2">
          <h1 class="text-4xl font-bold tracking-tight text-primary">
            UpNext
          </h1>
          <p class="text-muted text-base">
            Find your perfect movie for tonight
          </p>
        </div>

        <UCard class="shadow-lg">
          <div class="space-y-4">
            <p class="text-sm text-center text-muted">
              Sign in to save your watchlist and get personalized recommendations
            </p>

            <UButton
              block
              size="lg"
              color="neutral"
              variant="outline"
              icon="i-simple-icons-google"
              :loading="loading"
              @click="signInWithGoogle"
            >
              Continue with Google
            </UButton>
          </div>
        </UCard>

        <p class="text-center text-xs text-muted">
          You can browse without an account, but you won't be able to save movies or get recommendations.
        </p>
      </div>
    </div>
  </UApp>
</template>
