<script setup lang="ts">
</script>

<template>
  <router-view></router-view>
</template>

<style scoped>

.section-container {
  margin-bottom: 160px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 160px;
  flex-shrink: 0;
}

@media (max-width: 1280px) {
  .section-container {
    gap: clamp(64px, calc(160px - 96 / 446 * (1280px - 100vw)), 160px);
  }
}

@media (max-width: 834px) {
  .section-container {
    margin-bottom: 64px;
    gap: 64px;
  }
}
</style>
