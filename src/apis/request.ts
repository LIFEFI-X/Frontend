import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'
import { useModalStore } from '@/stores/modal'
import { message } from 'ant-design-vue'

// baseURL
const apiOrigin = import.meta.env.VITE_APP_API_PREFIX as string

/**
 *
 * @param options Request configuration
 * @param cancelToast Whether toast displays errors
 * @returns
 */
export function request(
  options: AxiosRequestConfig,
  cancelToast: boolean = false
) {
  return new Promise((resolve, reject) => {
    const global = useUserStore()

    // create an axios instance
    const request = axios.create({
      baseURL: 'https://api.lifefi.io/api',
      withCredentials: false,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Language': 'en-US',
        'accept-language': 'en-US'
      }
    })

    // request interception
    request.interceptors.request.use(async (config) => {
      if (config.headers) {
        // token - Add Authorization header to all requests
        if (global.accessToken) {
          config.headers.Authorization = `Bearer ${global.accessToken}`
          console.log('✅ Added Authorization header:', `Bearer ${global.accessToken.substring(0, 20)}...`)
        } else {
          console.warn('⚠️ No accessToken available, request may fail with 401')
        }
      }

      return config
    })

    // response interception
    request.interceptors.response.use(
      (res: any) => {
        const modalStore = useModalStore()
        if (res.data?.code === 401) {
          // Clear login information
          // global.clearAll()
          modalStore.toggleLoginEntryModal(true)
          modalStore.setLoginEntryType('all')
          modalStore.setLoginEntryConnectType('login')
          return Promise.reject(res.data)
        }
        return res.data
      },
      async (err: AxiosError) => {
        const modalStore = useModalStore()
        // Not logged in or your login has expired
        if (err.response?.code === 401) {
          // Clear login information
          // global.clearAll()
          modalStore.toggleLoginEntryModal(true)
          modalStore.setLoginEntryType('all')
          modalStore.setLoginEntryConnectType('login')
          return Promise.reject(err)
        }

        // When the error code is 60000000, the ModalNotification pop-up box is displayed.
        if (err.code === '60000000' || (err.response?.data as any).code === '60000000') {
          return modalStore.toggleUidModalNotification(true)
        }

        let errMsg

        const { ERR_NETWORK, ERR_CANCELED, ECONNABORTED } = AxiosError
        if ([ERR_NETWORK, ERR_CANCELED, ECONNABORTED].includes(err.code as string)) {
          errMsg = err.message
        } else {
          errMsg = (err.response?.data as any)?.detail
        }

        if (errMsg && errMsg === 'Please connect wallet first.') {
          modalStore.toggleConnectWalletModal(true)
        }

        // toast error
        if (!cancelToast) message.error(errMsg, 5)

        return Promise.reject(err)
      }
    )

    return request(options).then(
      (res) => {
        resolve(res)
      },
      (error) => {
        if (error.response) {
          reject(error.response.data)
        } else {
          reject(error)
        }
      }
    )
  })
}
