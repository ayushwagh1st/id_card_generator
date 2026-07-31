import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getVolunteersAction, 
  addVolunteerAction, 
  updateVolunteerAction, 
  deleteVolunteerAction,
  bulkDeleteVolunteersAction,
  bulkApproveVolunteersAction,
  bulkImportVolunteersAction
} from '../../server/actions/volunteers'
import { createClient } from '@/lib/supabase/server'

describe('Volunteer Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
  })

  it('should get volunteers', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockReturnThis()
    mockSupabase.range.mockResolvedValueOnce({ data: [{ id: '1' }], count: 1, error: null })

    const result = await getVolunteersAction(1, 20)
    expect(result.data).toBeDefined()
    expect(result.count).toBe(1)
  })

  it('should add volunteer', async () => {
    mockSupabase.insert.mockReturnThis()
    mockSupabase.select.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: '1' }, error: null })

    const result = await addVolunteerAction({ full_name: 'John Doe', mobile_number: '9876543210' })
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('should update volunteer', async () => {
    mockSupabase.update.mockReturnThis()
    mockSupabase.eq.mockResolvedValueOnce({ error: null })

    const result = await updateVolunteerAction('1', { full_name: 'Jane Doe' })
    expect(result.success).toBe(true)
  })

  it('should delete volunteer', async () => {
    mockSupabase.delete.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.select.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { full_name: 'John' }, error: null })

    const result = await deleteVolunteerAction('1')
    expect(result.success).toBe(true)
  })

  it('should bulk delete volunteers', async () => {
    mockSupabase.delete.mockReturnThis()
    mockSupabase.in.mockResolvedValueOnce({ error: null })

    const result = await bulkDeleteVolunteersAction(['1', '2'])
    expect(result.success).toBe(true)
  })

  it('should bulk approve volunteers', async () => {
    mockSupabase.update.mockReturnThis()
    mockSupabase.in.mockResolvedValueOnce({ error: null })

    const result = await bulkApproveVolunteersAction(['1', '2'])
    expect(result.success).toBe(true)
  })

  it('should bulk import volunteers', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ error: null })

    const result = await bulkImportVolunteersAction([{ full_name: 'Vol 1', mobile_number: '9876543210' }])
    expect(result.success).toBe(true)
    expect(result.count).toBe(1)
  })
})
