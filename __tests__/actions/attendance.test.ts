import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordAttendanceAction, bulkSyncAttendanceAction, getSessionAttendanceAction, bulkCheckoutAllAction } from '@/server/actions/attendance'
import { requireOperator, applyOperation } from '@/lib/offline/server'
import { createClient } from '@/lib/supabase/server'
vi.mock('@/lib/offline/server', () => ({ requireOperator: vi.fn(), applyOperation: vi.fn(), signServerOperation: (item: any) => item }))
const sessionId = '00000000-0000-4000-8000-000000000002'
const scan = { scanData: 'SNK-1', sessionId, mode: 'check-in', timestamp: '2026-11-14T08:00:00Z' }
beforeEach(() => {
  vi.mocked(requireOperator).mockResolvedValue({ id: 'operator', app_metadata: { role: 'LECTURER' } } as any)
  vi.mocked(applyOperation).mockReset()
})
describe('attendance uses the shared event processor', () => {
  it('processes online scans with the same operation format as offline replay', async () => {
    vi.mocked(applyOperation).mockResolvedValue({ data: { applied: true, name: 'Volunteer' } })
    const result = await recordAttendanceAction('SNK-1', sessionId, 'check-in', 'stable-id', scan.timestamp)
    expect(result.success).toBe(true)
    expect(applyOperation).toHaveBeenCalledWith(expect.objectContaining({ id: 'stable-id', entity: 'attendance_scans', payload: scan }), 'operator')
  })
  it('returns per-record errors and never calls an all-failed batch successful', async () => {
    vi.mocked(applyOperation).mockResolvedValue({ error: 'Database unavailable', retryable: true })
    const result = await bulkSyncAttendanceAction([scan])
    expect(result.success).toBe(false); expect(result.results[0]).toMatchObject({ status: 'error', retryable: true })
  })
  it('preserves partial success without discarding rejected scans', async () => {
    vi.mocked(applyOperation).mockResolvedValueOnce({ data: { applied: true } }).mockResolvedValueOnce({ error: 'Not enrolled', retryable: false })
    const result = await bulkSyncAttendanceAction([{ ...scan, id: 'one' }, { ...scan, id: 'two' }])
    expect(result.success).toBe(false); expect(result.results.map(item => item.id)).toEqual(['one', 'two']); expect(result.results.map(item => item.status)).toEqual(['success', 'error'])
  })
  it('does not silently accept the old incorrect test field names', async () => {
    const result = await bulkSyncAttendanceAction([{ session_id: sessionId, snk_id: 'SNK-1', scan_type: 'CHECK_IN', timestamp: scan.timestamp }])
    expect(result.success).toBe(false); expect(applyOperation).not.toHaveBeenCalled()
  })
  it('gives legacy scans stable operation IDs across repeated uploads', async () => {
    vi.mocked(applyOperation).mockResolvedValue({ data: { applied: true } })
    const first = await bulkSyncAttendanceAction([scan]); const second = await bulkSyncAttendanceAction([scan])
    expect(first.results[0].id).toBe(second.results[0].id)
  })
  it('normalizes full verification URLs before creating an event', async () => {
    vi.mocked(applyOperation).mockResolvedValue({ data: { applied: true } })
    await recordAttendanceAction('https://portal.test/verify/SNK-1/?source=qr', sessionId, 'check-in')
    expect(applyOperation).toHaveBeenCalledWith(expect.objectContaining({ payload: expect.objectContaining({ scanData: 'SNK-1' }) }), 'operator')
  })
  it('requires authorization before online or bulk writes', async () => {
    vi.mocked(requireOperator).mockRejectedValue(new Error('AUTH_REQUIRED'))
    await expect(bulkSyncAttendanceAction([scan])).rejects.toThrow('AUTH_REQUIRED'); expect(applyOperation).not.toHaveBeenCalled()
  })
  it('keeps session attendance retrieval working', async () => {
    const client: any = await createClient(); client.order.mockResolvedValueOnce({ data: [{ id: 'attendance' }], error: null })
    expect((await getSessionAttendanceAction(sessionId)).data).toHaveLength(1)
  })
})
