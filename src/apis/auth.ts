import { request } from './request'

/**
 * Get discord link address
 * @returns
 */
export const getDiscordUrl = () =>
  request({
    url: '/discord/login_url/',
    method: 'GET'
  })

/**
 * Get twitter link address
 * @returns
 */
export const getTwitterUrl = () =>
  request({
    url: '/social/twitter-auth-redirect/',
    method: 'GET'
  })

/**
 * discord verification
 * @returns
 */
export const discordLogin = (code: string) =>
  request({
    url: '/discord/login/',
    method: 'POST',
    data: { code }
  })

/**
 * Discord login to get Token
 * @returns
 */
export const discordRegister = (code: string) =>
  request({
    url: '/discord/login_or_register/',
    method: 'POST',
    data: { code }
  })

/**
 * twitter verification
 * @returns
 */
export const twitterLogin = (oauthToken: string, oauthVerifier: string) =>
  request({
    url: '/social/twitter-auth-callback/',
    method: 'POST',
    data: { oauthToken, oauthVerifier }
  })

/**
 * Log in to twitter to get token
 * @returns
 */
export const twitterRegister = (oauthToken: string, oauthVerifier: string) =>
  request({
    url: '/social/twitter_login_or_register/',
    method: 'POST',
    data: { oauthToken, oauthVerifier }
  })

/**
 * twitter video verification
 * @returns
 */
export const twitterVideoLogin = (oauthToken: string, oauthVerifier: string) =>
  request({
    url: '/social/twitter-video-callback/',
    method: 'POST',
    data: { oauthToken, oauthVerifier }
  })

/**
 * Telegram login to get Token
 * @returns
 */
export const telegramRegister = (
  userId: string,
  username: string,
  fullName: string,
  isBot: boolean
) =>
  request({
    url: '/tg_bot/login_or_register/',
    method: 'POST',
    data: { userId, username, fullName, isBot }
  })

/**
 * telegram binding
 * @returns
 */
export const telegramBind = (userId: string, username: string, fullName: string, isBot: boolean) =>
  request({
    url: '/tg_bot/bind/',
    method: 'POST',
    data: { userId, username, fullName, isBot }
  })
