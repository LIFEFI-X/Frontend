<template>
  <div class="create-nft-page">
    <!-- head -->
    <AigcHeader />
    
    <!-- main content area -->
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">CREATE NFT</h1>
        </div>
        
        <div class="content-wrapper">
          <!-- left form area -->
          <div class="form-section">
            <!-- Wallet selection -->
            <!-- <div class="wallet-section">
              <h3 class="section-title">CHOOSE WALLET</h3>
              <a-select 
                v-model:value="formData.wallet"
                placeholder="Select wallet"
                class="wallet-select"
              >
                <a-select-option value="metamask">
                  <div class="wallet-option">
                    <span class="wallet-icon">🦊</span>
                    <span>MetaMask</span>
                  </div>
                </a-select-option>
                <a-select-option value="phantom">
                  <div class="wallet-option">
                    <span class="wallet-icon">👻</span>
                    <span>Phantom</span>
                  </div>
                </a-select-option>
              </a-select>
            </div> -->
            
            <!-- File upload -->
            <div class="upload-section">
              <h3 class="section-title">UPLOAD FILE</h3>
              <FileUpload 
                v-model="formData.file as any"
                accept=".png,.gif,.webp,.jpg,.jpeg,.mp4,.mov"
                :max-size="200"
                title="CHOOSE FILE"
                subtitle="PNG, GIF, WEBP, MP4. Max 200 MB"
                class="main-upload"
                :autoUpload="true"
                :showUploadBtn="true"
                @upload-success="handleFileUploadSuccess as any"
                @upload-error="handleFileUploadError"
              />
            </div>
            
            <!-- NFT form -->
            <a-form 
              :model="formData" 
              :rules="rules" 
              ref="formRef"
              layout="vertical"
              class="nft-form"
            >
              <!-- Display Name -->
              <a-form-item 
                label="DISPLAY NAME (REQUIRED)" 
                name="displayName"
                class="form-item"
              >
                <a-input 
                  v-model:value="formData.displayName"
                  placeholder="Name"
                  class="form-input"
                />
              </a-form-item>
              
              <!-- Description -->
              <a-form-item 
                label="DESCRIPTION" 
                name="description"
                class="form-item"
              >
                <a-textarea 
                  v-model:value="formData.description"
                  placeholder="Spread some words about your token collection"
                  :rows="4"
                  class="form-textarea"
                />
              </a-form-item>
              
              <!-- Collection -->
              <a-form-item 
                label="COLLECTION" 
                name="collection"
                class="form-item"
              >
                <a-select 
                  v-model:value="formData.collection"
                  placeholder="Choose the collection"
                  class="form-select"
                >
                  <!-- If there is a Collection passed from CreateCollection, it will be displayed first. -->
                  <a-select-option 
                    v-if="formData.collectionMint" 
                    :value="formData.collectionMint"
                  >
                    📦 {{ formData.collectionName }} (Just Created)
                  </a-select-option>
                  <!-- Default options -->
                  <a-select-option value="art-collection">Art Collection</a-select-option>
                  <a-select-option value="music-collection">Music Collection</a-select-option>
                  <a-select-option value="gaming-collection">Gaming Collection</a-select-option>
                </a-select>
              </a-form-item>
              
              <!-- Properties -->
              <div class="properties-section">
                <h3 class="section-title">PROPERTIES</h3>
                <div class="properties-grid">
                  <a-form-item name="background" class="property-item">
                    <a-input 
                      v-model:value="formData.properties.background"
                      placeholder="Background"
                      class="form-input"
                    />
                  </a-form-item>
                  <a-form-item name="name" class="property-item">
                    <a-input 
                      v-model:value="formData.properties.name"
                      placeholder="Enter name"
                      class="form-input"
                    />
                  </a-form-item>
                </div>
              </div>
              
              <!-- Put on Marketplace -->
              <div class="marketplace-section">
                <h3 class="section-title">PUT ON MARKETPLACE</h3>
                <a-radio-group 
                  v-model:value="formData.marketplaceType" 
                  class="marketplace-radio"
                >
                  <a-radio value="fixed" class="radio-button">FIXED PRICE</a-radio>
                  <a-radio value="auction" class="radio-button">TIME AUCTION</a-radio>
                </a-radio-group>
              </div>
              
              <!-- Price -->
              <a-form-item 
                label="PRICE" 
                name="price"
                class="form-item"
              >
                <a-input-number 
                  v-model:value="formData.price"
                  placeholder="Enter price"
                  :min="0"
                  :step="0.01"
                  class="price-input"
                  addon-after="SOL"
                />
              </a-form-item>
              
              <!-- Fee Information -->
              <div class="fee-section">
                <div class="fee-row">
                  <span class="fee-label">Fee</span>
                  <span class="fee-value">1%</span>
                </div>
                <div class="fee-row highlight">
                  <span class="fee-label">You will receive</span>
                  <span class="fee-value">{{ calculateReceiveAmount }} SOL</span>
                </div>
              </div>
              
              <!-- Date of Listing Expiration -->
              <a-form-item 
                label="DATE OF LISTING EXPIRATION" 
                name="expirationDate"
                class="form-item"
              >
                <div class="expiration-wrapper">
                  <a-select 
                    v-model:value="formData.expirationDays"
                    class="expiration-select"
                  >
                    <a-select-option value="3">3 days</a-select-option>
                    <a-select-option value="7">7 days</a-select-option>
                    <a-select-option value="14">14 days</a-select-option>
                    <a-select-option value="30">30 days</a-select-option>
                  </a-select>
                  <a-date-picker 
                  style="color: #fff !important;"
                    v-model:value="formData.expirationDate as any"
                    placeholder="Feb 15, 2023"
                    class="expiration-date"
                  />
                </div>
              </a-form-item>

              <!-- Action button -->
              <div class="form-actions">
                <a-button 
                  size="large"
                  :loading="loading"
                  :disabled="!uploadedFileData"
                  @click="handleCreateNft"
                  class="create-btn"
                >
                  CREATE AN ITEM
                </a-button>
                <a-button 
                  size="large"
                  @click="handleDraft"
                  class="draft-btn"
                >
                  MAKE A DRAFT
                </a-button>
                <a-button 
                  size="large"
                  @click="handleCancel"
                  class="cancel-btn"
                >
                  CANCEL
                </a-button>
              </div>
            </a-form>
          </div>
          
          <!-- Preview area on the right -->
          <div class="preview-section">
            <h3 class="section-title">PREVIEW</h3>
            <div class="preview-card">
              <div class="preview-image">
                <img 
                  v-if="previewUrl" 
                  :src="previewUrl" 
                  :alt="formData.displayName || 'NFT Preview'"
                  class="nft-image"
                />
                <div v-else class="placeholder">
                  <span>Upload file and choose collection to see preview your brand new NFT</span>
                </div>
              </div>
              <div class="preview-info">
                <div class="nft-name">{{ formData.displayName || 'NFT Name' }}</div>
                <div class="nft-price" v-if="formData.price">{{ formData.price }} SOL</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- bottom -->
    <Footer />
    
    <!-- Knowledge base preview pop-up window -->
    <a-modal
      v-model:open="showKnowledgePreview"
      :title="`${knowledgeBases.length} Knowledge Base${knowledgeBases.length > 1 ? 's' : ''} from Extension`"
      width="800px"
      :footer="null"
      :maskClosable="false"
      class="kb-preview-modal"
    >
      <div class="kb-preview">
        <div class="kb-list">
          <div 
            v-for="(kb, index) in knowledgeBases" 
            :key="kb.id"
            class="kb-item"
          >
            <div class="kb-item-header">
              <h4>{{ index + 1 }}. {{ kb.title }}</h4>
              <span class="kb-tokens">{{ kb.tokens || 0 }} tokens</span>
            </div>
            <div class="kb-item-content">
              {{ kb.content.substring(0, 200) }}{{ kb.content.length > 200 ? '...' : '' }}
            </div>
            <div class="kb-item-meta">
              Created: {{ new Date(kb.created_at * 1000).toLocaleDateString() }}
            </div>
          </div>
        </div>
        
        <div class="kb-actions">
          <a-button @click="showKnowledgePreview = false">
            Cancel
          </a-button>
          <a-button 
            type="primary" 
            @click="applyKnowledgeBases"
            :disabled="!mergeContent && knowledgeBases.length > 1"
          >
            {{ mergeContent ? 'Merge & Continue' : 'Use First KB' }}
          </a-button>
        </div>
      </div>
    </a-modal>

    <!-- Pending order modal box -->
    <a-modal
      v-model:open="showListingModal"
      title="List NFT"
      @ok="handleConfirmListing"
      :confirm-loading="loading"
    >
      <div class="listing-modal">
        <a-form layout="vertical">
          <a-form-item label="NFT Address">
            <a-input :value="mintedNFTAddress" disabled />
          </a-form-item>
          
          <a-form-item label="Listing Price (SOL)" required>
            <a-input-number 
              v-model:value="listingPrice"
              :min="0.001"
              :step="0.1"
              placeholder="Enter price"
              style="width: 100%"
            />
          </a-form-item>
          
          <a-form-item>
            <div class="fee-info">
              <p>• Your NFT has been successfully minted with <strong>0%</strong> royalty</p>
              <p>• Platform trading fee: <strong>2.5%</strong></p>
              <p>• You will receive: <strong>{{ (listingPrice * 0.975).toFixed(4) }} SOL</strong></p>
            </div>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import AigcHeader from '@/components/AigcHeader.vue'
