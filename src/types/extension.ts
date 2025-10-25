/**
 * Knowledge base type definition
 */
export interface KnowledgeBase {
  id: string
  title: string
  content: string
  created_at: number
  tokens: number
  metadata?: {
    language: string
    category?: string
    tags?: string[]
  }
}

/**
 * Transfer preferences
 */
export interface TransferPreferences {
  merge_content: boolean
  language: string
  nft_collection?: string
  default_price?: number
}

/**
 * Transfer data structure
 */
export interface TransferData {
  transfer_type: 'single' | 'multiple'
  knowledge_bases: KnowledgeBase[]
  preferences: TransferPreferences
  timestamp: number
  source: string
  version: string
}

/**
 * Transfer response returned by API
 */
export interface TransferResponse {
  code: number
  message?: string
  data: {
    transferId: string
    data: TransferData
    knowledgeCount: number
    totalSize: number
    language: string
    createdAt: string
  }
  timestamp?: number
}

