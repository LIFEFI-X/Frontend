import { defineStore } from 'pinia'
import { getTwitterUrl, twitterLogin, twitterRegister, twitterVideoLogin } from '@/apis/auth'
import { twitterUnbindCallback } from '@/apis/index'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'

export const useTwitterStore = defineStore('Twitter', () => {
  // Get Twitter certification link
  const fetchUrl = async () => {
    try {
      const res: any = await getTwitterUrl()

      const url = res.redirectUrl

      window.location.href = url
      // window.open(url, '_blank')
    } catch (error) {
      console.error(error)
    }
  }

  // After returning from the Twitter website, get the code, then request the backend interface to complete the authentication
  const twitterAuthorization = async (oauth_token: string, oauth_verifier: string) => {
    try {
      await twitterLogin(oauth_token, oauth_verifier)

      const { fetchAccountInfo } = useUserStore()

      // Update account information
      fetchAccountInfo()
    } catch (error) {
      console.error(error)
    }
  }

  // After returning from the discord website, get the code, then request the backend interface to complete the authentication.
  const twitterLoginOrRegister = async (oauth_token: string, oauth_verifier: string) => {
    const { setAccessToken, fetchAccountInfo } = useUserStore()

    try {
      const { token }: any = await twitterRegister(oauth_token, oauth_verifier)

      // save token
      setAccessToken(token)

      // Update account information
      fetchAccountInfo()
    } catch (error) {
      console.error(error)
    }
  }

  // After returning from the Twitter website, get the code, then request the backend interface to complete the authentication
  const twitterVideoAuthorization = async (oauth_token: string, oauth_verifier: string) => {
    try {
      await twitterVideoLogin(oauth_token, oauth_verifier)

      const { fetchAccountInfo } = useUserStore()

      // Update account information
      fetchAccountInfo()
    } catch (error) {
      console.error(error)
    }
  }

  // Twitter unbinding callback processing
  const twitterUnbindAuthorization = async (oauth_token: string, oauth_verifier: string) => {
    try {
      await twitterUnbindCallback(oauth_token, oauth_verifier)

      const { fetchAccountInfo } = useUserStore()

      // Update account information
      await fetchAccountInfo()

      // Display successful unbinding prompt
      message.success('Unbind successful')
    } catch (error: any) {
      console.error(error)
      const errorMessage = error?.detail || error?.message || 'Unbind failed'
      message.error(errorMessage)
      throw error
    }
  }

  return {
    fetchUrl,
    twitterAuthorization,
    twitterVideoAuthorization,
    twitterLoginOrRegister,
    twitterUnbindAuthorization
  }
})
