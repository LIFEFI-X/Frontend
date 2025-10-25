import { request } from './request'

/**
 * Get extended transmission data
 * @param transferId Transport ID
 */
export const getTransferData = (transferId: string) =>
  request({
    url: `/extension/transfer/${transferId}`,
    method: 'GET'
  })

