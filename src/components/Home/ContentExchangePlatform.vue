<template>
  <div class="content-exchange-platform">
    <!-- Hero Section -->
    <div class="hero-section">
      <div class="hero-content">
        <!-- Left Content -->
        <div class="hero-left">
          <div class="title-container">
            <h1 class="platform-title">
              Redefining Healing <br>
              with Science, AI,<br>
              and Web3
            </h1>
          </div>
          
          <p class="platform-description">
            The launch platform for Bio-AI-Healing projects. Invest,
            experience, and co-create the next era of digital wellness on
            SOLANA Chain.
          </p>
        </div>
        
        <!-- Right Content Display Area -->
        <div class="hero-right">
          <div class="content-display">
            <div class="video-placeholder">
                <img :src="bg" alt="hero-video" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Collections Section -->
    <div class="top-collections">
      <div class="collections-header">
        <span class="collections-title">TOP COLLECTIONS</span>
        <div class="collections-controls">
          <span class="time-filter">30 minutes</span>
                    <div class="chain-filter-group">
            <button class="chain-filter active">ALL CHAINS</button>
            <div class="filter-icons">
                  <SvgIcon 
                    :name="selectedChain === 'bsv' ? 'bsv-active' : 'bsv'" 
                    class="chain-icon" 
                    :class="{ active: selectedChain === 'bsv' }"
                    @click="selectChain('bsv')"
                  />
            </div>
          </div>
          <button class="view-more">VIEW MORE</button>
        </div>
      </div>

      <!-- Collections Table -->
      <div class="collections-table">
        <div class="table-header">
          <div class="col-collection">COLLECTION</div>
          <div class="col-volume">DAY VOLUME</div>
          <div class="col-floor">FLOOR PRICE</div>
          <div class="col-items">ITEMS</div>
          <div class="col-owners">OWNERS</div>
          <div class="col-gallery">GALLERY</div>
        </div>

        <n-virtual-list 
          :item-size="80" 
          :items="collections"
          style="height: 600px; width: 100%;"
          class="virtual-table-list"
        >
          <template #default="{ item, index }">
            <div class="table-row">
              <div class="col-collection">
                <div class="collection-info">
                   <div class="col-rank">{{ item.id }}</div>
                  <div class="collection-avatar">
                    <img :src="item.avatar" :alt="item.name" />
                  </div>
                  <div class="collection-details">
                    <span class="collection-name">{{ item.name }}</span>
                    <SvgIcon name="verified" />
                  </div>
                </div>
              </div>
              <div class="col-volume">
                <span class="volume-amount">{{ item.dayVolume }}</span>
                <span class="volume-change" :class="item.changeClass">{{ item.change }}</span>
              </div>
              <div class="col-floor-th">{{ item.floorPrice }}</div>
              <div class="col-items-th">{{ item.items }}</div>
              <div class="col-owners-th">{{ item.owners }}</div>
                             <div class="col-gallery">
                <div class="gallery-grid">
                  <div 
                    v-for="imgIndex in 6" 
                    :key="imgIndex"
                    class="gallery-item"
                  >
                    <img :src="cname" :alt="`Gallery ${imgIndex}`" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </n-virtual-list>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NVirtualList } from 'naive-ui'
import bg from '@/assets/images/bg.png'
import cname from '@/assets/images/cname.png'
// Selected chain status
const selectedChain = ref<string | null>(null)

// Select chain processing function
const selectChain = (chainName: string) => {
  // If you click on the currently selected chain, uncheck it
  if (selectedChain.value === chainName) {
    selectedChain.value = null
  } else {
    selectedChain.value = chainName
  }
}

// Simulated collectible data
const baseCollections = [
  {id:1, name: 'DUN SHAO', dayVolume: '142 SOL', change: '+10.2%', changeClass: 'positive' },
  {id:2, name: 'XIANGCAI DONG', dayVolume: '98 SOL', change: '+8.5%', changeClass: 'positive' },
  {id:3, name: 'PENGGAOFEI WU', dayVolume: '76 SOL', change: '+6.1%', changeClass: 'positive' },
  {id:4, name: 'SHUAIDA', dayVolume: '65 SOL', change: '-2.3%', changeClass: 'negative' },
  {id:5, name: 'NIKO', dayVolume: '54 SOL', change: '+4.7%', changeClass: 'positive' },
  {id:6, name: 'NIKO', dayVolume: '43 SOL', change: '-1.2%', changeClass: 'negative' },
  {id:7, name: 'JISOSDDE', dayVolume: '32 SOL', change: '+3.4%', changeClass: 'positive' },
  {id:8, name: 'DADADAF', dayVolume: '28 SOL', change: '+2.1%', changeClass: 'positive' },
]

const collections = reactive(
  Array.from({ length: 8 }, (_, index) => {
    const base = baseCollections[index]
    return {
      id: index + 1,
      name: base.name,
      avatar: '',
      dayVolume: base.dayVolume,
      change: base.change,
      changeClass: base.changeClass,
      floorPrice: '5.23 SOL',
      items: '3,525',
      owners: '5,272',
      galleryImages: Array(10).fill('')
    }
  })
)
</script>

