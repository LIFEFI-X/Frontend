<template>
  <div class="create-collection-page">
    <!-- head -->
    <AigcHeader />
    
    <!-- main content area -->
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">LIFEFI COLLECTION</h1>
        </div>
        
        <div class="content-wrapper">
          <!-- left form area -->
          <div class="form-section">
            <a-form 
              :model="formData" 
              :rules="rules" 
              ref="formRef"
              layout="vertical"
              class="collection-form"
            >
              <!-- Display Name -->
              <a-form-item 
                label="DISPLAY NAME (REQUIRED)" 
                name="displayName"
                class="form-item"
              >
                <a-input 
                  v-model:value="formData.displayName"
                  placeholder="Text"
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
                  :rows="6"
                  class="form-textarea"
                />
              </a-form-item>
              
              <!-- Short URL -->
              <a-form-item 
                label="SHORT URL (REQUIRED)" 
                name="shortUrl"
                class="form-item"
              >
                <a-input 
                  v-model:value="formData.shortUrl"
                  addon-before="lifefi.io"
                  placeholder="enter short url"
                  class="form-input"
                />
              </a-form-item>
              
              <!-- Category -->
              <a-form-item 
                label="CATEGORY" 
                name="category"
                class="form-item"
              >
                <a-select 
                  v-model:value="formData.category"
                  placeholder="Input text"
                  class="form-select"
                >
                  <a-select-option value="art">Art</a-select-option>
                  <a-select-option value="music">Music</a-select-option>
                  <a-select-option value="gaming">Gaming</a-select-option>
                  <a-select-option value="sports">Sports</a-select-option>
                  <a-select-option value="collectibles">Collectibles</a-select-option>
                  <a-select-option value="virtual-worlds">Virtual Worlds</a-select-option>
                </a-select>
              </a-form-item>
              
              <!-- Action button -->
              <div class="form-actions">
                <a-button 
                  size="large"
                  :loading="loading"
                  @click="handleCreateCollection"
                  class="create-btn"
                >
                  LIFEFI COLLECTION
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
          
          <!-- Upload area on the right -->
          <div class="upload-section">
            <!-- Cover Image -->
            <div class="upload-item">
              <h3 class="upload-title">COVER IMAGE</h3>
              <FileUpload 
                v-model="formData.coverImage as any"
                accept=".png,.gif,.webp"
                :max-size="40"
                uploadMode="oss"
                  :autoUpload="true"
                title="CHOOSE FILE"
                subtitle="PNG, GIF, WEBP"
                size-text="Image size 800x400 px, max size: 40 MB"
                class="cover-upload"
              />
            </div>
            
            <!-- Logo -->
            <div class="upload-item">
              <h3 class="upload-title">LOGO</h3>
              <FileUpload 
                v-model="formData.logo as any"
                accept=".png,.gif,.webp"
                :max-size="10"
                uploadMode="oss"
                :autoUpload="true"
                title="CHOOSE"
                subtitle="PNG, GIF, WEBP"
                size-text="Image size 400x400 px, max size: 10 MB"
                shape="circle"
                class="logo-upload"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <!-- bottom -->
    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import AigcHeader from '@/components/AigcHeader.vue'
import Footer from '@/components/Footer.vue'
import FileUpload from '@/components/FileUpload.vue'
import { createPlatformCollection } from '@/utils/coreNft'
import { createCollection, type CreateCollectionParams } from '@/apis/nft'
import { useWallet } from 'solana-wallets-vue'

// Routing instance
const router = useRouter()

// Wallet instance
const { connected, publicKey } = useWallet()

// form reference
const formRef = ref<FormInstance>()

// Loading status
const loading = ref(false)

// form data
const formData = reactive({
  displayName: '',
  description: '',
  shortUrl: '',
  category: '',
  coverImage: null as File | null,
  logo: null as File | null
})

// Data mapped to API format
const getApiData = (): CreateCollectionParams => ({
  name: formData.displayName,
  description: formData.description,
  shortUrl: formData.shortUrl,
  imageUrl: '', // will be populated after uploading
  bannerImageUrl: '', // will be populated after uploading
  category: formData.category || 'art',
  projectUrl: '', // Can get or set default value from form
  mintPrice: 1, // Default price, can be obtained from the form
  priceUnits: '2', // SOL
  royaltyFee: 0, // Default royalty
  maxSupply: 100000, // Default maximum supply
  mintLimit: 100000 // Default casting limit
})

// form validation rules
const rules: Record<string, any[]> = {
  displayName: [
    { required: true, message: 'Please enter display name', trigger: 'blur' },
    { min: 2, max: 50, message: 'Display name should be 2-50 characters', trigger: 'blur' }
  ],
  shortUrl: [
    { required: true, message: 'Please enter short URL', trigger: 'blur' },
    { min: 3, max: 30, message: 'Short URL should be 3-30 characters', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9-_]+$/, message: 'Short URL can only contain letters, numbers, hyphens and underscores', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: 'Description should not exceed 500 characters', trigger: 'blur' }
  ]
}