import Footer from '@/components/Footer.vue'
import FileUpload from '@/components/FileUpload.vue'
import { useSolanaStore } from '@/stores/solana'
import { useCoreNftStore } from '@/stores/coreNft'
import { createNft, type CreateNftParams } from '@/apis/nft'
import type { ImageUploadResponse } from '@/apis/assets'
import { useUserStore } from '@/stores/user'
import { getTransferData } from '@/apis/extension'
import type { KnowledgeBase, TransferResponse } from '@/types/extension'
const userStore = useUserStore()

// Routing instance
const router = useRouter()
const route = useRoute()

// Store instance
const solanaStore = useSolanaStore()
const coreNftStore = useCoreNftStore()

// form reference
const formRef = ref<FormInstance>()

// Loading status
const loading = ref(false)

// Preview URL
const previewUrl:any = ref('')

// Pending order modal box status
const showListingModal = ref(false)
const mintedNFTAddress = ref('')
const listingPrice = ref(0)

// File upload results
const uploadedFileData = ref<ImageUploadResponse['data'] | null>(null)

// Knowledge base related status
const knowledgeBases = ref<KnowledgeBase[]>([])
const showKnowledgePreview = ref(false)
const mergeContent = ref(true) // Default merge mode
const isLoadingTransfer = ref(false)

