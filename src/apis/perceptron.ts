import { request } from './request'

export const getWhitelistGroup = () =>
  request({
    url: '/account/web/solana_whitelist_group/',
    method: 'GET'
  })

export const getPerceptronDetail = () =>
  request({
    url: '/assets/solana/nft/',
    method: 'GET'
  })

export const getMintRecords = () =>
  request(
    {
      url: '/assets/solana/mint_logs/',
      method: 'GET'
    },
    true
  )

export const mintValidate = (data: any) =>
  request(
    {
      url: '/assets/solana/mint_validate/',
      method: 'POST',
      data
    },
    true,
    true
  )

export const fetchMintInfo = () =>
  request({
    url: '/assets/solana/polling/',
    method: 'GET'
  })
