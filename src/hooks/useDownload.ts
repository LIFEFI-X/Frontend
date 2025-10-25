import { getDownloadLink } from '@/apis/game'

export function useDownload() {

    const donwload = () => {
        getDownloadLink().then((res: any) => {
          // It is not possible to open the download link directly. You need to use the a tag to trigger the download.
          if (res.downloadLink) {
            const a = document.createElement('a')
            a.href = res.downloadLink
            a.target = '_blank'
            document.body.appendChild(a) // Add to document to ensure clickable
            a.click()
            document.body.removeChild(a) // Remove when done
          } else {
            console.error('Download link is undefined or invalid.')
          }
        })
      }
      return {
        donwload
      }
}