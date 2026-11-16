import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getChildrenDirectoryAction,
  recordChildCheckInAction,
  recordChildCheckOutAction,
  bulkCheckInAction,
  bulkCheckOutAction,
  updateChildAttendanceTimesAction,
  toggleAttendanceStatusAction,
} from '@/server/actions/children'
import { createClient } from '@/lib/supabase/server'

describe('Children Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.update.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.in.mockReturnValue(mockSupabase)
    mockSupabase.single.mockReturnValue(mockSupabase)
    mockSupabase.order.mockReturnValue(mockSupabase)
  })

  it('fetches children directory with attendance records and serial numbers', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'children') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'child-1',
                  qr_id: 'qr-1',
                  name: 'Jane Doe',
                  contact_number: '1234567890',
                  status: 'Checked In',
                  checked_in_at: '2026-11-16T08:30:00Z',
                  checked_out_at: null,
                  created_at: '2026-11-15T10:00:00Z',
                  session: { name: 'Morning Session' },
                },
              ],
              error: null,
            }),
          }),
        }
      }
      return {
        select: vi.fn().mockResolvedValue({
          data: [{ id: 'qr-1', serial_number: 42 }],
          error: null,
        }),
      }
    })

    const res = await getChildrenDirectoryAction()
    expect(res.data).toBeDefined()
    expect(res.data).toHaveLength(1)
    expect(res.data![0].serial_number).toBe('MSS-2027-042')
    expect(res.data![0].checked_in_at).toBe('2026-11-16T08:30:00Z')
    expect(res.data![0].status).toBe('Checked In')
  })

  it('records check-in time for a child', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'child-1',
        status: 'Checked In',
        checked_in_at: '2026-11-16T09:00:00Z',
      },
      error: null,
    })

    const res = await recordChildCheckInAction('child-1', '2026-11-16T09:00:00Z')
    expect(res.data).toBeDefined()
    expect(res.data.status).toBe('Checked In')
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Checked In',
        checked_in_at: '2026-11-16T09:00:00Z',
      })
    )
  })

  it('records check-out time for a child', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'child-1',
        status: 'Checked Out',
        checked_out_at: '2026-11-16T12:00:00Z',
      },
      error: null,
    })

    const res = await recordChildCheckOutAction('child-1', '2026-11-16T12:00:00Z')
    expect(res.data).toBeDefined()
    expect(res.data.status).toBe('Checked Out')
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Checked Out',
        checked_out_at: '2026-11-16T12:00:00Z',
      })
    )
  })

  it('performs bulk check-in and records check-in timestamp', async () => {
    mockSupabase.in.mockResolvedValueOnce({ error: null })

    const res = await bulkCheckInAction(['child-1', 'child-2'], '2026-11-16T08:15:00Z')
    expect(res.success).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Checked In',
        checked_in_at: '2026-11-16T08:15:00Z',
      })
    )
    expect(mockSupabase.in).toHaveBeenCalledWith('id', ['child-1', 'child-2'])
  })

  it('performs bulk check-out and records check-out timestamp', async () => {
    mockSupabase.in.mockResolvedValueOnce({ error: null })

    const res = await bulkCheckOutAction(['child-1', 'child-2'], '2026-11-16T13:00:00Z')
    expect(res.success).toBe(true)
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Checked Out',
        checked_out_at: '2026-11-16T13:00:00Z',
      })
    )
    expect(mockSupabase.in).toHaveBeenCalledWith('id', ['child-1', 'child-2'])
  })

  it('updates custom attendance times and derives appropriate status', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'child-1',
        status: 'Checked Out',
        checked_in_at: '2026-11-16T09:00:00Z',
        checked_out_at: '2026-11-16T12:00:00Z',
      },
      error: null,
    })

    const res = await updateChildAttendanceTimesAction('child-1', {
      checked_in_at: '2026-11-16T09:00:00Z',
      checked_out_at: '2026-11-16T12:00:00Z',
    })
    expect(res.data).toBeDefined()
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Checked Out',
        checked_in_at: '2026-11-16T09:00:00Z',
        checked_out_at: '2026-11-16T12:00:00Z',
      })
    )
  })

  it('toggles attendance status and records timestamp', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'child-1',
        status: 'Checked Out',
      },
      error: null,
    })

    const res = await toggleAttendanceStatusAction('child-1', 'Checked In')
    expect(res.data).toBeDefined()
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Checked Out',
        checked_out_at: expect.any(String),
      })
    )
  })
})
