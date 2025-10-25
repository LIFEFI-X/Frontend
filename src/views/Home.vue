<template>
    <AigcHeader />
    <div class="home-container">
      <!-- Main interface of AIGC content exchange platform -->
      <ContentExchangePlatform />
      
      <!-- Best collection display -->
      <BestCollections />
      
     
      
      <!-- Keep the original card animation component as a supplementary display -->
      <StickyCardsAnimation
      style="margin-bottom: 40px"
        ref="stackedCardsRef"
        :images="demoImages"
        :animationDuration="4"
        :autoStart="true"
        :loop="true"
        :loopDelay="2"
        :triggerStart="'top 80%'"
        :triggerEnd="'bottom 20%'"
        :showMarkers="showMarkers"
        @animationStart="handleAnimationStart"
        @animationUpdate="handleAnimationUpdate"
        @animationComplete="handleAnimationComplete"
      />

       <!-- NFT learning card display -->
      <!-- <LearnNft /> -->
      <Footer/>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import AigcHeader from '@/components/AigcHeader.vue'
import StickyCardsAnimation from '@/components/Home/StickyCardsAnimation.vue'
import ContentExchangePlatform from '@/components/Home/ContentExchangePlatform.vue'
import BestCollections from '@/components/Home/BestCollections.vue'
// import LearnNft from '@/components/Home/LearnNft.vue'
import Footer from '@/components/Footer.vue'
// Import image resources
import herobgImg from '@/assets/images/herobg.png'
import lyImg from '@/assets/images/ly.png'
import peoImg from '@/assets/images/peo.png'
import pmImg from '@/assets/images/pm.png'
import t1Img from '@/assets/images/t1.png'
import t2Img from '@/assets/images/t2.png'
import t3Img from '@/assets/images/t3.png'

// component reference
const stackedCardsRef = ref<InstanceType<typeof StickyCardsAnimation>>()

// Status management
const isScrolling = ref(false)
const scrollProgress = ref(0)
const showMarkers = ref(false)

// Demo image data (limited to 6 images, matching original files)
const demoImages = reactive([
  { url: herobgImg, alt: 'Hero Background', content: 'X01-842' },
  { url: lyImg, alt: 'LY Image', content: 'V9-372K' },
  { url: peoImg, alt: 'People Image', content: 'Z84-Q17' },
  { url: pmImg, alt: 'PM Image', content: 'L56-904' },
  { url: t1Img, alt: 'Template 1', content: 'A23-7P1' },
  { url: t2Img, alt: 'Template 2', content: 'T98-462' }
])

// event handler
const handleAnimationStart = () => {
  console.log('🎬 Animation starts')
  isScrolling.value = true
}

const handleAnimationUpdate = (progress: number) => {
  scrollProgress.value = progress
}

const handleAnimationComplete = () => {
  console.log('✅ Animation completed')
  isScrolling.value = false
}


</script>

<style scoped lang="scss">
.home-container {
  width: 100%;
  min-height: 100vh;
  background: #0a0a0a;
  box-sizing: border-box;
  
  // Leave 72px space for fixed Header to avoid content being blocked
  padding-top: 72px;
  padding-left: 40px;
  padding-right: 40px;
  // Ensure proper spacing between components
  > * + * {
    margin-top: 80px;
  }
}

// Dark theme global style
:deep(.content-exchange-platform) {
  margin: 0;
}

:deep(.best-collections) {
  margin: 0;
}

:deep(.learn-nft) {
  margin: 0;
}

// Responsive design
@media (max-width: 768px) {
  .home-container {
    padding-top: 72px; // Keep the same Header height on the mobile terminal
    padding-left: 0;
    padding-right: 0;
    
    > * + * {
      margin-top: 40px;
    }
  }
}
</style>