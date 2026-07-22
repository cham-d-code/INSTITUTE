import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { classApi, qk, refApi, studentApi } from '@/lib/api/endpoints'
import type { Student } from '@/types/domain'
import { apiErrorMessage } from '@/lib/api/client'
import { formatMoney, formatTimeRange, formatWeekday } from '@/lib/format'
import { PageHeader } from '@/components/common/page-header'
import { BackLink, Section } from '@/components/common/section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const guardianSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  relationship: z.string().min(1, 'Required'),
  phonePrimary: z.string().min(7, 'A valid phone number is required'),
  phoneSecondary: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  isPrimary: z.boolean(),
})

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  displayName: z.string().optional().or(z.literal('')),
  grade: z.string().min(1, 'Grade is required'),
  academicYear: z.string().min(4, 'Required'),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  address: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  guardians: z.array(guardianSchema).min(1, 'At least one guardian is required'),
  classIds: z.array(z.string()),
})

type FormValues = z.infer<typeof schema>

const EMPTY_GUARDIAN = {
  fullName: '',
  relationship: 'Mother',
  phonePrimary: '',
  phoneSecondary: '',
  email: '',
  isPrimary: true,
}

export function StudentFormPage() {
  const { studentId } = useParams()
  const isEdit = Boolean(studentId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const gradesQuery = useQuery({ queryKey: qk.grades, queryFn: refApi.grades })
  const classesQuery = useQuery({ queryKey: qk.classes, queryFn: classApi.list })
  const existingQuery = useQuery({
    queryKey: qk.student(studentId ?? ''),
    queryFn: () => studentApi.get(studentId!),
    enabled: isEdit,
  })

  const [duplicate, setDuplicate] = useState<Student | null>(null)
  const [duplicateAck, setDuplicateAck] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      displayName: '',
      grade: '',
      academicYear: String(new Date().getFullYear()),
      dateOfBirth: '',
      address: '',
      phone: '',
      notes: '',
      guardians: [{ ...EMPTY_GUARDIAN }],
      classIds: [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'guardians' })

  // Prefill in edit mode.
  useEffect(() => {
    if (existingQuery.data) {
      const s = existingQuery.data
      form.reset({
        fullName: s.fullName,
        displayName: s.displayName ?? '',
        grade: s.grade,
        academicYear: s.academicYear,
        dateOfBirth: s.dateOfBirth ?? '',
        gender: s.gender ?? undefined,
        address: s.address ?? '',
        phone: s.phone ?? '',
        notes: s.notes ?? '',
        guardians: s.guardians.map((g) => ({
          fullName: g.fullName,
          relationship: g.relationship,
          phonePrimary: g.phonePrimary,
          phoneSecondary: g.phoneSecondary ?? '',
          email: g.email ?? '',
          isPrimary: g.isPrimary,
        })),
        classIds: [],
      })
    }
  }, [existingQuery.data, form])

  const selectedGrade = form.watch('grade')
  const availableClasses = (classesQuery.data ?? []).filter(
    (c) => !selectedGrade || c.grade === selectedGrade,
  )

  // FR-014: check for a likely duplicate on the name + primary guardian phone.
  async function runDuplicateCheck() {
    if (isEdit) return
    const name = form.getValues('fullName')
    const phone = form.getValues('guardians.0.phonePrimary')
    if (name.trim().length < 2 || phone.trim().length < 7) return
    try {
      const hit = await studentApi.checkDuplicate(name, phone)
      setDuplicate(hit)
      setDuplicateAck(false)
    } catch {
      /* non-blocking */
    }
  }

  async function onSubmit(values: FormValues) {
    if (duplicate && !duplicateAck) {
      toast.warning('Please confirm this is not a duplicate before saving.')
      return
    }
    setSubmitting(true)
    try {
      if (isEdit) {
        await studentApi.update(studentId!, {
          fullName: values.fullName,
          displayName: values.displayName || null,
          grade: values.grade,
          address: values.address || null,
          phone: values.phone || null,
          notes: values.notes || null,
        })
        toast.success('Student updated.')
        await queryClient.invalidateQueries({ queryKey: qk.student(studentId!) })
        navigate(`/students/${studentId}`)
      } else {
        const created = await studentApi.create({
          fullName: values.fullName,
          displayName: values.displayName || null,
          grade: values.grade,
          academicYear: values.academicYear,
          dateOfBirth: values.dateOfBirth || null,
          gender: values.gender,
          address: values.address || null,
          phone: values.phone || null,
          notes: values.notes || null,
          guardians: values.guardians.map((g) => ({
            fullName: g.fullName,
            relationship: g.relationship,
            phonePrimary: g.phonePrimary,
            phoneSecondary: g.phoneSecondary || null,
            email: g.email || null,
            isPrimary: g.isPrimary,
          })),
          classIds: values.classIds,
        })
        toast.success(`Registered ${created.studentCode}. ID card queued for printing.`)
        await queryClient.invalidateQueries({ queryKey: qk.students })
        navigate(`/students/${created.id}`)
      }
    } catch (err) {
      toast.error(apiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink to={isEdit ? `/students/${studentId}` : '/students'}>
        {isEdit ? 'Back to profile' : 'Back to students'}
      </BackLink>
      <PageHeader
        title={isEdit ? 'Edit student' : 'Register student'}
        description={
          isEdit
            ? 'Changes are recorded in the audit trail with the old and new values.'
            : 'Student and guardian details, plus the classes they will attend.'
        }
      />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {duplicate && (
          <Alert className="border-status-warn-soft bg-status-warn-soft/40 rounded-2xl">
            <AlertTriangle className="size-4" />
            <AlertTitle>Possible duplicate</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>
                A student named <strong>{duplicate.fullName}</strong> ({duplicate.studentCode}) already
                has this guardian phone number.
              </span>
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox checked={duplicateAck} onCheckedChange={(v) => setDuplicateAck(Boolean(v))} />
                This is a different student — continue anyway.
              </label>
            </AlertDescription>
          </Alert>
        )}

        <Section title="Student details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={form.formState.errors.fullName?.message} required>
              <Input
                {...form.register('fullName')}
                onBlur={runDuplicateCheck}
                className="h-10 rounded-xl"
                placeholder="e.g. Nimal Perera"
              />
            </Field>
            <Field label="Preferred / display name" error={form.formState.errors.displayName?.message}>
              <Input {...form.register('displayName')} className="h-10 rounded-xl" placeholder="e.g. Nimal" />
            </Field>
            <Field label="Grade" error={form.formState.errors.grade?.message} required>
              <Select value={form.watch('grade')} onValueChange={(v) => form.setValue('grade', v, { shouldValidate: true })}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {(gradesQuery.data ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.name}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Academic year" error={form.formState.errors.academicYear?.message} required>
              <Input {...form.register('academicYear')} className="h-10 rounded-xl" />
            </Field>
            <Field label="Date of birth">
              <Input type="date" {...form.register('dateOfBirth')} className="h-10 rounded-xl" />
            </Field>
            <Field label="Gender">
              <Select
                value={form.watch('gender') ?? ''}
                onValueChange={(v) => form.setValue('gender', v as FormValues['gender'])}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Student phone">
              <Input {...form.register('phone')} className="h-10 rounded-xl" placeholder="Optional" />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <Textarea {...form.register('address')} rows={2} className="rounded-xl" />
            </Field>
            <Field label="Notes (visible per role)" className="sm:col-span-2">
              <Textarea
                {...form.register('notes')}
                rows={2}
                className="rounded-xl"
                placeholder="e.g. picked up by grandfather, allergies…"
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Guardians"
          description="At least one is required. The primary guardian receives notifications."
          actions={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => append({ ...EMPTY_GUARDIAN, isPrimary: false, relationship: 'Father' })}
            >
              <Plus className="size-4" /> Add guardian
            </Button>
          }
        >
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border-border rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={form.watch(`guardians.${index}.isPrimary`)}
                      onCheckedChange={(v) => {
                        // Only one primary.
                        fields.forEach((_, i) => form.setValue(`guardians.${i}.isPrimary`, i === index ? Boolean(v) : false))
                      }}
                    />
                    Primary guardian
                  </label>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive size-8"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name" error={form.formState.errors.guardians?.[index]?.fullName?.message} required>
                    <Input {...form.register(`guardians.${index}.fullName`)} className="h-10 rounded-xl" />
                  </Field>
                  <Field label="Relationship" required>
                    <Select
                      value={form.watch(`guardians.${index}.relationship`)}
                      onValueChange={(v) => form.setValue(`guardians.${index}.relationship`, v)}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['Mother', 'Father', 'Guardian', 'Grandparent', 'Sibling'].map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    label="Phone"
                    error={form.formState.errors.guardians?.[index]?.phonePrimary?.message}
                    required
                  >
                    <Input
                      {...form.register(`guardians.${index}.phonePrimary`)}
                      onBlur={index === 0 ? runDuplicateCheck : undefined}
                      className="h-10 rounded-xl"
                    />
                  </Field>
                  <Field label="Alternate phone">
                    <Input {...form.register(`guardians.${index}.phoneSecondary`)} className="h-10 rounded-xl" />
                  </Field>
                  <Field
                    label="Email"
                    error={form.formState.errors.guardians?.[index]?.email?.message}
                    className="sm:col-span-2"
                  >
                    <Input {...form.register(`guardians.${index}.email`)} className="h-10 rounded-xl" placeholder="Optional" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {!isEdit && (
          <Section
            title="Enrol in classes"
            description={
              selectedGrade
                ? `Classes for ${selectedGrade}. Enrolments are created on save.`
                : 'Select a grade first to see its classes.'
            }
          >
            {availableClasses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {selectedGrade ? 'No classes for this grade yet.' : 'Choose a grade above.'}
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {availableClasses.map((c) => {
                  const checked = form.watch('classIds').includes(c.id)
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                        checked ? 'border-primary bg-secondary/50' : 'border-border hover:bg-secondary/30',
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const cur = form.getValues('classIds')
                          form.setValue('classIds', v ? [...cur, c.id] : cur.filter((id) => id !== c.id))
                        }}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {c.grade} {c.subjectName}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {c.teacherName} ·{' '}
                          {c.schedules
                            .map((s) => `${formatWeekday(s.weekday, true)} ${formatTimeRange(s.startTime, s.endTime)}`)
                            .join(', ')}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">{formatMoney(c.monthlyFee)}/month</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </Section>
        )}

        <div className="flex items-center justify-end gap-2 pb-4">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate(isEdit ? `/students/${studentId}` : '/students')}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Register student'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label className="text-xs">
        {label} {required && <span className="text-status-stop-soft-foreground">*</span>}
      </Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
