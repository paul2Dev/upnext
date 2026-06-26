<template>
  <div class="flex items-center justify-center min-h-96">
    <div class="text-center space-y-4">
      <UIcon
        name="i-lucide-clapperboard"
        class="size-16 text-primary mx-auto"
      />
      <h1 class="text-3xl font-bold">
        Bine ai venit pe UpNext
      </h1>
      <p class="text-muted">
        Recomandările personalizate vin în curând.
      </p>
      <UButton
        to="/discover"
        label="Explorează filme"
        icon="i-lucide-compass"
        size="lg"
      />
    </div>
  </div>
</template>
