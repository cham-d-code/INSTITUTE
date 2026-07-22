import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { cn } from '@/lib/utils'

/**
 * Renders an opaque QR token to an image.
 *
 * The `value` is the server's opaque token, never the student's name or ID
 * (FR-041) — a photographed card must reveal nothing. High error correction so
 * a scuffed printed card still scans (MA-003).
 */
export function QrCode({
  value,
  size = 160,
  className,
}: {
  value: string
  size?: number
  className?: string
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(value, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: size * 2, // 2× for crisp printing
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then((url) => {
        if (alive) setDataUrl(url)
      })
      .catch(() => {
        if (alive) setDataUrl(null)
      })
    return () => {
      alive = false
    }
  }, [value, size])

  return (
    <div
      className={cn('bg-white grid place-items-center overflow-hidden rounded-lg', className)}
      style={{ width: size, height: size }}
    >
      {dataUrl ? (
        <img src={dataUrl} width={size} height={size} alt="" className="block" />
      ) : (
        <div className="bg-muted size-full animate-pulse" />
      )}
    </div>
  )
}
