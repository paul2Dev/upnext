<script setup lang="ts">
const show = ref(false)

onMounted(() => {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isSafari = /safari/i.test(navigator.userAgent) && !/chrome|crios|fxios/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const dismissed = localStorage.getItem('ios-install-dismissed')

  if (isIOS && isSafari && !isStandalone && !dismissed) {
    show.value = true
  }
})

function dismiss() {
  show.value = false
  localStorage.setItem('ios-install-dismissed', '1')
}
</script>

<template>
  <Transition
    enter-active-class="transition-transform duration-300"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition-transform duration-300"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="show"
      class="fixed bottom-0 inset-x-0 z-50 p-4 pb-8 bg-elevated border-t border-default shadow-xl"
    >
      <button
        class="absolute top-3 right-3 text-muted hover:text-default transition-colors"
        @click="dismiss"
      >
        <UIcon
          name="i-lucide-x"
          class="size-4"
        />
      </button>

      <div class="flex items-start gap-3 max-w-sm mx-auto">
        <div class="shrink-0 bg-primary/10 rounded-xl p-2">
          <UIcon
            name="i-lucide-smartphone"
            class="size-5 text-primary"
          />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold leading-tight">
            Install UpNext
          </p>
          <ol class="text-xs text-muted mt-1.5 leading-relaxed space-y-0.5 list-none">
            <li>
              1. Tap <UIcon
                name="i-lucide-share"
                class="size-3.5 inline align-middle"
              /> <strong>Share</strong> in the Safari toolbar
            </li>
            <li>2. Scroll down in the menu that opens</li>
            <li>3. Tap <strong>"Add to Home Screen"</strong></li>
          </ol>
        </div>
      </div>

      <!-- Arrow pointing down to Safari toolbar -->
      <div class="flex justify-center mt-3">
        <UIcon
          name="i-lucide-chevron-down"
          class="size-4 text-muted animate-bounce"
        />
      </div>
    </div>
  </Transition>
</template>
