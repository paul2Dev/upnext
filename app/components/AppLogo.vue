<script setup lang="ts">
withDefaults(defineProps<{
  showText?: boolean
  size?: string
}>(), {
  showText: true,
  size: 'size-6'
})
</script>

<template>
  <div class="flex items-center gap-2">
    <UIcon
      name="i-lucide-film"
      :class="size"
      class="text-primary shrink-0"
    />
    <span
      v-if="showText"
      class="text-xl font-bold text-primary tracking-tight"
    >
      UpNext
    </span>
  </div>
</template>