// Form data type definition
interface FormData {
  wallet: string
  file: File | null
  displayName: string
  description: string
  collection: string
  collectionMint: string
  collectionName: string
  collectionUri: string
  collectionId: number
  properties: {
    background: string
    name: string
  }
  marketplaceType: string
  price: number
  expirationDays: string
  expirationDate: any
}

// form data
const formData = reactive<FormData>({
  wallet: 'phantom',
  file: null,
  displayName: '',
  description: '',
  collection: '',
  collectionMint: '',
  collectionName: '',
  collectionUri: '',
  collectionId: 0,
  properties: {
    background: '',
    name: ''
  },
  marketplaceType: 'fixed',
  price: 0,
  expirationDays: '7',
  expirationDate: null
})

// form validation rules
const rules: Record<string, any[]> = {
  displayName: [
    { required: true, message: 'Please enter display name', trigger: 'blur' },
    { min: 2, max: 50, message: 'Display name should be 2-50 characters', trigger: 'blur' }
  ],
  price: [
    { required: true, message: 'Please enter price', trigger: 'blur' },
    { type: 'number', min: 0.001, message: 'Price must be greater than 0', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: 'Description should not exceed 500 characters', trigger: 'blur' }
  ]
}

// Calculate the amount the user will receive
const calculateReceiveAmount = computed(() => {
  if (!formData.price) return '0'
  const fee = formData.price * 0.01 // 1% fee
  const receiveAmount = formData.price - fee
  return receiveAmount.toFixed(3)
})

// Listen for file changes to update the preview
watch(() => formData.file, (newFile) => {
  console.log('newFile', newFile)
  if (newFile) {
    previewUrl.value =newFile
  } else {
    previewUrl.value = ''
  }
})

// Process file upload successfully
const handleFileUploadSuccess = (result: ImageUploadResponse['data']) => {
  console.log('File upload success:', result)
  uploadedFileData.value = result
  console.log('uploadedFileData', uploadedFileData.value)
  message.success('File uploaded successfully!')
}

// Handling file upload errors
const handleFileUploadError = (error: any) => {
  console.error('File upload error:', error)
  uploadedFileData.value = null
  message.error('File upload failed!')
}

