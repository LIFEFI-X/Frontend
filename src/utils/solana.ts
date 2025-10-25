import SolanaWallets from 'solana-wallets-vue'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { OKXWalletAdapter } from '@/adapters/okx-wallet-solana-adapter'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import 'solana-wallets-vue/styles.css'

const solanaNetwork =
  import.meta.env.VITE_APP_ENV === 'production'
    ? WalletAdapterNetwork.Mainnet
    : WalletAdapterNetwork.Devnet
const walletSolanaOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({
      network: solanaNetwork
    }),
    new OKXWalletAdapter()
  ],
  autoConnect: false
}

localStorage.setItem('walletName', 'Phantom')

export { walletSolanaOptions, SolanaWallets }
