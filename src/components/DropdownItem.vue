<script lang="ts" setup>
interface Props {
  disabled?: boolean
  value: string | number
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const handleChange = inject<(value: string | number) => void>('handleChange')

const handleClick = () => {
  console.log('click', props.value)

  if (!props.disabled && handleChange) {
    handleChange(props.value)
  }
}
</script>

<template>
  <li class="dropdown-item" :class="{ 'is-disabled': disabled }" @click="handleClick">
    <slot></slot>
  </li>
</template>

<style lang="scss" scoped>
.dropdown-item {
  display: flex;
  height: 44px;
  padding: 0px 16px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  background: #fff;
  cursor: pointer;

  &:not(.is-disabled):hover {
    background: #fafafc;
    color: #1d1d1f;
    will-change: background-color, color;
    transition:
      background-color 0.2s ease-in-out,
      color 0.2s ease-in-out;

    * {
      color: #1d1d1f;
    }
  }

  &.is-disabled {
    pointer-events: none;
  }
}
</style>
