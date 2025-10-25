<template>
  <section 
    class="sticky-cards" 
    ref="stickyCardsRef"
    @mousemove="throttledMouseMove"
    @mouseleave="handleMouseNotOnCard"
  >
    <div 
      v-for="(image, index) in limitedImages" 
      :key="index"
      class="card" 
      :class="{ 'card-hovered': hoveredCardIndex === index }"
      :data-index="index"
    >
      <div class="card-img">
        <img :src="image.url" :alt="image.alt || `Card ${index + 1}`" />
      </div>
      <div class="card-content">
        <p>{{ image.content || `CARD-${index + 1}` }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, readonly } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register the ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger)

// Props definition
interface ImageData {
  url: string
  alt?: string
  content?: string
}

interface Props {
  images: ImageData[]
  animationDuration?: number  // Overall animation duration, default 4 seconds
  autoStart?: boolean         // Whether to start automatically, default true
  loop?: boolean              // Whether to loop playback, default true
  loopDelay?: number          // Cycle interval time (seconds), default 1 second
  triggerStart?: string       // ScrollTrigger starting position, default "top 80%"
  triggerEnd?: string         // ScrollTrigger end position, default "bottom 20%"
  showMarkers?: boolean       // Whether to display debugging markers, default false
}

const props = withDefaults(defineProps<Props>(), {
  images: () => [],
  animationDuration: 4,
  autoStart: true,
  loop: true,
  loopDelay: 1,
  triggerStart: "top 80%",
  triggerEnd: "bottom 20%",
  showMarkers: false
})

// Emits
const emit = defineEmits<{
  animationStart: []
  animationUpdate: [progress: number]
  animationComplete: []
}>()

// Refs
const stickyCardsRef = ref<HTMLElement>()
let animationTimeline: gsap.core.Timeline | null = null
let scrollTriggerInstance: ScrollTrigger | null = null
const animationPlayed = ref(false)
const isLooping = ref(false)
let loopTimeoutId: number | null = null

// Mouse interaction status
const isHovered = ref(false)
const hoveredCardIndex = ref(-1)

// Limit to 6 images (match original file)
const limitedImages = computed(() => {
  return props.images.slice(0, 6)
})

// Card rotation angle configuration (complete reproduction of the original file)
const rotations = [-12, 10, -5, 5, -5, -2]

// Anti-shake function
const debounce = (func: Function, delay: number) => {
  let timeoutId: number
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => func.apply(null, args), delay)
  }
}

// Throttle function
const throttle = (func: Function, delay: number) => {
  let inThrottle: boolean
  return (...args: any[]) => {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, delay)
    }
  }
}

// Initialize card position
const initializeCards = () => {
  const cards = gsap.utils.toArray('.card')
  
  cards.forEach((card: any, index: number) => {
    // Reduce initial offset so cards start from the edge of the screen instead of completely outside
    const initialY = window.innerHeight * 0.3 // Start at 30% instead of 100%
    gsap.set(card, {
      y: initialY,
      x: 0,
      rotate: rotations[index] || 0,
      transformOrigin: 'center center',
      opacity: 1, // completely opaque
      zIndex: 1, // Default level
      cursor: 'pointer' // Mouse pointer style
    })
  })
  
  console.log('✅ Card initialization completed, quantity:', cards.length)
}

// Progress update function that simulates the original scroll animation
const updateCardsPosition = (progress: number) => {
  const cards = gsap.utils.toArray('.card')
  const totalCards = cards.length
  const progressPerCard = 1 / totalCards

  emit('animationUpdate', progress)
  
  cards.forEach((card: any, index: number) => {
    const cardStart = index * progressPerCard
    let cardProgress = (progress - cardStart) / progressPerCard
    cardProgress = Math.min(Math.max(cardProgress, 0), 1)

    // Optimize position calculation and reduce vacuum period
    const initialY = window.innerHeight * 0.3 // Corresponds to the initial position
    let yPos = initialY * (1 - cardProgress) // Move from initial position to center
    let xPos = 0

    // Second stage: After the cards are fully raised, they start to move sideways (except for the last one)
    if (cardProgress === 1 && index < totalCards - 1) {
      const remainingProgress = 
        (progress - (cardStart + progressPerCard)) /
        (1 - (cardStart + progressPerCard))

      if (remainingProgress > 0) {
        const distanceMultiplier = 1 - index * 0.15
        xPos = -window.innerWidth * 0.3 * distanceMultiplier * remainingProgress
        yPos = -window.innerHeight * 0.3 * distanceMultiplier * remainingProgress
      }
    }

    // Apply transformation (preserve z-index, avoid being overwritten)
    const currentZIndex = gsap.getProperty(card, "zIndex") as number
    gsap.set(card, {
      y: yPos,
      x: xPos,
      rotate: rotations[index] || 0,
      opacity: 1, // remain completely opaque
      zIndex: currentZIndex || 1 // Keep current z-index
    })
  })
}

