<template>
  <div class="learn-nft">
    <div class="section-header">
      <h2 class="section-title">LEARN NFT</h2>
      <div class="header-line"></div>
    </div>
    
    <div class="nft-cards-grid">
      <div 
        v-for="(card, index) in nftCards" 
        :key="card.id"
        class="nft-card-container"
      >
        <!-- green card area -->
        <div class="nft-card">
          <div class="card-content">
            <div class="card-image">
              <img :src="card.image" :alt="card.title" />
            </div>
            <h3 class="card-title">{{ card.title }}</h3>
          </div>
        </div>
        
        <!-- Card external information area -->
        <div class="card-info">
          <div class="card-bottom">
            <p class="card-description">{{ card.description }}</p>
            <button class="read-more-btn">
              READ MORE
              <span class="btn-icon">+</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="learn-more-section">
      <button class="learn-more-btn">LEARN MORE</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

// Import NFT images
import nft1Img from '@/assets/images/nft/nft1.png'
import nft2Img from '@/assets/images/nft/nft2.png'
import nft3Img from '@/assets/images/nft/nft3.png'

// NFT card data
const nftCards = reactive([
  {
    id: 1,
    title: 'WHAT IS IT',
    description: 'What is LiFEFi Coin?',
    image: nft1Img
  },
  {
    id: 2,
    title: 'CRYPTO WALLET',
    description: 'What is a crypto wallet?',
    image: nft2Img
  },
  {
    id: 3,
    title: 'NFT COLLECTION',
    description: 'How to make the most of your NFT collection?',
    image: nft3Img
  }
])
</script>

<style scoped lang="scss">
.learn-nft {
  width: 100%;
  padding: 80px 0;
  background: #0a0a0a;
  color: #ffffff;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.section-title {
  font-weight: 900;
  font-size: 48px;
  line-height: 120%;
  color: #FFFFFF;
  margin: 0;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.header-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 1px;
}

.nft-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

.nft-card-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    .nft-card {
      transform: translateY(-8px);
      box-shadow: 0 20px 40px rgba(154, 255, 154, 0.3);
    }
  }
}

.nft-card {
  position: relative;
  background: linear-gradient(135deg, #9AFF9A 0%, #7FD97F 100%);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 280px;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  text-align: center;
}

.card-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  
  img {
    max-width: 70%;
    max-height: 120px;
    object-fit: contain;
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.2));
  }
}

.card-title {
  font-weight: 900;
  font-size: 24px;
  line-height: 120%;
  color: #000000;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 0;
}

.card-description {
  font-weight: 400;
  font-size: 14px;
  line-height: 140%;
  color: #FFFFFF;
  margin: 0;
  flex: 1;
}

.read-more-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.8);
  color: #FFFFFF;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.05);
  }
  
  .btn-icon {
    font-size: 14px;
    font-weight: bold;
  }
}

.learn-more-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.learn-more-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #FFFFFF;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  padding: 12px 32px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 255, 255, 0.1);
  }
}

// Responsive design
@media (max-width: 1200px) {
  .nft-cards-grid {
    gap: 20px;
  }
  
  .nft-card-container {
    gap: 14px;
  }
  
  .nft-card {
    height: 260px;
  }
  
  .card-title {
    font-size: 22px;
  }
  
  .card-description {
    font-size: 13px;
  }
  
  .card-image {
    margin-bottom: 18px;
  }
}

@media (max-width: 768px) {
  .learn-nft {
    padding: 60px 0;
  }
  
  .section-title {
    font-size: 36px;
  }
  
  .section-header {
    gap: 12px;
    margin-bottom: 30px;
  }
  
  .header-line {
    height: 1.5px;
  }
  
  .nft-cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 30px;
  }
  
  .nft-card-container {
    gap: 12px;
  }
  
  .nft-card {
    height: 240px;
  }
  
  .card-content {
    padding: 20px;
  }
  
  .card-title {
    font-size: 20px;
  }
  
  .card-description {
    font-size: 12px;
  }
  
  .card-image {
    margin-bottom: 16px;
  }
  
  .read-more-btn {
    padding: 6px 12px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .learn-nft {
    padding: 40px 0;
  }
  
  .section-title {
    font-size: 28px;
  }
  
  .section-header {
    gap: 8px;
    margin-bottom: 24px;
  }
  
  .header-line {
    height: 1px;
  }
  
  .nft-card-container {
    gap: 10px;
  }
  
  .nft-card {
    height: 220px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .card-title {
    font-size: 18px;
  }
  
  .card-image {
    margin-bottom: 16px;
    
    img {
      max-height: 100px;
    }
  }
  
  .learn-more-btn {
    padding: 10px 24px;
    font-size: 14px;
  }
}
</style> 