import { request } from './request'

interface Create {
  email: string
  confirmCode: number | string
  socialInviteCode?: string | null
}

interface AccountParams {
  name?: string
  pw?: string
  avatar?: string
}

/**
 * PC registration
 * @param data {
 *  "email": "user@example.com",
 *  "confirmCode": "string"，
 *  "socialInviteCode": "string"
 * }
 * @returns
 */
export const register = (data: Create) =>
  request({
    url: '/account/web/register/',
    method: 'POST',
    data
  })

/**
 * Send email
 * @param email Mail
 * @returns
 */
export const sendEmail = (email: string) =>
  request({
    url: '/mail/register_code/',
    method: 'POST',
    data: { email }
  })

/**
 * Log in
 * @param email Mail
 * @param pw password
 * @returns
 */
export const login = (email: string, pw: string) =>
  request({
    url: '/account/web/login/',
    method: 'POST',
    data: { email, pw }
  })

/**
 * Get user information
 * @param userId User ID (optional, if not passed, the current user information will be obtained)
 * @returns
 */
export const getAccount = (userId?: number,address?:string) =>
  request({
    url: '/auth/user/info',
    method: 'GET',
    params:{userId: userId,address:address}
  })

/**
 * Get user information
 * @returns
 */
export const putAccount = (data: AccountParams) =>
  request({
    url: '/account/info/',
    method: 'PUT',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

export const putPw = (data: AccountParams, token: string) =>
  request({
    url: '/account/info/',
    method: 'PUT',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: 'Token ' + token
    }
  })

/**
 * Send email
 * @param email Mail
 * @returns
 */
export const sendResetEmail = (email: string) =>
  request({
    url: '/mail/reset_pw_code/',
    method: 'POST',
    data: { email }
  })

/**
 * reset password
 * {
 *  email: email
 *  confirmCode: invitation code
 * }
 * @returns
 */
export const resetPw = (data: Create) =>
  request({
    url: '/account/web/reset_pw/',
    method: 'POST',
    data
  })

/** Get selectKey */
export const getSelectKey = () =>
  request({
    url: '/generic/info/',
    method: 'POST',
    data: {
      // random: `${new Date().valueOf()}${randomString()}`
    }
  })

/**
 * Unbind EVM wallet
 * @returns
 */
export const unbindEvmWallet = () =>
  request({
    url: '/assets/wallet/evm/unbind/',
    method: 'POST'
  })

/**
 * Unbind Solana wallet
 * @returns
 */
export const unbindSolanaWallet = () =>
  request({
    url: '/assets/solana/unbind/',
    method: 'POST'
  })

/**
 * Send unbinding email verification code
 * @returns
 */
export const sendUnbindEmailCode = () =>
  request({
    url: '/mail/unbind_email_code/',
    method: 'POST'
  })

/**
 * Unbind email
 * @param confirmCode Verification code
 * @returns
 */
export const unbindEmail = (confirmCode: string | number) =>
  request({
    url: '/account/web/unbind_email/',
    method: 'POST',
    data: { confirmCode }
  })

/**
 * Get Twitter unbinding link
 * @returns
 */
export const getTwitterUnbindUrl = () =>
  request({
    url: '/social/twitter_unbind/',
    method: 'GET'
  })

/**
 * Twitter unbinding callback
 * @param oauthToken OAuth token
 * @param oauthVerifier OAuth verifier
 * @returns
 */
export const twitterUnbindCallback = (oauthToken: string, oauthVerifier: string) =>
  request({
    url: '/social/twitter_unbind/',
    method: 'POST',
    data: { oauthToken, oauthVerifier }
  })

// Discord unbinding related API
export const getDiscordUnbindUrl = () =>
  request({
    url: '/discord/unbind/',
    method: 'GET'
  })

export const discordUnbindCallback = (code: string) =>
  request({
    url: '/discord/unbind/',
    method: 'POST',
    data: { code }
  })

// Telegram unbinding API
export const telegramUnbind = (
  userId: string,
  username: string,
  fullName: string,
  isBot: boolean
) =>
  request({
    url: '/tg_bot/unbind/',
    method: 'POST',
    data: { userId, username, fullName, isBot }
  })
