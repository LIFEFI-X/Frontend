import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine'
import { createNoopSigner, publicKey, signerIdentity } from '@metaplex-foundation/umi'
import { nftStorageUploader } from '@metaplex-foundation/umi-uploader-nft-storage'
import { useWallet } from 'solana-wallets-vue'
import { type WalletAdapter } from '@solana/wallet-adapter-base'

export function useUmi() {
  let endpoint = 'https://api.devnet.solana.com'
  console.log(1111)
  // if (import.meta.env.VITE_APP_RPC) {
  //   endpoint = import.meta.env.VITE_APP_RPC
  // }

  const { wallet, publicKey: address } = useWallet()
  const umi = createUmi(endpoint)
    .use(mplTokenMetadata())
    .use(mplCandyMachine())
    .use(nftStorageUploader({ token: 'test' }))
  
  if (!address.value) {
    console.log(1111)
    const noopSigner = createNoopSigner(publicKey('11111111111111111111111111111111'))
    umi.use(signerIdentity(noopSigner))
  } else {
    console.log(address.value, 'address2222')
    umi.use(walletAdapterIdentity(wallet.value?.adapter as WalletAdapter))
  }

  console.log(umi)

  return umi
}
