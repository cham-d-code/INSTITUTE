/**
 * Indirection so the offline queue depends on the API seam and the device-id
 * helper without importing heavy modules that would pull the whole app into
 * the (future) service-worker bundle. When the real client lands, only the
 * `attendanceApi` re-export here changes.
 */
import { attendanceApi } from '@/lib/api/endpoints'
import { getDeviceId } from '@/lib/api/client'

export { attendanceApi }

export function getDeviceIdSafe(): string {
  try {
    return getDeviceId()
  } catch {
    return 'unknown-device'
  }
}
