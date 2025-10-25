import type { CheckInRecord } from '@/types/models'
import { request } from './request'

export const getSocialRewardTasks = (seasonId: number = 1, size: number = 15) =>
  request({
    url: '/social/social-reward-rules/',
    method: 'GET',
    params: {
      seasonId,
      size
    }
  })

/**
 * Get the number of invitees
 * @returns
 */
export const getReferralsCount = () =>
  request({
    url: '/social/profile/',
    method: 'GET'
  })

/**
 * add follow on twitter
 * @returns
 */
export const followTwitterReward = () =>
  request({
    url: '/social/twitter-reward-follow/',
    method: 'POST'
  })

/**
 * add follow on twitter
 * @returns
 */
export const shareTwitterVideo = () =>
  request({
    url: '/social/twitter-reward-share-video/',
    method: 'POST'
  })

/**
 * Add follow to telegram
 * @returns
 */
export const followTelegramReward = () =>
  request({
    url: '/social/reward-join-telegram/',
    method: 'POST'
  })

/**
 * direct reward
 * @param code
 * @returns
 */
export const directReward = (code: string) =>
  request({
    url: '/social/reward-direct/',
    method: 'POST',
    data: { code }
  })

/**
 * Get boom moments videos
 * @returns
 */
export const getQuestVideos = () =>
  request({
    url: '/replay/manual_replays/',
    method: 'GET'
  })

/**
 * Get invitation ranking list
 * @returns
 */
export const getReferralsList = (page = 1, size = 10) =>
  request({
    url: '/social/ranking/',
    method: 'GET',
    params: { page, size }
  })

/**
 * Get check-in records
 */
export const getCheckInRecordsList = () =>
  request({
    url: '/assets/solana/checkin_logs/',
    method: 'GET'
  })
