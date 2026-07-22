import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, ShieldCheck, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/types/domain'
import { qk, userApi } from '@/lib/api/endpoints'
import { apiErrorMessage } from '@/lib/api/client'
import { ROLE_LABELS } from '@/lib/auth/permissions'
import { formatDateTime } from '@/lib/format'
import { useAuth } from '@/lib/auth/auth-store'
import { PageHeader } from '@/components/common/page-header'
import { Section } from '@/components/common/section'
import { EntityAvatar } from '@/components/data/entity-avatar'
import { PresetStatusPill } from '@/components/data/status-pill'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const schema = z.object({
  fullName: z.string().min(2, 'Required'),
  username: z.string().min(3, 'At least 3 characters').regex(/^[a-z0-9._]+$/i, 'Letters, numbers, dot or underscore'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  role: z.enum(['super_admin', 'assistant', 'teacher']),
})
type FormValues = z.infer<typeof schema>

export function UsersPage() {
  const queryClient = useQueryClient()
  const { user: me } = useAuth()
  const query = useQuery({ queryKey: qk.users, queryFn: userApi.list })
  const [createOpen, setCreateOpen] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<User | null>(null)

  async function toggleActive(user: User) {
    try {
      await userApi.setActive(user.id, !user.isActive)
      await queryClient.invalidateQueries({ queryKey: qk.users })
      toast.success(user.isActive ? 'Account deactivated. Access revoked.' : 'Account reactivated.')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Assistant and Super Admin accounts. Deactivating revokes web and app access without deleting history."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl">
                <UserPlus className="size-4" /> Add user
              </Button>
            </DialogTrigger>
            <CreateUserDialog onClose={() => setCreateOpen(false)} />
          </Dialog>
        }
      />

      <Section bodyClassName="p-0">
        {query.isLoading ? (
          <div className="p-5">
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {(query.data ?? []).map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <EntityAvatar name={u.fullName} code={`@${u.username}`} photoUrl={u.photoUrl} />
                </div>

                <div className="hidden sm:block">
                  <PresetStatusPill preset="approved" labelOverride={ROLE_LABELS[u.role]} size="sm" />
                </div>

                {u.twoFactorEnabled && (
                  <span className="text-status-ok-soft-foreground hidden items-center gap-1 text-xs font-medium sm:flex">
                    <ShieldCheck className="size-3.5" /> 2FA
                  </span>
                )}

                <div className="hidden text-right md:block">
                  <p className="text-muted-foreground text-xs">Last sign-in</p>
                  <p className="text-xs font-medium">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Never'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <PresetStatusPill preset={u.isActive ? 'active' : 'inactive'} />
                  <Switch
                    checked={u.isActive}
                    disabled={u.id === me?.id}
                    onCheckedChange={() => setToggleTarget(u)}
                    aria-label={u.isActive ? 'Deactivate' : 'Activate'}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-muted-foreground mt-3 text-xs">
        You can't change your own account status. There must always be at least one active Super Admin.
      </p>

      <ConfirmDialog
        open={toggleTarget !== null}
        onOpenChange={(o) => !o && setToggleTarget(null)}
        title={toggleTarget?.isActive ? 'Deactivate this account?' : 'Reactivate this account?'}
        description={
          toggleTarget?.isActive
            ? `${toggleTarget?.fullName} will be signed out of the web portal and mobile app on their next request. Their historical activity is kept.`
            : `${toggleTarget?.fullName} will regain access with their existing credentials.`
        }
        confirmLabel={toggleTarget?.isActive ? 'Deactivate' : 'Reactivate'}
        destructive={toggleTarget?.isActive}
        onConfirm={async () => {
          if (toggleTarget) await toggleActive(toggleTarget)
        }}
      />
    </div>
  )
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', username: '', email: '', phone: '', role: 'assistant' },
  })
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(values: FormValues) {
    setSubmitting(true)
    try {
      await userApi.create({
        fullName: values.fullName,
        username: values.username,
        email: values.email || null,
        phone: values.phone || null,
        role: values.role,
      })
      await queryClient.invalidateQueries({ queryKey: qk.users })
      toast.success('User created. They must set a password on first sign-in.')
      form.reset()
      onClose()
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogContent className="max-w-md rounded-2xl">
      <DialogHeader>
        <DialogTitle>Add user</DialogTitle>
        <DialogDescription>
          A temporary password is issued; the user is forced to change it on first sign-in.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Full name</Label>
          <Input {...form.register('fullName')} className="h-10 rounded-xl" />
          {form.formState.errors.fullName && <p className="text-destructive text-xs">{form.formState.errors.fullName.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Username</Label>
            <Input {...form.register('username')} className="h-10 rounded-xl" />
            {form.formState.errors.username && <p className="text-destructive text-xs">{form.formState.errors.username.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role</Label>
            <Select value={form.watch('role')} onValueChange={(v) => form.setValue('role', v as FormValues['role'])}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assistant">Assistant</SelectItem>
                <SelectItem value="teacher">Teacher (view-only)</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input {...form.register('email')} className="h-10 rounded-xl" placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input {...form.register('phone')} className="h-10 rounded-xl" placeholder="Optional" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Create user
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}
