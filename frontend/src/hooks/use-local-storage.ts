import { useCallback, useState } from 'react'

/**
 * Persisted UI preference (sidebar collapsed, table density, and similar).
 *
 * Only for cosmetic state. Never put a token, a permission, or anything the
 * server must trust in here — see the note in `lib/api/client.ts`.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initialValue
    } catch {
      // Corrupt JSON, or storage blocked in a private window — fall back
      // rather than taking the whole app down over a UI preference.
      return initialValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // Quota exceeded or storage disabled; keep the in-memory value.
        }
        return next
      })
    },
    [key],
  )

  return [stored, setValue] as const
}
