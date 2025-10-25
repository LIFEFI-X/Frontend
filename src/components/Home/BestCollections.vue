<template>
  <div class="best-collections">
    <div class="section-header">
        <SvgIcon name="best-collections" class="section-title"/>
        <div class="header-line"></div>
    </div>
    
    <div class="collections-grid">
      <GlassCard 
        v-for="(collection, index) in collections" 
        :key="collection.id"
        :background-image="collection.backgroundImage"
        height="422px"
        border-radius="20px"
        :hover-effect="true"
        class="collection-glass-card"
      >
        <!-- Upper frosted glass information layer - user information -->
        <template #topOverlay>
          <div class="user-info">
            <div class="user-avatar">
              <img :src="collection.userAvatar" :alt="collection.userName" />
            </div>
            <div class="user-details">
              <h3 class="user-name">{{ collection.userName }}</h3>
              <p class="user-id">{{ collection.userId }}</p>
            </div>
            <button class="follow-btn">Follow</button>
          </div>
        </template>
        
        <!-- Lower frosted glass information layer - work information and statistics -->
        <template #bottomOverlay>
          <div class="stats-container">
            <div class="stat-row">
              <div class="stat-item left">
                <div class="artwork-title">
                  <h4>{{ collection.artworkTitle }}</h4>
                  <SvgIcon name="verified" class="verified-icon" />
                </div>
                <span class="stat-label-only">COIN NAME</span>
              </div>
              <div class="stat-item center">
                <span class="stat-value">{{ collection.floorPrice }}</span>
                <span class="stat-label">FLOOR</span>
              </div>
              <div class="stat-item right">
                <span class="stat-value">{{ collection.totalVolume }}</span>
                <span class="stat-label">TOTAL VOLUME</span>
              </div>
            </div>
          </div>
        </template>
      </GlassCard>
    </div>
    
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import GlassCard from '@/components/GlassCard.vue'

// Import image resources
import herobgImg from '@/assets/images/y5.png'
import lyImg from '@/assets/images/t1.png'
import peoImg from '@/assets/images/y3.png'
import pmImg from '@/assets/images/y4.png'

// simulated data
const collections = reactive([
  {
    id: 1,
    userName: 'ALEXANDRA JACKSON',
    userId: 'ID:3131341413',
    userAvatar: peoImg,
    backgroundImage: herobgImg,
    artworkTitle: 'SHAOLIN',
    floorPrice: '0.8ETH',
    totalVolume: '66ETH'
  },
  {
    id: 2,
    userName: 'DAVID CHEN',
    userId: 'ID:2987654321',
    userAvatar: pmImg,
    backgroundImage: lyImg,
    artworkTitle: 'HORIZON',
    floorPrice: '1.2ETH',
    totalVolume: '89ETH'
  },
  {
    id: 3,
    userName: 'SARAH WILLIAMS',
    userId: 'ID:4567891234',
    userAvatar: peoImg,
    backgroundImage: peoImg,
    artworkTitle: 'SHADOWS',
    floorPrice: '0.9ETH',
    totalVolume: '74ETH'
  },
  {
    id: 4,
    userName: 'MIKE TAYLOR',
    userId: 'ID:7890123456',
    userAvatar: pmImg,
    backgroundImage: pmImg,
    artworkTitle: 'SKYLINE',
    floorPrice: '1.5ETH',
    totalVolume: '125ETH'
  }
])
</script>

<style scoped lang="scss">
.best-collections {
  width: 100%;
  padding: 19px 21px;
 background: rgba(187, 187, 187, 0.2);
 border-radius: 10px;
  color: #ffffff;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 13px;
}

.section-title {
    width:229px;
    height:84px;
  margin: 0;
  text-align: center;
  flex-shrink: 0;
}

.header-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 1px;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

// Collection Glass Card Style
.collection-glass-card {
  // Inherit all styles of GlassCard
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #2a2a2a, #404040);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  font-size: 13px;
  line-height: 120%;
  color: #FFFFFF;
  margin: 0 0 2px 0;
}

.user-id {
  font-weight: 400;
  font-size: 10px;
  line-height: 120%;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.follow-btn {


box-sizing: border-box;



background: linear-gradient(98.99deg, rgba(254, 254, 254, 0.325) 0%, rgba(0, 0, 0, 0.4355) 100%);
border-radius: 16.0731px;

  border:none;
  color: #FFFFFF;
  padding: 6px 14px;

  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  white-space: nowrap;
  
  &:hover {
    background: rgba(255, 255, 255, 0.35);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
  }
  
  // Alternate style
  @supports not (backdrop-filter: blur(10px)) {
    background: rgba(0, 0, 0, 0.6);
    
    &:hover {
      background: rgba(0, 0, 0, 0.8);
    }
  }
}

.artwork-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  
  h4 {
    font-weight: 700;
    font-size: 22px;
    line-height: 120%;
    color: #FFFFFF;
    margin: 0;
    font-style: italic;
  }
}

.verified-icon {
  width: 18px;
  height: 18px;
  color: #00B7FF;
}

.stats-container {
  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    &.left {
      align-items: flex-start;
      justify-content: flex-end;
      flex: 0 0 auto;
    }
    
    &.center {
      align-items: center;
      text-align: center;
      flex: 1;
    }
    
    &.right {
      align-items: flex-end;
      text-align: right;
      flex: 1;
    }
  }
}

.stat-label {
  font-weight: 400;
  font-size: 9px;
  line-height: 120%;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  order: 2;
}

.stat-label-only {
  font-weight: 400;
  font-size: 9px;
  line-height: 120%;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-weight: 600;
  font-size: 13px;
  line-height: 120%;
  color: #FFFFFF;
  order: 1;
}

.pagination-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 500;
}

.current-page {
  color: #00B7FF;
}

.divider {
  color: rgba(255, 255, 255, 0.5);
}

.total-pages {
  color: rgba(255, 255, 255, 0.7);
}

// Responsive design
@media (max-width: 1200px) {
  .collections-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  
  .collection-glass-card {
    height: 380px;
  }
  
  .section-title {
    width: 200px;
    height: 72px;
  }
}

@media (max-width: 768px) {
  .best-collections {
    padding: 60px 0;
  }
  
  .collections-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .collection-glass-card {
    height: 380px;
  }
  
  .section-title {
    width: 180px;
    height: 64px;
  }
  
  .stats-container .stat-row {
    gap: 8px;
  }
  
  .stat-value {
    font-size: 11px;
  }
  
  .stat-label {
    font-size: 8px;
  }
  
  .stat-label-only {
    font-size: 8px;
  }
  
  .artwork-title {
    margin-bottom: 6px;
    
    h4 {
      font-size: 18px;
    }
  }
  
  .section-header {
    gap: 12px;
  }
  
  .header-line {
    height: 1.5px;
  }
}

@media (max-width: 480px) {
  .best-collections {
    padding: 40px 0;
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .collection-glass-card {
    height: 350px;
  }
  
  .section-title {
    width: 160px;
    height: 56px;
  }
  
  .artwork-title h4 {
    font-size: 16px;
  }
  
  .stats-container .stat-row {
    gap: 6px;
  }
  
  .stat-value {
    font-size: 10px;
  }
  
  .stat-label {
    font-size: 7px;
  }
  
  .stat-label-only {
    font-size: 7px;
  }
  
  .artwork-title {
    margin-bottom: 4px;
    
    h4 {
      font-size: 16px;
    }
  }
}
</style> 