import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useVolunteersState } from '@/app/admin/volunteers/_hooks/useVolunteersState'

const { update, getVolunteers } = vi.hoisted(() => ({ update: vi.fn(), getVolunteers: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams() }))
vi.mock('@/server/actions/volunteers', () => ({ getVolunteersAction: getVolunteers, updateVolunteerAction: update, addVolunteerAction: vi.fn(), bulkDeleteVolunteersAction: vi.fn(), bulkApproveVolunteersAction: vi.fn(), uploadVolunteerPhotoAction: vi.fn() }))
vi.mock('@/app/admin/models/actions.server', () => ({ getModelsDataAction: async () => [] }))
vi.mock('@/lib/pdf', () => ({ exportToPDF: vi.fn() }))
vi.mock('@/lib/image', () => ({ compressImage: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const record = { id: 'test-id', full_name: '[Test volunteer]', status: 'Pending' }
afterEach(cleanup)
beforeEach(() => { vi.clearAllMocks(); getVolunteers.mockResolvedValue({ data: [record], count: 1 }) })

describe('Status request coordination', () => {
  it('shares one in-flight update per record and displays confirmation before the roster refresh finishes', async () => {
    let confirm!: (result: { success: boolean }) => void
    let refresh!: (result: { data: typeof record[]; count: number }) => void
    update.mockImplementation(() => new Promise(resolve => { confirm = resolve }))
    const { result } = renderHook(() => useVolunteersState())
    await waitFor(() => expect(result.current.state.volunteers).toHaveLength(1))
    getVolunteers.mockImplementation(() => new Promise(resolve => { refresh = resolve }))
    let first!: Promise<void>
    let second!: Promise<void>
    act(() => { first = result.current.handleStatusChange('test-id', 'Approved'); second = result.current.handleStatusChange('test-id', 'Rejected') })
    expect(first).toBe(second)
    expect(update).toHaveBeenCalledOnce()
    expect(update).toHaveBeenCalledWith('test-id', { status: 'Approved' })
    await act(async () => { confirm({ success: true }) })
    expect(result.current.state.volunteers[0].status).toBe('Approved')
    expect(result.current.state.loading).toBe(true)
    await act(async () => { refresh({ data: [{ ...record, status: 'Approved' }], count: 1 }); await first })
    expect(result.current.state.loading).toBe(false)
  })

  it('preserves the original status on failure and allows a later retry', async () => {
    update.mockResolvedValueOnce({ error: 'Request failed' }).mockResolvedValueOnce({ success: true })
    const { result } = renderHook(() => useVolunteersState())
    await waitFor(() => expect(result.current.state.volunteers).toHaveLength(1))
    await act(async () => { await expect(result.current.handleStatusChange('test-id', 'Approved')).rejects.toThrow('Request failed') })
    expect(result.current.state.volunteers[0].status).toBe('Pending')
    getVolunteers.mockResolvedValue({ data: [{ ...record, status: 'Approved' }], count: 1 })
    await act(async () => { await result.current.handleStatusChange('test-id', 'Approved') })
    expect(update).toHaveBeenCalledTimes(2)
    expect(result.current.state.volunteers[0].status).toBe('Approved')
  })
})