// Create timeline animation
const createTimelineAnimation = () => {
  console.log('🎬 Create timeline animation')
  
  animationTimeline = gsap.timeline({
    onStart: () => {
      console.log('🚀 Animation starts')
      emit('animationStart')
    },
    onComplete: () => {
      console.log('✅ Animation completed')
      emit('animationComplete')
      
      // Check if loop is needed
      if (props.loop && isLooping.value) {
        console.log(`🔄 ${props.loopDelay}Restart the cycle after seconds`)
        // delayed restart
        loopTimeoutId = window.setTimeout(() => {
          restartAnimation()
        }, props.loopDelay * 1000)
      }
    }
  })

  // Create a progress object
  const progressObject = { value: 0 }
  
  // Optimized animation easing, fast in the first half and slow in the second half
  animationTimeline.to(progressObject, {
    value: 1,
    duration: props.animationDuration,
    ease: "power2.out", // Use the ease-out effect, start fast and end slowly
    onUpdate: () => {
      updateCardsPosition(progressObject.value)
    }
  })
}

// restart animation
const restartAnimation = () => {
  if (!isLooping.value) return
  
  console.log('♻️ restart animation')
  
  // reset state
  if (animationTimeline) {
    animationTimeline.kill()
    animationTimeline = null
  }
  
  // Reinitialize and start animation
  initializeCards()
  createTimelineAnimation()
}

// Play animation
const playAnimation = () => {
  if (animationPlayed.value && !props.loop) return
  
  animationPlayed.value = true
  isLooping.value = props.loop
  
  console.log('🎯 Play animation', { loop: props.loop, loopDelay: props.loopDelay })
  
  initializeCards()
  
  // Start animation immediately, reducing latency
  createTimelineAnimation()
}

// stop loop
const stopLoop = () => {
  isLooping.value = false
  
  // Clear loop timer
  if (loopTimeoutId) {
    clearTimeout(loopTimeoutId)
    loopTimeoutId = null
  }
  
  console.log('⏹️ stop loop')
}

// Check if the mouse is on the card
const getCardUnderMouse = (mouseX: number, mouseY: number) => {
  const cards = gsap.utils.toArray('.card')
  
  for (let i = cards.length - 1; i >= 0; i--) {
    const card = cards[i] as HTMLElement
    const rect = card.getBoundingClientRect()
    
    if (mouseX >= rect.left && 
        mouseX <= rect.right && 
        mouseY >= rect.top && 
        mouseY <= rect.bottom) {
      return i
    }
  }
  
  return -1
}

// Processing of mouse on pictures
const handleMouseOnCard = (index: number) => {
  if (hoveredCardIndex.value === index) return // Avoid duplication of processing
  
  console.log('🖱️ Mouse over card:', index)
  
  isHovered.value = true
  hoveredCardIndex.value = index
  
  // pause animation
  if (animationTimeline) {
    animationTimeline.pause()
    console.log('⏸️ Animation paused')
  }
  
  // Update the card z-index so that the hovered card is on top
  updateCardZIndex(index)
}

// Processing when the mouse is not on any picture
const handleMouseNotOnCard = () => {
  if (!isHovered.value) return // Avoid duplication of processing
  
  console.log('🖱️ The mouse is not on any card')
  
  isHovered.value = false
  hoveredCardIndex.value = -1
  
  // Resume animation
  if (animationTimeline) {
    animationTimeline.resume()
    console.log('▶️ Animation restored')
  }
  
  // Restore z-index of all cards
  resetCardZIndex()
}

// Mouse move event handling
const handleMouseMove = (event: MouseEvent) => {
  const mouseX = event.clientX
  const mouseY = event.clientY
  
  const cardIndex = getCardUnderMouse(mouseX, mouseY)
  
  if (cardIndex >= 0) {
    // The mouse is on a card
    handleMouseOnCard(cardIndex)
  } else {
    // The mouse is not on any card
    handleMouseNotOnCard()
  }
}

// Update card z-index
const updateCardZIndex = (hoveredIndex: number) => {
  const cards = gsap.utils.toArray('.card')
  
  cards.forEach((card: any, index: number) => {
    if (index === hoveredIndex) {
      gsap.set(card, { zIndex: 1000 }) // Top layer of hovered cards
    } else {
      gsap.set(card, { zIndex: 1 }) // Other card default levels
    }
  })
}

