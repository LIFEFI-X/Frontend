<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h2>Place Bid</h2>
        <button class="close-btn" @click="$emit('close')">
          <SvgIcon name="close" />
        </button>
      </div>
      
      <div class="modal-content">
        <div class="nft-info">
          <img :src="nftData.image" :alt="nftData.name" class="nft-thumbnail" />
          <div class="nft-details">
            <h3>{{ nftData.name }}</h3>
            <p>{{ nftData.collection }}</p>
          </div>
        </div>
        
        <div class="bid-form">
          <div class="form-group">
            <label>Bid Amount</label>
            <div class="input-group">
              <input 
                v-model.number="bidAmount" 
                type="number" 
                step="0.001"
                min="0"
                placeholder="0.0"
                class="bid-input"
              />
              <span class="currency">SOL</span>
            </div>
            <div class="usd-estimate" v-if="bidAmount">
              ≈ ${{ usdEstimate.toLocaleString() }}
            </div>
          </div>
          
          <div class="form-group">
            <label>Expiration</label>
            <select v-model="expiryDays" class="expiry-select">
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>
          
          <div class="bid-summary">
            <div class="summary-row">
              <span>Your bid</span>
              <span>{{ bidAmount || 0 }} SOL</span>
            </div>
            <div class="summary-row">
              <span>Service fee (2.5%)</span>
              <span>{{ serviceFee }} SOL</span>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <span>{{ totalAmount }} SOL</span>
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              class="cancel-btn" 
              @click="$emit('close')"
              :disabled="loading"
            >
              Cancel
            </button>
            <button 
              class="submit-btn" 
              @click="handleSubmit"
              :disabled="!canSubmit || loading"
            >
              <span v-if="loading">Placing Bid...</span>
              <span v-else>Place Bid</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import SvgIcon from './SvgIcon.vue'

// Props
interface Props {
  visible: boolean
  nftData: {
    name: string
    image: string
    collection: string
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  close: []
  submit: [data: { amount: number, expiryDays: number }]
}>()

// Responsive data
const bidAmount = ref<number>(0)
const expiryDays = ref<number>(7)

// Computed properties
const serviceFee = computed(() => {
  return bidAmount.value * 0.025 // 2.5% service fee
})

const totalAmount = computed(() => {
  return bidAmount.value + serviceFee.value
})

const usdEstimate = computed(() => {
  // Assume 1 SOL = $100 for estimate (in real app, get from API)
  return bidAmount.value * 100
})

const canSubmit = computed(() => {
  return bidAmount.value > 0 && expiryDays.value > 0
})

// method
const handleOverlayClick = () => {
  emit('close')
}

const handleSubmit = () => {
  if (!canSubmit.value) return
  
  emit('submit', {
    amount: bidAmount.value,
    expiryDays: expiryDays.value
  })
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: #1a1a1a;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #333;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #333;
  
  h2 {
    color: #ffffff;
    font-size: 24px;
    font-weight: 600;
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #999;
    font-size: 24px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      color: #fff;
      background: #333;
    }
  }
}

.modal-content {
  padding: 24px;
}

.nft-info {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  padding: 16px;
  background: #0f0f0f;
  border-radius: 12px;
  border: 1px solid #333;
  
  .nft-thumbnail {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
  }
  
  .nft-details {
    flex: 1;
    
    h3 {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    
    p {
      color: #999;
      font-size: 14px;
      margin: 0;
    }
  }
}

.bid-form {
  .form-group {
    margin-bottom: 24px;
    
    label {
      display: block;
      color: #ffffff;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .input-group {
      position: relative;
      
      .bid-input {
        width: 100%;
        background: #0f0f0f;
        border: 1px solid #333;
        border-radius: 12px;
        padding: 16px 60px 16px 16px;
        color: #ffffff;
        font-size: 18px;
        font-weight: 500;
        transition: all 0.2s ease;
        
        &:focus {
          outline: none;
          border-color: #FFFFFF;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
        }
        
        &::placeholder {
          color: #666;
        }
      }
      
      .currency {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: #999;
        font-size: 16px;
        font-weight: 500;
      }
    }
    
    .usd-estimate {
      margin-top: 8px;
      color: #999;
      font-size: 14px;
    }
    
    .expiry-select {
      width: 100%;
      background: #0f0f0f;
      border: 1px solid #333;
      border-radius: 12px;
      padding: 16px;
      color: #ffffff;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:focus {
        outline: none;
        border-color: #FFFFFF;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
      }
      
      option {
        background: #1a1a1a;
        color: #ffffff;
      }
    }
  }
}

.bid-summary {
  background: #0f0f0f;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid #333;
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &.total {
      border-top: 1px solid #333;
      padding-top: 12px;
      font-weight: 600;
      font-size: 18px;
    }
    
    span:first-child {
      color: #999;
    }
    
    span:last-child {
      color: #ffffff;
      font-weight: 500;
    }
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  
  button {
    flex: 1;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .cancel-btn {
    background: transparent;
    color: #999;
    border: 1px solid #333;
    
    &:hover:not(:disabled) {
      background: #333;
      color: #ffffff;
    }
  }
  
  .submit-btn {
    background: #FFFFFF;
    color: #000;
    
    &:hover:not(:disabled) {
      background: #FFFFFF;
      transform: translateY(-1px);
    }
    
    &:disabled {
      background: #666;
      color: #999;
      transform: none;
    }
  }
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header,
  .modal-content {
    padding: 16px;
  }
  
  .nft-info {
    flex-direction: column;
    text-align: center;
    
    .nft-thumbnail {
      align-self: center;
    }
  }
}
</style>
