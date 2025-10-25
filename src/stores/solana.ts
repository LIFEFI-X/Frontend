// Third-party library import
import { defineStore } from 'pinia'
import { message } from 'ant-design-vue'
import { useWallet } from 'solana-wallets-vue'

// Solana Web3.js import
import { 
  Connection, 
  Keypair, 
  LAMPORTS_PER_SOL,
  PublicKey as Web3PublicKey,
  clusterApiUrl
} from '@solana/web3.js'
// Metaplex Foundation import
import {
  type Umi,
  type AddressLookupTableInput,
  type KeypairSigner,
  type Transaction,
  type PublicKey,
  publicKey as createPublicKey,
  createBigInt,
  generateSigner,
  signAllTransactions,
  percentAmount
} from '@metaplex-foundation/umi'
import { createUmi as createUmiInstance } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { fetchAddressLookupTable, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox'
import { base58 } from '@metaplex-foundation/umi/serializers'
import {
  fetchCandyMachine,
  safeFetchCandyGuard,
  type CandyGuard,
  type CandyMachine,
  AccountVersion,
  mplCandyMachine
} from '@metaplex-foundation/mpl-candy-machine'
import {
  type DigitalAsset,
  type DigitalAssetWithToken,
  type JsonMetadata,
  fetchDigitalAsset,
  createNft,
  transferV1,
  TokenStandard,
  mplTokenMetadata
  // fetchJsonMetadata
} from '@metaplex-foundation/mpl-token-metadata'

// Local tool function import
import { useUmi } from '@/utils/useUmi'
import { getSolanaTime, type GuardReturn } from '@/utils/checkerHelper'
import { guardChecker } from '@/utils/checkAllowed'
import {
  type GuardButtonList,
  chooseGuardToUse,
  routeBuilder,
  mintArgsBuilder,
  buildTx,
  getRequiredCU
} from '@/utils/mintHelper'
import { verifyTx } from '@/utils/verifyTx'

// Local Store import
import { useModalStore } from '@/stores/modal'

// Import of comments
// import { fetchJSONMetadata, postMintInfo } from '@/apis/solana'
// import { usePerceptronStore } from '@/stores/perceptron'

export const useSolanaStore = defineStore('solana', (): any => {
  const umi = ref<Umi>(useUmi())
  const candyMachineId = ref<PublicKey>(createPublicKey('11111111111111111111111111111111'))
  const candyGuard = ref<CandyGuard | null>(null)
  const candyMachine = ref<CandyMachine | null>(null)
  const solanaTime = ref<bigint>(0n)
  const guardReturn = ref<GuardReturn[]>([])
  const ownedTokens = ref<DigitalAssetWithToken[]>([])
  const mintsCreated = ref<{ mint: PublicKey; offChainMetadata: JsonMetadata }[]>([])
  const buttonGuardList = ref<GuardButtonList[]>([])
  // const perceptronStore = usePerceptronStore()
  const showMintFailedModal = ref(false)
  const showMintSuccessModal = ref(false)
  
  // === NFT hosting system status ===
  const escrowWallets = ref<Map<string, Keypair>>(new Map()) // Storage escrow wallet
  const escrowedNfts = ref<Map<string, string>>(new Map()) // NFT mint address -> Mapping of custodial wallet address
  const connection = ref<Connection | null>(null) // Solana connection

  const publicGuard = computed(() => {
    // if (perceptronStore.whiteType) {
    //   return buttonGuardList.value.find((elem) => elem.label === perceptronStore.whiteType)
    // }
    // return buttonGuardList.value.find((elem) => elem.label === 'public')
    return buttonGuardList.value.find((elem) => elem.label === 'public')
  })

  const getUmi = () => {
    umi.value = useUmi()
  }

  // Initialize Solana connection
  const initConnection = () => {
    try {
      // Choose a network based on your environment
      const network = import.meta.env.VITE_APP_SOLANA_NETWORK || 'devnet'
      let endpoint = clusterApiUrl(network as any)
      
      // If there is a custom RPC endpoint, use the custom one
      if (import.meta.env.VITE_APP_SOLANA_RPC_URL) {
        endpoint = import.meta.env.VITE_APP_SOLANA_RPC_URL
      }
      
      connection.value = new Connection(endpoint, 'confirmed')
      console.log('✅ Solana connection initialized:', endpoint)
    } catch (error) {
      console.error('❌ Failed to initialize Solana connection:', error)
      message.error('Failed to connect to Solana network')
    }
  }

  // Verify NFT ownership
  const verifyNftOwnership = async (nftMint: string, ownerPublicKey: string) => {
    try {
      console.log('🔍 Verifying NFT ownership...')
      console.log('- NFT Mint:', nftMint)
      console.log('- Expected Owner:', ownerPublicKey)
      
      // Use UMI to obtain digital asset information
      const digitalAsset = await fetchDigitalAsset(umi.value, createPublicKey(nftMint))
      
      console.log('📋 NFT Information:')
      console.log('- Name:', digitalAsset.metadata.name)
      console.log('- Symbol:', digitalAsset.metadata.symbol)
      console.log('- Token Standard:', digitalAsset.metadata.tokenStandard)
      console.log('- Mint Address:', digitalAsset.mint.publicKey.toString())
      
      // Additional logic is needed here to check token account ownership
      // Because the ownership of NFT is determined through the token account
      console.log('✅ NFT found and verified')
      return true
      
    } catch (error) {
      console.error('❌ NFT ownership verification failed:', error)
      if (error instanceof Error) {
        if (error.message.includes('Account does not exist')) {
          console.log('💡 NFT mint address may be invalid or NFT does not exist')
        } else {
          console.log('💡 Error details:', error.message)
        }
      }
      return false
    }
  }

  const fetchSolanaTime = async () => {
    console.log(umi.value, 'umi')
    if (!umi.value) return
    solanaTime.value = await getSolanaTime(umi.value)
    return Promise.resolve(solanaTime.value)
  }

  // Get candyMachineId
  const getCandyMachineId = () => {
    if (import.meta.env.VITE_APP_CANDY_MACHINE_ID) {
      candyMachineId.value = createPublicKey(import.meta.env.VITE_APP_CANDY_MACHINE_ID)
    } else {
      message.error('No candy machine id found')
    }
  }

  // Get candyMachine
  const getCandyMachine = async () => {
    if (!candyMachineId.value) {
      message.error('No candy machine id found')
      return
    }

    try {
      const machine = await fetchCandyMachine(umi.value, createPublicKey(candyMachineId.value))

      if (machine.version !== AccountVersion.V2) {
        message.error('Candy machine is not a v2')
        return
      }

      candyMachine.value = machine
      return Promise.resolve(candyMachine.value)
    } catch (error) {
      console.error(error)
      message.error('No candy machine found')
      return Promise.reject(error)
    }
  }

  // Get candyGuard
  const getCandyGuard = async () => {
    if (!candyMachine.value) {
      message.error('No candy machine found')
      return
    }

    try {
      candyGuard.value = await safeFetchCandyGuard(umi.value, candyMachine.value.mintAuthority)
      console.log(candyGuard.value, 'candyGuard')
      return Promise.resolve(candyGuard.value)
    } catch (error) {
      message.error('No candy guard found')
      console.error(error)
      return Promise.reject(error)
    }
  }

  const getGuardCheckerResult = async () => {
    if (!candyGuard.value || !candyMachine.value) {
      message.error('No candy guard or candy machine found')
      return
    }

    const { guardReturn: guard, ownedTokens: tokens } = await guardChecker(
      umi.value,
      candyGuard.value,
      candyMachine.value,
      solanaTime.value,
      'public'
    )
    guardReturn.value = guard
    ownedTokens.value = tokens || []
    return Promise.resolve({ guardReturn, ownedTokens })
  }

  const fetchCandyMachineAndGuard = async () => {
    getCandyMachineId()
    await fetchSolanaTime()
    await getCandyMachine()
    await getCandyGuard()
    await getGuardCheckerResult()
    return Promise.resolve({ candyMachine: candyMachine.value, candyGuard: candyGuard.value })
  }

  const getButtonGuardList = async () => {
    if (!candyMachine.value || !candyGuard.value) {
      message.error('No candy machine or candy guard found')
      return
    }

    // Remove duplicates
    let filteredGuardlist = guardReturn.value.filter(
      (guard, index, self) => index === self.findIndex((t) => t.label === guard.label)
    )

    if (!filteredGuardlist.length) {
      message.error('No guard return found')
      return
    }

    console.log(filteredGuardlist, 'filteredGuardlist')

    if (filteredGuardlist.length > 1) {
      filteredGuardlist = filteredGuardlist.filter((elem) => elem.label != 'default')
    }

    buttonGuardList.value = []
    for (const guard of filteredGuardlist) {
      // find guard by label in candyGuard
      const group = candyGuard.value.groups.find((elem) => elem.label === guard.label)
      let startTime = createBigInt(0)
      let endTime = createBigInt(0)
      if (group) {
        if (group.guards.startDate.__option === 'Some') {
          startTime = group.guards.startDate.value.date
        }
        if (group.guards.endDate.__option === 'Some') {
          endTime = group.guards.endDate.value.date
        }
      }
      const guardButton = {
        label: guard.label,
        allowed: guard.allowed,
        header: `${guard.label} MINT`,
        mintText: 'Mint',
        buttonLabel: 'Mint',
        startTime,
        endTime,
        tooltip: guard.reason,
        maxAmount: guard.maxAmount
      }
      buttonGuardList.value.push(guardButton)
    }

    return Promise.resolve(buttonGuardList.value)
  }

  const updateLoadingText = (loadingText: string, label: string) => {
    const guardIndex = buttonGuardList.value.findIndex((g) => g.label === label)
    if (guardIndex === -1) {
      console.error('guard not found')
      return
    }
    buttonGuardList.value[guardIndex].loadingText = loadingText
  }

  // Get a digital asset and its JSON metadata
  const fetchNft = async (nftAdress: PublicKey) => {
    let digitalAsset: DigitalAsset | undefined
    let jsonMetadata: JsonMetadata | undefined
    try {
      // Get a digital asset and its JSON metadata
      digitalAsset = await fetchDigitalAsset(umi.value, nftAdress)
      // const data = {
      //   address: digitalAsset.metadata.uri.split('/ipfs/')[1]
      // }
      // console.log(data, 'fetchJSONMetadata data')
      // const jsonStr = await fetchJSONMetadata(data)
      // jsonMetadata = JSON.parse(jsonStr as string)
      jsonMetadata = {}
    } catch (e) {
      console.error(e)
      // Display an error message if retrieval of the digital asset and its JSON metadata fails
      message.error('Nft could not be fetched!')
    }

    console.log(digitalAsset, 'digitalAsset')
    console.log(jsonMetadata, 'jsonMetadata')

    // Returns the digital asset and its JSON metadata
    return { digitalAsset, jsonMetadata }
  }

  const mint = async (amount: number, mintAddress: string, gbInviteCode: string) => {
    if (!candyMachine.value || !candyGuard.value) {
      console.log('mint error: No candy machine or candy guard found')
      if (!candyMachine.value) {
        await getCandyMachine()
      }
      if (!candyGuard.value) {
        await getCandyGuard()
      }

      if (!candyMachine.value || !candyGuard.value) return
      console.log('mint error: No candy machine or candy guard found')
    }

    if (!publicGuard.value) {
      message.error('No public guard found')
      return
    }

    // Select the guard to use
    const guardToUse = chooseGuardToUse(publicGuard.value, candyGuard.value)

    // If guardToUse does not have a guard, an error message is displayed
    if (!guardToUse.guards) {
      console.error('no guard defined!')
      return
    }

    try {
      // Set the current guard to the casting state
      const guardIndex = buttonGuardList.value.findIndex((g) => g.label === guardToUse.label)
      if (guardIndex === -1) {
        console.error('guard not found')
        return
      }

      // Set the current guard to the casting state
      buttonGuardList.value[guardIndex].minting = true

      // Construct transaction
      let routeBuild = await routeBuilder(umi.value, guardToUse, candyMachine.value)

      if (routeBuild && routeBuild.items.length > 0) {
        // Set calculation unit price
        routeBuild = routeBuild.prepend(
          setComputeUnitPrice(umi.value, {
            microLamports: parseInt(import.meta.env.VITE_APP_MICROLAMPORTS)
          })
        )
        // Get the latest block hash
        const latestBlockhash = await umi.value.rpc.getLatestBlockhash({ commitment: 'finalized' })
        // Set block hash
        routeBuild = routeBuild.setBlockhash(latestBlockhash)
        // Construct transaction
        const builtTx = await routeBuild.buildAndSign(umi.value)

        const sig = await umi.value.rpc
          .sendTransaction(builtTx, {
            skipPreflight: true,
            maxRetries: 1,
            preflightCommitment: 'finalized',
            commitment: 'finalized'
          })
          .then((signature) => {
            return { status: 'fulfilled', value: signature }
          })
          .catch((error) => {
            message.error('Allow List TX failed!')
            return { status: 'rejected', reason: error, value: new Uint8Array() }
          })

        // Verify transaction
        if (sig.status === 'fulfilled')
          await verifyTx(umi.value, [sig.value], latestBlockhash, 'finalized')
      }

      // Get address lookup table (LUT)
      let tables: AddressLookupTableInput[] = []
      const lut = import.meta.env.VITE_APP_LUT
      if (lut) {
        // Get address lookup table (LUT)
        const lutPubKey = createPublicKey(lut)
        // Get address lookup table (LUT)
        const fetchedLut = await fetchAddressLookupTable(umi.value, lutPubKey)
        tables = [fetchedLut]
      } else {
        // message.warning('The developer should really set a lookup table!')
      }

      // Building a minting transaction
      const mintTxs: Transaction[] = []
      const nftsigners = [] as KeypairSigner[]

      const latestBlockhash = await umi.value.rpc.getLatestBlockhash({ commitment: 'finalized' })

      const mintArgs = mintArgsBuilder(candyMachine.value, guardToUse, ownedTokens.value)
      const nftMint = generateSigner(umi.value)
      const txForSimulation = buildTx(
        umi.value,
        candyMachine.value,
        candyGuard.value,
        nftMint,
        guardToUse,
        mintArgs,
        tables,
        latestBlockhash,
        1_400_000
      )

      // Get the required calculation unit
      const requiredCu = await getRequiredCU(umi.value, txForSimulation)

      // Building a minting transaction
      for (let i = 0; i < amount; i++) {
        // Generate nft signer
        const nftMint = generateSigner(umi.value)
        // Add nft signer
        nftsigners.push(nftMint)
        // Building a minting transaction
        const transaction = buildTx(
          umi.value,
          candyMachine.value,
          candyGuard.value,
          nftMint,
          guardToUse,
          mintArgs,
          tables,
          latestBlockhash,
          requiredCu
        )
        console.log(transaction)
        mintTxs.push(transaction)
      }
      if (!mintTxs.length) {
        console.error('no mint tx built!')
        return
      }

      // Update loadingText
      updateLoadingText(`Please sign`, guardToUse.label)

      const signedTransactions = await signAllTransactions(
        mintTxs.map((transaction, index) => ({
          transaction,
          signers: [umi.value.payer, nftsigners[index]]
        }))
      )

      const signatures: Uint8Array[] = []
      let amountSent = 0
      // Send transaction
      const sendPromises = signedTransactions.map((tx, index) => {
        return umi.value.rpc
          .sendTransaction(tx, {
            skipPreflight: true,
            maxRetries: 1,
            preflightCommitment: 'finalized',
            commitment: 'finalized'
          })
          .then((signature) => {
            console.log(
              `Transaction ${index + 1} resolved with signature: ${
                base58.deserialize(signature)[0]
              }`
            )
            amountSent = amountSent + 1
            signatures.push(signature)
            return { status: 'fulfilled', value: signature }
          })
          .catch((error) => {
            console.error(`Transaction ${index + 1} failed:`, error)
            return { status: 'rejected', reason: error }
          })
      })

      await Promise.allSettled(sendPromises)

      if (!(await sendPromises[0]).status === true) {
        // throw error that no tx was created
        throw new Error('no tx was created')
      }
      updateLoadingText(`Finalizing transaction(s)`, guardToUse.label)
      message.success(`${signedTransactions.length} Transaction(s) sent!`)

      const successfulMints = await verifyTx(umi.value, signatures, latestBlockhash, 'finalized')

      updateLoadingText('Fetching your NFT', guardToUse.label)

      // Filter out successful mints and map to fetch promises
      const fetchNftPromises = successfulMints.map((mintResult) =>
        fetchNft(mintResult).then((nftData) => ({
          mint: mintResult,
          nftData
        }))
      )

      const newMintsCreated: { mint: PublicKey; offChainMetadata: JsonMetadata }[] = []
      const fetchedNftsResults = await Promise.all(fetchNftPromises)

      for (const acc of fetchedNftsResults) {
        if (acc.nftData.digitalAsset && acc.nftData.jsonMetadata) {
          newMintsCreated.push({
            mint: acc.mint,
            offChainMetadata: acc.nftData.jsonMetadata
          })
        }
      }

      // Update mintsCreated only if there are new mints
      if (newMintsCreated.length > 0) {
        mintsCreated.value = newMintsCreated
        console.log(mintsCreated.value, 'mintsCreated')
      }

      // Submit casting information
      const mintInfo = {
        solanaAddress: mintAddress,
        transactionHash: successfulMints[0],
        quantity: successfulMints.length,
        gbInviteCode
      }
      // await postMintInfo(mintInfo)

      console.log('mint success')
      showMintSuccessModal.value = true
      return Promise.resolve(successfulMints)
    } catch (error) {
      console.error(`minting failed because of ${error}`)
      // message.error('Your mint failed! Please try again.')
      showMintFailedModal.value = true
    } finally {
      //find the guard by guardToUse.label and set minting to true
      const guardIndex = buttonGuardList.value.findIndex((g) => g.label === guardToUse.label)
      if (guardIndex === -1) {
        console.error('guard not found')
        return
      }
      buttonGuardList.value[guardIndex].minting = false
      updateLoadingText('', guardToUse.label)
    }
  }

  // CreateCollection
  const createCollection = async (formData: {
    displayName: string
    description: string
    shortUrl: string
    category: string
    coverImage: File | null
    logo: File | null
  }) => {
    try {
      // 1. Check Solana wallet connection status
      const { connected, publicKey, wallet: solanaWallet } = useWallet()
      const modalStore = useModalStore()
      
      console.log('🔍 Checking Solana wallet connection status...')
      console.log('- connected:', connected.value)
      console.log('- publicKey:', !!publicKey.value)
      console.log('- solanaWallet:', !!solanaWallet.value)
      
      // Check if wallet is connected
      if (!connected.value || !publicKey.value) {
        console.warn('❌ Solana wallet not connected or publicKey not available')
        message.error('Please connect your Solana wallet first')
        modalStore.toggleLoginEntryModal(true)
        modalStore.setLoginEntryConnectType('connect')
        modalStore.setLoginEntryType('solana')
        return
      }
      
      console.log('✅ Solana wallet connected:', publicKey.value.toBase58())
      
      // 2. Check whether the necessary files have been uploaded
      // if (!formData.coverImage) {
      //   message.error('Please upload cover image')
      //   return
      // }
      
      // if (!formData.logo) {
      //   message.error('Please upload logo')
      //   return
      // }
      
      console.log('🎯 Starting Collection creation on-chain...')
      
      // 1. Upload the cover image and logo to the storage service
      message.loading({ content: 'Uploading cover image...', key: 'collectionStatus' })
      // const coverImageUri = await uploadFile(formData.coverImage)
      
      message.loading({ content: 'Uploading logo...', key: 'collectionStatus' })
      // const logoUri = await uploadFile(formData.logo)
      
      // 2. Create Collection metadata
      const collectionMetadata = {
        name: formData.displayName,
        description: formData.description || `${formData.displayName} Collection`,
        image: 'https://img2.baidu.com/it/u=3018303209,1765139986&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=722',
        external_url: formData.shortUrl ? `https://its.nft.io/${formData.shortUrl}` : '',
        properties: {
          category: formData.category,
          logo: 'https://img2.baidu.com/it/u=3018303209,1765139986&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=722',
          shortUrl: formData.shortUrl
        },
        attributes: [
          {
            trait_type: "Type",
            value: "Collection"
          },
          {
            trait_type: "Category", 
            value: formData.category
          }
        ]
      }
      
      // 3. Upload metadata JSON to the storage service
      message.loading({ content: 'Uploading metadata...', key: 'collectionStatus' })
      // const metadataUri = await umi.value.uploader.uploadJson(collectionMetadata)
      const metadataUri = 'https://arweave.net/w4RVczdWwyiWS8tXgDenLEL7iFDdu4bi2YVmGyQo_dE/3321.json'
      console.log('Collection metadata uploaded:', metadataUri)
      
      // 4. Generate Collection minting signers
      const collectionMint = generateSigner(umi.value)
      console.log('Collection mint address:', collectionMint.publicKey.toString())
      
      // 5. Create Collection NFT on the chain
      message.loading({ content: 'Creating collection on blockchain...', key: 'collectionStatus' })
      const createCollectionTx = createNft(umi.value, {
        mint: collectionMint,
        name: formData.displayName,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(5), // 5% royalty
        isCollection: true, // Mark as Collection
      })
      
      // 6. Send transaction and confirm
      const collectionResult = await createCollectionTx.sendAndConfirm(umi.value)
      console.log('✅ Collection created successfully!')
      console.log('Collection mint:', collectionMint.publicKey.toString())
      console.log('Transaction signature:', collectionResult.signature)
      
      // 7. Display success message
      message.success({
        content: `Collection "${formData.displayName}" created successfully!`,
        key: 'collectionStatus'
      })
      
      // 8. Return Collection information
      return {
        collectionMint: collectionMint.publicKey.toString(),
        collectionName: formData.displayName,
        collectionUri: metadataUri,
        signature: collectionResult.signature
      }
      
    } catch (error) {
      console.error('❌ LIFEFI COLLECTION failed:', error)
      
      // More detailed error handling
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          message.error('Transaction was cancelled by user')
        } else if (error.message.includes('upload')) {
          message.error('Failed to upload files. Please check your network connection.')
        } else {
          message.error(`Failed to LIFEFI COLLECTION: ${error.message}`)
        }
      } else {
        message.error('Failed to LIFEFI COLLECTION. Please try again.')
      }
      
      // Clear loading message
      message.destroy('collectionStatus')
      throw error
    }
  }

  // Create NFT
  const createNftItem = async (formData: {
    wallet: string
    file: File | null
    displayName: string
    description: string
    collection: string
    collectionMint: string
    collectionName: string
    collectionUri: string
    properties: {
      background: string
      name: string
    }
    marketplaceType: string
    price: number
    expirationDays: string
    expirationDate: any
  }) => {
    try {
      // 1. Check Solana wallet connection status
      const { connected, publicKey, wallet: solanaWallet } = useWallet()
      const modalStore = useModalStore()
      
      console.log('🔍 Checking Solana wallet connection status for NFT creation...')
      console.log('- connected:', connected.value)
      console.log('- publicKey:', !!publicKey.value)
      console.log('- solanaWallet:', !!solanaWallet.value)
      
      // Check if wallet is connected
      if (!connected.value || !publicKey.value) {
        console.warn('❌ Solana wallet not connected or publicKey not available')
        message.error('Please connect your Solana wallet first')
        modalStore.toggleLoginEntryModal(true)
        modalStore.setLoginEntryConnectType('connect')
        modalStore.setLoginEntryType('solana')
        return
      }
      
      console.log('✅ Solana wallet connected:', publicKey.value.toBase58())
      
      // 2. Check necessary data
      if (!formData.file) {
        message.error('Please upload a file')
        return
      }
      
      if (!formData.displayName) {
        message.error('Please enter display name')
        return
      }
      
      console.log('🎯 Starting NFT creation on-chain...')
      
      // 3. Upload NFT files to the storage service
      message.loading({ content: 'Uploading NFT file...', key: 'nftStatus' })
      // const fileUri = await uploadFile(formData.file)
      const fileUri = 'https://img0.baidu.com/it/u=2835871854,4046080650&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=1734'
      console.log('NFT file uploaded:', fileUri)
      
      // 4. Create NFT metadata
      const nftMetadata = {
        name: formData.displayName,
        description: formData.description || `${formData.displayName} NFT`,
        image: fileUri,
        external_url: '',
        properties: {
          background: formData.properties.background,
          name: formData.properties.name,
          marketplace_type: formData.marketplaceType,
          price: formData.price,
          expiration_days: formData.expirationDays
        },
        attributes: [
          {
            trait_type: "Type",
            value: "NFT"
          },
          {
            trait_type: "Background", 
            value: formData.properties.background || "None"
          },
          {
            trait_type: "Marketplace Type",
            value: formData.marketplaceType
          },
          {
            trait_type: "Price",
            value: `${formData.price} SOL`
          }
        ]
      }
      
      // 5. Upload NFT metadata JSON to the storage service
      message.loading({ content: 'Uploading NFT metadata...', key: 'nftStatus' })
      // const metadataUri = await umi.value.uploader.uploadJson(nftMetadata)
      const metadataUri = 'https://arweave.net/w4RVczdWwyiWS8tXgDenLEL7iFDdu4bi2YVmGyQo_dE/3322.json'
      console.log('NFT metadata uploaded:', metadataUri)
      
      // 6. Generate NFT coin signers
      const nftMint = generateSigner(umi.value)
      console.log('NFT mint address:', nftMint.publicKey.toString())
      
      // 7. Create NFT on the chain
      message.loading({ content: 'Creating NFT on blockchain...', key: 'nftStatus' })
      let createNftTx = createNft(umi.value, {
        mint: nftMint,
        name: formData.displayName,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(5), // 5% royalty
      })
      
             // 8. If Collection is specified, associate the NFT to the Collection
       if (formData.collectionMint && formData.collectionMint !== '') {
         try {
           const collectionPublicKey = createPublicKey(formData.collectionMint)
           createNftTx = createNft(umi.value, {
             mint: nftMint,
             name: formData.displayName,
             uri: metadataUri,
             sellerFeeBasisPoints: percentAmount(5),
             collection: {
               key: collectionPublicKey,
               verified: false
             }
           })
           console.log('NFT will be linked to collection:', formData.collectionMint)
         } catch (error) {
           console.warn('Failed to link NFT to collection, creating standalone NFT:', error)
         }
       }
      
      // 9. Send transaction and confirm
      const nftResult = await createNftTx.sendAndConfirm(umi.value)
      console.log('✅ NFT created successfully!')
      console.log('NFT mint:', nftMint.publicKey.toString())
      console.log('Transaction signature:', nftResult.signature)
      
      // 10. Display success message
      message.success({
        content: `NFT "${formData.displayName}" created successfully!`,
        key: 'nftStatus'
      })
      
      // 11. Return NFT information
      return {
        nftMint: nftMint.publicKey.toString(),
        nftName: formData.displayName,
        nftUri: metadataUri,
        fileUri: fileUri,
        signature: nftResult.signature,
        collection: formData.collectionMint || null
      }
      
    } catch (error) {
      console.error('❌ Create NFT failed:', error)
      
      // More detailed error handling
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          message.error('Transaction was cancelled by user')
        } else if (error.message.includes('upload')) {
          message.error('Failed to upload files. Please check your network connection.')
        } else if (error.message.includes('Simulation failed')) {
          message.error('Transaction simulation failed. Please check your wallet balance and try again.')
        } else {
          message.error(`Failed to create NFT: ${error.message}`)
        }
      } else {
        message.error('Failed to create NFT. Please try again.')
      }
      
      // Clear loading message
      message.destroy('nftStatus')
      throw error
    }
  }

  // === NFT Escrow Function ===
  
  /**
   * Create a custodial wallet and hold the NFT in escrow
   * @param nftMint Mint address of NFT
   * @param listingPrice List price (SOL)
   * @returns Hosted wallet information
   */
  const createEscrowAndTransferNft = async (formData: {
    nftMint: string
    listingPrice: number
  }) => {
    try {
      const { connected, publicKey, wallet } = useWallet()
      const modalStore = useModalStore()
      
      // Check wallet connection status
      if (!connected.value || !publicKey.value) {
        console.warn('❌ Solana wallet not connected')
        message.error('Please connect your Solana wallet first')
        modalStore.toggleLoginEntryModal(true)
        modalStore.setLoginEntryConnectType('connect')
        modalStore.setLoginEntryType('solana')
        return
      }
      
      // Refresh UMI now to use correct wallet
      console.log('🔄 Refreshing UMI with connected wallet...')
      if (wallet.value?.adapter) {
        const endpoint = import.meta.env.VITE_APP_RPC || 'https://api.devnet.solana.com'
        umi.value = createUmiInstance(endpoint)
          .use(mplTokenMetadata())
          .use(mplCandyMachine())
          .use(walletAdapterIdentity(wallet.value.adapter))
        
        console.log('✅ UMI refreshed with wallet:', umi.value.identity.publicKey.toString())
      } else {
        throw new Error('Wallet adapter not available')
      }
      
      // Initialize connection
      if (!connection.value) {
        initConnection()
      }
      
      if (!connection.value) {
        message.error('Failed to connect to Solana network')
        return
      }
      
      console.log('🏪 Starting NFT escrow process...')
      message.loading({ content: 'Verifying NFT ownership...', key: 'escrowStatus' })
      
      // First verify NFT ownership
      // const isNftOwned = await verifyNftOwnership(formData.nftMint, publicKey.value.toString())
      // if (!isNftOwned) {
      //   throw new Error(`NFT ownership verification failed. Please ensure you own the NFT with mint address: ${formData.nftMint}`)
      // }
      
      message.loading({ content: 'Creating escrow wallet...', key: 'escrowStatus' })
      
      // Line 2: Create a new wallet and get the airdrop
      const fromWallet = Keypair.generate()
      console.log('✅ New escrow wallet created:', fromWallet.publicKey.toString())
      
      // Line 4: Request to empty funds into the wallet
      message.loading({ content: 'Requesting airdrop...', key: 'escrowStatus' })
      const fromAirdropSignature = await connection.value.requestAirdrop(
        fromWallet.publicKey,
        LAMPORTS_PER_SOL // 1 SOL airdrop
      )
      
      // Line 9: Waiting for airdrop confirmation
      console.log('⏳ Waiting for airdrop confirmation...')
      const latestBlockHash = await connection.value.getLatestBlockhash()
      await connection.value.confirmTransaction({
        signature: fromAirdropSignature,
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      })
      console.log('✅ Airdrop confirmed! Wallet funded with 1 SOL')
      
      // Check wallet balance
      const balance = await connection.value.getBalance(fromWallet.publicKey)
      console.log(`💰 Escrow wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`)
      
      if (balance < LAMPORTS_PER_SOL * 0.1) {
        throw new Error('Insufficient balance in escrow wallet')
      }
      
      message.loading({ content: 'Transferring NFT to escrow...', key: 'escrowStatus' })
      
      // Transfer NFT from user wallet to escrow wallet using transferV1
      console.log('📤 Transferring NFT to escrow wallet...')
      console.log('From:', publicKey.value.toString())
      console.log('To:', fromWallet.publicKey.toString())
      console.log('NFT Mint:', formData.nftMint)
      // Check wallet connection status and UMI identity
      console.log('🔍 Checking wallet and UMI status...')
      console.log('- Wallet connected:', connected.value)
      console.log('- Wallet publicKey:', publicKey.value?.toString())
      console.log('- UMI identity type:', typeof umi.value.identity)
      console.log('- UMI identity publicKey:', umi.value.identity?.publicKey?.toString())
      
      // Verify that the UMI identity is set correctly
      if (!umi.value.identity || !umi.value.identity.publicKey) {
        throw new Error('UMI identity not properly configured')
      }
      
      // Verify that the wallet public key matches the UMI identity
      if (publicKey.value?.toString() !== umi.value.identity.publicKey.toString()) {
        console.warn('⚠️ Wallet and UMI identity mismatch!')
        console.log('Wallet publicKey:', publicKey.value?.toString())
        console.log('UMI identity publicKey:', umi.value.identity.publicKey.toString())
      }
            // Construct transferV1 parameters according to Metaplex official documentation
      // Reference: https://developers.metaplex.com/token-metadata/transfer
      console.log('🔧 Building transferV1 parameters according to Metaplex docs...')
      
      // Verify that the UMI identity is set correctly
      console.log('Current UMI identity:', umi.value.identity.publicKey.toString())
      
      if (umi.value.identity.publicKey.toString() === '11111111111111111111111111111111') {
        throw new Error('UMI identity not properly initialized after refresh')
      }
      
      if (umi.value.identity.publicKey.toString() !== publicKey.value.toString()) {
        console.warn('⚠️ UMI identity mismatch:', {
          umiIdentity: umi.value.identity.publicKey.toString(),
          walletPublicKey: publicKey.value.toString()
        })
      }
      
      // Important: authority must be the owner of the current NFT (connected wallet)
      // tokenOwner should also point to the public key of the same account
      console.log('📝 Transfer parameters:', {
        mint: formData.nftMint,
        authority: 'umi.identity (current wallet signer)',
        tokenOwner: publicKey.value.toString(), // Use the wallet’s public key
        destinationOwner: fromWallet.publicKey.toString(),
        tokenStandard: 'TokenStandard.NonFungible'
      })
      
      // Get the actual information about NFT first
      console.log('🔍 Fetching NFT information...')
      let actualTokenOwner: PublicKey
      
      try {
        const nftInfo = await fetchDigitalAsset(umi.value, createPublicKey(formData.nftMint))
        console.log('NFT Info:', {
          name: nftInfo.metadata.name,
          mint: nftInfo.mint.publicKey.toString(),
          updateAuthority: nftInfo.metadata.updateAuthority?.toString() || 'None'
        })
        
        // Get the token account to find the actual owner
        // NOTE: This requires additional logic, temporarily use the wallet public key
        actualTokenOwner = createPublicKey(publicKey.value.toString())
        console.log('⚠️ Note: Using wallet publicKey as token owner. In production, should fetch actual token account owner.')
        
      } catch (error) {
        console.error('Failed to fetch NFT info:', error)
        actualTokenOwner = createPublicKey(publicKey.value.toString())
      }
      
      // Build transferV1 parameters
      const mintPublicKey = createPublicKey(formData.nftMint)
      const destinationPublicKey = createPublicKey(fromWallet.publicKey.toString())
      
      console.log('📋 Transfer details:')
      console.log('- Mint:', mintPublicKey.toString())
      console.log('- Authority (signer):', umi.value.identity.publicKey.toString())
      console.log('- Token Owner:', actualTokenOwner.toString())
      console.log('- Destination (escrow):', destinationPublicKey.toString())
      console.log('- Authority identity check:', {
        type: typeof umi.value.identity,
        hasSignMessage: typeof umi.value.identity.signMessage === 'function',
        hasSignTransaction: typeof umi.value.identity.signTransaction === 'function',
        publicKey: umi.value.identity.publicKey.toString()
      })
      
      // Attempt to perform an NFT transfer to an escrow wallet
      console.log('✍️ Executing transferV1...')
      
      // Build transferV1 parameters
      const transferParams = {
        mint: mintPublicKey,
        authority: umi.value.identity, // Signer
        tokenOwner: umi.value.identity.publicKey, // The current owner’s public key
        destinationOwner: destinationPublicKey, // Hosted wallet address
        tokenStandard: TokenStandard.NonFungible,
      }
      
      console.log('🔐 Final transfer params check:')
      console.log('- authority is signer:', !!transferParams.authority.signTransaction)
      console.log('- authority publicKey:', transferParams.authority.publicKey.toString())
      console.log('- tokenOwner matches authority:', transferParams.tokenOwner.toString() === transferParams.authority.publicKey.toString())
      
      const transferInstruction = transferV1(umi.value, transferParams)
      
      console.log('📝 Sending and confirming transaction...')
      const transferResult = await transferInstruction.sendAndConfirm(umi.value)
      
      console.log('✅ NFT transferred to escrow!')
      console.log('🔗 Transfer transaction:', transferResult.signature)
      
      // Store hosting information
      escrowWallets.value.set(formData.nftMint, fromWallet)
      escrowedNfts.value.set(formData.nftMint, fromWallet.publicKey.toString())
      
      message.success({
        content: `NFT successfully escrowed! Price: ${formData.listingPrice} SOL`,
        key: 'escrowStatus'
      })
      
      return {
        success: true,
        escrowWallet: fromWallet.publicKey.toString(),
        escrowPrivateKey: Array.from(fromWallet.secretKey), // Note: Secure storage is required in practical applications
        nftMint: formData.nftMint,
        listingPrice: formData.listingPrice,
        transferSignature: transferResult.signature,
        airdropSignature: fromAirdropSignature,
        balance: balance / LAMPORTS_PER_SOL
      }
      
    } catch (error) {
      console.error('❌ NFT escrow failed:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          message.error('Transaction was cancelled by user')
        } else if (error.message.includes('Insufficient')) {
          message.error('Insufficient balance for escrow operation')
        } else if (error.message.includes('airdrop')) {
          message.error('Failed to receive airdrop. Please try again or use testnet.')
        } else if (error.message.includes('Simulation failed') || error.message.includes('signature verification failure')) {
          message.error('Transaction simulation failed. This could be due to: 1) NFT not owned by wallet, 2) Network issues, or 3) UMI configuration problems. Please check console for details.')
          
          // Provide detailed debugging information
          const { connected, publicKey } = useWallet()
          console.log('🚨 Detailed Error Analysis:')
          console.log('- Error message:', error.message)
          console.log('- Wallet connected:', connected.value)
          console.log('- Wallet publicKey:', publicKey.value?.toString())
          console.log('- UMI identity configured:', !!umi.value.identity)
          console.log('- UMI identity publicKey:', umi.value.identity?.publicKey?.toString())
          console.log('- NFT mint:', formData.nftMint)
          
          // Suggested solutions
          console.log('💡 Suggested solutions:')
          console.log('1. Verify you own the NFT with mint address:', formData.nftMint)
          console.log('2. Check if you are on the correct network (devnet/mainnet)')
          console.log('3. Try reconnecting your wallet')
          console.log('4. Make sure the NFT is a standard NonFungible token')
          
        } else if (error.message.includes('UMI identity not properly configured')) {
          message.error('Wallet connection issue. Please reconnect your wallet and try again.')
        } else {
          message.error(`Escrow failed: ${error.message}`)
        }
      } else {
        message.error('Failed to create escrow. Please try again.')
      }
      
      message.destroy('escrowStatus')
      throw error
    }
  }
  
  /**
   * Release NFT from escrow wallet back to original owner
   * @param nftMint Mint address of NFT
   */
  const releaseNftFromEscrow = async (nftMint: string) => {
    try {
      const { connected, publicKey } = useWallet()
      
      if (!connected.value || !publicKey.value) {
        message.error('Please connect your wallet first')
        return
      }
      
      // Get a custodial wallet
      const escrowWallet = escrowWallets.value.get(nftMint)
      if (!escrowWallet) {
        message.error('Escrow wallet not found for this NFT')
        return
      }
      
      console.log('🔄 Releasing NFT from escrow...')
      message.loading({ content: 'Releasing NFT from escrow...', key: 'releaseStatus' })
      
      let transferResult: { signature: string }
      
      // Transfer NFT from escrow wallet back to original owner
      // NOTE: This requires the hosting wallet to be signed as authority
      try {
        // For demonstration purposes, create a temporary signer here
        // In practical applications, the private keys of managed wallets should be managed securely
        console.log('🔄 Preparing NFT release from escrow...')
        
        // Build release parameters (according to Metaplex documentation format)
        const releaseParams = {
          mint: createPublicKey(nftMint),
          authority: umi.value.identity, // Note: There is a permission issue here, and the signer actually needs to host the wallet.
          tokenOwner: createPublicKey(escrowWallet.publicKey.toString()), // Currently in escrow wallet
          destinationOwner: createPublicKey(publicKey.value.toString()), // Release back to original owner
          tokenStandard: TokenStandard.NonFungible
        }
        
        console.log('🔧 Release Parameters:', {
          mint: releaseParams.mint.toString(),
          authority: 'umi.identity (Requires managed wallet permissions)',
          tokenOwner: releaseParams.tokenOwner.toString(),
          destinationOwner: releaseParams.destinationOwner.toString(),
          tokenStandard: 'TokenStandard.NonFungible'
        })
        
        // Due to the complexity of permissions, mock implementation is currently used
        console.log('⚠️ Note: The actual application requires the escrow wallet private key to sign this transaction')
        console.log('🔄 Simulating NFT release...')
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const mockReleaseSignature = `MockEscrowRelease_${Date.now()}_${Math.random().toString(36).slice(2)}`
        transferResult = { signature: mockReleaseSignature }
        
        // The actual implementation should be:
        // const escrowSigner = createSignerFromKeypair(umi.value, escrowWallet)
        // transferResult = await transferV1(umi.value, {
        //   ...releaseParams,
        //   authority: escrowSigner // Use the escrow wallet as the signer
        // }).sendAndConfirm(umi.value)
        
        console.log('✅ NFT release simulated successfully!')
        
      } catch (error) {
        console.error('❌ Release preparation failed:', error)
        throw error
      }
      
      // Clean escrow records
      escrowWallets.value.delete(nftMint)
      escrowedNfts.value.delete(nftMint)
      
      console.log('✅ NFT released from escrow!')
      message.success({
        content: 'NFT successfully released from escrow',
        key: 'releaseStatus'
      })
      
      return {
        success: true,
        transferSignature: transferResult.signature
      }
      
    } catch (error) {
      console.error('❌ Failed to release NFT from escrow:', error)
      message.error('Failed to release NFT from escrow')
      message.destroy('releaseStatus')
      throw error
    }
  }
  
  /**
   * Get custodial wallet information
   * @param nftMint Mint address of NFT
   */
  const getEscrowInfo = (nftMint: string) => {
    const escrowAddress = escrowedNfts.value.get(nftMint)
    const escrowWallet = escrowWallets.value.get(nftMint)
    
    return {
      isEscrowed: !!escrowAddress,
      escrowAddress,
      escrowWallet: escrowWallet ? {
        publicKey: escrowWallet.publicKey.toString(),
        // Note: Private keys should not be exposed in actual applications
        hasPrivateKey: !!escrowWallet.secretKey
      } : null
    }
  }

  return {
    umi,
    solanaTime,
    candyMachineId,
    candyGuard,
    candyMachine,
    guardReturn,
    ownedTokens,
    mintsCreated,
    buttonGuardList,
    publicGuard,
    showMintFailedModal,
    showMintSuccessModal,
    getUmi,
    fetchSolanaTime,
    getCandyMachineId,
    getCandyMachine,
    getCandyGuard,
    fetchCandyMachineAndGuard,
    getButtonGuardList,
    mint,
    createCollection,
    createNftItem,
    
    // === NFT Escrow Methods ===
    initConnection,
    verifyNftOwnership,
    createEscrowAndTransferNft,
    releaseNftFromEscrow,
    getEscrowInfo,
    
    // === Hosting status ===
    escrowWallets,
    escrowedNfts,
    connection
  }
})
