import { Hammer } from 'lucide-react'
import { PageHeader } from './page-header'

interface ScaffoldPageProps {
  title: string
  description: string
  /** The requirement IDs this screen is responsible for, so the build order
   *  stays traceable to the spec while the module is still empty. */
  covers: string[]
}

/**
 * Temporary stand-in for a screen that is scaffolded but not yet built.
 *
 * Every one of these should be deleted as its module lands — if you are
 * reading this in a shipped build, that screen was missed.
 */
export function ScaffoldPage({ title, description, covers }: ScaffoldPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="card-surface p-6">
        <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          <Hammer className="size-4" />
          Not built yet
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          This screen is scaffolded. It will implement:
        </p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {covers.map((id) => (
            <li
              key={id}
              className="bg-secondary text-secondary-foreground rounded-lg px-2 py-1 font-mono text-xs font-medium"
            >
              {id}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
