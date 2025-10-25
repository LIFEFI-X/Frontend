<template>
  <div class="circular-animation-container" ref="containerRef">
    <!-- Pictures of the six regions -->
    <div 
      v-for="(image, index) in imagesByRegion" 
      :key="`region-${index}`"
      class="image-region"
      :data-region="index"
    >
      <div 
        v-for="(img, imgIndex) in image" 
        :key="`img-${index}-${imgIndex}`"
        class="floating-image"
        :ref="el => setImageRef(el, index, imgIndex)"
        :style="getInitialImageStyle(index, imgIndex)"
      >
        <img 
          :src="img.src" 
          :alt="`Image ${index}-${imgIndex}`"
          @load="handleImageLoad(index, imgIndex)"
          @error="handleImageError(index, imgIndex, img.src)"
          @mouseenter="(event) => handleImageMouseEnter(event, index, imgIndex)"
          @mouseleave="(event) => handleImageMouseLeave(event, index, imgIndex)"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, type ComponentPublicInstance } from 'vue'
import { gsap } from 'gsap'

/**
 * CircularImageAnimation component
 *
 * Features:
 * 1. Four diagonal tracks fan images outward from a centralized start.
 *    - Track 0: 45 degrees (upper-right)
 *    - Track 1: 135 degrees (upper-left)
 *    - Track 2: 225 degrees (lower-left)
 *    - Track 3: 315 degrees (lower-right)
 * 2. Placement rules:
 *    - Tracks use a fixed spacing of 150px between cards.
 *    - Images begin near radius 500px and move toward their endpoints.
 *    - imageIndex = 0 launches first and each subsequent index adds a 200ms delay.
 * 3. Animation phases:
 *    - Phase 1: fade in while clustered (0.5s).
 *    - Phase 2: travel along the track toward the dispersed position (main duration).
 *    - Phase 3: remain visible at the destination (0.5s).
 * 4. Hover interaction pauses playback and zooms the hovered image to 1.6x, resuming on mouse leave.
 * 5. Progress tracking emits updates and completion events when every image finishes.
 * 6. Auto reload rebuilds the timelines whenever props.images changes.
 *
 * Events:
 * - @all-images-completed: emitted after every image finishes animating.
 * - @animation-progress: emitted for progress updates (payload { completed, total }).
 * - @prepare-next-batch: emitted once progress reaches 30% so the parent can preload the next set.
 */

interface ImageData {
  src: string
  size: number
  speed: number
}

interface Props {
  images?: string[]
  animationSpeed?: number
  imageCount?: number
  nextBatchImages?: string[] // Next batch of preloaded images
}

// Define emit event
const emit = defineEmits<{
  'all-images-completed': []
  'animation-progress': [completed: number, total: number]
  'prepare-next-batch': [] // In the second phase, notify the parent component to prepare the next batch of images.
}>()

const props = withDefaults(defineProps<Props>(), {
  images: () => [
  ],
  animationSpeed: 1,
  imageCount: 20, // 4 areas, 5 pictures in each area
  nextBatchImages: () => [] // Default empty array
})

const containerRef = ref<HTMLElement>()
const imageRefs = ref<Map<string, HTMLElement>>(new Map())
const animationInstance = ref<any>()

// Image data for four areas (4 diagonal tracks)
const imagesByRegion = ref<ImageData[][]>([[], [], [], []])

// Stores all animation timeline instances for pausing and resuming
const allTimelines = ref<any[]>([])

// Whether the animation is paused
const isAnimationPaused = ref(false)

// Anti-shake timer
const debounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// The currently suspended image element
const hoveredElement = ref<HTMLElement | null>(null)

// Animation completion status tracking
const completedAnimations = ref<number>(0)
const totalAnimations = ref<number>(0)
const isAllCompleted = ref<boolean>(false)

// 30% stage trigger status tracking (used to prepare the next batch of data)
const thirtyPercentTriggered = ref<boolean>(false)
const thirtyPercentCompletedCount = ref<number>(0)

// Pre-display the status of the next batch of images
const showNextBatchPreview = ref<boolean>(false)
const nextBatchPreviewImages = ref<string[]>([])



// Set image reference
const setImageRef = (el: Element | ComponentPublicInstance | null, regionIndex: number, imageIndex: number) => {
  if (el && el instanceof HTMLElement) {
    imageRefs.value.set(`${regionIndex}-${imageIndex}`, el)
  }
}

