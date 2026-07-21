import axios, { AxiosError, type AxiosInstance } from 'axios'

/**
 * The single HTTP client for the app.
 *
 * Auth uses an httpOnly refresh cookie plus a short-lived in-memory access
 * token. The access token is deliberately NOT written to localStorage: this
 * app holds minors' personal data (NFR-05) and an XSS bug should not hand an
 * attacker a durable credential. It lives in a module variable, so a page
 * reload silently re-mints it from the refresh cookie.
 */

let accessToken: string | null = null
let onUnauthenticated: (() => void) | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

/** Lets the auth layer register what happens when the session dies — normally
 *  clearing user state and bouncing to /login with a "signed out" notice. */
export function setUnauthenticatedHandler(handler: (() => void) | null) {
  onUnauthenticated = handler
}

export const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  // Required for the refresh cookie.
  withCredentials: true,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  // MA-005 / FR-050: every mutating record must carry the device it came from,
  // so the audit log can answer "which phone marked this?".
  const deviceId = getDeviceId()
  if (deviceId) config.headers['X-Device-Id'] = deviceId
  return config
})

/* --- Refresh handling ------------------------------------------------------
   A single in-flight refresh is shared by all callers. Without this, ten
   parallel queries hitting an expired token would fire ten refreshes and race
   each other into a logout. */

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= (async () => {
    try {
      const { data } = await axios.post<{ accessToken: string }>(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      setAccessToken(data.accessToken)
      return data.accessToken
    } catch {
      setAccessToken(null)
      return null
    } finally {
      // Cleared on the next tick so concurrent callers all observe this result.
      queueMicrotask(() => {
        refreshPromise = null
      })
    }
  })()
  return refreshPromise
}

interface RetriableConfig {
  _retried?: boolean
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (typeof error.config & RetriableConfig) | undefined
    const status = error.response?.status

    // FR-003: idle sessions time out server-side. One silent retry, then out.
    if (status === 401 && config && !config._retried && !config.url?.includes('/auth/')) {
      config._retried = true
      const token = await refreshAccessToken()
      if (token) return api(config)
      onUnauthenticated?.()
    }

    // FR-005 / MA-006: a deactivated assistant is rejected here, which signs
    // the device out on its next request.
    if (status === 403 && (error.response?.data as { code?: string })?.code === 'ACCOUNT_DISABLED') {
      onUnauthenticated?.()
    }

    return Promise.reject(error)
  },
)

/** A stable per-install identifier for the device column on attendance and
 *  payment records. Not a security control — it is an audit breadcrumb. */
const DEVICE_ID_KEY = 'tims.deviceId'

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

/** Normalises an API failure into something a toast can show without leaking
 *  a stack trace or raw SQL to an assistant. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined
    if (data?.message) return data.message
    if (data?.error) return data.error
    if (error.code === 'ECONNABORTED') return 'The server took too long to respond.'
    if (!error.response) return 'No connection to the server.'
  }
  return fallback
}
