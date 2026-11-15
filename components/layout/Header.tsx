'use client'

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { User, LogOut, Sun, Moon, Link as LinkIcon, ChevronDown } from 'lucide-react'
import { Menu } from '@base-ui/react/menu'
import { usePathname } from 'next/navigation'
import { getCurrentUserAction, logoutAction } from '@/server/actions/auth'
import { CommandPalette } from './CommandPalette'
import { useTheme } from 'next-themes'
import { useSyncManager } from '@/components/SyncProvider'
import { NetworkSyncStatus } from '@/web_offline_p2p_sync/components/NetworkSyncStatus'
import { lockOfflineSession } from '@/lib/offline/session'
import { getWorkspaceNavigation, type WorkspaceRole } from './navigation'
import { touchFeedbackEnabled, setTouchFeedback, touchFeedback } from '@/lib/touch-feedback'

const subscribe = () => () => {}
const subscribeTouch = (listener: () => void) => {
  window.addEventListener('touch-feedback-change', listener)
  window.addEventListener('storage', listener)
  return () => { window.removeEventListener('touch-feedback-change', listener); window.removeEventListener('storage', listener) }
}

export function Header({ userName = 'User', roleName = 'Role', userRole = 'SUPER_ADMIN', navigationTrigger }: { userName?: string; roleName?: string; userRole?: WorkspaceRole; navigationTrigger?: ReactNode }) {
  const [fetchedName, setFetchedName] = useState<string | null>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const { syncManager, openModal, openBridgeModal } = useSyncManager()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const touchEnabled = useSyncExternalStore(subscribeTouch, touchFeedbackEnabled, () => false)
  const pathname = usePathname()
  const displayName = fetchedName || userName
  const roleLabel = roleName === 'SUPER_ADMIN' ? 'Administration' : roleName === 'MODEL_HEAD' ? 'Model Head' : roleName === 'SECURITY' ? 'Security' : 'Lecturer'
  const currentPage = getWorkspaceNavigation(userRole).flatMap(group => group.links).find(link => pathname === link.href)?.name || 'Workspace'
  const isDark = mounted && resolvedTheme === 'dark'

  useEffect(() => {
    async function getUserName() {
      try {
        const user = await getCurrentUserAction()
        if (user) {
          if (user.user_metadata?.full_name) setFetchedName(user.user_metadata.full_name)
          else if (user.user_metadata?.name) setFetchedName(user.user_metadata.name)
          else if (user.email) setFetchedName(user.email.split('@')[0])
          return
        }
        const sessionUserStr = document.cookie.split('; ').find(row => row.startsWith('mock-user='))?.split('=')[1]
        if (sessionUserStr) {
          try {
            const sessionUser = JSON.parse(decodeURIComponent(sessionUserStr))
            if (sessionUser.full_name) setFetchedName(sessionUser.full_name)
            else if (sessionUser.name) setFetchedName(sessionUser.name)
            else if (sessionUser.email) setFetchedName(sessionUser.email.split('@')[0])
          } catch {}
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
      }
    }
    void getUserName()
  }, [userName])

  const handleLogout = async () => {
    lockOfflineSession()
    try { await logoutAction() } catch { /* Local access remains locked when the server is unreachable. */ }
    finally { window.location.href = '/login' }
  }

  return (
    <header className="workspace-header">
      <div className="workspace-header-location">{navigationTrigger}<div><span>{roleLabel}</span><p>{currentPage}</p></div></div>
      <CommandPalette role={userRole} />
      <div className="workspace-header-tools">
        {mounted && syncManager && <div className="workspace-connection-tools">
          <button type="button" onClick={openBridgeModal} className="workspace-icon-button" aria-label="Bridge offline devices" title="Bridge offline devices"><LinkIcon size={18} aria-hidden="true" /></button>
          <NetworkSyncStatus syncManager={syncManager} onOpenModal={openModal} />
        </div>}
        <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} className="workspace-icon-button" aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`} title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>{isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}</button>
        <Menu.Root>
          <Menu.Trigger className="workspace-profile-trigger" aria-label="Open account menu"><span className="workspace-profile-icon"><User size={18} aria-hidden="true" /></span><span className="workspace-profile-name">{displayName}</span><ChevronDown size={14} aria-hidden="true" /></Menu.Trigger>
          <Menu.Portal><Menu.Positioner sideOffset={8} align="end" className="workspace-menu-positioner"><Menu.Popup className="workspace-account-menu">
            <div className="workspace-account-info"><strong>{displayName}</strong><span>{roleLabel}</span></div>
            <Menu.CheckboxItem checked={touchEnabled} onCheckedChange={enabled => { setTouchFeedback(enabled); if (enabled) touchFeedback() }} className="workspace-account-action" closeOnClick={false}><span aria-hidden="true">{touchEnabled ? '✓' : '○'}</span><span>Touch feedback<small className="touch-feedback-help">Supported phones only · optional</small></span></Menu.CheckboxItem>
            <Menu.Item onClick={handleLogout} data-destructive className="workspace-account-action"><LogOut size={17} aria-hidden="true" />Sign out</Menu.Item>
          </Menu.Popup></Menu.Positioner></Menu.Portal>
        </Menu.Root>
      </div>
    </header>
  )
}
