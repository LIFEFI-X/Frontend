<template>
  <div 
    class="glass-card"
    :style="{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none' }"
    @click="$emit('click', $event)"
  >
    <!-- Background image gradient mask -->
    <div class="card-background"></div>
    
    <!-- Upper frosted glass information layer -->
    <div v-if="$slots.topOverlay" class="card-overlay-top">
      <slot name="topOverlay"></slot>
    </div>
    
    <!-- Lower frosted glass information layer -->
    <div v-if="$slots.bottomOverlay" class="card-overlay-bottom">
      <slot name="bottomOverlay"></slot>
    </div>
    
    <!-- Main content area (middle) -->
    <div v-if="$slots.default" class="card-content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  backgroundImage?: string
  height?: string | number
  borderRadius?: string | number
  hoverEffect?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  backgroundImage: '',
  height: '422px',
  borderRadius: '20px',
  hoverEffect: true
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped lang="scss">
.glass-card {
  position: relative;
  height: v-bind('typeof props.height === "number" ? props.height + "px" : props.height');
  border-radius: v-bind('typeof props.borderRadius === "number" ? props.borderRadius + "px" : props.borderRadius');
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: v-bind('props.hoverEffect ? "translateY(-8px)" : "none"');
  }
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.0) 25%,
    rgba(0, 0, 0, 0.0) 75%,
    rgba(0, 0, 0, 0.1) 100%
  );
}

// Upper frosted glass area
.card-overlay-top {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  min-height: 48px;
  max-height: 60px; // Limit maximum height
  overflow: hidden; // Prevent content from overflowing
  display: flex;
  align-items: center;
  
  // Alternate style when background-filter is not supported
  @supports not (backdrop-filter: blur(4px)) {
    background: rgba(0, 0, 0, 0.8);
  }
}

// Lower frosted glass area
.card-overlay-bottom {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  min-height: 65px;
  max-height: 80px; // Limit maximum height to prevent overflow
  overflow: hidden; // Prevent content from overflowing
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  // Alternate style when background-filter is not supported
  @supports not (backdrop-filter: blur(4px)) {
    background: rgba(0, 0, 0, 0.8);
  }
}

// main content area
.card-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 32px);
  text-align: center;
  color: #ffffff;
}

// Responsive design
@media (max-width: 768px) {
  .card-overlay-top {
    top: 12px;
    left: 12px;
    right: 12px;
    padding: 10px 14px;
    min-height: 45px;
    border-radius: 6px;
  }
  
  .card-overlay-bottom {
    bottom: 12px;
    left: 12px;
    right: 12px;
    padding: 12px 14px;
    min-height: 65px;
    border-radius: 6px;
  }
  
  .card-content {
    width: calc(100% - 24px);
  }
}

@media (max-width: 480px) {
  .card-overlay-top {
    top: 10px;
    left: 10px;
    right: 10px;
    padding: 8px 12px;
    min-height: 40px;
    border-radius: 4px;
  }
  
  .card-overlay-bottom {
    bottom: 10px;
    left: 10px;
    right: 10px;
    padding: 10px 12px;
    min-height: 55px;
    border-radius: 5px;
  }
  
  .card-content {
    width: calc(100% - 20px);
  }
}
</style> 