'use client'

import { useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Dialog } from '@base-ui/react/dialog'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { WorkspaceRole } from './navigation'

export type { WorkspaceRole } from './navigation'

export function AppShell({ children, role }: { children: ReactNode; role: WorkspaceRole }) {
  const [navigationOpen, setNavigationOpen] = useState(false)
  const navigationTriggerRef = useRef<HTMLButtonElement>(null)
  const roleName = role === 'LECTURER' ? 'SECURITY' : role
  const userName = role === 'SUPER_ADMIN' ? 'Admin User' : role === 'MODEL_HEAD' ? 'Model Head' : 'Security'

  return (
    <div className="app-workspace">
      <a className="workspace-skip-link" href="#workspace-main">Skip to workspace</a>
      <div className="workspace-desktop-nav"><Sidebar userRole={role} /></div>
      <div className="workspace-body">
        <Header roleName={roleName} userName={userName} userRole={role} navigationTrigger={
          <button ref={navigationTriggerRef} type="button" onClick={() => setNavigationOpen(true)} className="workspace-menu-trigger" aria-label="Open navigation" aria-expanded={navigationOpen} aria-haspopup="dialog">
            <Menu aria-hidden="true" size={19} /><span>Menu</span>
          </button>
        } />
        <main id="workspace-main" tabIndex={-1} className="workspace-main">
          <div className="workspace-content">{children}</div>
        </main>
        <footer className="workspace-footer"><span>Bal Pradarshani · Samagam 2027</span><Link href="/support">Help & support</Link></footer>
      </div>

      <Dialog.Root open={navigationOpen} onOpenChange={setNavigationOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="workspace-drawer-scrim" />
          <Dialog.Popup className="workspace-drawer" aria-describedby={undefined} finalFocus={navigationTriggerRef}>
            <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
            <Sidebar userRole={role} closeMobileMenu={() => setNavigationOpen(false)} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
