<template>
  <div v-if="visible" class="offer-modal-overlay" @click="handleOverlayClick">
    <div class="offer-modal" @click.stop>
      <div class="modal-header">
        <h3>Make an Offer</h3>
        <button class="close-btn" @click="close">
          <SvgIcon name="close" />
        </button>
      </div>
      
      <div class="modal-body">
        <div class="nft-info">
          <img :src="nftData?.image" :alt="nftData?.name" class="nft-image" />
          <div class="nft-details">
            <h4>{{ nftData?.name }}</h4>
            <p>{{ nftData?.collection }}</p>
          </div>
        </div>
        
        <div class="offer-input-section">
          <label class="input-label">Your Offer (SOL)</label>
          <div class="input-container">
            <input 
              type="number" 
              v-model="offerAmount" 
              placeholder="0.00"
              step="0.01"
              min="0"
              class="offer-input"
            />
            <span class="currency-label">SOL</span>
          </div>
          <div class="offer-info">
            <div class="info-row">
              <span>Service Fee (2.5%)</span>
              <span>{{ serviceFee }} SOL</span>
            </div>
            <div class="info-row total">
              <span>Total</span>
              <span>{{ totalAmount }} SOL</span>
            </div>
          </div>
        </div>
        
        <div class="expiry-section">
          <label class="input-label">Offer Expiry</label>
          <select v-model="expiryDays" class="expiry-select">
            <option value="1">1 Day</option>
            <option value="3">3 Days</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
          </select>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="cancel-btn" @click="close">Cancel</button>
        <button 
          class="submit-btn" 
          @click="submitOffer"
          :disabled="!offerAmount || offerAmount <= 0 || submitting"
        >
          {{ submitting ? 'Submitting...' : 'Make Offer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import SvgIcon from '@/components/SvgIcon.vue'

interface Props {
  visible: boolean
  nftData?: {
    name: string
    image: string
    collection: string
  }
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: { amount: number, expiryDays: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Responsive data
const offerAmount = ref<number | ''>('')
const expiryDays = ref(7)
const submitting = ref(false)

// Computed properties
const serviceFee = computed(() => {
  if (!offerAmount.value || typeof offerAmount.value !== 'number') return '0.00'
  return (offerAmount.value * 0.025).toFixed(3)
})

const totalAmount = computed(() => {
  if (!offerAmount.value || typeof offerAmount.value !== 'number') return '0.00'
  return (offerAmount.value + parseFloat(serviceFee.value)).toFixed(3)
})

// method
const close = () => {
  emit('close')
}

const handleOverlayClick = (e: Event) => {
  if (e.target === e.currentTarget) {
    close()
  }
}

const submitOffer = async () => {
  if (!offerAmount.value || offerAmount.value <= 0) {
    message.error('Please enter a valid offer amount')
    return
  }
  
  submitting.value = true
  try {
    emit('submit', {
      amount: Number(offerAmount.value),
      expiryDays: expiryDays.value
    })
  } catch (error) {
    console.error('Submit offer error:', error)
  } finally {
    submitting.value = false
  }
}

// Monitor visible changes and reset the form
watch(() => props.visible, (newVal) => {
  if (newVal) {
    offerAmount.value = ''
    expiryDays.value = 7
    submitting.value = false
  }
})
</script>

<style scoped lang="scss">
.offer-modal-overlay {
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
  padding: 20px;
  box-sizing: border-box;
}

.offer-modal {
  background: #111111;
  border-radius: 16px;
  border: 1px solid #333333;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  color: #ffffff;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  
  h3 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    color: #ffffff;
  }
  
  .close-btn {
    background: none;
    border: none;
    color: #999999;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
    
    &:hover {
      background: #222222;
      color: #ffffff;
    }
  }
}

.modal-body {
  padding: 24px;
}

.nft-info {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid #333333;
  
  .nft-image {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
  }
  
  .nft-details {
    flex: 1;
    
    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #ffffff;
    }
    
    p {
      font-size: 14px;
      color: #999999;
      margin: 0;
    }
  }
}

.offer-input-section {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 8px;
}

.input-container {
  position: relative;
  margin-bottom: 16px;
  
  .offer-input {
    width: 100%;
    background: #222222;
    border: 1px solid #333333;
    border-radius: 8px;
    padding: 16px 60px 16px 16px;
    color: #ffffff;
    font-size: 18px;
    font-weight: 500;
    box-sizing: border-box;
    
    &::placeholder {
      color: #666666;
    }
    
    &:focus {
      outline: none;
      border-color: #D3F56E;
    }
  }
  
  .currency-label {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #999999;
    font-size: 14px;
    font-weight: 500;
  }
}

.offer-info {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #333333;
  
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    font-size: 14px;
    color: #cccccc;
    
    &.total {
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid #333333;
      font-weight: 600;
      color: #ffffff;
      font-size: 16px;
    }
  }
}

.expiry-section {
  margin-bottom: 24px;
  
  .expiry-select {
    width: 100%;
    background: #222222;
    border: 1px solid #333333;
    border-radius: 8px;
    padding: 12px 16px;
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: #D3F56E;
    }
    
    option {
      background: #222222;
      color: #ffffff;
    }
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px 24px;
  
  .cancel-btn {
    flex: 1;
    background: transparent;
    border: 1px solid #333333;
    border-radius: 8px;
    color: #cccccc;
    font-size: 16px;
    font-weight: 500;
    padding: 12px 24px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: #222222;
      border-color: #555555;
      color: #ffffff;
    }
  }
  
  .submit-btn {
    flex: 1;
    background: #D3F56E;
    border: none;
    border-radius: 8px;
    color: #000000;
    font-size: 16px;
    font-weight: 600;
    padding: 12px 24px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover:not(:disabled) {
      background: #B8E348;
    }
    
    &:disabled {
      background: #666666;
      color: #999999;
      cursor: not-allowed;
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .offer-modal-overlay {
    padding: 12px;
  }
  
  .modal-header {
    padding: 20px 20px 0 20px;
    
    h3 {
      font-size: 20px;
    }
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .modal-footer {
    padding: 0 20px 20px 20px;
    flex-direction: column;
    
    .cancel-btn,
    .submit-btn {
      width: 100%;
    }
  }
  
  .nft-info {
    .nft-image {
      width: 56px;
      height: 56px;
    }
    
    .nft-details {
      h4 {
        font-size: 14px;
      }
      
      p {
        font-size: 12px;
      }
    }
  }
}
</style>