// Create a collection
const handleCreateCollection = async () => {
  try {
    // Validation form
    await formRef.value?.validate()
    
    loading.value = true
    message.loading({ content: 'Creating collection...', key: 'createCollection' })
    
    // 1. Upload pictures to the server
    let logoUrl:any = ''
    let coverUrl:any = ''
    logoUrl=formData.logo
    coverUrl=formData.coverImage
    
    // 2. Create collections on the chain through Core NFT
    console.log('🎨 Creating platform collection on blockchain...')
    message.loading({ content: 'Creating collection on blockchain...', key: 'createCollection' })
    
    const coreResult = await createPlatformCollection({
      name: formData.displayName,
      description: formData.description,
      symbol: formData.shortUrl.toUpperCase().substring(0, 10), // Use shortUrl as symbol
      image: formData.logo // logo as collection image
    })
    
    if (!coreResult.success) {
      throw new Error('Failed to LIFEFI COLLECTION on blockchain')
    }
    
    console.log('✅ Blockchain collection created:', coreResult.collection)
    
    // 3. Prepare API data and call backend API
    console.log('📡 Saving collection to backend...')
    message.loading({ content: 'Saving to backend...', key: 'createCollection' })
    
    const apiData = getApiData()
    apiData.imageUrl = logoUrl
    apiData.bannerImageUrl = coverUrl
    
    const apiResult = await createCollection(apiData)
    
    if (!apiResult.success) {
      console.warn('⚠️ Backend API call failed, but blockchain collection was created')
      // Even if the backend API fails, the blockchain collection has been created successfully
    } else {
      console.log('✅ Backend collection saved:', apiResult.data)
    }
    
    message.success({ 
      content: 'Collection created successfully!', 
      key: 'createCollection' 
    })
    
    // Jump to the CreateNft page and pass Collection information
    router.push({
      path: '/create-nft',
      query: {
        collectionId: apiResult.data?.id || 0,
        collectionAddress: coreResult.collection,
        collectionName: formData.displayName,
        collectionUri: coreResult.metadataUri
      }
    })
    
  } catch (error) {
    console.error('❌ LIFEFI COLLECTION failed:', error)
    message.error({
      content: error instanceof Error ? error.message : 'Failed to LIFEFI COLLECTION',
      key: 'createCollection'
    })
  } finally {
    loading.value = false
  }
}

// Cancel operation
const handleCancel = () => {
  // Confirm cancellation operation
  if (hasFormData()) {
    // Here you can add a confirmation dialog box
    const confirmed = confirm('Are you sure you want to cancel? All unsaved changes will be lost.')
    if (!confirmed) return
  }
  
  // Return to previous page or home page
  router.push('/marketplace')
}

// Check if there is form data
const hasFormData = (): boolean => {
  return !!(
    formData.displayName ||
    formData.description ||
    formData.shortUrl ||
    formData.category ||
    formData.coverImage ||
    formData.logo
  )
}
onMounted(() => {
  // Check wallet connection status
  if (!connected.value) {
    console.warn('Wallet not connected when CreateCollection page loaded')
  }
})
</script>

<style lang="scss" scoped>
.create-collection-page {
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
  grid-template-columns: 1fr 1.2fr;
  gap: 60px;
  align-items: start;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: calc(100vw - 57%);
    top: 0;
    bottom: 0;
    width: 1px;
    background: #fff;
    transform: translateX(-50%);
    z-index: 0;
    pointer-events: none;
  }
}

