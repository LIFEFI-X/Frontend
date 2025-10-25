<template>
  <div class="more-from-collection">
    <div class="section-header">
      <h2 class="section-title">MORE FROM THIS COLLECTION</h2>
      <div class="nav-buttons">
        <button class="nav-btn prev" @click="scrollPrev" :disabled="!canScrollPrev">
          ←
        </button>
        <button class="nav-btn next" @click="scrollNext" :disabled="!canScrollNext">
          →
        </button>
      </div>
    </div>

    <div class="nft-carousel" ref="carouselRef">
      <div class="nft-grid">
        <GlassCard
          v-for="nft in nftList" 
          :key="nft.id"
          :background-image="nft.image"
          height="398px"
          border-radius="16px"
          :hover-effect="true"
          @click="selectNft(nft)"
          class="nft-glass-card"
        >
          <!-- Upper frosted glass layer - Creator information -->
          <template #topOverlay>
            <div class="creator-info">
              <div class="creator-avatar">
                <img :src="nft.creator.avatar" :alt="nft.creator.name" />
              </div>
              <div class="creator-details">
                <span class="creator-name">{{ nft.creator.name }}</span>
                <SvgIcon name="verified" class="verified-icon" v-if="nft.creator.verified" />
              </div>
            </div>
          </template>

          <!-- Lower frosted glass layer - NFT details -->
          <template #bottomOverlay>
            <div class="nft-details">
              <div class="nft-title-section">
                <h4 class="nft-title">{{ nft.name }}</h4>
              </div>
              <div class="nft-price-section">
                <div class="price-info">
                  <span class="price">{{ nft.price }} {{ nft.currency }}</span>
                  <span class="usd-price">${{ nft.usdPrice }}</span>
                </div>
                <button class="cart-btn">
                  <SvgIcon name="cart2" class="cart-icon" />
                </button>
              </div>
            </div>
          </template>
        </GlassCard>
      </div>
    </div>

    <div class="view-more-section">
      <button class="view-more-btn" @click="viewMore">
        VIEW MORE
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import SvgIcon from '@/components/SvgIcon.vue'
import GlassCard from '@/components/GlassCard.vue'
// Import image resources
import nft1 from '@/assets/images/nft/nft1.png'
import nft2 from '@/assets/images/nft/nft2.png'
import nft3 from '@/assets/images/nft/nft3.png'
import t1 from '@/assets/images/t1.png'
import t2 from '@/assets/images/t2.png'
import t3 from '@/assets/images/t3.png'
import y1 from '@/assets/images/y1.png'
import y2 from '@/assets/images/y2.png'
import y3 from '@/assets/images/y3.png'
import y4 from '@/assets/images/y4.png'
import y5 from '@/assets/images/y5.png'
// Props
interface Props {
  collection?: string
}

const props = withDefaults(defineProps<Props>(), {
  collection: 'Fernando'
})

// routing
const router = useRouter()

// Responsive data
const carouselRef = ref<HTMLElement>()
const currentIndex = ref(0)
const canScrollPrev = ref(false)
const canScrollNext = ref(true)

// Create an avatar placeholder
const createAvatarPlaceholder = (name: string) => {
  const colors = ['#ff6b35', '#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1']
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
  const bgColor = colors[name.length % colors.length]
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="${bgColor}" rx="16"/>
      <text x="16" y="22" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="white">
        ${initials}
      </text>
    </svg>
  `)}`
}

// NFT list data
const nftList = ref([
  {
    id: 1,
    name: 'FERDIE #124',
    image: nft1,
    creator: {
      name: 'Fernando',
      avatar: createAvatarPlaceholder('Fernando'),
      verified: true
    },
    price: '3,241',
    currency: 'SOL',
    usdPrice: '1,200'
  },
  {
    id: 2,
    name: 'FERDIE #124',
    image: nft2,
    creator: {
      name: 'Fernando',
      avatar: createAvatarPlaceholder('Fernando'),
      verified: true
    },
    price: '3,241',
    currency: 'SOL',
    usdPrice: '1,200'
  },
  {
    id: 3,
    name: 'FERDIE #124',
    image: y1,
    creator: {
      name: 'Fernando',
      avatar: createAvatarPlaceholder('Fernando'),
      verified: true
    },
    price: '3,241',
    currency: 'SOL',
    usdPrice: '1,200'
  },
  {
    id: 4,
    name: 'FERDIE #124',
    image: y2,
    creator: {
      name: 'Fernando',
      avatar: createAvatarPlaceholder('Fernando'),
      verified: true
    },
    price: '3,241',
    currency: 'SOL',
    usdPrice: '1,200'
  },
  {
    id: 5,
    name: 'FERDIE #124',
    image: y3,
    creator: {
      name: 'Fernando',
      avatar: createAvatarPlaceholder('Fernando'),
      verified: true
    },
    price: '3,241',
    currency: 'SOL',
    usdPrice: '1,200'
  }
])

// method
const scrollPrev = () => {
  if (carouselRef.value && currentIndex.value > 0) {
    currentIndex.value--
    updateCarousel()
  }
}

