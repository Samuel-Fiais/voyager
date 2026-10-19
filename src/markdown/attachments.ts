import { useEffect, useState } from 'react'
import { db } from '@/storage/db'

const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i

export const isImagePath = (path: string) => IMAGE.test(path)

/** URL local (blob:) de um anexo da cópia do vault; null enquanto carrega ou se não existe. */
export function useAttachmentUrl(workspaceId: string | undefined, path: string | null) {
  const [url, setUrl] = useState<{ key: string; url: string | null } | null>(null)
  const key = `${workspaceId}|${path}`
  useEffect(() => {
    if (!workspaceId || !path) return
    let objectUrl: string | null = null
    let cancelled = false
    db.files.get([workspaceId, path]).then((file) => {
      if (cancelled) return
      if (file?.data) {
        const blob = path.toLowerCase().endsWith('.svg')
          ? new Blob([file.data], { type: 'image/svg+xml' })
          : file.data
        objectUrl = URL.createObjectURL(blob)
      } else if (file?.kind === 'text' && path.toLowerCase().endsWith('.svg') && file.text) {
        objectUrl = URL.createObjectURL(new Blob([file.text], { type: 'image/svg+xml' }))
      }
      setUrl({ key, url: objectUrl })
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [workspaceId, path, key])
  return url?.key === key ? url.url : null
}