.form-section {
  width: 100%;
  
  .collection-form {
    .form-item {
      margin-bottom: 32px;
      
      :deep(.ant-form-item-label) {
        padding-bottom: 12px;
        
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
        
        &::placeholder {
          color: #666;
        }
        
        &:hover,
        &:focus {
          border-color: #555;
          box-shadow: none;
        }
        
        &:hover,
        &:focus-within {
          :deep(.ant-input-group-addon) {
            border-color: #555;
          }
          
          :deep(.ant-input) {
            border-color: #555;
          }
        }
      }
      
      .form-input {
        height: 48px;
        
        :deep(.ant-input-group-addon) {
          background: transparent;
          border: 1px solid #333;
          border-right: none;
          color: #999;
          padding: 0 16px;
        }
        
        :deep(.ant-input-group-addon + .ant-input) {
          border-left: none;
        }
        
        :deep(.ant-input-group) {
          display: flex;
          width: 100%;
          border-radius: 26px;
          overflow: hidden;
          
          .ant-input-group-addon {
            background: transparent;
            border: 1px solid #333;
            border-right: 1px solid #333;
            border-radius: 26px 0 0 26px;
            height: 48px;
            line-height: 46px;
            display: flex;
            align-items: center;
            margin: 0;
            padding: 0 20px;
            min-width: 120px;
            justify-content: center;
          }
          
          .ant-input {
            border: 1px solid #333;
            border-left: none;
            border-radius: 0 26px 26px 0;
            height: 48px;
            padding: 0 20px;
            flex: 1;
            margin: 0;
          }
        }
      }
      
      .form-textarea {
        resize: vertical;
        min-height: 120px;
      }
      
      .form-select {
        height: 48px;
        
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
    }
  }
  
  .form-actions {
    display: flex;
    gap: 16px;
    margin-top: 40px;
    justify-content: flex-start;
    
    .create-btn {
      background: #D3F56E !important;
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
        background: #c4e961 !important;
        color: #101010 !important;
        border: none !important;
        box-shadow: none !important;
      }
      
      &:active {
        background: #b8dd55 !important;
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

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: flex-start;
  
  .upload-item {
    width: 100%;
    
    .upload-title {
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.5px;
      margin: 0 0 16px 0;
      text-align: left;
    }
    
    .cover-upload {
      width: 100%;
      
      :deep(.upload-dragger) {
        min-height: 200px;
      }
    }
    
    .logo-upload {
      width: 160px;
      height: 160px;
      align-self: flex-start;
      
      :deep(.upload-dragger) {
        min-height: 160px;
        height: 160px;
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
  
  .upload-section {
    order: -1;
    align-items: flex-start;
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
    .collection-form {
      .form-item {
        margin-bottom: 24px;
      }
    }
    
    .form-actions {
      flex-direction: column;
      
      .create-btn,
      .cancel-btn {
        width: 100%;
      }
    }
  }
  
  .upload-section {
    gap: 30px;
    
    .logo-upload {
      align-self: flex-start;
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
      background: #9cff2e;
      color: #000;
    }
  }
}

:deep(.ant-form-item-has-error) {
  .form-input,
  .form-textarea,
  .form-select {
    border-color: #ff4d4f;
    
    .ant-input-group-addon {
      border-color: #ff4d4f;
    }
    
    .ant-input {
      border-color: #ff4d4f;
    }
  }
  
  .form-input .ant-input-group {
    .ant-input-group-addon {
      border-color: #ff4d4f;
    }
    
    .ant-input {
      border-color: #ff4d4f;
    }
  }
}

// Force override Ant Design button style
:deep(.ant-btn.create-btn) {
  background: #D3F56E !important;
  border: none !important;
  color: #101010 !important;
  box-shadow: none !important;
  
  &:hover,
  &:focus {
    background: #c4e961 !important;
    color: #101010 !important;
    border: none !important;
    box-shadow: none !important;
  }
  
  &:active {
    background: #b8dd55 !important;
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
</style>

<style lang="scss">
/* Unscoped style, used to force override Ant Design button style */
.create-collection-page .form-actions .ant-btn.create-btn {
  background: #D3F56E !important;
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

.create-collection-page .form-actions .ant-btn.create-btn:hover,
.create-collection-page .form-actions .ant-btn.create-btn:focus {
  background: #c4e961 !important;
  color: #101010 !important;
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-collection-page .form-actions .ant-btn.create-btn:active {
  background: #b8dd55 !important;
  color: #101010 !important;
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-collection-page .form-actions .ant-btn.cancel-btn {
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

.create-collection-page .form-actions .ant-btn.cancel-btn:hover,
.create-collection-page .form-actions .ant-btn.cancel-btn:focus {
  background: #333 !important;
  color: #fff !important;
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

.create-collection-page .form-actions .ant-btn.cancel-btn:active {
  background: #444 !important;
  color: #fff !important;
  border: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
}

/* Short URL input combination style */
.create-collection-page .ant-input-group {
  border-radius: 26px !important;
  overflow: hidden !important;
  display: flex !important;
  width: 100% !important;
}

.create-collection-page .ant-input-group .ant-input-group-addon {
  background: transparent !important;
  border: 1px solid #333 !important;
  border-right: 1px solid #333 !important;
  border-radius: 26px 0 0 26px !important;
  color: #999 !important;
  padding: 0 20px !important;
  height: 48px !important;
  line-height: 46px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  min-width: 120px !important;
}

.create-collection-page .ant-input-group .ant-input {
  background: transparent !important;
  border: 1px solid #333 !important;
  border-left: none !important;
  border-radius: 0 26px 26px 0 !important;
  color: #fff !important;
  height: 48px !important;
  padding: 0 20px !important;
  flex: 1 !important;
  margin: 0 !important;
}

.create-collection-page .ant-input-group:hover .ant-input-group-addon,
.create-collection-page .ant-input-group:focus-within .ant-input-group-addon {
  border-color: #555 !important;
}

.create-collection-page .ant-input-group:hover .ant-input,
.create-collection-page .ant-input-group:focus-within .ant-input {
  border-color: #555 !important;
  box-shadow: none !important;
}

.create-collection-page .ant-form-item-has-error .ant-input-group .ant-input-group-addon {
  border-color: #ff4d4f !important;
}

.create-collection-page .ant-form-item-has-error .ant-input-group .ant-input {
  border-color: #ff4d4f !important;
}
</style> 