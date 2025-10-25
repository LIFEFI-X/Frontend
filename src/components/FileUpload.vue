<template>
  <div class="file-upload-wrapper">
    <!-- File upload area -->
    <div :class="['upload-dragger', `upload-dragger--${shape}`]">
      <!-- Show upload area when no file is selected -->
      <div v-if="!previewFile" class="upload-content" @click="handleUploadClick">
        <!-- upload icon -->
        <div class="upload-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 8V32M8 20H32" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        <!-- upload button -->
        <div class="upload-button">
          {{ title || 'CHOOSE FILE' }}
        </div>
        
        <!-- File format description -->
        <div class="upload-subtitle">{{ subtitle || `${acceptText}` }}</div>
      </div>
      
      <!-- Show preview after selecting file -->
      <div v-else :class="['preview-content', `preview-content--${shape}`]">
        <img 
          v-if="isImage(previewFile)" 
          :src="previewUrl" 
          :alt="previewFile.name"
          class="preview-image"
        />
        <div v-else class="preview-file">
          <div class="file-icon">📄</div>
          <span class="file-name">{{ previewFile.name }}</span>
        </div>
        
        <!-- Upload/Convert Status Overlay -->
        <div v-if="uploading" class="upload-overlay">
          <div class="upload-loading">
            <div class="spinner"></div>
            <div class="upload-text">
              <span>{{ uploadMode === 'base64' ? 'Converting...' : 'Uploading...' }}</span>
              <div v-if="uploadMode === 'oss' && uploadProgress > 0" class="progress-text">
                {{ uploadProgress }}%
              </div>
            </div>
          </div>
        </div>
        
        <!-- Upload/conversion success status -->
        <!-- <div v-else-if="fileInfo" class="upload-success">
          <div class="success-icon">✓</div>
        </div> -->
        
        <!-- Action button group -->
        <div class="action-buttons">
          
          <!-- delete button -->
          <button @click="handleClear" class="clear-btn" type="button" title="Delete files">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      :accept="accept"
      :multiple="multiple"
      @change="handleFileInputChange"
      style="display: none;"
    />
    

    
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onUnmounted, readonly } from 'vue'
import { message } from 'ant-design-vue'
import { uploadFileToOSS, type OSSUploadResult } from '@/utils/ossUpload'
import type { OSSConfig, OSSUploadOptions } from '@/utils/ossConfig'

// Upload mode type
type UploadMode = 'base64' | 'oss'

// Component property definition
interface Props {
  modelValue?: string | null  // Value bound to v-model (base64 or OSS URL)
  accept?: string          // Accepted file types
  maxSize?: number        // Maximum file size (MB)
  multiple?: boolean      // Whether to support multiple selection
  title?: string          // Upload title
  subtitle?: string       // Upload subtitle
  sizeText?: string       // Size prompt text
  shape?: 'rectangle' | 'circle'  // Upload area shape
  // Upload mode: base64 or oss
  uploadMode?: UploadMode
  // Whether to automatically upload/convert
  autoUpload?: boolean
  // Whether to display manual upload/convert button
  showUploadBtn?: boolean
  // OSS configuration (optional)
  ossConfig?: Partial<OSSConfig>
  // OSS upload options (optional)
  ossOptions?: OSSUploadOptions
}

// File information interface
interface FileInfo {
  name: string
  size: number
  type: string
  base64?: string  // Data in base64 mode
  url?: string     // URL in OSS mode
  key?: string     // Storage path in OSS mode
  etag?: string    // ETag in OSS mode
  fileUrl?: string  // File URL in OSS mode
  lastModified: number
}

// event definition
interface Emits {
  (e: 'update:modelValue', value: string | null): void
  (e: 'change', fileInfo: FileInfo | null): void
  (e: 'upload-start'): void
  (e: 'upload-success', fileInfo: FileInfo): void
  (e: 'upload-error', error: any): void
  (e: 'upload-progress', progress: number): void
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.png,.jpg,.jpeg,.gif,.webp',
  maxSize: 40,
  multiple: false,
  title: '',
  subtitle: '',
  sizeText: '',
  shape: 'rectangle',
  uploadMode: 'oss',
  autoUpload: true,
  showUploadBtn: false,
  ossOptions: () => ({
    prefix: 'uploads/',
    generateUniqueKey: true
  })
})

