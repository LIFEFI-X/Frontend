<script lang="ts" setup>
import useClickOutside from '@/hooks/useClickOutside'

interface Props {
  title: string
  trigger?: 'click' | 'hover'
}

const props = withDefaults(defineProps<Props>(), {
  trigger: 'hover',
})

/**
 * Whether to open the drop-down menu
 */
const isOpen = ref(false)
const isHoveringMenu = ref(false)

const onOpen = () => {
  isOpen.value = true
}

const onClose = () => {
  isOpen.value = false
}

const onClick = () => {
  if (props.trigger === 'hover') return
  if (isOpen.value) {
    onClose()
  } else {
    onOpen()
  }
}

const onMouseEnterToggle = () => {
  if (props.trigger === 'click') return
  onOpen()
}
const onMouseLeaveToggle = () => {
  if (props.trigger === 'click') return
  setTimeout(() => {
    if (!isHoveringMenu.value) {
      onClose()
    }
  }, 500)
}

const onMouseEnterMenu = () => {
  isHoveringMenu.value = true
}

const onMouseLeaveMenu = () => {
  isHoveringMenu.value = false
  onClose()
}

/**
 * Click on the blank area event handling
 */
const dropdownRef = ref<null | HTMLElement>(null)

const isClickOutside = useClickOutside(dropdownRef)

/**
 * Listen for changes in isClickOutside
 */
watch(isClickOutside, () => {
  if (isOpen.value && isClickOutside.value) {
    isOpen.value = false
  }
})

// Define change event
const emit = defineEmits<{
  (e: 'change', value: string | number): void
}>()

const handleChange = (value: string | number) => {
  isOpen.value = false
  emit('change', value)
}

provide('handleChange', handleChange)
</script>

<template>
  <div class="dropdown" ref="dropdownRef">
    <div
      class="dropdown-toggle"
      :class="{ open: isOpen }"
      @click="onClick"
      @mouseenter="onMouseEnterToggle"
      @mouseleave="onMouseLeaveToggle"
    >
      <slot>{{ title }}</slot>
    </div>
    <Transition name="slide-down">
      <ul
        class="dropdown-menu"
        v-if="isOpen"
        @mouseenter="onMouseEnterMenu"
        @mouseleave="onMouseLeaveMenu"
      >
        <slot name="dropdown"></slot>
      </ul>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.dropdown {
  position: relative;

  .dropdown-toggle {
    color: inherit;
    text-align: center;
    font-family: Poppins;
    font-size: 16px;
    font-style: normal;
    font-weight: 800;
    line-height: 24px; /* 150% */
    cursor: pointer;

    &.open {
      color: #1d1d1f;
    }
  }

  ul {
    padding-inline-start: 0;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 24px);
    right: 0;
    display: flex;
    width: 184px;
    flex-direction: column;
    align-items: flex-start;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0px 4px 16px 0px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  /* Cut animation from top to bottom */
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: all 0.3s ease;
  }

  .slide-down-enter-from,
  .slide-down-leave-to {
    transform: translateY(-10px);
    opacity: 0;
  }
}
</style>
