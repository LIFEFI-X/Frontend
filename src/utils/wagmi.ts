import { http, createConfig, type Config } from '@wagmi/vue'
import { bsc, bscTestnet, mainnet } from '@wagmi/vue/chains'
import { injected, metaMask, walletConnect } from '@wagmi/vue/connectors'

export const config: Config = createConfig({
  chains: [mainnet, bsc, bscTestnet],
  connectors: [
    walletConnect({
      projectId: import.meta.env.VITE_APP_WC_PROJECT_ID
    }),
    metaMask(),
    // OKX wallet
    injected({
      target: () => ({
        id: 'okxWallet',
        name: 'OKX Wallet',
        provider: () => window.okxwallet
      })
    }),
    // Binance wallet (traditional way, also works in Binance environment)
    injected({
      target: () => ({
        id: 'binanceWallet',
        name: 'Binance Wallet',
        provider: () => window.BinanceChain || window.ethereum
      })
    })
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [bscTestnet.id]: http()
  }
})

declare module '@wagmi/vue' {
  interface Register {
    config: typeof config
  }
}

declare global {
  interface Window {
    okxwallet?: any
    phantom?: { solana?: any }
    BinanceChain?: any
    ton?: any
  }
}