const emit = defineEmits<Emits>()

// Responsive data
const previewFile = ref<File | null>(null)
const previewUrl = ref('')
const fileInputRef = ref<HTMLInputElement>()
const uploading = ref(false)
const uploadProgress = ref(0)
const fileInfo = ref<FileInfo | null>(null)

// Computed properties
const acceptText = computed(() => {
  if (props.accept.includes('image')) return 'PNG, GIF, WEBP'
  const extensions = props.accept.split(',').map(ext => ext.replace('.', '').toUpperCase())
  return extensions.join(', ')
})

// Determine whether it is a picture
const isImage = (file: File): boolean => {
  return file.type.startsWith('image/')
}

// Convert file to base64
const convertToBase64 = async (file: File): Promise<void> => {
  try {
    console.log('=== Start converting files tobase64 ===')
    console.log('file name:', file.name)
    console.log('file size:', (file.size / 1024).toFixed(2), 'KB')
    console.log('File type:', file.type)
    
    // Convert to base64 using FileReader
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    
    const newFileInfo: FileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      base64: base64,
      lastModified: file.lastModified
    }
    
    fileInfo.value = newFileInfo
    emit('update:modelValue', base64)
    emit('upload-success', newFileInfo)
    // message.success('File converted to base64 successfully!')
    console.log('✅ File conversion successful')
    console.log('Base64length:', base64.length)
    
  } catch (error) {
    console.error('❌ File conversion failed:', error)
    emit('upload-error', error)
    // message.error('File conversion failed: ' + (error as Error).message)
  }
}

// Upload files to OSS
const uploadToOSS = async (file: File): Promise<void> => {
  if (uploading.value) {
    console.log('The file is being uploaded, skipping repeated requests')
    return
  }
  
  try {
    uploading.value = true
    uploadProgress.value = 0
    emit('upload-start')
    
    console.log('=== Start uploading files to OSS ===')
    console.log('file name:', file.name)
    console.log('file size:', (file.size / 1024).toFixed(2), 'KB')
    console.log('File type:', file.type)
    
    // Prepare upload options
    const uploadOptions: OSSUploadOptions = {
      ...props.ossOptions,
      onProgress: (progress: number) => {
        uploadProgress.value = progress
        emit('upload-progress', progress)
        console.log(`Upload progress: ${progress}%`)
      }
    }
    
    // Upload to OSS
    const result: OSSUploadResult = await uploadFileToOSS(file, uploadOptions, props.ossConfig)
    
    if (result.success && result.url) {
      const newFileInfo: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.url,
        fileUrl: result.url,
        key: result.key,
        etag: result.etag,
        lastModified: file.lastModified
      }
      
      fileInfo.value = newFileInfo
      emit('update:modelValue', result.url)
      emit('upload-success', newFileInfo)
      // message.success('File uploaded to OSS successfully!')
      console.log('✅ OSS Upload successful')
      console.log('document URL:', result.url)
      console.log('document Key:', result.key)
    } else {
      throw new Error(result.error || 'OSS upload failed')
    }
    
  } catch (error) {
    console.error('❌ OSS Upload failed:', error)
    emit('upload-error', error)
    // message.error('OSS upload failed: ' + (error as Error).message)
  } finally {
    uploading.value = false
    console.log('=== OSS Upload process ends ===')
  }
}

// Upload/convert files (selected based on mode)
const processFile = async (file: File): Promise<void> => {
  if (props.uploadMode === 'base64') {
    await convertToBase64(file)
  } else {
    await uploadToOSS(file)
  }
}

// Manually upload/convert current file
const handleManualUpload = async (): Promise<void> => {
  console.log('🔄 User clicks manual upload button')
  if (!previewFile.value) {
    console.log('❌ No file selected')
    message.warning('Please select a file first')
    return
  }
  console.log('📁 Prepare to process files:', previewFile.value.name)
  await processFile(previewFile.value)
}

// Create preview URL
const createPreviewUrl = (file: File) => {
  if (isImage(file)) {
    previewUrl.value = URL.createObjectURL(file)
  }
}

