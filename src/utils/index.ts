import { encrypt, decrypt } from './aes'
import { request } from '@/apis/request'

/** Generate a random string */
const randomString = (len: number = 6): string => {
  const t = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678',
    a = t.length
  let n = ''
  for (let i = 0; i < len; i++) n += t.charAt(Math.floor(Math.random() * a))
  return n
}

const formatAddress = (address?: string) => {
  if (!address) return '--'
  return `${address?.slice(0, 5)}...${address?.slice(-3)}`
}

const formatAmount = (number: number | string) => {
  if (!number) return '--'
  return (parseFloat(number + '') + '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatUserName = (username?: string) => {
  if (!username) return '--'
  return `${username?.slice(0, 2)}***${username?.slice(-3)}`
}

/**
 * Calculate the hash code of a string
 *
 * @param str The string whose hash code is to be calculated
 * @returns returns the hash code of the string
 */
const hashCode = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

const avatarColors = [
  '#0071E3',
  '#FF9300',
  '#FF4D45',
  '#A945E3',
  '#E635CE',
  '#0071E3',
  '#FA243C',
  '#1D1D1F'
]
// const avatarColors = ['#00FFB4', '#F6255A', '#10E4F4', '#FFCA47', '#CA59FF', '#8DA8DA']

/**
 * Get user avatar color
 *
 * @param userId User ID
 * @returns returns the color of the user's avatar
 */
const getUserAvatarColor = (userId: string): string => {
  const hash = hashCode(userId) // Calculate the hash value of a string
  const index = Math.abs(hash) % avatarColors.length // Modulo operation to determine color index
  return avatarColors[index]
}

export {
  encrypt,
  decrypt,
  randomString,
  request,
  formatAddress,
  formatAmount,
  formatUserName,
  getUserAvatarColor
}
