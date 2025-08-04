<!-- src/components/Icon.vue -->
<script setup>
const props = defineProps({
  name: {
    type: String,
    required: true
  }
})

const icons = {
  gift: defineAsyncComponent(() => import('@/assets/icons/f7_gift-fill.svg')),
  bank: defineAsyncComponent(() => import('@/assets/icons/maki_bank.svg')),
  // добавьте все остальные иконки
}
</script>

<template>
  <component :is="icons[name]" class="icon" />
</template>

<style>
.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}
</style>