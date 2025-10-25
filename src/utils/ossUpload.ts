import OSS from 'ali-oss'
import { 
  createOSSClient, 
  generateUniqueFileName, 
  getMimeType, 
  getFileUrl,
  type OSSConfig, 
  type OSSUploadOptions 
} from './ossConfig'

// Upload result interface
export interface OSSUploadResult {
  success: boolean
  url?: string
  key?: string
  size?: number
  etag?: string
  error?: string
}

// Upload progress interface
export interface OSSUploadProgress {
  percent: number
  loaded: number
  total: number
}

/**
 * Upload files to Alibaba Cloud OSS
 * @param file File to upload
 * @param options Upload options
 * @param config OSS configuration (optional, use default configuration)
 * @returns Promise<OSSUploadResult>
 */
export const uploadFileToOSS = async (
  file: File,
  options: OSSUploadOptions = {},
  config?: Partial<OSSConfig>
): Promise<OSSUploadResult> => {
  try {
    console.log('=== Start uploading files to Alibaba Cloud OSS ===')
    console.log('File information:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type
    })

    // Create OSS client
    const client = createOSSClient(config)
    
    // Generate file storage path
    let key = options.key
    if (!key) {
      const prefix = options.prefix || 'uploads/'
      const fileName = options.generateUniqueKey !== false 
        ? generateUniqueFileName(file.name)
        : file.name
      key = `${prefix}${fileName}`
    }
    
    console.log('The file will be stored in:', key)

    // Prepare upload options
    const uploadOptions: any = {
      // Set Content-Type
      headers: {
        'Content-Type': getMimeType(file.name),
        ...options.headers
      }
    }

    // Set storage type
    if (options.storageClass) {
      uploadOptions.headers['x-oss-storage-class'] = options.storageClass
    }

    // Progress callback processing
    if (options.onProgress) {
      uploadOptions.progress = (percentage: number, checkpoint: any) => {
        const percent = Math.round(percentage * 100)
        console.log(`Upload progress: ${percent}%`)
        options.onProgress!(percent)
      }
    }

    // Check if files need to be overwritten
    if (!options.overwrite) {
      try {
        const exists = await client.head(key)
        if (exists) {
          console.warn(`document ${key} Already exists, skip uploading`)
          const ossConfig = client.options as any
          return {
            success: true,
            url: getFileUrl(ossConfig, key),
            key: key,
            size: file.size
          }
        }
      } catch (error) {
        // File does not exist, continue uploading
      }
    }

    // Perform upload
    console.log('Start uploading to OSS...')
    const result = await client.put(key, file, uploadOptions)
    
    console.log('✅ OSS Upload successful:', result)
    
    return {
      success: true,
      url: result.url,
      key: key,
      size: file.size,
      etag: result.etag
    }

  } catch (error) {
    console.error('❌ OSS Upload failed:', error)
    
    let errorMessage = 'OSS Upload failed'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = (error as any).message || JSON.stringify(error)
    }
    
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Upload files to OSS in batches
 * @param files file array
 * @param options Upload options
 * @param config OSS configuration
 * @returns Promise<OSSUploadResult[]>
 */
export const uploadMultipleFilesToOSS = async (
  files: File[],
  options: OSSUploadOptions = {},
  config?: Partial<OSSConfig>
): Promise<OSSUploadResult[]> => {
  console.log(`Start bulk upload ${files.length} files to OSS`)
  
  const results: OSSUploadResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    console.log(`Upload the ${i + 1}/${files.length} files: ${file.name}`)
    
    // Create separate upload options for each file
    const fileOptions = {
      ...options,
      onProgress: options.onProgress ? 
        (percent: number) => options.onProgress!(percent * (i + 1) / files.length) : 
        undefined
    }
    
    const result = await uploadFileToOSS(file, fileOptions, config)
    results.push(result)
    
    if (!result.success) {
      console.error(`document ${file.name} Upload failed:`, result.error)
    }
  }
  
  const successCount = results.filter(r => r.success).length
  console.log(`Batch upload completed: ${successCount}/${files.length} files uploaded successfully`)
  
  return results
}

/**
 * Delete files in OSS
 * @param key file path
 * @param config OSS configuration
 * @returns Promise<boolean>
 */
export const deleteFileFromOSS = async (
  key: string,
  config?: Partial<OSSConfig>
): Promise<boolean> => {
  try {
    console.log('delete OSS document:', key)
    
    const client = createOSSClient(config)
    await client.delete(key)
    
    console.log('✅ OSS File deleted successfully')
    return true
  } catch (error) {
    console.error('❌ OSS File deletion failed:', error)
    return false
  }
}

/**
 * Get the signed URL of a file (for private file access)
 * @param key file path
 * @param expires Expiration time (seconds, default 3600)
 * @param config OSS configuration
 * @returns Promise<string>
 */
export const getSignedUrl = async (
  key: string,
  expires: number = 3600,
  config?: Partial<OSSConfig>
): Promise<string> => {
  try {
    const client = createOSSClient(config)
    const url = client.signatureUrl(key, {
      expires: expires,
      method: 'GET'
    })
    return url
  } catch (error) {
    console.error('❌ Get signature URL fail:', error)
    throw error
  }
}

/**
 * Check if the file exists in OSS
 * @param key file path
 * @param config OSS configuration
 * @returns Promise<boolean>
 */
export const checkFileExists = async (
  key: string,
  config?: Partial<OSSConfig>
): Promise<boolean> => {
  try {
    const client = createOSSClient(config)
    await client.head(key)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Get file information
 * @param key file path
 * @param config OSS configuration
 * @returns Promise<any>
 */
export const getFileInfo = async (
  key: string,
  config?: Partial<OSSConfig>
): Promise<any> => {
  try {
    const client = createOSSClient(config)
    const result = await client.head(key)
    return result
  } catch (error) {
    console.error('❌ Failed to obtain file information:', error)
    throw error
  }
}
