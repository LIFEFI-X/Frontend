import { defineStore } from 'pinia'
import { STORAGE_KEYS } from '@/constants'
import { encrypt, decrypt } from '@/utils'

import { ref } from 'vue'

export const useGlobalStore = defineStore('global', () => {
  // combination key
  const selectKey = ref<string>(localStorage.getItem(STORAGE_KEYS.SELECT_KEY) ?? '')
  if (selectKey.value) {
    selectKey.value = decrypt(import.meta.env.VITE_APP_SECRET_KEY, selectKey.value)
  }

  function setSelectKey(v: string) {
    selectKey.value = v
    localStorage.setItem(STORAGE_KEYS.SELECT_KEY, encrypt(import.meta.env.VITE_APP_SECRET_KEY, v))
  }

  return {
    selectKey,
    setSelectKey,
  }
})
