import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SyncProgressModal } from '@/web_offline_p2p_sync/components/SyncProgressModal'
import { P2PBridgeModal } from '@/web_offline_p2p_sync/components/P2PBridgeModal'
import type { SyncManager, SyncState } from '@/web_offline_p2p_sync/core/SyncManager'

afterEach(cleanup)

describe('Sync dialog behavior', () => {
  it('retains queue, connection, and in-progress guards for server sync', () => {
    let listener!: (state: SyncState) => void
    const unsubscribe = vi.fn()
    const syncWithServer = vi.fn()
    const initial: SyncState = { isOnline: false, isSyncing: false, pendingCount: 2, peerCount: 0, lastSyncedTime: null }
    const manager = { subscribeState(callback: typeof listener) { listener = callback; callback(initial); return unsubscribe }, syncWithServer } as unknown as SyncManager
    const view = render(<SyncProgressModal isOpen onClose={vi.fn()} syncManager={manager} />)
    expect(screen.getByRole('dialog', { name: 'Offline & server sync' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sync Now' })).toBeDisabled()
    act(() => listener({ ...initial, isOnline: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Sync Now' }))
    expect(syncWithServer).toHaveBeenCalledTimes(1)
    act(() => listener({ ...initial, isOnline: true, isSyncing: true }))
    expect(screen.getByRole('button', { name: 'Syncing...' })).toBeDisabled()
    view.unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('keeps the local router connection callback and closes after connecting', async () => {
    const connectWebSocket = vi.fn()
    const onClose = vi.fn()
    const manager = { getMeshEngine: () => ({ connectWebSocket }) } as unknown as SyncManager
    render(<P2PBridgeModal isOpen onClose={onClose} syncManager={manager} />)
    fireEvent.click(screen.getByRole('button', { name: 'Local WiFi' }))
    const input = screen.getByLabelText('Router WebSocket URL')
    expect(input).toHaveValue('wss://event-router.local:8080')
    fireEvent.change(input, { target: { value: 'wss://router.example.invalid:8080' } })
    fireEvent.click(screen.getByRole('button', { name: 'Connect' }))
    expect(connectWebSocket).toHaveBeenCalledWith('wss://router.example.invalid:8080')
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('keeps a partial preparation incomplete and explains missing files without losing saved-data status', async () => {
    const state: SyncState = { isOnline: true, isSyncing: false, pendingCount: 2, peerCount: 0, lastSyncedTime: null, preparedAt: Date.now(), authorizationExpiresAt: Date.now() + 86400000, error: 'Required offline asset unavailable: /_next/static/chunks/missing.js' }
    const manager = { subscribeState(callback: (state: SyncState) => void) { callback(state); return vi.fn() } } as unknown as SyncManager
    await act(async () => { render(<SyncProgressModal isOpen onClose={vi.fn()} syncManager={manager} />) })
    expect(screen.getByText('Needs preparation')).toBeVisible()
    expect(screen.getByText(/^Saved \d/)).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('App files could not be saved')
    expect(screen.getByRole('alert')).toHaveTextContent('Your saved records are safe.')
    expect(screen.getByText('Not verified. Finish preparation before going offline.')).toBeVisible()
    expect(screen.queryByText('Ready on this device')).not.toBeInTheDocument()
  })

  it('does not call expired authorization ready even when data and files were saved', async () => {
    const now = Date.now()
    const state: SyncState = { isOnline: true, isSyncing: false, pendingCount: 0, peerCount: 0, lastSyncedTime: null, preparedAt: now, pagesPreparedAt: now, authorizationExpiresAt: now - 1000 }
    const manager = { subscribeState(callback: (state: SyncState) => void) { callback(state); return vi.fn() } } as unknown as SyncManager
    await act(async () => { render(<SyncProgressModal isOpen onClose={vi.fn()} syncManager={manager} />) })
    expect(screen.getByText('Needs preparation')).toBeVisible()
    expect(screen.getByText(/^Expired /)).toBeVisible()
  })

  it('keeps the preparation guard and reports backup failures', async () => {
    const onPrepare = vi.fn(async () => {})
    const state: SyncState = { isOnline: true, isSyncing: false, pendingCount: 0, peerCount: 0, lastSyncedTime: null }
    const manager = { subscribeState(callback: (state: SyncState) => void) { callback(state); return vi.fn() }, exportData: vi.fn().mockRejectedValue(new Error('Storage unavailable')) } as unknown as SyncManager
    const view = render(<SyncProgressModal isOpen onClose={vi.fn()} syncManager={manager} onPrepare={onPrepare} isPreparing />)
    expect(screen.getByRole('button', { name: 'Preparing offline access…' })).toBeDisabled()
    view.rerender(<SyncProgressModal isOpen onClose={vi.fn()} syncManager={manager} onPrepare={onPrepare} />)
    fireEvent.click(screen.getByRole('button', { name: 'Prepare offline access' }))
    expect(onPrepare).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('Backup & router tools'))
    fireEvent.click(screen.getByRole('button', { name: 'Export saved records' }))
    expect(await screen.findByText('Storage unavailable')).toBeVisible()
  })
})
