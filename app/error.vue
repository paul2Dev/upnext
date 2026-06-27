<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

const title = computed(() =>
  props.error.statusCode === 404 ? 'Pagina nu a fost găsită' : 'A apărut o eroare'
)

const description = computed(() =>
  props.error.statusCode === 404
    ? 'Pagina pe care o cauți nu există sau a fost mutată.'
    : (props.error.message ?? 'Ceva nu a mers bine. Încearcă din nou.')
)

function goBack() {
  if (import.meta.client) window.history.back()
}
</script>

<template>
  <UApp>
    <UContainer class="min-h-screen flex flex-col items-center justify-center py-24 text-center gap-6">
      <p class="text-8xl font-bold text-muted/20 select-none">
        {{ error.statusCode }}
      </p>
      <div class="space-y-2">
        <h1 class="text-2xl font-bold">
          {{ title }}
        </h1>
        <p class="text-muted max-w-sm mx-auto">
          {{ description }}
        </p>
      </div>
      <div class="flex gap-3">
        <UButton
          to="/"
          label="Acasă"
          icon="i-lucide-home"
        />
        <UButton
          color="neutral"
          variant="outline"
          label="Înapoi"
          icon="i-lucide-arrow-left"
          @click="goBack"
        />
      </div>
    </UContainer>
  </UApp>
</template>
