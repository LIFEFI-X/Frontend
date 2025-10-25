import { request } from './request'

/**
 * Send bound email verification code
 * @param data
 * {
 *    email: email
 * }
 * @returns
 */
export const sendBindEmailCode = (email: string) =>
  request({
    url: '/mail/bind_email_code/',
    method: 'POST',
    data: { email }
  })

/**
 * Bind email
 * @param data
 * {
 *    email: email
 *    confirmCode: verification code
 *    socialInviteCode: invitation code
 * }
 * @returns
 */
export const bindEmail = (data: object) =>
  request({
    url: '/account/web/bind_email/',
    method: 'POST',
    data
  })

/**
 * Bind email
 * @param data
 * {
 *    address: wallet address
 *    chainId: web3 wallet chain
 * }
 * @returns
 */
export const walletLogin = (data: object) =>
  request(
    {
      url: '/auth/connect/login',
      method: 'POST',
      data
    },
    false
  ).then(
    (result) => {
      return Promise.resolve((result as any)?.data)
    },
    (error) => {
      return Promise.reject(error)
    }
  )

export const confirmAddress = () =>
  request({
    url: '/account/web/confirm_address/',
    method: 'POST'
  })

/**
 * Wallet login
 * @param data
 * {
 *    address: wallet address
 * }
 * @returns
 */
export const solanaWalletLogin = (data: object) =>
  request(
    {
      url: '/auth/connect/login',
      method: 'POST',
      data
    },
    false
  ).then(
    (result) => {
      return Promise.resolve((result as any)?.data)
    },
    (error) => {
      return Promise.reject(error)
    }
  )

/**
 * Bind wallet
 * @param data
 * {
 *    address: wallet address
 * }
 * @returns
 */
export const solanaWalletConnect = (data: object) =>
  request(
    {
      url: '/assets/solana/connect/',
      method: 'POST',
      data
    },
    true
  )

/**
 * Confirm invitation code
 * @param data
 * {
 *    inviteCode: invitation code
 * }
 * @returns
 */
export const inviteCodeConfirm = (data: object) =>
  request({
    url: '/account/web/invite_code_confirm/',
    method: 'POST',
    data
  })
