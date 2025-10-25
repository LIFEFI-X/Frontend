<template>
  <div class="nft-placeholder" :style="{ width: `${width}px`, height: `${height}px` }">
    <div class="placeholder-content">
      <div class="placeholder-icon">🖼️</div>
      <div class="placeholder-text">{{ text || 'NFT Image' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  width?: number
  height?: number
  text?: string
}

withDefaults(defineProps<Props>(), {
  width: 400,
  height: 400,
  text: ''
})
</script>

<style scoped lang="scss">
.nft-placeholder {
  background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
  border: 1px solid #333333;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg, 
      transparent, 
      rgba(255, 255, 255, 0.1), 
      transparent
    );
    animation: shimmer 2s infinite;
  }
}

.placeholder-content {
  text-align: center;
  color: #666666;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.placeholder-text {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.8;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}
</style> 