// Generate random image data
const generateImageData = () => {
  const regions = 4  // 4 diagonal track areas
  const imagesPerRegion = Math.ceil(props.imageCount / regions)
  
  console.log(`Generate image data: total${props.imageCount}，4area, each area${imagesPerRegion}`)
  
  // Reset animation completion status
  resetAnimationProgress()
  
  // Check if an image is available
  if (!props.images || props.images.length === 0) {
    console.error('❌ No image data available, cannot generate animation')
    return
  }
  
  // Reallocate tracks only if first loaded or if track is empty, otherwise keep existing track structure
  const shouldReallocateTracks = imagesByRegion.value.every(region => region.length === 0)
  
  if (shouldReallocateTracks) {
    console.log('🔄 Assign or reallocate a track for the first time')
    for (let region = 0; region < regions; region++) {
      imagesByRegion.value[region] = []
    }
  } else {
    console.log('🎯 Keep the existing track structure and clear the image data')
    // Clear existing image data but keep track structure
    for (let region = 0; region < regions; region++) {
      imagesByRegion.value[region] = []
    }
  }
  
  for (let region = 0; region < regions; region++) {
    for (let i = 0; i < imagesPerRegion; i++) {
      imagesByRegion.value[region].push({
        src: props.images[Math.floor(Math.random() * props.images.length)],
        size: Math.random() * 60 + 100, // 100-160px, increase the base size to make the image larger
        speed: Math.random() * 0.5 + 0.7 // 0.7-1.2x speed, reduce the speed to make the movement slower
      })
    }
    const angleInfo = [
      '15-75degree', '105-165degree', '195-255degree', '285-345degree'
    ]
    console.log(`area${region}(${angleInfo[region]})generate${imagesByRegion.value[region].length}pictures`)
  }
  
  // Set the total number of animations
  totalAnimations.value = props.imageCount
  console.log(`📊 Set the total number of animations: ${totalAnimations.value}`)
}

// Reset animation progress
const resetAnimationProgress = () => {
  completedAnimations.value = 0
  totalAnimations.value = 0
  isAllCompleted.value = false
  thirtyPercentTriggered.value = false
  thirtyPercentCompletedCount.value = 0
  
  // Hide preview image
  showNextBatchPreview.value = false
  nextBatchPreviewImages.value = []
  
  console.log('🔄 Reset animation progress status')
}

// Mark 30% stage complete
const markThirtyPercentCompleted = () => {
  thirtyPercentCompletedCount.value++
  console.log(`🎯 30%stage completed: ${thirtyPercentCompletedCount.value}/${totalAnimations.value}`)
  
  // When the 30% stage completion quantity reaches 30% of the total, the parent component is notified to prepare the next batch.
  const triggerThreshold = Math.ceil(totalAnimations.value * 0.3)
  
  if (!thirtyPercentTriggered.value && thirtyPercentCompletedCount.value >= triggerThreshold) {
    thirtyPercentTriggered.value = true
    console.log(`🚀 animation reaches30%Completeness, notifies the parent component to prepare the next batch of pictures (${thirtyPercentCompletedCount.value}/${totalAnimations.value})`)
    emit('prepare-next-batch')
    
    // If the next batch of images is ready, show a preview immediately
    if (props.nextBatchImages && props.nextBatchImages.length > 0) {
      showNextBatchPreview.value = true
      nextBatchPreviewImages.value = [...props.nextBatchImages]
      console.log(`👁️ Start showing preview of next batch of images (${props.nextBatchImages.length}open)`)
    }
  }
}

// Mark animation completed
const markAnimationCompleted = () => {
  completedAnimations.value++
  console.log(`✅ Animation completed: ${completedAnimations.value}/${totalAnimations.value}`)
  
  // trigger progress event
  emit('animation-progress', completedAnimations.value, totalAnimations.value)
  
  // Check if all animations are completed
  checkAllCompleted()
}

// Check if all animations are completed
const checkAllCompleted = () => {
  if (completedAnimations.value >= totalAnimations.value && !isAllCompleted.value) {
    isAllCompleted.value = true
    console.log('🎉 All image animations have been completed, notify the parent component')
    
    // Please delay the notification again to ensure that the final animation effect is fully displayed.
    setTimeout(() => {
      emit('all-images-completed')
    }, 500)
  }
}

// Get the initial image style - a rectangular image in the style of playing cards
const getInitialImageStyle = (regionIndex: number, imageIndex: number) => {
  const baseWidth = imagesByRegion.value[regionIndex]?.[imageIndex]?.size || 100
  
  // Playing card ratio 2.5:3.5 (approximately 5:7), vertical rectangle, increased size
  const width = baseWidth * 0.9  // Increase the width factor to make the image larger
  const height = width * 1.4     // The height is 1.4 times the width, like playing cards
  
  return {
    width: `${width}px`,
    height: `${height}px`,
    // The initial position is set to the center, giving GSAP full control over position and transparency
    transform: `translate3d(-50%, -50%, 0px)`,
    opacity: '0' // Set a small transparency to make it easier to see during debugging
  }
}