// Create NFT (using CoreNft method)
const handleCreateNft = async () => {
  try {
    // Validate form data
    if (!formData.file) {
      message.error('Please select an NFT file first')
      return
    }
    
    if (!uploadedFileData.value) {
      message.error('Please upload the file to server first')
      return
    }
    
    if (!formData.displayName || !formData.description) {
      message.error('Please fill in NFT name and description')
      return
    }

    // Validation form
    await formRef.value?.validate()
    
    loading.value = true
    
    console.log('🎨 Start creatingNFT...')
    console.log('- Use uploaded files:', uploadedFileData.value.fileUrl)
    console.log('- documentCID:', uploadedFileData.value.fileHash)
    console.log('- Collectionaddress:', formData.collectionMint || 'noneCollection')
    console.log('- Collectionname:', formData.collectionName || 'none')
    console.log('- Collection ID (database):', formData.collectionId || 'none')
    
    // 1. Mint NFTs on-chain using CoreNft
    const coreNftResult = await coreNftStore.createUserNft({
      name: formData.displayName,
      symbol: formData.collection || 'NFT',
      description: formData.description,
      imageUrl: uploadedFileData.value.fileUrl, // Use uploaded file URL
      attributes: Object.entries(formData.properties).map(([trait_type, value]) => ({
        trait_type,
        value: String(value)
      })).filter(attr => attr.value.trim() !== ''),
      price: formData.price || 0, // Add price parameter
      collection: formData.collectionMint || undefined, // Add Collection association (blockchain address)
      // Note: collectionId is the database ID and is not passed to the on-chain casting function, but to the backend API
    })

    if (!coreNftResult.success) {
      throw new Error((coreNftResult.error as any)?.message || 'on the chainNFTCasting failed')
    }

    console.log('✅ on the chainNFTCasting success:', coreNftResult)
    // 2. Call the server API to create NFT records
    const createNftParams: CreateNftParams = {
      name: formData.displayName,
      description: formData.description,
      imageUrl: uploadedFileData.value.fileUrl,
      displayImageUrl: uploadedFileData.value.thumbnailUrl || uploadedFileData.value.fileUrl,
      tokenStandard: 'ERC721', // Adjust according to actual situation
      blockchainNetwork: 'solana',
      contractAddress: coreNftResult.asset || '', // Mint address of NFT
      metadataUrl: (coreNftResult as any).metadataUri || '',
      price: formData.price || 0,
      listingPrice: formData.price || 0,
      priceCurrency: 'SOL',
      marketplace: 'opensea', // Adjust according to actual situation
      isListed: formData.price ? 1 : 0,
      creatorAddress: userStore.walletInfo?.address || '',
      collectionId: formData.collectionId || 0, // Database Collection ID obtained from route parameters
    }

    console.log('📤 Call the serverAPIcreateNFTRecord...')
    const apiResult = await createNft(createNftParams)
    
    if (apiResult.code !== 200) {
      console.warn('⚠️ ServerNFTRecord creation fails, but on-chain minting succeeds:', apiResult.message)
      message.warning('NFT minted on blockchain successfully, but failed to save record to backend')
    } else {
      console.log('✅ ServerNFTRecord created successfully:', apiResult.data)
    }

    // Display different success messages and processing logic based on whether there is a price
    const collectionInfo = formData.collectionName ? `\n        • Collection: ${formData.collectionName}` : ''
    
    if ((coreNftResult as any).isListed && (coreNftResult as any).price) {
      // NFT has been created and orders placed automatically
      message.success(`NFT created and listed successfully! Price: ${(coreNftResult as any).price} SOL`)
      router.push('/marketplace')
    } else {
      // NFT is only created, no orders are placed
      message.success('NFT created successfully!')
      
      const collectionText = formData.collectionName ? ` and linked to Collection "${formData.collectionName}"` : ''
   router.push('/marketplace')
    }
    
    // Reset form
    resetForm()
    
  } catch (error) {
    console.error('❌ Create NFT failed:', error)
    message.error('NFT creation failed: ' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

// save draft
const handleDraft = async () => {
  try {
    loading.value = true
    
    // Here you can call the API to save the draft
    // await saveDraftAPI(formData)
    
    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    message.success('Draft saved successfully!')
    
  } catch (error) {
    console.error('Save draft failed:', error)
    message.error('Failed to save draft')
  } finally {
    loading.value = false
  }
}

// Confirm pending order
const handleConfirmListing = async () => {
  if (!mintedNFTAddress.value || !listingPrice.value) {
    message.error('Please enter listing price')
    return
  }

  try {
    loading.value = true
    
    console.log('🏷️ Start pending orderNFT...')
    console.log('- NFTaddress:', mintedNFTAddress.value)
    console.log('- Pending order price:', listingPrice.value, 'SOL')
    
    const result = await (coreNftStore as any).listNftForSale(
      mintedNFTAddress.value,
      listingPrice.value,
      true // Use on-chain price storage
    )

    if (result.success) {
      message.success('NFT listed successfully! Price stored on-chain')
      showListingModal.value = false
      router.push('/marketplace')
    } else {
      message.error(result.error?.message || 'Failed to list NFT')
    }
  } catch (error) {
    console.error('pending orderNFTmistake:', error)
    message.error('Error occurred while listing NFT')
  } finally {
    loading.value = false
  }
}

// Reset form
const resetForm = () => {
  formData.wallet = ''
  formData.file = null
  formData.displayName = ''
  formData.description = ''
  formData.collection = ''
  formData.collectionMint = ''
  formData.collectionName = ''
  formData.collectionUri = ''
  formData.properties.background = ''
  formData.properties.name = ''
  formData.marketplaceType = 'fixed'
  formData.price = 0
  formData.expirationDays = '7'
  formData.expirationDate = null
  previewUrl.value = ''
  uploadedFileData.value = null // Clean uploaded file data
  
  // Reset form validation status
  formRef.value?.resetFields()
}

// Cancel operation
const handleCancel = () => {
  // Confirm cancellation operation
  if (hasFormData()) {
    const confirmed = confirm('Are you sure you want to cancel? All unsaved changes will be lost.')
    if (!confirmed) return
  }
  
  // Return to previous page or home page
  router.back()
}

/**
 * Load the data transferred by the extension
 */
async function loadTransferData(transferId: string) {
  isLoadingTransfer.value = true
  
  try {
    message.loading({ content: 'Loading knowledge base data...', key: 'transfer' })
    
    const response = await getTransferData(transferId) as TransferResponse
    
    if (response.code === 200 && response.data) {
      const transferData = response.data.data
      knowledgeBases.value = transferData.knowledge_bases || []
      
      if (knowledgeBases.value.length === 0) {
        message.error({ content: 'No knowledge base found', key: 'transfer' })
        return
      }
      
      if (knowledgeBases.value.length === 1) {
        // Single knowledge base: populate directly
        applySingleKnowledgeBase(knowledgeBases.value[0])
        message.success({ content: 'Knowledge base loaded successfully', key: 'transfer' })
      } else {
        // Multiple knowledge bases: Show preview popup
        showKnowledgePreview.value = true
        message.success({ 
          content: `Loaded ${knowledgeBases.value.length} knowledge bases`, 
          key: 'transfer' 
        })
      }
    } else {
      throw new Error(response.message || 'Failed to load data')
    }
  } catch (error: any) {
    console.error('Failed to load transfer data:', error)
    message.error({ 
      content: error.message || 'Failed to load transfer data', 
      key: 'transfer' 
    })
  } finally {
    isLoadingTransfer.value = false
  }
}

/**
 * Apply a single knowledge base data
 */
function applySingleKnowledgeBase(kb: KnowledgeBase) {
  formData.displayName = kb.title
  formData.description = kb.content
  // Other fields can be set based on metadata
  if (kb.metadata?.language) {
    console.log('Knowledge base language:', kb.metadata.language)
  }
}

/**
 * Apply knowledge base content to a form
 */
function applyKnowledgeBases() {
  if (knowledgeBases.value.length === 0) return
  
  if (mergeContent.value) {
    // merge mode
    const titles = knowledgeBases.value.map((kb) => kb.title)
    const contents = knowledgeBases.value.map((kb) => 
      `=== ${kb.title} ===\n${kb.content}`
    )
    
    formData.displayName = titles.join(' + ')
    formData.description = contents.join('\n\n---\n\n')
    
    message.success('Knowledge bases merged successfully')
  } else {
    // Standalone mode - only the first one is used for now
    message.info('Only the first knowledge base will be used for now')
    applySingleKnowledgeBase(knowledgeBases.value[0])
  }
  
  showKnowledgePreview.value = false
}

// Check if there is form data
const hasFormData = (): boolean => {
  return !!(
    formData.displayName ||
    formData.description ||
    formData.file ||
    formData.price ||
    formData.properties.background ||
    formData.properties.name
  )
}

// Check routing parameters when mounting the component
onMounted(async () => {
  // Initialize UMI instance
  ;(solanaStore as any).getUmi?.()
  
  // Check extended transport parameters
  const transferId = route.query.transfer as string
  if (transferId) {
    await loadTransferData(transferId)
  }
  
  // Check whether there is Collection information passed from CreateCollection
  const { collectionAddress, collectionName, collectionUri, collectionId } = route.query
  
  // Get collectionId from route parameter
  if (collectionId) {
    const parsedCollectionId = parseInt(collectionId as string, 10)
    if (!isNaN(parsedCollectionId)) {
      formData.collectionId = parsedCollectionId
      console.log('✅ Collection ID Already set from routing parameters:', formData.collectionId)
    } else {
      console.warn('⚠️ Invalid collectionId parameter:', collectionId)
    }
  }
  
  if (collectionAddress && collectionName && collectionUri) {
    console.log('📦 Received Collection info from CreateCollection:', {
      address: collectionAddress,
      name: collectionName,
      collectionId: formData.collectionId,
      uri: collectionUri
    })
    
    // Set Collection information
    formData.collectionMint = collectionAddress as string
    formData.collectionName = collectionName as string  
    formData.collectionUri = collectionUri as string
    formData.collection = collectionAddress as string // Set to selected state
    
    // Show prompt message
    message.success({
      content: `Collection "${collectionName}" has been auto-selected!`,
      duration: 3
    })
  }
})
</script>

<style lang="scss" scoped>
.create-nft-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a0a0a;
  color: #fff;
}

.main-content {
  flex: 1;
  padding: 80px 0 60px;
  
  .container {
    margin: 0 auto;
    padding: 0 20px;
  }
}

.page-header {
  margin-bottom: 40px;
  
  .page-title {
    font-size: 32px;
    font-weight: bold;
    color: #fff;
    margin: 0;
    text-align: left;
  }
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 60px;
  align-items: start;
  position: relative;
}

.form-section {
  .section-title {
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.5px;
    margin: 0 0 16px 0;
  }
  
  .wallet-section {
    margin-bottom: 32px;
    
    .wallet-select {
      width: 100%;
      height: 48px;
      
      :deep(.ant-select-selector) {
        background: transparent !important;
        border: 1px solid #333 !important;
        border-radius: 26px !important;
        height: 100% !important;
        
        .ant-select-selection-item {
          color: #fff;
          line-height: 46px !important;
        }
        
        .ant-select-selection-placeholder {
          color: #666;
          line-height: 46px !important;
        }
      }
      
      :deep(.ant-select-arrow) {
        color: #666;
      }
      
      .wallet-option {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .wallet-icon {
          font-size: 16px;
        }
      }
    }
  }
  
  .upload-section {
    margin-bottom: 32px;
    
    .main-upload {
      min-height: 160px;
    }
  }
  
  .nft-form {
    .form-item {
      margin-bottom: 24px;
      
      :deep(.ant-form-item-label) {
        padding-bottom: 8px;
        
        label {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
      }
      
      .form-input,
      .form-textarea,
      .form-select {
        background: transparent;
        border: 1px solid #333;
        border-radius: 26px;
        color: #fff;
        font-size: 16px;
        height: 48px;
        
        &::placeholder {
          color: #666;
        }
        
        &:hover,
        &:focus {
          border-color: #555;
          box-shadow: none;
        }
      }
      
      .form-select {
        :deep(.ant-select-selector) {
          background: transparent !important;
          border: none !important;
          height: 100% !important;
          
          .ant-select-selection-item {
            color: #fff;
            line-height: 46px !important;
          }
          
          .ant-select-selection-placeholder {
            color: #666;
            line-height: 46px !important;
          }
        }
        
        :deep(.ant-select-arrow) {
          color: #666;
        }
      }
      
      .form-textarea {
        resize: vertical;
        min-height: 100px;
        height: auto;
      }
      
      .price-input {
        width: 100%;
        height: 48px;
        
        :deep(.ant-input-number) {
          width: 100%;
          height: 100%;
          background: transparent !important;
          border: 1px solid #333 !important;
          border-radius: 26px !important;
          overflow: hidden !important;
          
          &:hover {
            border-color: #555 !important;
          }
          
          &:focus-within {
            border-color: #555 !important;
            box-shadow: none !important;
          }
        }
        
        :deep(.ant-input-number-input-wrap) {
          height: 100% !important;
        }
        
        :deep(.ant-input-number-input) {
          background: transparent !important;
          color: #fff !important;
          border: none !important;
          height: 46px !important;
          line-height: 46px !important;
          padding: 0 16px !important;
          
          &::placeholder {
            color: #666 !important;
          }
        }
        
        :deep(.ant-input-number-group-addon) {
          background: transparent !important;
          border: none !important;
          color: #999 !important;
          height: 46px !important;
          line-height: 46px !important;
          padding: 0 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
      }
    }
  }
  
  .properties-section {
    margin-bottom: 24px;
    
    .properties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 16px;
      
      .property-item {
        margin-bottom: 0;
      }
    }
  }
  
  .marketplace-section {
    margin-bottom: 24px;
    
    .marketplace-radio {
      margin-top: 16px;
      display: flex;
      gap: 24px;
      
      .radio-button {
        color: #fff;
        
        :deep(.ant-radio-inner) {
          background: transparent;
          border-color: #333;
        }
        
        :deep(.ant-radio-checked .ant-radio-inner) {
          background: #FFFFFF;
          border-color: #FFFFFF;
        }
        
        :deep(.ant-radio-checked .ant-radio-inner::after) {
          background: #000;
        }
      }
    }
  }
  
  .fee-section {
    padding: 16px 0;
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
    margin: 24px 0;
    
    .fee-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      &.highlight {
        font-weight: 600;
        color: #FFFFFF;
      }
      
      .fee-label {
        color: #999;
      }
      
      .fee-value {
        color: #fff;
      }
    }
  }
  
  .expiration-wrapper {
    display: flex;
    gap: 16px;
    
    .expiration-select {
      flex: 1;
      height: 48px;
      background: transparent;
      border: 1px solid #333;
      border-radius: 26px;
      
      :deep(.ant-select-selector) {
        background: transparent !important;
        border: none !important;
        height: 100% !important;
        
        .ant-select-selection-item {
          color: #fff;
          line-height: 46px !important;
        }
        
        .ant-select-selection-placeholder {
          color: #666;
          line-height: 46px !important;
        }
      }
      
      :deep(.ant-select-arrow) {
        color: #666;
      }
      
      &:hover {
        border-color: #555;
      }
    }
    
    .expiration-date {
      flex: 1;
      height: 48px;
      
      :deep(.ant-picker) {
        background: transparent !important;
        border: 1px solid #333 !important;
        border-radius: 26px !important;
        color: #fff;
        width: 100%;
        height: 100%;
        
        &:hover {
          border-color: #555 !important;
        }
        
        &:focus {
          border-color: #555 !important;
          box-shadow: none !important;
        }
        
        .ant-picker-input input {
          color: #fff !important;
          background: transparent !important;
          
          &::placeholder {
            color: #666 !important;
          }
        }
      }
    }
  }
  
  .form-actions {
    display: flex;
    gap: 16px;
    margin-top: 40px;
    flex-wrap: wrap;
    
    .create-btn {
      background: #FFFFFF !important;
      border: none !important;
      color: #101010 !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      height: 48px !important;
      padding: 0 32px !important;
      border-radius: 26px !important;
      letter-spacing: 0.5px !important;
      box-shadow: none !important;
      
      &:hover,
      &:focus {
        background: #FFFFFF !important;
        color: #101010 !important;
        border: none !important;
        box-shadow: none !important;
      }
      
      &:active {
        background: #FFFFFF !important;
        color: #101010 !important;
        border: none !important;
        box-shadow: none !important;
      }
      
      &:disabled {
        background: #666 !important;
        color: #999 !important;
        border: none !important;
        box-shadow: none !important;
      }
    }
    
    .draft-btn {
      background: #fff !important;
      border: 1px solid #fff !important;
      color: #222222 !important;
      font-weight: 500 !important;
      font-size: 14px !important;
      height: 48px !important;
      padding: 0 32px !important;
      border-radius: 26px !important;
      letter-spacing: 0.5px !important;
      box-shadow: none !important;
      
      &:hover,
      &:focus {
        background: #f0f0f0 !important;
        border-color: #f0f0f0 !important;
        color: #222222 !important;
        box-shadow: none !important;
      }
      
      &:active {
        background: #e0e0e0 !important;
        border-color: #e0e0e0 !important;
        color: #222222 !important;
        box-shadow: none !important;
      }
    }
    
    .cancel-btn {
      background: #222 !important;
      border: none !important;
      color: #fff !important;
      font-weight: 500 !important;
      font-size: 14px !important;
      height: 48px !important;
      padding: 0 32px !important;
      border-radius: 26px !important;
      letter-spacing: 0.5px !important;
      box-shadow: none !important;
      
      &:hover,
      &:focus {
        background: #333 !important;
        color: #fff !important;
        border: none !important;
        box-shadow: none !important;
      }
      
      &:active {
        background: #444 !important;
        color: #fff !important;
        border: none !important;
        box-shadow: none !important;
      }
      
      &:disabled {
        background: #111 !important;
        color: #666 !important;
        border: none !important;
        box-shadow: none !important;
      }
    }
  }
}

.preview-section {
  .section-title {
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.5px;
    margin: 0 0 16px 0;
  }
  
  .preview-card {
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 26px;
    overflow: hidden;
    
    .preview-image {
      aspect-ratio: 1;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .nft-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .placeholder {
        padding: 40px 20px;
        text-align: center;
        color: #666;
        font-size: 14px;
        line-height: 1.5;
      }
    }
    
    .preview-info {
      padding: 16px;
      
      .nft-name {
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }
      
      .nft-price {
        color: #FFFFFF;
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}

// Responsive design
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .preview-section {
    order: -1;
    
    .preview-card {
      max-width: 400px;
      margin: 0 auto;
    }
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 60px 0 40px;
    
    .container {
      padding: 0 16px;
    }
  }
  
  .page-header {
    margin-bottom: 30px;
    
    .page-title {
      font-size: 24px;
    }
  }
  
  .content-wrapper {
    gap: 30px;
  }
  
  .form-section {
    .properties-grid {
      grid-template-columns: 1fr;
    }
    
    .expiration-wrapper {
      flex-direction: column;
    }
    
    .form-actions {
      flex-direction: column;
      
      .create-btn,
      .draft-btn,
      .cancel-btn {
        width: 100%;
      }
    }
  }
}

// Ant Design Vue style override
:deep(.ant-select-dropdown) {
  background: #1a1a1a;
  border: 1px solid #333;
  
  .ant-select-item {
    color: #fff;
    
    &:hover {
      background: #333;
    }
    
    &.ant-select-item-option-selected {
      background: #FFFFFF;
      color: #000;
    }
  }
}

// Date picker drop down panel style
:deep(.ant-picker-dropdown) {
  background: #ffffff !important;
  border: 1px solid #d9d9d9 !important;
  
  .ant-picker-panel-container {
    background: #ffffff !important;
  }
  
  .ant-picker-panel {
    background: #ffffff !important;
  }
  
  .ant-picker-content {
    background: #ffffff !important;
  }
  
  .ant-picker-header {
    color: #000 !important;
    border-bottom: 1px solid #f0f0f0 !important;
    
    button {
      color: #000 !important;
      
      &:hover {
        color: #FFFFFF !important;
      }
    }
  }
  
  .ant-picker-cell {
    color: #000 !important;
    
    &:hover:not(.ant-picker-cell-selected):not(.ant-picker-cell-disabled) {
      background: #f5f5f5 !important;
    }
  }
  
  .ant-picker-cell-in-view {
    color: #000 !important;
  }
  
  .ant-picker-cell-selected {
    background: #FFFFFF !important;
    color: #fff !important;
    
    .ant-picker-cell-inner {
      background: #FFFFFF !important;
      color: #fff !important;
      font-weight: 600 !important;
    }
  }
  
  .ant-picker-cell-in-view.ant-picker-cell-selected {
    color: #fff !important;
    
    .ant-picker-cell-inner {
      color: #fff !important;
      font-weight: 600 !important;
    }
  }
  
  .ant-picker-cell-today {
    .ant-picker-cell-inner::before {
      border: 1px solid #FFFFFF !important;
    }
  }
  
  .ant-picker-cell-disabled {
    color: #d9d9d9 !important;
    background: transparent !important;
  }
  
  .ant-picker-footer {
    background: #ffffff !important;
    border-top: 1px solid #f0f0f0 !important;
    
    .ant-picker-today-btn {
      color: #FFFFFF !important;
      
      &:hover {
        color: #FFFFFF !important;
      }
    }
  }
}

// Globally override the text color of the selected date
.ant-picker-dropdown .ant-picker-cell-selected .ant-picker-cell-inner {
  color: #fff !important;
  font-weight: 600 !important;
}

 .ant-picker-input > input {
  color: #fff !important;
}

:deep(.ant-form-item-has-error) {
  .form-input,
  .form-textarea,
  .form-select,
  .price-input {
    border-color: #ff4d4f;
  }
}

// Force override Ant Design button style
:deep(.ant-btn.create-btn) {
  background: #FFFFFF !important;
  border: none !important;
  color: #101010 !important;
  box-shadow: none !important;
  
  &:hover,
  &:focus {
    background: #FFFFFF !important;
    color: #101010 !important;
    border: none !important;
    box-shadow: none !important;
  }
  
  &:active {
    background: #FFFFFF !important;
    color: #101010 !important;
    border: none !important;
    box-shadow: none !important;
  }
}

:deep(.ant-btn.cancel-btn) {
  background: #222 !important;
  border: none !important;
  color: #fff !important;
  box-shadow: none !important;
  
  &:hover,
  &:focus {
    background: #333 !important;
    color: #fff !important;
    border: none !important;
    box-shadow: none !important;
  }
  
  &:active {
    background: #444 !important;
    color: #fff !important;
    border: none !important;
    box-shadow: none !important;
  }
}

  :deep(.ant-btn.draft-btn) {
    background: #fff !important;
    border: 1px solid #fff !important;
    color: #222222 !important;
    box-shadow: none !important;
    
    &:hover,
    &:focus {
      background: #f0f0f0 !important;
      border-color: #f0f0f0 !important;
      color: #222222 !important;
      box-shadow: none !important;
    }
    
    &:active {
      background: #e0e0e0 !important;
      border-color: #e0e0e0 !important;
      color: #222222 !important;
      box-shadow: none !important;
    }
  }
</style>

<style lang="scss">
/* Unscoped style, used to force override Ant Design button style */
.create-nft-page .form-actions .ant-btn.create-btn {
  background: #FFFFFF !important;
  border: none !important;
  color: #101010 !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  height: 48px !important;
  padding: 0 32px !important;
  border-radius: 26px !important;
  letter-spacing: 0.5px !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-nft-page .form-actions .ant-btn.create-btn:hover,
.create-nft-page .form-actions .ant-btn.create-btn:focus {
  background: #FFFFFF !important;
  color: #101010 !important;
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-nft-page .form-actions .ant-btn.create-btn:active {
  background: #FFFFFF !important;
  color: #101010 !important;
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-nft-page .form-actions .ant-btn.cancel-btn {
  background: #222 !important;
  border: none !important;
  color: #fff !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  height: 48px !important;
  padding: 0 32px !important;
  border-radius: 26px !important;
  letter-spacing: 0.5px !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-nft-page .form-actions .ant-btn.cancel-btn:hover,
.create-nft-page .form-actions .ant-btn.cancel-btn:focus {
  background: #333 !important;
  color: #fff !important;
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-nft-page .form-actions .ant-btn.cancel-btn:active {
  background: #444 !important;
  color: #fff !important;
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-nft-page .form-actions .ant-btn.draft-btn {
  background: #fff !important;
  border: 1px solid #fff !important;
  color: #222222 !important;
  font-weight: 500 !important;
  font-size: 14px !important;
  height: 48px !important;
  padding: 0 32px !important;
  border-radius: 26px !important;
  letter-spacing: 0.5px !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-nft-page .form-actions .ant-btn.draft-btn:hover,
.create-nft-page .form-actions .ant-btn.draft-btn:focus {
  background: #f0f0f0 !important;
  border-color: #f0f0f0 !important;
  color: #222222 !important;
  border: 1px solid #f0f0f0 !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-nft-page .form-actions .ant-btn.draft-btn:active {
  background: #e0e0e0 !important;
  border-color: #e0e0e0 !important;
  color: #222222 !important;
  border: 1px solid #e0e0e0 !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

/* Selector style override */
.create-nft-page .ant-select {
  background: transparent !important;
  border: 1px solid #333 !important;
  border-radius: 26px !important;
}

.create-nft-page .ant-select .ant-select-selector {
  background: transparent !important;
  border: none !important;
  border-radius: 26px !important;
}

.create-nft-page .ant-select:hover {
  border-color: #555 !important;
}

.create-nft-page .ant-picker {
  background: transparent !important;
  border: 1px solid #333 !important;
  border-radius: 26px !important;
}

.create-nft-page .ant-picker:hover {
  border-color: #555 !important;
}

.create-nft-page .ant-picker:focus {
  border-color: #555 !important;
  box-shadow: none !important;
}





/* Force coverage of all input box backgrounds */
.create-nft-page .ant-input {
  background: transparent !important;
  color: #fff !important;
  border: 1px solid #333 !important;
  border-radius: 26px !important;
  height: 48px !important;
  line-height: 46px !important;
  padding: 0 16px !important;
}

.create-nft-page .ant-input:hover {
  border-color: #555 !important;
  background: transparent !important;
}

.create-nft-page .ant-input:focus {
  border-color: #555 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.create-nft-page .ant-input::placeholder {
  color: #666 !important;
}

.create-nft-page .ant-input-number {
  background: transparent !important;
  border: 1px solid #333 !important;
  border-radius: 26px !important;
  height: 48px !important;
  overflow: hidden !important;
}

.create-nft-page .ant-input-number:hover {
  border-color: #555 !important;
}

.create-nft-page .ant-input-number:focus-within {
  border-color: #555 !important;
  box-shadow: none !important;
}

.create-nft-page .ant-input-number .ant-input-number-input {
  background: transparent !important;
  color: #fff !important;
  height: 46px !important;
  line-height: 46px !important;
  border: none !important;
}

.create-nft-page .ant-input-number .ant-input-number-input::placeholder {
  color: #666 !important;
}

.create-nft-page .ant-input-number .ant-input-number-group-addon {
  background: transparent !important;
  border: none !important;
  color: #999 !important;
  height: 46px !important;
  line-height: 46px !important;
}

.create-nft-page .properties-section .ant-input {
  background: transparent !important;
  color: #fff !important;
  border: 1px solid #333 !important;
  border-radius: 26px !important;
  height: 48px !important;
}

.create-nft-page .properties-section .ant-input:hover {
  border-color: #555 !important;
  background: transparent !important;
}

.create-nft-page .properties-section .ant-input:focus {
  border-color: #555 !important;
  background: transparent !important;
  box-shadow: none !important;
}

/* Knowledge base preview pop-up window style */
.kb-preview {
  .kb-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
  }
  
  .kb-list {
    max-height: 450px;
    overflow-y: auto;
    margin-bottom: 24px;
    
    /* Custom scroll bar style */
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
  }
  
  .kb-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    background: #f9fafb;
    transition: all 0.2s;
    
    &:hover {
      border-color: #667eea;
      background: #f5f7ff;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .kb-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }
      
      .kb-tokens {
        font-size: 12px;
        color: #6b7280;
        background: #e5e7eb;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 500;
      }
    }
    
    .kb-item-content {
      font-size: 14px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 10px;
      word-break: break-word;
    }
    
    .kb-item-meta {
      font-size: 12px;
      color: #9ca3af;
    }
  }
  
  .kb-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;
  }
}

/* Pending order modal box style */
.listing-modal {
  .fee-info {
    background: linear-gradient(135deg, rgba(45, 55, 72, 0.1), rgba(74, 85, 104, 0.1));
    border: 1px solid rgba(99, 179, 237, 0.2);
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;

    p {
      margin: 4px 0;
      font-size: 14px;
      color: #666;

      strong {
        color: #1890ff;
        font-weight: 600;
      }
    }
  }

  .ant-input-number {
    border-radius: 6px;
    height: 40px;

    &:focus-within {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }

  .ant-form-item-label > label {
    font-weight: 600;
    color: #333;
  }
}
</style>

<style>
/* The global highest priority overrides the date picker input box color - use multiple selectors to ensure it takes effect */
.ant-picker .ant-picker-input > input,
.ant-picker-input input,
.create-nft-page .ant-picker .ant-picker-input > input,
.create-nft-page .expiration-date .ant-picker .ant-picker-input > input,
:where(.css-dev-only-do-not-override-1p3hq3p).ant-picker .ant-picker-input > input,
[class*="ant-picker"] .ant-picker-input > input {
  color: #fff !important;
  background: transparent !important;
}

/* Directly override Ant Design’s :where selector */
.ant-picker .ant-picker-input input[type="text"] {
  color: #fff !important;
}
</style> 