// Reset all card z-index
const resetCardZIndex = () => {
  const cards = gsap.utils.toArray('.card')
  
  cards.forEach((card: any) => {
    gsap.set(card, { zIndex: 1 }) // All cards return to default level
  })
}

// Throttled mouse movement events (avoid triggering frequently)
const throttledMouseMove = throttle((event: MouseEvent) => {
  handleMouseMove(event)
}, 50) // Trigger at most once every 50ms

// Set GSAP ScrollTrigger viewport observation
const setupScrollTrigger = () => {
  if (!stickyCardsRef.value) return

  console.log('🔧 set up ScrollTrigger:', {
    start: props.triggerStart,
    end: props.triggerEnd,
    markers: props.showMarkers
  })

  scrollTriggerInstance = ScrollTrigger.create({
    trigger: stickyCardsRef.value,
    start: props.triggerStart,
    end: props.triggerEnd,
    markers: props.showMarkers,
    onEnter: () => {
      if (props.autoStart && !animationPlayed.value) {
        console.log('📍 The component enters the viewport and starts animation')
        playAnimation()
      }
    },
    onLeave: () => {
      console.log('📍 Component leaves the viewport')
    },
    onEnterBack: () => {
      console.log('📍 Component reenters the viewport')
    },
    onLeaveBack: () => {
      console.log('📍 Component moves upward out of the viewport')
    },
  })
}

// refresh animation
const refreshAnimation = () => {
  // stop loop
  stopLoop()
  
  if (animationTimeline) {
    animationTimeline.kill()
  }
  
  if (scrollTriggerInstance) {
    scrollTriggerInstance.kill()
  }
  
  animationPlayed.value = false
  
  nextTick(() => {
    initializeCards()
    if (props.autoStart) {
      setupScrollTrigger()
    }
  })
}

// destroy animation
const destroyAnimation = () => {
  // stop loop
  stopLoop()
  
  if (animationTimeline) {
    animationTimeline.kill()
    animationTimeline = null
  }
  
  if (scrollTriggerInstance) {
    scrollTriggerInstance.kill()
    scrollTriggerInstance = null
  }
  
  // reset state
  animationPlayed.value = false
  isHovered.value = false
  hoveredCardIndex.value = -1
}

// life cycle
onMounted(async () => {
  console.log('🎯 StickyCardsAnimation Component mounting')
  console.log('📊 Number of pictures passed in:', props.images.length)
  
  await nextTick()
  
  if (limitedImages.value.length > 0) {
    // Lazy initialization to ensure the DOM is fully rendered
    setTimeout(() => {
      initializeCards()
      if (props.autoStart) {
        setupScrollTrigger()
      }
    }, 100)
  }
})

onUnmounted(() => {
  console.log('🔚 StickyCardsAnimation Component uninstallation')
  destroyAnimation()
})

// Expose methods to parent component
defineExpose({
  playAnimation,
  stopLoop,
  refreshAnimation,
  destroyAnimation,
  isLooping: readonly(isLooping),
  isHovered: readonly(isHovered),
  hoveredCardIndex: readonly(hoveredCardIndex)
})
</script>

<style scoped lang="scss">
.sticky-cards {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
  // Make sure mouse events are captured correctly
  pointer-events: all;
}

.card {
  position: absolute;
  width: min(350px, 80vw);
  height: min(500px, 70vh);
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
  opacity: 1; // completely opaque
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.2s ease;
  
  &:hover {
    box-shadow: 0 35px 70px rgba(0, 0, 0, 0.7);
  }
  
  &.card-hovered {
    box-shadow: 0 40px 80px rgba(0, 0, 0, 0.8);
    z-index: 1000 !important;
  }
  
  .card-img {
    width: 100%;
    height: 75%;
    overflow: hidden;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }
  
  .card-content {
    height: 25%;
    padding: 20px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    
    p {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #000;
      text-align: center;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  }
}

// Mobile terminal adaptation
@media (max-width: 768px) {
  .card {
    width: min(280px, 85vw);
    height: min(400px, 65vh);
    border-radius: 16px;
    
    .card-content {
      padding: 15px;
      
      p {
        font-size: 14px;
      }
    }
  }
}

@media (max-width: 480px) {
  .card {
    width: min(240px, 90vw);
    height: min(350px, 60vh);
    border-radius: 12px;
    
    .card-content {
      padding: 12px;
      
      p {
        font-size: 12px;
      }
    }
  }
}
</style> 