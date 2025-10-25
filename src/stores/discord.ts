import { defineStore } from 'pinia'
import { getDiscordUrl, discordLogin, discordRegister } from '@/apis/auth'
import { getDiscordUnbindUrl, discordUnbindCallback } from '@/apis/index'
import { useUserStore } from '@/stores/user'
import { message } from 'ant-design-vue'

export const useDiscordStore = defineStore('discord', () => {
  // Get discord certification link
  const fetchUrl = async () => {
    try {
      const res: any = await getDiscordUrl()

      const url = res.url

      window.location.href = url
      // window.open(url, '_blank')
    } catch (error) {
      console.error(error)
    }
  }

  // After returning from the discord website, get the code, then request the backend interface to complete the authentication.
  const discordAuthorization = async (code: string) => {
    try {
      await discordLogin(code)

      const { fetchAccountInfo } = useUserStore()

      // Update account information
      fetchAccountInfo()
    } catch (error) {
      console.error(error)
    }
  }

  // After returning from the discord website, get the code, then request the backend interface to complete the authentication.
  const discordLoginOrRegister = async (code: string) => {
    const { setAccessToken, fetchAccountInfo } = useUserStore()
    try {
      const { token }: any = await discordRegister(code)
      setAccessToken(token)

      // Update account information
      fetchAccountInfo()
    } catch (error) {
      console.error(error)
    }
  }

  // Discord unbinding related methods
  const discordUnbindAuthorization = async (code: string) => {
    try {
      await discordUnbindCallback(code)

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

  return { fetchUrl, discordAuthorization, discordLoginOrRegister, discordUnbindAuthorization }
})
