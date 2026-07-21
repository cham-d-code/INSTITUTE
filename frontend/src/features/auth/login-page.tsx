import { useState } from 'react'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Sign-in — FR-003.
 *
 * Scaffold: the submit handler is not wired to the API yet.
 *
 * Two rules for whoever wires it up:
 *   - The failure message must stay generic ("Incorrect username or password").
 *     Never reveal whether the username exists, or whether the account is
 *     deactivated — that turns the login form into a staff directory.
 *   - Rate limiting and lockout belong on the server. There is nothing this
 *     component can do about a scripted attempt that never loads it.
 */
export function LoginPage() {
  const [isSubmitting, setSubmitting] = useState(false)
  const [error] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    // TODO: POST /api/auth/login, store the access token in memory,
    // then redirect to the role's landing route.
    setTimeout(() => setSubmitting(false), 600)
  }

  return (
    <div className="bg-background grid min-h-svh lg:grid-cols-2">
      {/* Brand panel — the reference's black surface, given a job. */}
      <div className="bg-sidebar text-sidebar-foreground hidden flex-col justify-between p-10 lg:flex">
        <div className="flex items-center gap-3">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground grid size-10 place-items-center rounded-xl text-lg font-black">
            T
          </div>
          <div>
            <p className="font-bold tracking-tight">TIMS</p>
            <p className="text-sidebar-foreground/50 text-xs">Institute manager</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-bold tracking-tight">
            Every scan, every rupee, attributed to a name.
          </h1>
          <p className="text-sidebar-foreground/60 mt-4 text-sm leading-relaxed">
            Attendance at the door, fees at the desk, and a record of who did what — so
            disputes end with an answer instead of an argument.
          </p>
        </div>

        <p className="text-sidebar-foreground/40 flex items-center gap-2 text-xs">
          <ShieldCheck className="size-4" aria-hidden />
          Shared logins are not permitted. Sign in with your own account.
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="bg-primary text-primary-foreground grid size-11 place-items-center rounded-2xl text-lg font-black">
              T
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Use the account issued to you by the institute owner.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <Alert variant="destructive" className="rounded-2xl">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                required
                className="h-11 rounded-xl"
                placeholder="e.g. nimal.p"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-xs font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-11 rounded-xl"
              />
            </div>

            <Button type="submit" className="h-11 w-full rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in
                </>
              ) : (
                <>
                  Sign in <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-muted-foreground mt-6 text-xs leading-relaxed">
            This system holds personal data of minors. Access is logged against your account,
            including the device you signed in from.
          </p>
        </div>
      </div>
    </div>
  )
}
