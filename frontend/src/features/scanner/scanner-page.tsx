import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Html5Qrcode } from 'html5-qrcode'
import {
  CameraOff,
  CloudOff,
  Keyboard,
  Loader2,
  RefreshCw,
  ScanLine,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { ClassSession, ScanResult } from '@/types/domain'
import { attendanceApi, cardApi, qk, sessionApi } from '@/lib/api/endpoints'
import { apiErrorMessage } from '@/lib/api/client'
import { formatTime, formatTimeRange } from '@/lib/format'
import { useAuth } from '@/lib/auth/auth-store'
import { useOnlineStatus } from '@/hooks/use-online-status'
import {
  countQueuedScans,
  enqueueScan,
  syncQueuedScans,
} from '@/lib/offline/scan-queue'
import { playScanFeedback } from './scan-feedback'
import { ScanResultOverlay } from './scan-result-overlay'
import { PresetStatusPill } from '@/components/data/status-pill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

type TodaySession = ClassSession & { className: string; teacherName: string; hall: string | null }

const SCANNER_ELEMENT_ID = 'tims-qr-reader'

/** Suggest the session whose window contains 'now', else the next upcoming
 *  one (FR-051). */
function suggestSession(sessions: TodaySession[]): TodaySession | null {
  if (!sessions.length) return null
  const now = new Date()
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const active = sessions.find((s) => s.startTime <= hhmm && hhmm <= s.endTime)
  if (active) return active
  const upcoming = sessions.filter((s) => s.startTime >= hhmm).sort((a, b) => a.startTime.localeCompare(b.startTime))
  return upcoming[0] ?? sessions[0]
}

export function ScannerPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const online = useOnlineStatus()

  const sessionsQuery = useQuery({ queryKey: qk.todaySessions, queryFn: sessionApi.today })
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [recent, setRecent] = useState<Array<{ result: ScanResult; at: string; queued: boolean }>>([])
  const [unsynced, setUnsynced] = useState(0)
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'running' | 'error'>('idle')
  const [manualOpen, setManualOpen] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const busyRef = useRef(false)

  const sessions = sessionsQuery.data ?? []
  const session = sessions.find((s) => s.id === sessionId) ?? null

  // Auto-suggest the current session once loaded. Runs once — the `!sessionId`
  // guard makes the changing `sessions` array reference harmless.
  useEffect(() => {
    if (!sessionId && sessions.length) {
      const s = suggestSession(sessions)
      if (s) setSessionId(s.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.length, sessionId])

  const refreshUnsynced = useCallback(async () => {
    setUnsynced(await countQueuedScans())
  }, [])

  useEffect(() => {
    void refreshUnsynced()
  }, [refreshUnsynced])

  /** Core: resolve a scanned token against the selected session. */
  const handleToken = useCallback(
    async (token: string) => {
      if (busyRef.current || !sessionId) return
      busyRef.current = true
      try {
        if (!online) {
          // FR-058: capture now, sync later.
          await enqueueScan(token, sessionId)
          await refreshUnsynced()
          const queuedResult: ScanResult = {
            outcome: 'ok',
            student: null,
            className: session?.className ?? null,
            alreadyMarkedAt: null,
            attendance: null,
            feeStatus: null,
            isLate: false,
          }
          toast.info('Offline — scan queued and will sync when back online.')
          setRecent((r) => [{ result: queuedResult, at: new Date().toISOString(), queued: true }, ...r].slice(0, 30))
          playScanFeedback('duplicate')
        } else {
          const scan = await attendanceApi.scan(token, sessionId)
          playScanFeedback(scan.outcome)
          setResult(scan)
          setRecent((r) => [{ result: scan, at: new Date().toISOString(), queued: false }, ...r].slice(0, 30))
        }
      } catch (err) {
        toast.error(apiErrorMessage(err))
      } finally {
        // Small cool-down so a card held in frame doesn't fire repeatedly.
        setTimeout(() => {
          busyRef.current = false
        }, 900)
      }
    },
    [online, sessionId, session, refreshUnsynced],
  )

  /* --- Camera lifecycle --------------------------------------------------- */
  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, { verbose: false })
    scannerRef.current = scanner
    setCameraState('starting')

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decoded) => void handleToken(decoded),
        () => {}, // per-frame decode errors are noise; ignore
      )
      .then(() => {
        if (!cancelled) setCameraState('running')
      })
      .catch(() => {
        if (!cancelled) setCameraState('error')
      })

    return () => {
      cancelled = true
      const s = scannerRef.current
      scannerRef.current = null
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {})
      }
    }
    // Restart the camera only when the session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Auto-sync when connectivity returns.
  useEffect(() => {
    if (online && unsynced > 0) void handleSync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

  async function handleSync() {
    const outcome = await syncQueuedScans()
    await refreshUnsynced()
    if (outcome.synced.length) toast.success(`Synced ${outcome.synced.length} queued ${outcome.synced.length === 1 ? 'scan' : 'scans'}.`)
    if (outcome.failed) toast.warning(`${outcome.failed} scans still queued.`)
  }

  return (
    <div className="bg-sidebar text-sidebar-foreground safe-top safe-bottom flex min-h-svh flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground hover:bg-sidebar-accent size-10 shrink-0 rounded-xl"
          onClick={() => navigate('/')}
          aria-label="Exit scanner"
        >
          <X className="size-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <Select value={sessionId ?? ''} onValueChange={setSessionId}>
            <SelectTrigger className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground h-11 rounded-xl">
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              {sessions.length === 0 && (
                <div className="text-muted-foreground px-2 py-3 text-sm">No sessions today.</div>
              )}
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.className} · {formatTimeRange(s.startTime, s.endTime)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {online ? (
            <span className="text-status-ok flex items-center gap-1 text-xs font-semibold">
              <Wifi className="size-4" />
            </span>
          ) : (
            <span className="text-status-warn flex items-center gap-1 text-xs font-semibold">
              <WifiOff className="size-4" />
            </span>
          )}
          {unsynced > 0 && (
            <button
              onClick={handleSync}
              className="bg-status-warn text-status-warn-foreground flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold"
            >
              <CloudOff className="size-3.5" /> {unsynced}
            </button>
          )}
        </div>
      </header>

      {session && (
        <div className="text-sidebar-foreground/60 px-4 pb-2 text-center text-xs">
          {session.teacherName}
          {session.hall && ` · ${session.hall}`} · Signed in as {user?.fullName}
        </div>
      )}

      {/* Camera viewport */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-3xl bg-black">
          <div id={SCANNER_ELEMENT_ID} className="size-full [&_video]:size-full [&_video]:object-cover" />

          {/* Framing guides */}
          {cameraState === 'running' && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="border-status-ok/80 relative size-56 rounded-2xl border-2">
                <ScanLine className="text-status-ok absolute inset-x-0 top-1/2 mx-auto size-8 -translate-y-1/2 animate-pulse" />
              </div>
            </div>
          )}

          {(cameraState === 'starting' || cameraState === 'idle') && (
            <div className="text-sidebar-foreground/70 absolute inset-0 grid place-items-center gap-2">
              <Loader2 className="size-8 animate-spin" />
            </div>
          )}

          {cameraState === 'error' && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <CameraOff className="mx-auto size-10 opacity-60" />
                <p className="mt-3 text-sm font-semibold">Camera unavailable</p>
                <p className="text-sidebar-foreground/60 mt-1 text-xs">
                  Grant camera permission, or use manual entry below.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="text-sidebar-foreground/60 mt-4 text-center text-sm">
          {session ? 'Hold each student’s card up to the camera' : 'Select a session to begin'}
        </p>

        {/* Manual / demo controls */}
        <div className="mt-4 flex w-full max-w-sm flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/70 rounded-xl"
            onClick={() => setManualOpen((v) => !v)}
          >
            <Keyboard className="size-4" /> Manual entry
          </Button>
          <Button
            variant="outline"
            className="border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/70 rounded-xl"
            onClick={handleSync}
            disabled={unsynced === 0}
          >
            <RefreshCw className="size-4" /> Sync queue
          </Button>
        </div>

        {manualOpen && session && (
          <ManualPanel sessionId={session.id} onToken={handleToken} />
        )}
      </div>

      {/* Recent scans */}
      {recent.length > 0 && (
        <div className="border-sidebar-border border-t px-4 py-3">
          <p className="text-sidebar-foreground/50 mb-2 text-xs font-semibold tracking-wide uppercase">
            Recent ({recent.length})
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recent.map((r, i) => (
              <RecentChip key={i} entry={r} />
            ))}
          </div>
        </div>
      )}

      {result && <ScanResultOverlay result={result} onDismiss={() => setResult(null)} />}
    </div>
  )
}

function RecentChip({ entry }: { entry: { result: ScanResult; at: string; queued: boolean } }) {
  const { result, at, queued } = entry
  const tone =
    queued || result.outcome === 'duplicate'
      ? 'info'
      : result.outcome === 'ok'
        ? 'ok'
        : result.outcome === 'unpaid'
          ? 'warn'
          : 'stop'
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium',
        tone === 'ok' && 'bg-status-ok/20 text-status-ok',
        tone === 'warn' && 'bg-status-warn/20 text-status-warn',
        tone === 'stop' && 'bg-status-stop/20 text-status-stop',
        tone === 'info' && 'bg-status-info/20 text-status-info',
      )}
    >
      <span className="max-w-[120px] truncate font-semibold">
        {queued ? 'Queued offline' : (result.student?.displayName ?? result.student?.fullName ?? 'Unknown card')}
      </span>
      <span className="opacity-70">{formatTime(at)}</span>
    </div>
  )
}