// Clear file function (defined in advance)
const handleClear = () => {
  // Release preview URL memory
  if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl.value)
  }
  
  previewFile.value = null
  previewUrl.value = ''
  fileInfo.value = null
  uploading.value = false
  uploadProgress.value = 0
  emit('update:modelValue', null)
  emit('change', null)
}

// Monitor modelValue changes
watch(() => props.modelValue, (newValue, oldValue) => {
  if (newValue && typeof newValue === 'string') {
    // Set preview URL
    previewUrl.value = newValue
    
    // Try to get file information from existing fileInfo
    const currentValue = props.uploadMode === 'base64' ? fileInfo.value?.base64 : fileInfo.value?.url
    if (!fileInfo.value || currentValue !== newValue) {
      // If there is no corresponding file information, create a default
      const defaultFileInfo: FileInfo = {
        name: 'file',
        size: 0,
        type: props.uploadMode === 'base64' ? 'image/*' : 'application/octet-stream',
        lastModified: Date.now()
      }
      
      if (props.uploadMode === 'base64') {
        defaultFileInfo.base64 = newValue
      } else {
        defaultFileInfo.url = newValue
      }
      
      fileInfo.value = defaultFileInfo
    }
  } else if (!newValue) {
    handleClear()
  }
}, { immediate: true })



// File type verification
const isValidFileType = (file: File): boolean => {
  if (!props.accept) return true
  
  const acceptTypes = props.accept.split(',').map(type => type.trim())
  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()
  
  return acceptTypes.some(type => {
    if (type.startsWith('.')) {
      return fileName.endsWith(type.toLowerCase())
    } else if (type.includes('/')) {
      return fileType === type
    } else if (type === 'image/*') {
      return fileType.startsWith('image/')
    }
    return false
  })
}



// Handle upload area clicks
const handleUploadClick = (event: Event) => {
  event.stopPropagation()
  event.preventDefault()
  fileInputRef.value?.click()
}

// Handle file input changes
const handleFileInputChange = async (event: Event) => {
  console.log('📁 User selected file')
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    console.log('File information:', {
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type,
      uploadMode: props.uploadMode,
      autoUpload: props.autoUpload,
      showUploadBtn: props.showUploadBtn
    })
    
    // Use the same validation logic
    const isValidSize = file.size / 1024 / 1024 < props.maxSize
    if (!isValidSize) {
      console.log('❌ File too large:', file.size / 1024 / 1024, 'MB > ', props.maxSize, 'MB')
      message.error(`File size must be smaller than ${props.maxSize}MB`)
      return
    }

    if (props.accept && !isValidFileType(file)) {
      console.log('❌ File type not supported:', file.type)
      message.error(`Please upload files in ${acceptText.value} format`)
      return
    }

    console.log('✅ File verification passed, set preview')
    // Set preview
    previewFile.value = file
    createPreviewUrl(file)
    
    // trigger event
    const tempFileInfo: FileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    }
    emit('change', tempFileInfo)
    
    // Process files automatically if automatic upload/conversion is enabled
    if (props.autoUpload) {
      console.log(`🚀 automatic${props.uploadMode === 'base64' ? 'Convert' : 'upload'}mode, start processing`)
      await processFile(file)
    } else {
      console.log(`⏳ Manual${props.uploadMode === 'base64' ? 'Convert' : 'upload'}Mode that waits for the user to click a button`)
    }
  }
  
  // Clear the input value to allow repeated selection of the same file
  target.value = ''
}

