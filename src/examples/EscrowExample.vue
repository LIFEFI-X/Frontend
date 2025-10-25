<template>
  <div class="escrow-example">
    <h2>NFTHosted system demo</h2>
    
    <!-- NFT listing and hosting -->
    <div class="escrow-section">
      <h3>🏪 NFTList hosting</h3>
      <div class="form-group">
        <label>NFT Mintaddress:</label>
        <input 
          v-model="nftMint" 
          placeholder="enterNFTofmintaddress"
          class="input-field"
        />
      </div>
      
      <div class="form-group">
        <label>Shelf price (SOL):</label>
        <input 
          v-model.number="listingPrice" 
          type="number"
          placeholder="0.5"
          step="0.1"
          min="0"
          class="input-field"
        />
      </div>
      
      <button 
        @click="handleEscrowNft"
        :disabled="escrowLoading || !nftMint || !listingPrice"
        class="escrow-btn"
      >
        {{ escrowLoading ? 'Processing...' : '🔒 hostingNFTand put on shelves' }}
      </button>
    </div>
    
    <!-- Hosting information display -->
    <div v-if="escrowResult" class="escrow-info">
      <h3>✅ Hosting successful!</h3>
      <div class="info-item">
        <strong>Hosted wallet address:</strong>
        <code>{{ escrowResult.escrowWallet }}</code>
      </div>
      <div class="info-item">
        <strong>wallet balance:</strong>
        <span>{{ escrowResult.balance }} SOL</span>
      </div>
      <div class="info-item">
        <strong>Transfer transaction:</strong>
        <code>{{ escrowResult.transferSignature }}</code>
      </div>
      <div class="info-item">
        <strong>Airdrop trading:</strong>
        <code>{{ escrowResult.airdropSignature }}</code>
      </div>
    </div>
    
    <!-- NFT release -->
    <div class="release-section">
      <h3>🔓 releaseNFT</h3>
      <button 
        @click="handleReleaseNft"
        :disabled="releaseLoading || !nftMint || !escrowResult"
        class="release-btn"
      >
        {{ releaseLoading ? 'releasing...' : 'releaseNFTReturn to wallet' }}
      </button>
    </div>
    
    <!-- Hosting status query -->
    <div class="status-section">
      <h3>📊 Escrow status</h3>
      <button @click="checkEscrowStatus" class="status-btn">
        Check hosting status
      </button>
      
      <div v-if="escrowStatus" class="status-info">
        <p><strong>Whether to host:</strong> {{ escrowStatus.isEscrowed ? 'yes' : 'no' }}</p>
        <p v-if="escrowStatus.escrowAddress">
          <strong>Escrow address:</strong> {{ escrowStatus.escrowAddress }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSolanaStore } from '@/stores/solana'
import { message } from 'ant-design-vue'

// Store
const solanaStore = useSolanaStore()

// form data
const nftMint = ref('')
const listingPrice = ref(0.5)

// Loading status
const escrowLoading = ref(false)
const releaseLoading = ref(false)

// Result data
const escrowResult = ref<any>(null)
const escrowStatus = ref<any>(null)

// Hosting NFTs
const handleEscrowNft = async () => {
  if (!nftMint.value || !listingPrice.value) {
    message.warning('Please fill in the completeNFTinformation')
    return
  }
  
  try {
    escrowLoading.value = true
    console.log('🏪 Start hostingNFT...')
    
    const result = await solanaStore.createEscrowAndTransferNft({
      nftMint: nftMint.value,
      listingPrice: listingPrice.value
    })
    
    if (result) {
      escrowResult.value = result
      console.log('✅ Hosting successful:', result)
      message.success('NFTHosting successful!')
    }
    
  } catch (error) {
    console.error('❌ Hosting failed:', error)
    message.error('NFTHosting failed')
  } finally {
    escrowLoading.value = false
  }
}

// Release NFT
const handleReleaseNft = async () => {
  if (!nftMint.value) {
    message.warning('Please enterNFTaddress')
    return
  }
  
  try {
    releaseLoading.value = true
    console.log('🔓 Start releasingNFT...')
    
    const result = await solanaStore.releaseNftFromEscrow(nftMint.value)
    
    if (result) {
      console.log('✅ Release successful:', result)
      message.success('NFTRelease successful!')
      escrowResult.value = null // Clear hosting results
    }
    
  } catch (error) {
    console.error('❌ Release failed:', error)
    message.error('NFTRelease failed')
  } finally {
    releaseLoading.value = false
  }
}

// Check hosting status
const checkEscrowStatus = () => {
  if (!nftMint.value) {
    message.warning('Please enterNFTaddress')
    return
  }
  
  escrowStatus.value = solanaStore.getEscrowInfo(nftMint.value)
  console.log('📊 Escrow status:', escrowStatus.value)
}
</script>

<style scoped lang="scss">
.escrow-example {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 12px;
  
  h2 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
  }
  
  h3 {
    color: #555;
    border-bottom: 2px solid #ddd;
    padding-bottom: 10px;
    margin: 20px 0;
  }
}

.escrow-section,
.release-section,
.status-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 15px;
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 600;
    color: #333;
  }
}

.input-field {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
  }
}

.escrow-btn {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.release-btn {
  background: linear-gradient(45deg, #ff9800, #f57c00);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.status-btn {
  background: linear-gradient(45deg, #2196F3, #1976D2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
  }
}

.escrow-info,
.status-info {
  background: #e8f5e8;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  
  h3 {
    color: #2e7d32;
    margin: 0 0 15px 0;
    border: none;
    padding: 0;
  }
}

.info-item {
  margin-bottom: 10px;
  
  strong {
    color: #333;
  }
  
  code {
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    word-break: break-all;
  }
}

.status-info {
  background: #e3f2fd;
  
  p {
    margin: 8px 0;
    color: #1565c0;
  }
}
</style>