import { Link } from 'react-router-dom'
import { Lock, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

function ErrorLayout({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode
  title: string
  message: string
}) {
  return (
    <div className="bg-background grid min-h-svh place-items-center p-6">
      <div className="max-w-sm text-center">
        <div className="bg-secondary text-secondary-foreground mx-auto grid size-14 place-items-center rounded-2xl">
          {icon}
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2 text-sm">{message}</p>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/">Back to your dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

export function NotAuthorisedPage() {
  return (
    <ErrorLayout
      icon={<Lock className="size-6" aria-hidden />}
      title="You don't have access to this"
      message="Your role doesn't include this screen. If you think it should, ask the institute owner — they manage account permissions."
    />
  )
}

export function NotFoundPage() {
  return (
    <ErrorLayout
      icon={<SearchX className="size-6" aria-hidden />}
      title="Page not found"
      message="That link doesn't lead anywhere. It may have been renamed, or the record was removed."
    />
  )
}
