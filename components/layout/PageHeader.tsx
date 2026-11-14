import type { ReactNode } from 'react'

export function PageHeader({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children?: ReactNode }) {
  return <header className="task-page-header">
    <div className="task-page-heading"><h1>{title}</h1>{description && <p>{description}</p>}{children}</div>
    {actions && <div className="task-page-actions">{actions}</div>}
  </header>
}
