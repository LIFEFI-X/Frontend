// nft.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getWalletInfo } from '@/apis/assets'
import type { Nft, WalletInfoResponse } from '@/types/models'
import { useWalletStore } from '@/stores/wallet'

export const useNftStore = defineStore('nft', () => {
  const isLoading = ref(true)
  const nfts = ref<Nft[]>([])
  const walletStore = useWalletStore()

  const setNfts = (newNfts: Nft[]) => {
    nfts.value = newNfts
  }

  const addNft = (nft: Nft) => {
    nfts.value.push(nft)
  }

  // Used to get wallet information from API and update store
  const fetchWalletInfo = async (walletAddress?: string) => {
    // isLoading.value = true
    // try {
    //   // If walletAddress is empty, use walletStore.wallet.address
    //   const addressToUse = walletAddress || walletStore.wallet.address
    //   const response = await getWalletInfo(addressToUse) // Call the API
    //   //Update store status
    //   const updatedNfts = response.nfts
    //     .filter((nft) => !nft.name.toLocaleLowerCase().includes('wukong'))
    //     .map((nft) => {
    //       if (nft.whitelistInfo) {
    //         const normalPrice = nft.price
    //         // Parse the merkleProof string into an array
    //         let merkleProof = []
    //         try {
    //           merkleProof = JSON.parse(nft.whitelistInfo.merkleProof.replace(/'/g, '"'))
    //         } catch (error) {
    //           console.error('Failed to parse merkleProof:', error)
    //         }
    //         return {
    //           ...nft,
    //           mintFunction: nft.whitelistInfo.mintFunction,
    //           mintPriceEther: nft.whitelistInfo.mintPriceEther,
    //           mintButtonText: nft.whitelistInfo.mintButtonText,
    //           merkleProof: merkleProof,
    //           price: nft.whitelistInfo.mintPriceEther,
    //           normalPrice: normalPrice
    //         }
    //       }
    //       return nft
    //     })
    //   setNfts(updatedNfts)
    //   isLoading.value = false
    // } catch (error) {
    //   console.error('Failed to fetch wallet information:', error)
    //   isLoading.value = false
    // }
  }

  const setNftMinted = (nftId: number, minted: boolean) => {
    const nft = nfts.value.find((n) => n.id === nftId)
    if (nft) {
      nft.minted = minted
    }
  }

  return {
    isLoading,
    nfts,
    setNfts,
    addNft,
    fetchWalletInfo,
    setNftMinted
  }
})
