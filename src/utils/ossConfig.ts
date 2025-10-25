import OSS from 'ali-oss'

// OSS configuration interface
export interface OSSConfig {
  region: string
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  // STS temporary authorization configuration (recommended for browser environment)
  stsToken?: string
  // Custom domain name
  endpoint?: string
  // Whether to use HTTPS
  secure?: boolean
}

// Default OSS configuration - please modify according to your actual configuration
export const defaultOSSConfig: OSSConfig = {
  // Alibaba Cloud OSS region, Singapore region
  region: 'oss-ap-southeast-1',
  
  // Access key ID (environment variables recommended)
  accessKeyId: 'LTAI5tLiuonwebjVXJjJGY3n',
  
  // Access key Secret (environment variables are recommended)
  accessKeySecret: 'NAJ6LSi6Ih9JI7Zt8UFwCDmRVfOexf',
  
  // OSS bucket name
  bucket: 'lifeif',
  
  // STS temporary authorization token (optional, recommended for browser environments)
  stsToken: process.env.VITE_OSS_STS_TOKEN || '',
  
  // Whether to use HTTPS
  secure: true,
}

// Create an OSS client instance
export const createOSSClient = (config?: Partial<OSSConfig>): OSS => {
  const finalConfig = { ...defaultOSSConfig, ...config }
  
  if (!finalConfig.accessKeyId || !finalConfig.accessKeySecret || !finalConfig.bucket) {
    throw new Error('OSS Configuration is incomplete, please check accessKeyId, accessKeySecret and bucket Configuration')
  }

  return new OSS({
    region: finalConfig.region,
    accessKeyId: finalConfig.accessKeyId,
    accessKeySecret: finalConfig.accessKeySecret,
    bucket: finalConfig.bucket,
    stsToken: finalConfig.stsToken,
    endpoint: finalConfig.endpoint,
    secure: finalConfig.secure,
  })
}

// OSS upload options
export interface OSSUploadOptions {
  // The storage path of the file in OSS
  key?: string
  // folder prefix
  prefix?: string
  // Whether to generate unique filenames
  generateUniqueKey?: boolean
  // Upload progress callback
  onProgress?: (progress: number) => void
  // Custom headers
  headers?: Record<string, string>
  // Storage type: 'Standard' | 'IA' | 'Archive' | 'ColdArchive'
  storageClass?: string
  // Whether to overwrite the file with the same name
  overwrite?: boolean
}

// Generate unique file name
export const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = originalName.substring(originalName.lastIndexOf('.'))
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))
  return `${nameWithoutExt}_${timestamp}_${random}${ext}`
}

// Get the MIME type of a file
export const getMimeType = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    // picture
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    
    // document
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // Audio and video
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    
    // other
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  }
  
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

// Verify OSS configuration
export const validateOSSConfig = (config: OSSConfig): boolean => {
  return !!(config.accessKeyId && config.accessKeySecret && config.bucket && config.region)
}

// Get the public access URL of a file
export const getFileUrl = (config: OSSConfig, key: string): string => {
  const protocol = config.secure !== false ? 'https' : 'http'
  const endpoint = config.endpoint || `${config.bucket}.${config.region}.aliyuncs.com`
  return `${protocol}://${endpoint}/${key}`
}
