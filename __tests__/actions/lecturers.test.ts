import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getLecturersAction,
  addLecturerAction,
  updateLecturerAction,
  deleteLecturerAction,
  resetLecturerPasswordAction
} from '../../app/actions/lecturers'
import { createClient } from '@/lib/supabase/server'

describe('Lecturer Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
  })

  it('should get lecturers', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockResolvedValueOnce({ data: [{ id: '1' }], error: null })

    const result = await getLecturersAction()
    expect(result.data).toBeDefined()
  })

  it('should add lecturer', async () => {
    // Mock user auth
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { role: 'ADMIN' } }, error: null })
    
    // Auth admin create user
    mockSupabase.auth.admin = {
      createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    }
    
    mockSupabase.insert.mockReturnThis()
    mockSupabase.select.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: '1' }, error: null })

    const result = await addLecturerAction({ full_name: 'John Doe', email: 'j@example.com', password: 'password', role: 'LECTURER' })
    expect(result.success).toBe(true)
  })

  it('should update lecturer', async () => {
    mockSupabase.update.mockReturnThis()
    mockSupabase.eq.mockResolvedValueOnce({ error: null })

    const result = await updateLecturerAction('1', { full_name: 'Updated Name' })
    expect(result.success).toBe(true)
  })

  it('should delete lecturer', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { full_name: 'Name', auth_user_id: 'u1' } })
    
    mockSupabase.auth.admin = {
      deleteUser: vi.fn().mockResolvedValue({ error: null })
    }
    
    mockSupabase.delete.mockReturnThis()
    mockSupabase.eq.mockResolvedValueOnce({ error: null })

    const result = await deleteLecturerAction('1')
    expect(result.success).toBe(true)
  })

  it('should reset lecturer password', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.eq.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { auth_user_id: 'u1' } })
    
    mockSupabase.auth.admin = {
      updateUserById: vi.fn().mockResolvedValue({ error: null })
    }

    const result = await resetLecturerPasswordAction('1', 'newpass')
    expect(result.success).toBe(true)
  })
})
