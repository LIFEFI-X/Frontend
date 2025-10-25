# LifeFi Frontend

LifeFi is a SOL-native NFT co-creation and marketplace experience that turns AI knowledge bases into collectibles backed by on-chain ownership. The frontend powers https://www.lifefi.io/ and bridges the browser extension and backend services to deliver a fluid mint-to-market pipeline.

[Live](https://www.lifefi.io/) · [Plugin](https://github.com/LIFEFI-X/Plugin) · [Backend](https://github.com/LIFEFI-X/Backend)

## Table of Contents
- [Overview](#overview)
- [Highlights](#highlights)
- [Ecosystem](#ecosystem)
- [Architecture](#architecture)
- [NFT Minting Workflow](#nft-minting-workflow)
- [Royalties & Fees](#royalties--fees)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Project Structure](#project-structure)
- [Core Workflows](#core-workflows)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

## Overview
LifeFi Frontend is built with Vue 3, TypeScript, and Vite to deliver a responsive NFT marketplace tailored to the Solana ecosystem. It orchestrates wallet connectivity, asset uploads to object storage, on-chain minting via Metaplex Core, and synchronization with the LifeFi backend so creators and collectors can move from idea to tradable NFT seamlessly.

The application supports both traditional form-driven minting and one-click experiences bootstrapped by the LifeFi browser extension, enabling users to mint from curated knowledge bases in seconds.

## Highlights
- AI-to-NFT pipeline that pre-populates metadata from knowledge bases supplied by the LifeFi browser extension.
- Zero-royalty Solana minting by default, with configurable royalty splits for imported collections.
- Marketplace-ready listings with automatic platform fee breakdowns and transfer delegate safeguards for secure trades.
- Responsive, dark-themed UI with Ant Design Vue and rich micro-interactions powered by GSAP and Lottie.
- Localized experience with Vue I18n and wallet support through Solana Wallet Adapter integrations (e.g., OKX, Phantom).

## Ecosystem
| Project | Description |
| --- | --- |
| [LifeFi Frontend](https://www.lifefi.io/) | Vue 3 single-page app for browsing, minting, and trading SOL NFTs. |
| [LifeFi Plugin](https://github.com/LIFEFI-X/Plugin) | Browser extension that packages AI knowledge bases and pushes them into the minting flow through a `transfer` payload. |
| [LifeFi Backend](https://github.com/LIFEFI-X/Backend) | API layer for asset storage, wallet auth, marketplace listings, and trade settlement bookkeeping. |

## Architecture
```
Browser (Vue 3 SPA)
   ├─ solana-wallets-vue & custom adapters
   ├─ Pinia stores (user, core NFT, marketplace)
   ├─ Ant Design Vue UI + GSAP/Lottie animations
   └─ @tanstack/vue-query for data fetching
        │
        ├─ LifeFi Backend (REST, Axios)
        │     ├─ NFT inventory, listings, bids
        │     └─ Wallet authentication
        │
        └─ Solana RPC (Metaplex UMI + MPL Core)
              ├─ 0% royalty NFT minting
              ├─ Collection creation & freeze
              └─ Transfer delegate approvals
```

## NFT Minting Workflow
### From the web app
1. **Connect a Solana wallet** – handled via `solana-wallets-vue` adapters and the LifeFi modal experience.  
2. **Describe the collectible** – upload media, edit metadata, and optionally select a collection. Assets are uploaded to Alibaba Cloud OSS and metadata JSON is generated on the fly.  
3. **Mint on Solana** – `CoreNftManager.createUserNft` invokes Metaplex Core to mint with 0% royalty, optionally freezing the asset and authorizing the marketplace when a price is provided.  
4. **Register with LifeFi** – the frontend calls `createNft` on the backend to sync the new asset, listing price, and metadata URL.  
5. **List immediately** – if a price was supplied, the NFT is marked as listed; otherwise creators can list later from the marketplace view.

### From the browser extension
1. The extension sends a `transfer` ID after curating knowledge bases.  
2. Visiting `/create-nft?transfer=<id>` loads the payload through `getTransferData`, previews all knowledge bases, and pre-fills the mint form.  
3. Creators can merge or pick individual knowledge entries before finalizing the minting flow above.

### Trade settlement safeguards
- The seller grants a transfer delegate to the marketplace (or winning bidder) before a sale.  
- Buyers trigger `buyNft`, which reconfirms ownership, enforces the delegate requirement, and executes a combined SOL transfer plus NFT handover in a single transaction builder.  
- Platform fees and royalties are calculated up front so both sides can verify expected payouts.

## Royalties & Fees
| Scenario | Rate | Source | Notes |
| --- | --- | --- | --- |
| Primary mint via LifeFi | 0% royalty | `CoreNftManager.createUserNft` | Minted NFTs default to zero basis points on-chain. |
| Marketplace platform fee | 2.5% | `CreateNft.vue` / `coreNftManager.buyNft` | Displayed in the minting form and deducted during purchase. |
| Creator royalty on resale | Configurable (defaults to 0%) | `coreNftManager.buyNft` `royaltyPercentage` param | Keeps imported collections compliant; shared with creator if metadata specifies a percentage. |

## Quick Start
```bash
# Requirements
# - Node.js ≥ 18
# - pnpm ≥ 8

pnpm install
pnpm dev        # start with Vite (default dev mode)
pnpm build      # production build
pnpm preview    # serve the build locally
```

## Configuration
Set environment variables through `.env.*` files or the shell before running the app.

| Key | Description |
| --- | --- |
| `VITE_APP_API_ORIGIN` | Base URL for the LifeFi backend. |
| `VITE_APP_API_PREFIX` | API prefix, defaults to `/api`. |
| `VITE_APP_SOLANA_RPC` | Primary Solana RPC endpoint used by Metaplex UMI. |
| `VITE_APP_SOLANA_RPCS_STRING` | Comma-separated failover RPC URLs. |
| `VITE_APP_ENV_SOLANA` | Target Solana environment (`mainnet`, `devnet`, etc.). |
| `VITE_APP_WC_PROJECT_ID` | WalletConnect project identifier for mobile wallets. |
| `VITE_APP_CANDY_MACHINE_ID` | Candy Machine ID for legacy drops. |
| `VITE_APP_MICROLAMPORTS` | Minimum airdrop / incentive threshold (lamports). |

## Project Structure
```
src/
  apis/           # Axios request wrappers for backend endpoints
  components/     # Reusable UI components (home hero, headers, modals)
  stores/         # Pinia stores for user, Solana core NFT logic, modals
  utils/          # OSS uploads, Metaplex helpers, local storage utilities
  views/          # Route views (Home, Marketplace, CreateCollection, CreateNft, NftDetail)
  router/         # SPA routes definition
  assets/         # Static images, icons, and animations
```

## Core Workflows
- **Create a collection** – `/create-collection` crafts collection metadata, sets supply limits, and defines the (default) 0% royalty fee before minting the collection on-chain.  
- **Mint & list an NFT** – `/create-nft` handles asset upload, 0% royalty minting, optional immediate listing, and backend registration.  
- **Extension-assisted minting** – loads multi-knowledge-base payloads from the LifeFi Plugin and accelerates metadata authoring.  
- **Purchase flow** – marketplace listings enforce transfer delegate approval, split platform fees (2.5%), and optionally honor creator royalties before notifying the backend of the completed order.

## Tech Stack
- Vue 3, TypeScript, Vite, Pinia, Vue Router, Vue I18n
- Ant Design Vue, Naive UI virtual lists, GSAP, Lottie, Swiper
- @tanstack/vue-query for server state and caching
- Metaplex UMI, MPL Core, Solana Wallet Adapter, @solana/web3.js
- Axios, ali-oss for uploads, nft.storage utilities

## Contributing
Contributions and issues are welcome. Please fork the repository, create a feature branch, and open a pull request describing your changes. Remember to run `pnpm type-check` and `pnpm lint` before submitting.

## License
Licensed under the [MIT License](./LICENSE). 
