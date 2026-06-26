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
    <div class="min-h-screen flex items-center justify-center bg-background px-4">
      <div class="w-full max-w-sm space-y-8">
        <div class="text-center space-y-2">
          <h1 class="text-4xl font-bold tracking-tight text-primary">
            UpNext
          </h1>
          <p class="text-muted text-base">
            Descoperă filmul perfect pentru seara asta
          </p>
        </div>

        <UCard class="shadow-lg">
          <div class="space-y-4">
            <p class="text-sm text-center text-muted">
              Autentifică-te pentru a-ți salva watchlist-ul și a primi recomandări personalizate
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
              Continuă cu Google
            </UButton>
          </div>
        </UCard>

        <p class="text-center text-xs text-muted">
          Poți naviga și fără cont, dar nu vei putea salva filme sau primi recomandări.
        </p>
      </div>
    </div>
  </UApp>
</template>
