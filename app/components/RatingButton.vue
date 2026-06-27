<script setup lang="ts">
const RATINGS = [
  { value: 1, icon: 'i-lucide-thumbs-down', label: 'Not for me', selectedClass: 'border-red-400 text-red-400 bg-red-400/10', hoverClass: 'hover:border-red-400/60 hover:text-red-400/60' },
  { value: 3, icon: 'i-lucide-thumbs-up', label: 'I like this', selectedClass: 'border-green-400 text-green-400 bg-green-400/10', hoverClass: 'hover:border-green-400/60 hover:text-green-400/60' },
  { value: 5, label: 'Love this', selectedClass: 'border-pink-400 text-pink-400 bg-pink-400/10', hoverClass: 'hover:border-pink-400/60 hover:text-pink-400/60' }
] as const

defineProps<{ modelValue: number | null, loading?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
</script>

<template>
  <div class="flex items-center gap-1.5">
    <template
      v-for="option in RATINGS"
      :key="option.value"
    >
      <div class="group/opt relative flex flex-col items-center">
        <!-- Tooltip -->
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white text-black text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover/opt:opacity-100 transition-opacity pointer-events-none shadow z-10">
          {{ option.label }}
        </div>

        <button
          class="size-9 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110"
          :class="modelValue === option.value
            ? option.selectedClass
            : `border-white/30 text-white/40 ${option.hoverClass}`"
          :disabled="loading"
          @click="emit('update:modelValue', option.value)"
        >
          <UIcon
            v-if="loading && modelValue === option.value"
            name="i-lucide-loader-circle"
            class="size-4 animate-spin"
          />
          <!-- Love this: two overlapping thumbs-up -->
          <span
            v-else-if="option.value === 5"
            class="flex"
          >
            <UIcon
              name="i-lucide-thumbs-up"
              class="size-3.5"
            />
            <UIcon
              name="i-lucide-thumbs-up"
              class="size-3.5 -ml-1.5"
            />
          </span>
          <UIcon
            v-else
            :name="option.icon"
            class="size-4"
          />
        </button>
      </div>
    </template>
  </div>
</template>
