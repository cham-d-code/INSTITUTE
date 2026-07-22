import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Forced password change — FR-004.
 *
 * Reached on first sign-in and after an owner-initiated reset. The route guard
 * won't let the user anywhere else until this is done.
 */
export function ChangePasswordPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const tooShort = next.length > 0 && next.length < 8
  const mismatch = confirm.length > 0 && next !== confirm

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (next.length < 8 || next !== confirm) return
    setSubmitting(true)
    // TODO: POST /api/auth/change-password { current, next }.
    setTimeout(() => {
      if (user) setUser({ ...user, mustChangePassword: false })
      toast.success('Password updated.')
      navigate(user?.role === 'assistant' ? '/scanner' : '/dashboard', { replace: true })
      setSubmitting(false)
    }, 500)
  }

  return (
    <div className="bg-background grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-sm">
        <div className="bg-primary text-primary-foreground mb-5 grid size-11 place-items-center rounded-2xl">
          <KeyRound className="size-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          For security, choose a new password before continuing.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current">Current / temporary password</Label>
            <Input
              id="current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="h-11 rounded-xl"
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next">New password</Label>
            <Input
              id="next"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              className="h-11 rounded-xl"
              autoComplete="new-password"
            />
            {tooShort && <p className="text-destructive text-xs">At least 8 characters.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="h-11 rounded-xl"
              autoComplete="new-password"
            />
            {mismatch && <p className="text-destructive text-xs">Passwords don't match.</p>}
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl"
            disabled={submitting || next.length < 8 || next !== confirm}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </div>
    </div>
  )
}