/**
 * Manual entry — a forgotten or damaged card (FR-056) and, for review without
 * a camera, a demo panel that simulates scanning a roster student's card.
 */
function ManualPanel({ sessionId, onToken }: { sessionId: string; onToken: (token: string) => void }) {
  const [token, setToken] = useState('')
  const sessionQuery = useQuery({ queryKey: qk.session(sessionId), queryFn: () => sessionApi.get(sessionId) })

  async function simulate(studentId: string) {
    const active = await cardApi.activeToken(studentId)
    if (active) onToken(active.token)
  }

  const roster = sessionQuery.data
    ? [...sessionQuery.data.records.map((r) => ({ id: r.studentId, name: r.studentName })), ...sessionQuery.data.absentees.map((a) => ({ id: a.id, name: a.fullName }))]
    : []
  const unique = Array.from(new Map(roster.map((r) => [r.id, r])).values())

  return (
    <div className="border-sidebar-border bg-sidebar-accent/40 mt-4 w-full max-w-sm space-y-3 rounded-2xl border p-4">
      <div className="flex gap-2">
        <Input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste card token"
          className="border-sidebar-border bg-sidebar text-sidebar-foreground h-10 rounded-xl"
        />
        <Button
          className="rounded-xl"
          onClick={() => {
            if (token.trim()) {
              onToken(token.trim())
              setToken('')
            }
          }}
        >
          Mark
        </Button>
      </div>

      <div>
        <p className="text-sidebar-foreground/50 mb-2 flex items-center gap-1.5 text-xs font-semibold">
          <PresetStatusPill preset="guest" labelOverride="Demo" size="sm" /> Simulate a card scan
        </p>
        <div className="flex flex-wrap gap-1.5">
          {unique.slice(0, 8).map((s) => (
            <button
              key={s.id}
              onClick={() => simulate(s.id)}
              className="bg-sidebar text-sidebar-foreground/80 hover:text-sidebar-foreground rounded-lg px-2.5 py-1.5 text-xs font-medium"
            >
              {s.name}
            </button>
          ))}
          {unique.length === 0 && (
            <span className="text-sidebar-foreground/40 text-xs">Roster loads once a session is active.</span>
          )}
        </div>
      </div>
    </div>
  )
}
