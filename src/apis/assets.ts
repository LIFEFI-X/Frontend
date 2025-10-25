import { request } from './request'
import type { WalletInfoResponse } from '@/types/models'

// Image upload response interface
interface ImageUploadResponse {
  code: number
  message: string
  data: {
    id: number
    originalFilename: string
    storedFilename: string
    filePath: string
    fileUrl: string
    fileType: string
    mimeType: string
    fileSize: number
    fileHash: string // CID
    uploadStatus: number
    width: number
    height: number
    duration: number
    thumbnailUrl: string
    createdAt: string
  }
  timestamp: number
}

interface WalletConnectParams {
  address: string
}

interface NFTActionParams {
  account_id: number
  nft_address: string
  minted?: boolean
  genesis_signed?: boolean
}

/**
 * Connect wallet
 * @param data {
 *  "network": "Ethereum",
 *  "address": "0x...",
 * }
 * @returns
 */
export const connectWallet = (data: WalletConnectParams) =>
  request({
    url: '/auth/connect/login',
    method: 'POST',
    data,
  })

/**
 * Get wallet information
 * @returns
 */
export const getWalletInfo = (walletaddress?: string): Promise<WalletInfoResponse> => {
  let url = '/assets/wallet/info/'
  if (walletaddress) {
    url += `?walletaddress=${encodeURIComponent(walletaddress)}`
  }
  return request({
    url: url,
    method: 'GET',
  }) as Promise<WalletInfoResponse>
}

/**
 * Notify the server about the completion of the blockchain operation
 * @param action Action type, e.g. 'mint', 'signGenesisProof', 'claimAirdrop'
 * @param data Operation-related data can be in any structure, according to the requirements of the back-end API
 */
export const notifyBlockchainOperation = async (action: string, data: any) => {
  try {
    // Build request data
    const payload = { action, ...data }
    // Send a request to a specific endpoint on the server
    await request(
      {
        url: '/assets/blockchain/operation/',
        method: 'POST',
        data: payload,
      },
      false
    )
    console.log(`${action} notification sent to server successfully.`)
  } catch (error) {
    console.error(`Failed to notify server about ${action}:`, error)
  }
}

export const confirmAccount = (accountId: number) =>
  request({
    url: '/assets/confirm_account/',
    method: 'POST',
    data: { accountId },
  })

// Upload pictures to the server
export const uploadImage = async (file: File): Promise<ImageUploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/upload/image',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }) as Promise<ImageUploadResponse>
}

// Export type
export type { ImageUploadResponse }