// Get the pre-display image style - four areas distributed by default, but on the background layer
const getPreviewImageStyle = (index: number) => {
  const containerWidth = containerRef.value?.clientWidth || 1200
  const containerHeight = containerRef.value?.clientHeight || 800
  
  // Calculate which region this is and the index within the region
  const imagesPerRegion = Math.ceil(nextBatchPreviewImages.value.length / 4)
  const regionIndex = Math.floor(index / imagesPerRegion)
  const imageIndexInRegion = index % imagesPerRegion
  
  // Uses the same four-orbit angle calculation as the main animation
  const baseAngles = [
    { start: 15, end: 75 },     // Zone 0: 15-75 degrees (center 45 degrees)
    { start: 105, end: 165 },   // Zone 1: 105-165 degrees (center 135 degrees)
    { start: 195, end: 255 },   // Zone 2: 195-255 degrees (center 225 degrees)
    { start: 285, end: 345 }    // Zone 3: 285-345 degrees (center 315 degrees)
  ]
  
  const region = baseAngles[regionIndex] || baseAngles[0]
  
  // Angle range
  const angleRange = region.end - region.start
  const step = angleRange / Math.max(imagesPerRegion, 1)
  const angle = region.start + (step * imageIndexInRegion) + (Math.random() * step * 0.3)
  
  const angleRad = (angle * Math.PI) / 180
  
  // Pre-display image uses smaller size but maintains playing card proportions
  const baseWidth = 60 + Math.random() * 20 // 60-80px 
  const width = baseWidth * 0.8
  const height = width * 1.4
  
  // Position calculation: distributed near the center area, but not overlapping with the main animation
  const radius = Math.min(containerWidth, containerHeight) * 0.15 // Distributed at 15% radius, closer to the center
  const x = Math.cos(angleRad) * radius
  const y = Math.sin(angleRad) * radius
  
  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate3d(-50%, -50%, -300px)`, // The Z axis is further away to ensure no interference
    left: `${50 + (x / containerWidth) * 100}%`,
    top: `${50 + (y / containerHeight) * 100}%`,
    opacity: '0.4' // Slightly increase the transparency to make the distribution of the six regions more obvious
  }
}

// Handle pre-display image loading
const handlePreviewImageLoad = (index: number) => {
  console.log(`📷 Pre-display image loaded successfully: index${index}`)
}

// Track Configuration - Define the frontend and backend of each track
const TRACK_CONFIG = {
  fixedImageSpacing: 150, // Fixed spacing (pixels) between images on the track
  trackLength: 600,       // Total length of each track (pixels)
  frontEndRadius: 500,    // Rail front radius (picture vanishing point)
  backEndRadius: 200      // Track back end radius (picture starting point)
}

// Calculate the position of pictures on a track - in order, with consistent spacing
const calculateTrackPosition = (regionIndex: number, imageIndex: number) => {
  const baseAngles = [
    { angle: 45, name: 'upper right' },   // Zone 0: 45 degree orbit
    { angle: 135, name: 'upper left' },  // Zone 1: 135 degree orbit  
    { angle: 225, name: 'lower left' },  // Zone 2: 225 degree orbit
    { angle: 315, name: 'lower right' }   // Zone 3: 315 degree orbit
  ]
  
  const track = baseAngles[regionIndex]
  const angle = track.angle * Math.PI / 180 // Convert to radians
  
  // Calculate the initial position of the image on the track
  // imageIndex=0 at the end, the larger the imageIndex is, the closer it is to the front
  const totalImages = imagesByRegion.value[regionIndex]?.length || 1
  const positionFromBack = imageIndex * TRACK_CONFIG.fixedImageSpacing
  
  // Calculate the radius: moving from the back end to the front end
  const radius = TRACK_CONFIG.backEndRadius + positionFromBack
  
  // Calculate rectangular coordinates using polar coordinates
  const x = Math.cos(angle) * radius
  const y = Math.sin(angle) * radius
  
  console.log(`📍 track${regionIndex}(${track.name}) picture${imageIndex}: angle${track.angle} degrees, radius${radius}px, Location(${x.toFixed(1)}, ${y.toFixed(1)})`)
  
  return {
    angle,
    radius,
    x,
    y,
    trackName: track.name
  }
}

// Calculate the position of the vanishing point at the front end of the track
const getTrackFrontEndPosition = (regionIndex: number) => {
  const baseAngles = [45, 135, 225, 315] // Corresponding to the angles of 4 orbits
  const angle = baseAngles[regionIndex] * Math.PI / 180
  
  return {
    x: Math.cos(angle) * TRACK_CONFIG.frontEndRadius,
    y: Math.sin(angle) * TRACK_CONFIG.frontEndRadius,
    radius: TRACK_CONFIG.frontEndRadius
  }
}

// Get image radius
const getRadiusForImage = () => {
  if (!containerRef.value) return 300
  
  const containerWidth = containerRef.value.clientWidth
  const containerHeight = containerRef.value.clientHeight
  const maxRadius = Math.min(containerWidth, containerHeight) / 2 - 100
  
  return Math.random() * maxRadius + 150 // Between 150px and maxRadius
}

// Initialize animation
const initAnimation = () => {
  if (!containerRef.value) {
    console.log('Container reference does not exist')
    return
  }
  
  const allImages: HTMLElement[] = []
  
  // Collect image elements in order of region and index
  for (let regionIndex = 0; regionIndex < 4; regionIndex++) {
    const regionImageCount = imagesByRegion.value[regionIndex]?.length || 0
    
    for (let imageIndex = 0; imageIndex < regionImageCount; imageIndex++) {
      const key = `${regionIndex}-${imageIndex}`
      const element = imageRefs.value.get(key)
      
      if (element) {
        allImages.push(element)
        console.log(`✅ Collection of picture elements: area${regionIndex}, index${imageIndex}, key=${key}`)
      } else {
        console.warn(`❌ Image element not found: area${regionIndex}, index${imageIndex}, key=${key}`)
      }
    }
  }
  
  console.log(`📊 Total collected${allImages.length}image elements`)
  console.log('📋 imageRefsstoredkey:', Array.from(imageRefs.value.keys()))
  
  if (allImages.length === 0) {
    console.log('❌ There is no picture element, exit animation initialization')
    return
  }
  
  // Verify the distribution of 4 areas
  console.log('🔍 Regional distribution verification:')
  imagesByRegion.value.forEach((regionImages, index) => {
    console.log(`  area${index}: ${regionImages.length}pictures`)
  })

      // All images enter animation starting from the outside of their respective tracks

    // Create a continuous picture animation
    console.log('🎬 Start creating4Orbital diagonal movement animation')
    createContinuousAnimation(allImages)
}

// Create continuous animation - 4-track diagonal movement effect (supports mouse hover pause)
const createContinuousAnimation = (images: HTMLElement[]) => {
  console.log(`Start as${images.length}Create animations from pictures`)
  
  let globalIndex = 0
  
  // Iterate through the pictures of each area
  imagesByRegion.value.forEach((regionImages, regionIndex) => {
    regionImages.forEach((_, imageIndex) => {
      if (globalIndex < images.length) {
        const image = images[globalIndex]
        
        // Set different delays for each area of ​​the image - reduces latency for easier debugging
        const baseDelay = regionIndex * 100 // The interval between each area is 100ms
        const imageDelay = imageIndex * 50  // The interval between pictures in the same area is 50ms
        const randomDelay = Math.random() * 100 // Random delay 0-100ms
        const delay = baseDelay + imageDelay + randomDelay + 200 // Basic delay 200ms
        
        console.log(`🎯 picture${globalIndex}: area${regionIndex}(${getRegionName(regionIndex)}), Image index${imageIndex}, Delay${delay.toFixed(0)}ms`)
        
        setTimeout(() => {
          console.log(`🚀 Startup area${regionIndex}picture${imageIndex}animation`)
          animateImage(image, regionIndex, imageIndex)
        }, delay)
        
        globalIndex++
      }
    })
  })
}

// Get zone name (for debugging)
const getRegionName = (regionIndex: number) => {
  const names = ['15-75 degrees', '105-165 degrees', '195-255 degrees', '285-345 degrees']
  return names[regionIndex] || 'unknown area'
}

// Image loading successfully processed
const handleImageLoad = (regionIndex: number, imageIndex: number) => {
  console.log(`✅ Image loaded successfully: area${regionIndex}, index${imageIndex}`)
}

// Image loading failure handling
const handleImageError = (regionIndex: number, imageIndex: number, src: string) => {
  console.error(`❌ Image loading failed: area${regionIndex}, index${imageIndex}, path: ${src}`)
}

// Pause all animations
const pauseAllAnimations = (event?: Event) => {
  // Clear previous anti-shake timer
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  // Prevent frequent triggering
  if (isAnimationPaused.value) return
  
  console.log('🚫 Hover the mouse to pause all track animations')
  isAnimationPaused.value = true
  
  // Pause all timelines and keep pictures at their current location
  allTimelines.value.forEach((timeline, index) => {
    if (timeline && typeof timeline.pause === 'function') {
      timeline.pause()
      console.log(`⏸️ Pause timeline ${index + 1}/${allTimelines.value.length}`)
    }
  })
  
  console.log(`📊 Total pauses ${allTimelines.value.length} animation`)
}

// Restore all animations (with anti-shake)
const resumeAllAnimations = (event?: Event) => {
  // Clear previous anti-shake timer
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }
  
  // Set anti-shake delay to avoid flickering caused by rapid movement in and out
  debounceTimer.value = setTimeout(() => {
    // Prevent frequent triggering
    if (!isAnimationPaused.value) return
    
    console.log('▶️ Move the mouse away to restore all track animations')
    isAnimationPaused.value = false
    
    // Restore all timelines
    allTimelines.value.forEach((timeline, index) => {
      if (timeline && typeof timeline.resume === 'function') {
        timeline.resume()
        console.log(`▶️ restore timeline ${index + 1}/${allTimelines.value.length}`)
      }
    })
    
    console.log(`📊 Total restored ${allTimelines.value.length} animation`)
  }, 100) // 100ms anti-shake delay
}

// Clean all animations
const clearAllAnimations = (keepTrackState = false) => {
  console.log('🧹 Clean all animation timelines', keepTrackState ? '(stay on track)' : '')
  
  // Clear anti-shake timer
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
    debounceTimer.value = null
  }
  
  // Clear suspended state
  if (hoveredElement.value) {
    gsap.set(hoveredElement.value, { scale: 1, zIndex: 1 })
    hoveredElement.value = null
  }
  
  // Clean all timelines
  allTimelines.value.forEach(timeline => {
    if (timeline && typeof timeline.kill === 'function') {
      timeline.kill()
    }
  })
  
  allTimelines.value = []
  isAnimationPaused.value = false
  
  // Reset animation progress status
  completedAnimations.value = 0
  totalAnimations.value = 0
  isAllCompleted.value = false
  thirtyPercentTriggered.value = false
  thirtyPercentCompletedCount.value = 0
  
  // Hide preview image
  showNextBatchPreview.value = false
  nextBatchPreviewImages.value = []
  
  // If the track status is not maintained, clear the track data
  if (!keepTrackState) {
    imagesByRegion.value = [[], [], [], []]
    console.log('🔄 Track status reset')
  } else {
    console.log('🎯 Track status maintained')
  }
}

// Handle picture mouse entry event
const handleImageMouseEnter = (event: Event, regionIndex: number, imageIndex: number) => {
  const target = event.target as HTMLElement
  const imageContainer = target.closest('.floating-image') as HTMLElement
  
  if (!imageContainer) return
  
  // Pause all animations
  pauseAllAnimations()
  
  // Record the currently suspended element
  hoveredElement.value = imageContainer
  
  console.log(`🔍 Mouse enter picture: area${regionIndex}, index${imageIndex}`)
  
  // Use GSAP to enlarge the picture and stay at the current position
  gsap.to(imageContainer, {
    scale: 1.6, // Magnify to 1.6 times because the image itself is larger and requires a more obvious magnification effect
    duration: 0.3,
    ease: "power2.out",
    transformOrigin: "center center", // Zoom from center point
    zIndex: 100 // Promote level and display at the front
  })
  
  // Change the mouse style to indicate that the current zoom state is
  imageContainer.style.cursor = 'zoom-out'
  
  // Enhance visual effects
  gsap.to(imageContainer, {
    boxShadow: "0 0 30px rgba(255, 255, 255, 0.6), 0 10px 25px rgba(0, 0, 0, 0.8)",
    duration: 0.3,
    ease: "power2.out"
  })
}

// Handle picture mouse leave event
const handleImageMouseLeave = (event: Event, regionIndex: number, imageIndex: number) => {
  const target = event.target as HTMLElement
  const imageContainer = target.closest('.floating-image') as HTMLElement
  
  if (!imageContainer || hoveredElement.value !== imageContainer) return
  
  console.log(`👋 Mouse leaves picture: area${regionIndex}, index${imageIndex}`)
  
  // Restore the original size of the picture
  gsap.to(imageContainer, {
    scale: 1, // Restore original size
    duration: 0.3,
    ease: "power2.out",
    zIndex: 1 // Restore original level
  })
  
  // Restore original shadow
  gsap.to(imageContainer, {
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
    duration: 0.3,
    ease: "power2.out"
  })
  
  // Restore mouse style
  imageContainer.style.cursor = 'zoom-in'
  
  // Clear suspended element records
  hoveredElement.value = null
  
  // Restore all animations
  resumeAllAnimations()
}

// Single picture animation - track queue movement effect: all pictures move from the front end of the track to the back end (dispersed)
const animateImage = (element: HTMLElement, regionIndex: number, imageIndex: number) => {
  // Get orbital information - reverse start and target positions
  const frontEndPosition = getTrackFrontEndPosition(regionIndex) // Now is the starting position
  const targetPosition = calculateTrackPosition(regionIndex, imageIndex) // Now is the target location
  
  // Calculation delay: The last picture (the smallest imageIndex) starts to move first
  const totalImages = imagesByRegion.value[regionIndex]?.length || 1
  const delayMultiplier = imageIndex // Use the index directly, and subsequent pictures will be delayed more
  const baseDelay = delayMultiplier * 200 // Each picture is delayed by 200ms
  
  console.log(`🚀 track${regionIndex}(${targetPosition.trackName}) picture${imageIndex}: Delay${baseDelay}ms`)
  console.log(`   starting position(front end): (${frontEndPosition.x.toFixed(1)}, ${frontEndPosition.y.toFixed(1)})`)
  console.log(`   Target location(rear end): (${targetPosition.x.toFixed(1)}, ${targetPosition.y.toFixed(1)})`)
  
  // Delayed start animation
  setTimeout(() => {
    startTrackMovement(element, regionIndex, imageIndex, frontEndPosition, targetPosition)
  }, baseDelay)
}

// Orbital movement animation - moving from front-end (concentrated) to back-end (dispersed)
const startTrackMovement = (
  element: HTMLElement, 
  regionIndex: number, 
  imageIndex: number,
  startPos: any, // Front-end position (centralized state)
  targetPos: any // Backend location (decentralized state) 
) => {
  const totalImages = imagesByRegion.value[regionIndex]?.length || 1
  
  // Calculate travel distance and time
  const distance = Math.sqrt(
    Math.pow(targetPos.x - startPos.x, 2) + 
    Math.pow(targetPos.y - startPos.y, 2)
  )
  
  // Basic movement time, adjusted based on distance
  const baseDuration = 8 + (distance / 100) // 8 seconds base time, increases according to distance
  const speed = imagesByRegion.value[regionIndex]?.[imageIndex]?.speed || 1
  const duration = baseDuration / speed
  
  console.log(`🎯 track${regionIndex} picture${imageIndex}: Moving distance${distance.toFixed(1)}px, duration${duration.toFixed(1)}s`)
  
  // Calculate size and transparency - based on target track position
  const scaleMultiplier = 0.8 + (targetPos.radius / TRACK_CONFIG.frontEndRadius) * 0.4 // 0.8-1.2
  const opacityMultiplier = 0.8 // unified transparency
  
  // Make sure the element has the correct positioning attributes
  element.style.position = 'absolute'
  element.style.pointerEvents = 'auto'
  
  // Set initial state - at the front of the track (centralized state)
  gsap.set(element, {
    x: startPos.x,
    y: startPos.y,
    z: imageIndex * 10, // Slight Z-axis delamination
    opacity: 0,
    scale: 0.3 * scaleMultiplier,
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    visibility: 'visible'
  })
  
  console.log(`🎨 Set the initial state of the picture: track${regionIndex}, front position(${startPos.x.toFixed(1)}, ${startPos.y.toFixed(1)})`)
  
  // Create trail effects
  const createTrail = () => {
    const trail = document.createElement('div')
    trail.className = 'particle-trail'
    trail.style.cssText = `
      position: absolute;
      width: 3px;
      height: 3px;
      background: radial-gradient(circle, rgba(0,245,255,0.8), rgba(255,255,255,0.4), transparent);
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      box-shadow: 0 0 6px rgba(0,245,255,0.6);
    `
    element.parentNode?.appendChild(trail)
    
    gsap.set(trail, {
      x: startPos.x,
      y: startPos.y,
      z: imageIndex * 10,
      opacity: 0.8,
      scale: 0.5
    })
    
    // The trajectory follows the picture and moves to the backend
    gsap.to(trail, {
      x: targetPos.x,
      y: targetPos.y,
      z: imageIndex * 10,
      opacity: 0,
      scale: 1.5,
      duration: duration * 0.9,
      ease: "power2.out",
      delay: 0.1,
      onComplete: () => trail.remove()
    })
  }
  
  // Create track points
  for (let i = 0; i < 2; i++) {
    setTimeout(() => createTrail(), i * 300)
  }

  // Create an orbital movement timeline
  const tl = gsap.timeline({
    onComplete: () => {
      console.log(`✅ Orbital movement completed - track${regionIndex} picture${imageIndex} Reached backend dispersion location`)
      
      // Mark animation completed
      markAnimationCompleted()
      
      // Remove this timeline from the array after the animation is complete
      const index = allTimelines.value.indexOf(tl)
      if (index > -1) {
        allTimelines.value.splice(index, 1)
        console.log(`📋 The timeline has been removed from the managed array, leaving${allTimelines.value.length}indivual`)
      }
    }
  })
  
  // Add timeline to admin array
  allTimelines.value.push(tl)
  console.log(`📋 Timeline added to admin array, current total: ${allTimelines.value.length}`)
  
  // Phase 1: Fade in and start moving
  tl.to(element, {
    opacity: opacityMultiplier * 0.7,
    scale: 0.6 * scaleMultiplier,
    duration: 0.5,
    ease: "power2.out"
  })
  
  // Phase 2: Move along the track to the rear dispersion position
  tl.to(element, {
    x: targetPos.x,
    y: targetPos.y,
    z: imageIndex * 10,
    opacity: opacityMultiplier,
    scale: 1.2 * scaleMultiplier,
    duration: duration - 1, // Spend most of the time moving
    ease: "power1.inOut",
    onUpdate: function() {
      const progress = this.progress()
      
      // Trigger to prepare the next batch of data at 30%
      if (progress >= 0.3 && !element.dataset.thirtyPercentTriggered) {
        element.dataset.thirtyPercentTriggered = 'true'
        markThirtyPercentCompleted()
      }
      
      // Remain visible when approaching the backend (do not fade out)
      if (progress >= 0.9) {
        // The final stage remains fully visible, resulting in a decentralized final state
        gsap.set(element, { opacity: opacityMultiplier })
      }
    }
  })
  
  // Stage 3: Remain visible (do not disappear) after reaching the backend position
  tl.to(element, {
    opacity: opacityMultiplier, // remain visible
    scale: 1.0 * scaleMultiplier, // Shrunk slightly to final size
    duration: 0.5,
    ease: "power2.out"
  })
}

// Recalculate when window size changes
const handleResize = () => {
  // Reinitialize animation
  if (animationInstance.value && animationInstance.value.pause) {
    animationInstance.value.pause()
  }
  
  setTimeout(() => {
    initAnimation()
  }, 100)
}

// Monitor props changes and regenerate animations
watch(() => props.images, (newImages, oldImages) => {
  if (newImages && newImages.length > 0 && newImages !== oldImages) {
    console.log('🔄 Detect new image array and regenerate animation', { 
      newCount: newImages.length, 
      oldCount: oldImages?.length || 0 
    })
    
    // Clear all current animations but keep track state
    clearAllAnimations(true) // Pass true to maintain track status
    
    // Regenerate picture data (keep track assignments)
    generateImageData()
    
    // Reinitialize animation after waiting for DOM update
    setTimeout(() => {
      initAnimation()
    }, 100)
  }
}, { deep: true })

// Monitor the changes in the next batch of pictures and update the pre-display
watch(() => props.nextBatchImages, (newNextImages) => {
  if (newNextImages && newNextImages.length > 0) {
    console.log('📥 Receive the next batch of image data', { count: newNextImages.length })
    
    // If 30% has been triggered, display the preview immediately
    if (thirtyPercentTriggered.value) {
      showNextBatchPreview.value = true
      nextBatchPreviewImages.value = [...newNextImages]
      console.log(`👁️ Show an immediate preview of the next batch of images (${newNextImages.length}open)`)
    } else {
      console.log('📋 The next batch of pictures is ready, waiting30%Progress trigger display')
    }
  } else {
    // If the next batch of pictures is cleared, hide the preview
    showNextBatchPreview.value = false
    nextBatchPreviewImages.value = []
    console.log('🙈 Hide next batch of image previews')
  }
}, { deep: true })

onMounted(() => {
  console.log('🎬 CircularImageAnimationComponent is mounted - 4Track centralized to decentralized animation system')
  console.log('📊 Track system configuration:', {
    imageCount: props.imageCount,
    imagesReceived: props.images.length,
    trackCount: 4,
    trackAngles: ['45 degrees', '135 degrees', '225 degrees', '315 degrees'],
    imageSpacing: TRACK_CONFIG.fixedImageSpacing,
    frontEndRadius: TRACK_CONFIG.frontEndRadius,
    backEndRadius: TRACK_CONFIG.backEndRadius
  })
  
  generateImageData()
  
  // Wait for the DOM to update, extending the time to ensure that all elements are rendered.
  setTimeout(() => {
    console.log('🚀 start up4Track centralized to decentralized animation system')
    
    // Verify track configuration
    console.log('🛤️ Track configuration verification:')
    for (let region = 0; region < 4; region++) {
      const regionImages = imagesByRegion.value[region]
      const regionInfo = getRegionName(region)
      console.log(`  track${region}(${regionInfo}): ${regionImages.length}pictures`)
      
      // Verify the orbital position of each image
      for (let i = 0; i < Math.min(3, regionImages.length); i++) {
        const position = calculateTrackPosition(region, i)
        console.log(`    picture${i}: radius${position.radius}px, spacing${TRACK_CONFIG.fixedImageSpacing}px`)
      }
      
      if (regionImages.length > 3) {
        console.log(`    ...the remaining${regionImages.length - 3}pictures`)
      }
    }
    
    // Verify track front vanishing point
    console.log('🎯 track front vanishing point:')
    for (let region = 0; region < 4; region++) {
      const frontEnd = getTrackFrontEndPosition(region)
      const regionInfo = getRegionName(region)
      console.log(`  track${region}(${regionInfo}): (${frontEnd.x.toFixed(1)}, ${frontEnd.y.toFixed(1)})`)
    }
    
    console.log('📝 animation logic: The last picture starts to move first → All images moved from frontend to backend → form a dispersed state')
    
    initAnimation()
  }, 500)
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationInstance.value && animationInstance.value.pause) {
    animationInstance.value.pause()
  }
  
  // Clean all animation timelines
  clearAllAnimations()
  
  window.removeEventListener('resize', handleResize)
  console.log('🔚 CircularImageAnimationComponent has been unloaded and all animations have been cleaned')
})
</script>

<style scoped lang="scss">
.circular-animation-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000000;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  
  // Strengthen 3D perspective settings and support Z-axis advancement effect
  perspective: 1200px; // Increase perspective distance to better display Z-axis hierarchy
  perspective-origin: center center;
  transform-style: preserve-3d;
  
  // Add depth of field blur effect to enhance the sense of Z-axis depth
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.4) 80%);
    z-index: 1;
    pointer-events: none;
  }
}

.circular-background {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80vmin;
  height: 80vmin;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate3d(-50%, -50%, -100px);
  transform-style: preserve-3d;
  
  // Add slight pulsing animation
  animation: backgroundPulse 4s ease-in-out infinite;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 60%;
    height: 60%;
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    transform: translate3d(-50%, -50%, -50px);
    animation: backgroundPulse 6s ease-in-out infinite reverse;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40%;
    height: 40%;
    border: 1px solid rgba(255, 255, 255, 0.03);
    border-radius: 50%;
    transform: translate3d(-50%, -50%, -25px);
    animation: backgroundPulse 8s ease-in-out infinite;
  }
}



// background pulse animation
@keyframes backgroundPulse {
  0%, 100% {
    opacity: 0.6;
    transform: translate3d(-50%, -50%, var(--z-pos, 0)) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate3d(-50%, -50%, var(--z-pos, 0)) scale(1.02);
  }
}



.image-region {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.floating-image {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 6px; // Playing card style rounded corners
  overflow: visible; // Change to visible to avoid being cropped
  transform-style: preserve-3d;
  backface-visibility: visible;
  
  // Enhanced 3D optimization
  will-change: transform, opacity, filter;
  transform-origin: center center; // Make sure scaling is from the center
  z-index: 1; // Set initial level
  
  // Border for debugging to facilitate viewing element position
  border: 1px solid rgba(255, 0, 0, 0.3);
  
  // Playing card style shadow effect
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.4),      // main shadow
    0 0 15px rgba(255, 255, 255, 0.1), // slightly glowing
    inset 0 1px 0 rgba(255, 255, 255, 0.2); // internal highlight
  
  // Depth of field blur effect - a sense of depth based on the Z-axis position, the distant picture is blurred, and the near picture is clear
  filter: blur(0px) brightness(1);
  transition: filter 0.1s ease-out;
  
  // Z-axis advancement effect: refer to the strong sense of depth of field shown in the figure
  &[style*="translateZ(-150px)"], &[style*="translateZ(-270px)"] {
    filter: blur(0.5px) brightness(0.95) contrast(1.05);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.5),
      0 0 20px rgba(255, 255, 255, 0.15);
    transform-origin: center center;
  }
  
  &[style*="translateZ(-390px)"], &[style*="translateZ(-510px)"] {
    filter: blur(1.5px) brightness(0.8) contrast(0.9);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.4),
      0 0 12px rgba(255, 255, 255, 0.08);
    transform-origin: center center;
  }
  
  &[style*="translateZ(-630px)"], &[style*="translateZ(-750px)"] {
    filter: blur(3px) brightness(0.65) contrast(0.7);
    box-shadow: 
      0 1px 4px rgba(0, 0, 0, 0.3),
      0 0 6px rgba(255, 255, 255, 0.04);
    transform-origin: center center;
  }
  
  // Ultra-distant image - mimics the smallest background image in the illustration
  &[style*="translateZ(-870px)"], &[style*="translateZ(-990px)"] {
    filter: blur(4px) brightness(0.5) contrast(0.6);
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
    transform-origin: center center;
  }
  
  // playing card border effect
  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    background: linear-gradient(135deg, 
      rgba(255,255,255,0.3), 
      rgba(255,255,255,0.1), 
      rgba(255,255,255,0.05),
      rgba(255,255,255,0.1)
    );
    border-radius: 7px;
    z-index: -1;
    opacity: 0.6; // Always show slight borders
    transition: opacity 0.3s ease;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 6px; // Playing card rounded corners consistent with container
    pointer-events: auto; // Change to auto to receive mouse events
    cursor: zoom-in; // Magnifying glass style, prompts you to view enlarged pictures
    transition: none; // CSS transitions removed, fully controlled by GSAP
    
    // Enhance the 3D effect of pictures
    backface-visibility: hidden;
    transform-style: preserve-3d;
    
    // Increase picture texture
    box-shadow: inset 0 0 20px rgba(0,0,0,0.3);
    
  }
  
  // Apply different effects according to different transform states
  &[style*="scale(0.1)"], &[style*="scale(0.2)"], &[style*="scale(0.3)"] {
    filter: blur(2px) brightness(0.9);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.05);
  }
  
  &[style*="scale(1."], &[style*="scale(2)"] {
    filter: blur(0px) brightness(1.2);
    box-shadow: 
      0 0 30px rgba(255, 255, 255, 0.3),
      0 0 60px rgba(255, 255, 255, 0.1),
      0 20px 40px rgba(0, 0, 0, 0.8);
    
    &::before {
      opacity: 1;
    }
  }

}

// Particle trajectory effect
.particle-trail {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, 
    rgba(255,255,255,0.9) 0%, 
    rgba(135,206,235,0.6) 50%, 
    transparent 100%
  );
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  transform-style: preserve-3d;
  
  // glow effect
  box-shadow: 
    0 0 10px rgba(255,255,255,0.8),
    0 0 20px rgba(135,206,235,0.4),
    0 0 30px rgba(135,206,235,0.2);
  
  // Trajectory animation
  animation: trailPulse 2s ease-in-out infinite;
}

@keyframes trailPulse {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

// Next batch of pictures pre-display area
.next-batch-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; // Mouse events that do not interfere with the main animation
  z-index: 0; // under main animation
}

// Pre-display image style - six-area default distribution style
.preview-image {
  position: absolute;
  border-radius: 6px; // Same rounded corners as main image
  overflow: hidden;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  
  // Pre-display the background layer effect of the image
  filter: blur(0.5px) brightness(0.5); // Slight blurring and darkening, but does not affect six-area recognition
  will-change: transform, opacity;
  transition: all 0.3s ease;
  
  // Similar but darker shadow effect to the main image
  box-shadow: 
    0 1px 4px rgba(0, 0, 0, 0.4),
    0 0 8px rgba(255, 255, 255, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  // Border effect, maintaining the feeling of playing cards
  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    background: linear-gradient(135deg, 
      rgba(255,255,255,0.08), 
      rgba(255,255,255,0.03), 
      rgba(255,255,255,0.01),
      rgba(255,255,255,0.03)
    );
    border-radius: 7px;
    z-index: -1;
    opacity: 0.4;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 6px;
    pointer-events: none;
    
    // Pre-display image texture - maintain sharpness but reduce brightness
    filter: grayscale(0.2) contrast(0.9) brightness(0.6); // Slightly remove color to maintain image recognition
    opacity: 0.8;
  }
  
  // Slight animation of pre-show image - simulates six-zone default state
  animation: previewPulse 6s ease-in-out infinite;
}

// Pulsing animation for pre-displayed images - six-zone default state feel
@keyframes previewPulse {
  0%, 100% {
    opacity: 0.4;
    transform: translate3d(-50%, -50%, -300px) scale(1);
    filter: blur(0.5px) brightness(0.5);
  }
  33% {
    opacity: 0.6;
    transform: translate3d(-50%, -50%, -280px) scale(1.02);
    filter: blur(0.3px) brightness(0.6);
  }
  66% {
    opacity: 0.5;
    transform: translate3d(-50%, -50%, -290px) scale(1.01);
    filter: blur(0.4px) brightness(0.55);
  }
}

// Motion blur effect (optional, used on high-performance devices)
@media (min-width: 1024px) and (prefers-reduced-motion: no-preference) {
  .floating-image {
    // Add motion blur to fast-moving pictures
    &[style*="scale(1.5)"], &[style*="scale(2)"] {
      filter: blur(0px) brightness(1.2) drop-shadow(0 0 20px rgba(255,255,255,0.3));
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .circular-background {
    width: 90vmin;
    height: 90vmin;
  }
  

  
  .floating-image {
    border-radius: 6px; // Slightly smaller rounded corners on mobile
  }
}

@media (max-width: 480px) {
  .floating-image {
    border-radius: 4px; // Smaller screens and smaller rounded corners
  }
}
</style> 
