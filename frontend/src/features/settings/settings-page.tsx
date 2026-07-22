import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { qk, refApi } from '@/lib/api/endpoints'
import { apiErrorMessage } from '@/lib/api/client'
import { PageHeader } from '@/components/common/page-header'
import { Section } from '@/components/common/section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

export function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Institute details, master lists, operational thresholds and message templates." />

      <Tabs defaultValue="general">
        <TabsList className="mb-4 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg">General</TabsTrigger>
          <TabsTrigger value="masters" className="rounded-lg">Subjects & grades</TabsTrigger>
          <TabsTrigger value="rules" className="rounded-lg">Rules</TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralSettings /></TabsContent>
        <TabsContent value="masters"><MasterLists /></TabsContent>
        <TabsContent value="rules"><RulesSettings /></TabsContent>
        <TabsContent value="templates"><Templates /></TabsContent>
      </Tabs>
    </div>
  )
}

function GeneralSettings() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: qk.institute, queryFn: refApi.institute })
  const [name, setName] = useState('')
  useEffect(() => {
    if (query.data) setName(query.data.name)
  }, [query.data])

  async function save() {
    try {
      await refApi.updateInstitute({ name })
      await queryClient.invalidateQueries({ queryKey: qk.institute })
      toast.success('Saved.')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <Section title="Institute" className="max-w-xl">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Institute name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-xl" />
          <p className="text-muted-foreground text-xs">Shown on ID cards and receipts.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Currency</Label>
            <Input value={query.data?.currency ?? 'LKR'} disabled className="h-10 rounded-xl" />
          </div>
        </div>
        <Button className="rounded-xl" onClick={save}>Save changes</Button>
      </div>
    </Section>
  )
}

function MasterLists() {
  const queryClient = useQueryClient()
  const subjectsQuery = useQuery({ queryKey: qk.subjects, queryFn: refApi.subjects })
  const gradesQuery = useQuery({ queryKey: qk.grades, queryFn: refApi.grades })
  const [newSubject, setNewSubject] = useState('')
  const [newGrade, setNewGrade] = useState('')

  async function addSubject() {
    if (!newSubject.trim()) return
    try {
      await refApi.addSubject(newSubject.trim())
      await queryClient.invalidateQueries({ queryKey: qk.subjects })
      setNewSubject('')
      toast.success('Subject added.')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }
  async function addGrade() {
    if (!newGrade.trim()) return
    try {
      await refApi.addGrade(newGrade.trim(), (gradesQuery.data?.length ?? 0) + 1)
      await queryClient.invalidateQueries({ queryKey: qk.grades })
      setNewGrade('')
      toast.success('Grade added.')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Subjects">
        {subjectsQuery.isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <ul className="mb-3 flex flex-wrap gap-2">
            {(subjectsQuery.data ?? []).map((s) => (
              <li key={s.id} className="bg-secondary rounded-lg px-3 py-1.5 text-sm font-medium">
                {s.name}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="New subject" className="h-10 rounded-xl" />
          <Button className="rounded-xl" onClick={addSubject}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </Section>

      <Section title="Grades">
        {gradesQuery.isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <ul className="mb-3 flex flex-wrap gap-2">
            {(gradesQuery.data ?? []).map((g) => (
              <li key={g.id} className="bg-secondary rounded-lg px-3 py-1.5 text-sm font-medium">
                {g.name}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input value={newGrade} onChange={(e) => setNewGrade(e.target.value)} placeholder="New grade" className="h-10 rounded-xl" />
          <Button className="rounded-xl" onClick={addGrade}>
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </Section>
    </div>
  )
}

function RulesSettings() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: qk.institute, queryFn: refApi.institute })
  const [late, setLate] = useState(20)
  const [absence, setAbsence] = useState(3)
  const [idle, setIdle] = useState(30)

  useEffect(() => {
    if (query.data) {
      setLate(query.data.lateGraceMinutes)
      setAbsence(query.data.absenceAlertSessions)
      setIdle(query.data.idleTimeoutMinutes)
    }
  }, [query.data])

  async function save() {
    try {
      await refApi.updateInstitute({ lateGraceMinutes: late, absenceAlertSessions: absence, idleTimeoutMinutes: idle })
      await queryClient.invalidateQueries({ queryKey: qk.institute })
      toast.success('Rules saved.')
    } catch (err) {
      toast.error(apiErrorMessage(err))
    }
  }

  return (
    <Section title="Operational rules" className="max-w-xl">
      <div className="space-y-4">
        <NumberField
          label="Late grace period (minutes)"
          hint="Scans this many minutes after the start are flagged Late."
          value={late}
          onChange={setLate}
        />
        <NumberField
          label="Absence alert threshold (sessions)"
          hint="Flag a student on the dashboard after this many consecutive absences."
          value={absence}
          onChange={setAbsence}
        />
        <NumberField
          label="Idle session timeout (minutes)"
          hint="Users are signed out after this long with no activity."
          value={idle}
          onChange={setIdle}
        />
        <Button className="rounded-xl" onClick={save}>Save rules</Button>
      </div>
    </Section>
  )
}

function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tabular h-10 w-32 rounded-xl"
        min={0}
      />
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  )
}

function Templates() {
  const templates = [
    { key: 'receipt', name: 'Payment receipt', body: 'Dear {guardian}, we received {amount} for {student} — {class}, {month}. Receipt {receipt}.' },
    { key: 'reminder', name: 'Fee reminder', body: 'Dear {guardian}, {student} has {amount} outstanding for {month}. Please settle at your earliest.' },
    { key: 'absence', name: 'Absence alert', body: '{student} has been absent from {class} for {count} sessions.' },
    { key: 'cancel', name: 'Class cancellation', body: '{class} on {date} is cancelled. Sorry for the inconvenience.' },
  ]
  return (
    <Section title="Message templates" description="Placeholders are filled in when messages are sent (SMS/WhatsApp in Phase 2).">
      <ul className="space-y-3">
        {templates.map((t) => (
          <li key={t.key} className="border-border rounded-xl border p-4">
            <p className="text-sm font-semibold">{t.name}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
