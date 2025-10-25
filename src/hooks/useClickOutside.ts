const useClickOutside = (elementRef: Ref<null | HTMLElement>) => {
  // Whether to click outside
  const isClickOutside = ref(false)
  const handler = (e: MouseEvent) => {
    // Determine whether the element elementRef exists
    if (elementRef.value) {
      // Determine whether elementRef is included in this document
      if (elementRef.value.contains(e.target as HTMLElement)) {
        isClickOutside.value = false
      } else {
        isClickOutside.value = true
      }
    }
  }

  onMounted(() => {
    // Add handler event
    document.addEventListener('click', handler)
  })

  onUnmounted(() => {
    // Remove handler event
    document.removeEventListener('click', handler)
  })

  return isClickOutside
}

export default useClickOutside
