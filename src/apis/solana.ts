import { request } from './request'

export const fetchJSONMetadata = (data: any) =>
  request(
    {
      url: '/assets/request_online/',
      method: 'POST',
      data
    },
    false,
    true
  )

export const postMintInfo = (data: any) =>
  request(
    {
      url: '/assets/solana/mint/ ',
      method: 'POST',
      data
    },
    true,
    true
  )
