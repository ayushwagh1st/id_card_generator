import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDashboardStatsAction } from '../../server/actions/dashboard'
import { createClient } from '@/lib/supabase/server'

describe('Dashboard Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
  })

  it('should get dashboard stats', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.count = vi.fn().mockResolvedValue({ count: 10, error: null })
    mockSupabase.eq.mockReturnThis()

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'volunteers') return { select: mockSupabase.select, count: mockSupabase.count, eq: mockSupabase.eq }
      if (table === 'models') return { select: mockSupabase.select, count: mockSupabase.count }
      if (table === 'profiles') return { select: mockSupabase.select, count: mockSupabase.count, eq: mockSupabase.eq }
      if (table === 'sessions') return { select: mockSupabase.select, count: mockSupabase.count, eq: mockSupabase.eq, order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [] }) }
      if (table === 'attendance_records') return { select: mockSupabase.select, count: mockSupabase.count, eq: mockSupabase.eq, gte: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [] }) }
      return mockSupabase
    })

    const result = await getDashboardStatsAction()
    expect(result.stats?.totalVolunteers).toBeDefined()
  })
})
