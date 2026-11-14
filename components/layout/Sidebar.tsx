'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, LogOut, X } from 'lucide-react'
import { getWorkspaceNavigation, type WorkspaceRole } from './navigation'

export function Sidebar({ userRole, closeMobileMenu }: { userRole: WorkspaceRole; closeMobileMenu?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const groups = getWorkspaceNavigation(userRole)
  const roleLabel = userRole === 'SUPER_ADMIN' ? 'Administration' : userRole === 'MODEL_HEAD' ? 'Model Head workspace' : 'Security workspace'

  const handleLogout = async () => {
    const { logoutUser } = await import('@/lib/supabase/client')
    await logoutUser()
    router.refresh()
    router.push('/')
  }

  return (
    <aside className="workspace-sidebar">
      <div className="workspace-brand-row">
        <Link href="/" className="workspace-brand"><span>Bal Pradarshani<span>.</span></span><small>Volunteer & ID portal</small></Link>
        {closeMobileMenu && <button type="button" onClick={closeMobileMenu} className="workspace-icon-button workspace-nav-close" aria-label="Close navigation"><X size={20} aria-hidden="true" /></button>}
      </div>
      <p className="workspace-role-label">{roleLabel}</p>
      <nav className="workspace-navigation" aria-label={roleLabel}>
        {groups.map(group => <details className="workspace-nav-group" key={group.label} open={groups.length === 1 || group.label === 'Volunteers' || group.links.some(link => pathname === link.href)}>
          <summary>{group.label}<ChevronDown size={14} aria-hidden="true" /></summary>
          {group.links.map(link => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            const Icon = link.icon
            return <Link key={link.href} href={link.href} onClick={closeMobileMenu} aria-current={active ? 'page' : undefined} className="workspace-nav-link"><Icon size={18} strokeWidth={1.7} aria-hidden="true" /><span>{link.name}</span>{active && <span className="workspace-current-marker" aria-hidden="true" />}</Link>
          })}
        </details>)}
      </nav>
      <div className="workspace-sidebar-bottom">
        <p><span lang="hi">जागृति</span><span>The Awakening</span></p>
        <button type="button" className="workspace-signout" onClick={() => { void handleLogout(); closeMobileMenu?.() }}><LogOut size={18} aria-hidden="true" />Sign out</button>
      </div>
    </aside>
  )
}
