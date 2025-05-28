<template>
  <div class="mention-panel">mention-panel —— {{ query }}</div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  query: string
}>()
</script>

<style scoped>
.mention-panel {
  border: 1px solid #000;
}
</style>
