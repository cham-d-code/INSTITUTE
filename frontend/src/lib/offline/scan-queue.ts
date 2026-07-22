import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ScanResult } from '@/types/domain'
import { attendanceApi, getDeviceIdSafe } from './queue-deps'

/**
 * Offline scan queue — FR-058 / MA-004.
 *
 * At the classroom door connectivity is intermittent, and a dropped scan is a
 * student marked absent who was present. So a scan is captured to IndexedDB
 * FIRST, with the on-device timestamp, and only then sent. If the send fails
 * (offline, timeout) the record stays queued and syncs automatically when
 * connectivity returns.
 *
 * The captured on-device time is preserved as `capturedAt` and travels with
 * the record; the server still stamps its own authoritative `markedAt` when it
 * finally accepts the scan (FR-050). The device clock decides nothing that
 * matters — not lateness, not ordering — it is only a breadcrumb.
 */

export interface QueuedScan {
  id: string
  token: string
  sessionId: string
  capturedAt: string
  deviceId: string
  /** Bumped each failed attempt, so the UI can surface a stuck record. */
  attempts: number
  lastError: string | null
}

interface ScanDB extends DBSchema {
  scans: {
    key: string
    value: QueuedScan
    indexes: { 'by-session': string }
  }
}

let dbPromise: Promise<IDBPDatabase<ScanDB>> | null = null

function db() {
  dbPromise ??= openDB<ScanDB>('tims-scan-queue', 1, {
    upgrade(database) {
      const store = database.createObjectStore('scans', { keyPath: 'id' })
      store.createIndex('by-session', 'sessionId')
    },
  })
  return dbPromise
}

export async function enqueueScan(token: string, sessionId: string): Promise<QueuedScan> {
  const record: QueuedScan = {
    id: crypto.randomUUID(),
    token,
    sessionId,
    capturedAt: new Date().toISOString(),
    deviceId: getDeviceIdSafe(),
    attempts: 0,
    lastError: null,
  }
  const database = await db()
  await database.put('scans', record)
  return record
}

export async function getQueuedScans(): Promise<QueuedScan[]> {
  const database = await db()
  return database.getAll('scans')
}

export async function countQueuedScans(): Promise<number> {
  const database = await db()
  return database.count('scans')
}

async function removeScan(id: string) {
  const database = await db()
  await database.delete('scans', id)
}

async function markFailed(record: QueuedScan, error: string) {
  const database = await db()
  await database.put('scans', { ...record, attempts: record.attempts + 1, lastError: error })
}

/** Result of draining the queue once. */
export interface SyncOutcome {
  synced: Array<{ record: QueuedScan; result: ScanResult }>
  failed: number
  remaining: number
}

let syncing = false

/**
 * Attempt to send every queued scan. Records that succeed are removed; records
 * that fail stay queued with their captured time intact for the next attempt.
 * Guarded so two triggers (a reconnect event and a manual tap) can't double-send.
 */
export async function syncQueuedScans(): Promise<SyncOutcome> {
  if (syncing) return { synced: [], failed: 0, remaining: await countQueuedScans() }
  syncing = true
  const synced: SyncOutcome['synced'] = []
  let failed = 0
  try {
    const pending = await getQueuedScans()
    for (const record of pending) {
      try {
        // The server rejects a duplicate (FR-053) rather than double-marking,
        // so replaying a scan that actually did land is safe.
        const result = await attendanceApi.scan(record.token, record.sessionId)
        await removeScan(record.id)
        synced.push({ record, result })
      } catch (err) {
        failed++
        await markFailed(record, err instanceof Error ? err.message : 'Sync failed')
      }
    }
  } finally {
    syncing = false
  }
  return { synced, failed, remaining: await countQueuedScans() }
}