const scrollNext = () => {
  const maxIndex = Math.max(0, nftList.value.length - 4)
  if (carouselRef.value && currentIndex.value < maxIndex) {
    currentIndex.value++
    updateCarousel()
  }
}

const updateCarousel = () => {
  if (carouselRef.value) {
    const cardWidth = 298 + 24 // GlassCard width + gap
    const scrollLeft = currentIndex.value * cardWidth
    carouselRef.value.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    })
    
    // Update button state
    canScrollPrev.value = currentIndex.value > 0
    canScrollNext.value = currentIndex.value < Math.max(0, nftList.value.length - 4)
  }
}

const selectNft = (nft: any) => {
  console.log('chooseNFT:', nft)
  // Navigate to the NFT details page
  router.push(`/nft/${nft.id}`)
}

const viewMore = () => {
  console.log('View more')
  // Here you can navigate to the collection page
}

onMounted(() => {
  // Initialize scroll state
  updateCarousel()
})
</script>

<style scoped lang="scss">
.more-from-collection {
  padding: 60px 40px 0;
  background: #000000;
  
  @media (max-width: 768px) {
    padding: 40px 20px 0;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  position: relative;
  
  .section-title {
    color: #ffffff;
    font-size: 32px;
    font-weight: bold;
    margin: 0;
    text-transform: uppercase;
    position: relative;
    z-index: 2;
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: calc(100% + 24px);
      width: calc(100vw - 665px);
      height: 1px;
      background: #ffffff;
      transform: translateY(-50%);
    }
    
    @media (max-width: 768px) {
      font-size: 24px;
      
      &::after {
        width: 200px;
        left: calc(100% + 16px);
      }
    }
  }
  
  .nav-buttons {
    display: flex;
    gap: 8px;
    z-index: 2;
    
    .nav-btn {
      width: 40px;
      height: 40px;
      background: transparent;
      border: 1px solid #666666;
      border-radius: 50%;
      color: #666666;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: normal;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: #333333;
        border-color: #ffffff;
        color: #ffffff;
      }
      
      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        border-color: #333333;
        color: #333333;
      }
    }
  }
}

.nft-carousel {
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  
  // Hide scroll bar
  &::-webkit-scrollbar {
    display: none;
  }
  
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.nft-grid {
  display: flex;
  gap: 24px;
  min-width: fit-content;
}

.nft-glass-card {
  width: 298px;
  flex-shrink: 0;
}

// Creator information style (topOverlay)
.creator-info {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .creator-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .creator-details {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .creator-name {
    color: #ffffff;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .verified-icon {
    color: #D3F56E;
    font-size: 16px;
    flex-shrink: 0;
  }
}

// NFT detail style (bottomOverlay)
.nft-details {
  width: 100%;

  .nft-title-section {
    margin-bottom: 12px;
  }

  .nft-title {
    color: #ffffff;
    font-size: 16px;
    font-weight: bold;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nft-price-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .price-info {
      flex: 1;
      
      .price {
        color: #ffffff;
        font-size: 14px;
        font-weight: bold;
        display: block;
      }
      
      .usd-price {
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        display: block;
        margin-top: 2px;
      }
    }
    
    .cart-btn {
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      flex-shrink: 0;
      
      .cart-icon {
        font-size: 14px;
      }
      
      &:hover {
        background: rgba(211, 245, 110, 0.9);
        border-color: rgba(211, 245, 110, 1);
        color: #000000;
        transform: scale(1.1);
      }
    }
  }
}

.view-more-section {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  
  .view-more-btn {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 25px;
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    padding: 12px 32px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    
    // Alternate style when background-filter is not supported
    @supports not (backdrop-filter: blur(10px)) {
      background: #222222;
      border-color: #333333;
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(211, 245, 110, 0.6);
      color: #D3F56E;
      transform: translateY(-2px);
      
      @supports not (backdrop-filter: blur(10px)) {
        background: #333333;
        border-color: #D3F56E;
      }
    }
  }
}

// Responsive design
@media (max-width: 1024px) {
  .nft-glass-card {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
    
    .section-title {
      &::after {
        display: none; // Hide lines on mobile
      }
    }
    
    .nav-buttons {
      align-self: flex-end;
    }
  }
  
  .nft-glass-card {
    width: 250px;
  }
  
  .creator-info {
    .creator-name {
      font-size: 12px;
    }
    
    .verified-icon {
      font-size: 14px;
    }
  }
  
  .nft-details {
    .nft-title {
      font-size: 14px;
    }
    
    .nft-price-section {
      .price-info {
        .price {
          font-size: 12px;
        }
      }
      
      .cart-btn {
        width: 28px;
        height: 28px;
        
        .cart-icon {
          font-size: 12px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .nft-grid {
    gap: 16px;
  }
  
  .nft-glass-card {
    width: 220px;
  }
  
  .creator-info {
    .creator-name {
      font-size: 11px;
    }
    
    .verified-icon {
      font-size: 12px;
    }
  }
}
</style> 