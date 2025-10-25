<template>
  <div class="transfer-nft-demo">
    <h2>NFT Transfer to custodial wallet demo</h2>
    
    <div class="demo-card">
      <h3>transfer NFT to escrow wallet</h3>
      
      <div class="form-group">
        <label>NFT Mint address</label>
        <input 
          v-model="nftMint" 
          placeholder="enter NFT of Mint address"
          class="input-field"
        />
      </div>
      
      <div class="form-group">
        <label>Shelf price (SOL)</label>
        <input 
          v-model.number="listingPrice" 
          type="number"
          step="0.1"
          placeholder="Enter the listing price"
          class="input-field"
        />
      </div>
      
      <button 
        @click="handleTransferToEscrow"
        :disabled="!nftMint || !listingPrice || transferring"
        class="transfer-btn"
      >
        {{ transferring ? 'Transferring...' : 'Transfer to escrow wallet' }}
      </button>
      
      <div v-if="escrowResult" class="result-box">
        <h4>Transfer results</h4>
        <div class="result-item">
          <strong>state:</strong> 
          <span :class="escrowResult.success ? 'success' : 'error'">
            {{ escrowResult.success ? 'success' : 'fail' }}
          </span>
        </div>
        <div v-if="escrowResult.success" class="result-details">
          <div class="result-item">
            <strong>Hosted wallet address:</strong>
            <code>{{ escrowResult.escrowWallet }}</code>
          </div>
          <div class="result-item">
            <strong>Transfer transaction signature:</strong>
            <code>{{ escrowResult.transferSignature }}</code>
          </div>
          <div class="result-item">
            <strong>Airdrop transaction signature:</strong>
            <code>{{ escrowResult.airdropSignature }}</code>
          </div>
          <div class="result-item">
            <strong>Escrow wallet balance:</strong>
            {{ escrowResult.balance }} SOL
          </div>
        </div>
      </div>
    </div>
    
    <div class="info-card">
      <h3>Working principle</h3>
      <ol>
        <li>Generate a new escrow wallet address</li>
        <li>Airdrop to custodial wallet 1 SOL(used to pay transaction fees)</li>
        <li>use Metaplex transferV1 Will NFT Transfer from your wallet to a custodial wallet</li>
        <li>Save custody information for later release</li>
      </ol>
      
      <h3>Key parameter description</h3>
      <ul>
        <li><strong>authority:</strong> Currently connected wallet (NFT owner)</li>
        <li><strong>tokenOwner:</strong> current NFT owner's public key</li>
        <li><strong>destinationOwner:</strong> Hosted wallet’s public key</li>
        <li><strong>tokenStandard:</strong> NFT standard type (NonFungible）</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { useSolanaStore } from '@/stores/solana'
import { useWallet } from 'solana-wallets-vue'

const solanaStore = useSolanaStore()
const { connected } = useWallet()

const nftMint = ref('')
const listingPrice = ref<number>(0)
const transferring = ref(false)
const escrowResult = ref<any>(null)

const handleTransferToEscrow = async () => {
  if (!connected.value) {
    message.error('Please connect the wallet first')
    return
  }
  
  if (!nftMint.value || listingPrice.value <= 0) {
    message.error('Please fill in complete information')
    return
  }
  
  transferring.value = true
  escrowResult.value = null
  
  try {
    // Call the transfer function in the store
    const result = await solanaStore.createEscrowAndTransferNft({
      nftMint: nftMint.value,
      listingPrice: listingPrice.value
    })
    
    escrowResult.value = result
    
    if (result.success) {
      message.success('NFT Successfully transferred to escrow wallet!')
    }
  } catch (error: any) {
    console.error('Transfer failed:', error)
    escrowResult.value = {
      success: false,
      error: error.message
    }
  } finally {
    transferring.value = false
  }
}
</script>

<style scoped>
.transfer-nft-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #14f195;
  margin-bottom: 30px;
  text-align: center;
}

.demo-card, .info-card {
  background: #1e1e1e;
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

h3 {
  color: #9945ff;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #aaa;
  font-weight: 500;
}

.input-field {
  width: 100%;
  padding: 12px;
  background: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
}

.input-field:focus {
  outline: none;
  border-color: #9945ff;
}

.transfer-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(90deg, #9945ff, #14f195);
  color: #121212;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.transfer-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(153, 69, 255, 0.4);
}

.transfer-btn:disabled {
  background: #555;
  cursor: not-allowed;
}

.result-box {
  margin-top: 20px;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 8px;
}

.result-box h4 {
  color: #14f195;
  margin-bottom: 15px;
}

.result-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.result-item code {
  background: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
}

.success {
  color: #14f195;
}

.error {
  color: #ff6b6b;
}

.info-card {
  background: #252525;
}

.info-card ol, .info-card ul {
  padding-left: 20px;
  line-height: 1.8;
}

.info-card li {
  margin-bottom: 8px;
  color: #ccc;
}

.info-card strong {
  color: #14f195;
}
</style>