<style scoped lang="scss">
.content-exchange-platform {
  width: 100%;
  background: #0a0a0a;
  color: #ffffff;
  padding: 40px 0;
}

// Hero Section
.hero-section {
  margin-bottom: 60px;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: end;
  min-height: 500px;
}

.hero-left {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.title-container {
  position: relative;
  margin-bottom: 32px;
}



.platform-title {

font-style: normal;
font-weight: 700;
font-size: 64px;
line-height: 74px;
text-transform: uppercase;

color: #ffffff;


}



.platform-description {
font-style: normal;
font-weight: 300;
font-size: 24px;
line-height: 28px;
color: #989898;
}

.hero-right {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.content-display {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.video-placeholder {
  width: 100%;
  max-height: 500px;
  height: 100%;
  min-height: 400px;
  background: #2a2a2a;
  border-radius: 16px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #333;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 16px;
  }
}

// Top Collections Section
.top-collections {
  margin-top: 80px;
  width: 100%;
  max-width: none;
}

  .collections-header {
    background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
    border: 1px solid #262626;
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;
    padding: 26px 40px;
    border-bottom: 1px solid #262626;
    width: 100%;
    box-sizing: border-box;
  }

.collections-title {
font-weight: 900;
font-size: 32px;
line-height: 132%;
text-transform: uppercase;
color: #FFFFFF;
}

.collections-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.time-filter {
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
line-height: 140%;
  background: transparent;
  border: 1px solid #3d3d3d;
  border-radius: 48px;
  padding: 16px 51px 16px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #FFFFFF;


  &:hover {
    color: #aaaaaa;
    border-color: #555555;
  }
}

.chain-filter-group {
  display: flex;
  align-items: center;
  background: transparent;
  border: 1px solid #3d3d3d;
  border-radius: 48px;
  padding: 14px 24px;
  gap: 12px;


}

.chain-filter {
  background: transparent;
  color: #00B7FF;
  border: none;
  border-radius: 0;
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 17px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.active {
    color: #00B7FF;
  }
  
  &:hover {
    color: #33CCFF;
  }
}

.filter-icons {
  display: flex;
  gap: 6px;
  align-items: center;
  
  .chain-icon {
    width: 24px;
    height: 24px;
    padding: 4px;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.7;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      opacity: 1;
      transform: scale(1.1);
    }
    
    &.active {
      opacity: 1;
      background: rgba(0, 183, 255, 0.15);
      border: 1px solid #00B7FF;
      transform: scale(1.05);
    }
  }
}



.view-more {
  background: #222222;
  border: 1px solid #333333;
  color: #cccccc;
  padding: 16px 32px 16px 32px;
  border-radius: 48px;
  cursor: pointer;
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #555555;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// Collections Table
.collections-table {
  background: #0a0a0a;
  border-top: none;
  border-radius: 0 0 20px 20px;
  overflow: hidden;
  width: 100%;
  
  // naive-ui virtual list style rewrite
  :deep(.n-virtual-list) {
    width: 100% !important;
    background: transparent !important;
  }
  
  :deep(.n-virtual-list-item) {
    width: 100% !important;
    background: transparent !important;
  }
  
  :deep(.n-scrollbar) {
    background: transparent !important;
  }
  
  .virtual-table-list {
    :deep(.n-virtual-list-item) {
      padding: 0 !important;
      margin: 0 !important;
    }
  }
}

.table-header {
  display: grid;
  grid-template-columns: 1fr 0.8fr 1.2fr 1.2fr 0.8fr 1fr;
  padding: 20px 40px;
  background: transparent;
  border-bottom: 1px solid #262626;
  font-style: normal;
  font-weight: 600;
  font-size: 12px;
  line-height: 15px;
  color: #888E8F;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  width: 100%;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 0.8fr 1.2fr 1.2fr 0.8fr 1fr;
  padding: 20px 40px;
  border-bottom: 1px solid #1a1a1a;
  align-items: center;
  transition: all 0.2s ease;
  background: transparent;
  width: 100%;
  box-sizing: border-box;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.col-rank {
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  color: #888888;
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.collection-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #2a2a2a, #404040);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #333333;
  
  // placeholder style
  &::before {
    content: '👤';
    font-size: 18px;
    color: #666666;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
    
    &[src=""], &:not([src]) {
      display: none;
    }
  }
}

.collection-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collection-name {
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  color: #ffffff;
}

.collection-verified {
  font-size: 16px;
}

.col-volume {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.volume-amount {
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  line-height: 19px;
  color: #ffffff;
}

.volume-change {
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  
  &.positive {
    color: #00D67E;
  }
  
  &.negative {
    color: #FF4747;
  }
}

.col-floor,
.col-items,
.col-gallery,
.col-collection,
.col-volume,
.col-owners {
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  color: #888E8F;
}

.col-floor-th,
.col-items-th,
.col-owners-th {
  font-style: normal;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 4px;
  width: 100%;
  max-width: 400px;
}

.gallery-item {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #2a2a2a, #404040);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #333333;
  transition: all 0.2s ease;
  
  // placeholder style
  &::before {
    content: '🖼';
    font-size: 10px;
    color: #666666;
  }
  
  &:hover {
    transform: scale(1.1);
    border-color: #555555;
    z-index: 10;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    top: 0;
    left: 0;
    
    &[src=""], &:not([src]) {
      display: none;
    }
  }
}

// Responsive design
@media (max-width: 1200px) {
  .content-exchange-platform {
    padding: 30px 0;
  }
  
  .top-collections {
    margin-top: 60px;
  }
  
  .collections-header {
    margin-bottom: 0;
    padding: 20px 40px;
  }
  
  .collections-title {
    font-size: 24px;
    line-height: 29px;
  }
  
  .collections-controls {
    gap: 16px;
  }
  
  .chain-filter-group {
    padding: 6px;
    gap: 8px;
  }
  
  .chain-filter {
    padding: 4px 12px;
    font-size: 13px;
  }
  
  .filter-icons .chain-icon {
    width: 26px;
    height: 26px;
    
    &.active {
      border: 1px solid #00B7FF;
      background: rgba(0, 183, 255, 0.15);
    }
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 260px 180px 140px 140px 140px 1fr;
    padding: 16px 40px;
  }
  
  .table-header {
    font-size: 11px;
  }
  
  .col-rank,
  .collection-name,
  .volume-amount,
  .col-floor,
  .col-items,
  .col-owners {
    font-size: 14px;
    line-height: 17px;
  }
  
  .collection-avatar {
    width: 36px;
    height: 36px;
  }
  
  .gallery-grid {
    width: 300px;
    max-width: 100%;
  }
  
  .gallery-item {
    width: 48px;
    height: 48px;
  }
  
  .platform-title {
    font-size: 36px;
  }
}

@media (max-width: 1024px) {
  .hero-content {
    gap: 40px;
  }
  
  .platform-title {
    font-size: 44px;
  }
}

@media (max-width: 768px) {
  .content-exchange-platform {
    padding: 20px 0;
  }
  
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
    min-height: auto;
  }
  
  .hero-left {
    order: 1;
  }
  
  .hero-right {
    order: 2;
  }
  
  .title-container {
    margin-bottom: 24px;
  }
  
  .platform-title {
    font-size: 36px;
  }
  
  .platform-description {
    font-size: 16px;
    max-width: 100%;
  }
  
  .content-display {
    min-height: 300px;
  }
  
  .video-placeholder {
    min-height: 300px;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 16px;
    }
  }
  
  .top-collections {
    margin-top: 40px;
  }
  
  .collections-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
    padding: 20px;
    margin-bottom: 0;
  }
  
  .collections-title {
    font-size: 22px;
    line-height: 26px;
  }
  
  .collections-controls {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .chain-filter-group {
    padding: 6px;
    gap: 6px;
  }
  
  .chain-filter {
    padding: 4px 10px;
    font-size: 12px;
  }
  
  .filter-icons {
    gap: 4px;
  }
  
  .filter-icons .chain-icon {
    width: 24px;
    height: 24px;
    
    &.active {
      border: 1px solid #00B7FF;
      background: rgba(0, 183, 255, 0.15);
    }
  }
  

  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px 16px;
  }
  
  .table-header > div,
  .table-row > div {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .table-header > div::before,
  .table-row > div::before {
    content: attr(data-label);
    font-weight: 600;
    color: #888;
  }
}

@media (max-width: 480px) {
  .content-exchange-platform {
    padding: 16px 0;
  }
  
  .platform-title {
    font-size: 28px;
    line-height: 1.2;
  }
  
  .platform-description {
    font-size: 14px;
  }
  
  .top-collections {
    margin-top: 32px;
  }
  
  .collections-title {
    font-size: 20px;
    line-height: 24px;
  }
  
  .collections-header {
    padding: 16px;
    margin-bottom: 0;
  }
  
  .collections-controls {
    gap: 8px;
  }
  
  .chain-filter-group {
    padding: 4px;
    gap: 4px;
  }
  
  .chain-filter,
  .view-more {
    padding: 6px 10px;
    font-size: 11px;
  }
  
  .filter-icons .chain-icon {
    width: 20px;
    height: 20px;
    
    &.active {
      border: 1px solid #00B7FF;
      background: rgba(0, 183, 255, 0.15);
    }
  }
  

  
  .table-header,
  .table-row {
    padding: 12px 20px;
  }
  
  .collection-avatar {
    width: 32px;
    height: 32px;
  }
  
  .gallery-grid {
    width: 200px;
  }
  
  .gallery-item {
    width: 32px;
    height: 32px;
  }
}
</style> 