// Clean memory when component is unloaded
onUnmounted(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

// Expose methods to parent component
defineExpose({
  uploadFile: handleManualUpload,
  clearFile: handleClear,
  uploading: readonly(uploading),
  uploadProgress: readonly(uploadProgress),
  fileInfo: readonly(fileInfo)
})
</script>

<style lang="scss" scoped>
.file-upload-wrapper {
  position: relative;
  
  .upload-dragger {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 160px;
    width: 100%;
    position: relative;
    
    &:hover {
      .upload-content {
        border-color: #666;
      }
    }
    
    // round style
    &--circle {
      .upload-content {
        border-radius: 50%;
        aspect-ratio: 1;
        padding: 20px;
        text-align: center;
        width: 100%;
        height: 100%;
        gap: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        
        .upload-button {
          padding: 8px 16px;
          font-size: 12px;
        }
        
        .upload-subtitle {
          font-size: 12px;
        }
      }
    }
  }
  
  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    border: 2px dashed #404040;
    border-radius: 26px;
    padding: 40px 20px;
    transition: all 0.3s ease;
    min-height: 160px;
    box-sizing: border-box;
    width: 100%;
    cursor: pointer;
    position: relative;
    z-index: 2;
    
    &:hover {
      border-color: #666;
    }
    
    .upload-icon {
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .upload-button {
      background: #222222;
      color: #fff;
      padding: 12px 24px;
      border-radius: 26px;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.5px;
      border: none;
      cursor: pointer;
      transition: background 0.2s ease;
      
      &:hover {
        background: #333;
      }
    }
    
    .upload-subtitle {
      color: #999;
      font-size: 14px;
      text-align: center;
      margin: 0;
    }
  }
  
  .upload-size-info {
    color: #666;
    font-size: 12px;
    text-align: center;
    margin-top: 8px;
    line-height: 1.4;
  }
  
  .preview-content {
    border: 2px dashed #404040;
    border-radius: 26px;
    min-height: 160px;
    box-sizing: border-box;
    width: 100%;
    position: relative;
    background: #1a1a1a;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .preview-image {
      width: 100%;
      height: 100%;
      min-height: 160px;
      object-fit: cover;
      display: block;
    }
    
    .preview-file {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      
      .file-icon {
        font-size: 24px;
      }
      
      .file-name {
        color: #fff;
        font-size: 14px;
        flex: 1;
        word-break: break-all;
      }
    }
    
    .upload-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: inherit;
      z-index: 20;
      
      .upload-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: #fff;
        
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid transparent;
          border-top: 2px solid #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .upload-text {
          text-align: center;
          
          span {
            font-size: 14px;
            display: block;
          }
          
          .progress-text {
            font-size: 12px;
            margin-top: 4px;
            opacity: 0.8;
          }
        }
      }
    }
    
    .upload-success {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(0, 255, 0, 0.8);
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 15;
      
      .success-icon {
        color: #fff;
        font-weight: bold;
        font-size: 14px;
      }
    }
    
    .action-buttons {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 8px;
      z-index: 10;
    }
    
    .upload-btn {
      padding: 6px 12px;
      background: #2196F3;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
      
      &:hover {
        background: #1976D2;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(33, 150, 243, 0.4);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    .clear-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.8);
      }
    }
    
    // Circle preview style
    &--circle {
      border-radius: 50%;
      aspect-ratio: 1;
      
      .preview-image {
        border-radius: 50%;
        width: 100%;
        height: 100%;
      }
      
      .preview-file {
        height: 100%;
        flex-direction: column;
        justify-content: center;
        text-align: center;
        
        .file-name {
          font-size: 12px;
          line-height: 1.2;
        }
      }
    }
  }
  
  .upload-result-info {
    margin-top: 12px;
    padding: 12px;
    background: rgba(34, 34, 34, 0.5);
    border-radius: 8px;
    font-size: 12px;
    
    .result-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        color: #999;
        min-width: 60px;
      }
      
      .value {
        color: #fff;
        flex: 1;
        text-align: right;
        word-break: break-all;
        
        &.key,
        &.etag {
          font-family: monospace;
          font-size: 10px;
        }
      }
      
      .file-link {
        color: #4CAF50;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }

}

// animation definition
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Responsive design
@media (max-width: 768px) {
  .file-upload-wrapper {
    .upload-content {
      padding: 30px 15px;
      gap: 12px;
      
      .upload-button {
        padding: 10px 20px;
        font-size: 12px;
      }
      
      .upload-subtitle {
        font-size: 12px;
      }
    }
    
    .upload-dragger--circle {
      .upload-content {
        padding: 15px;
        gap: 8px;
        
        .upload-button {
          padding: 6px 12px;
          font-size: 10px;
        }
        
        .upload-subtitle {
          font-size: 10px;
        }
      }
    }
  }
}


</style> 