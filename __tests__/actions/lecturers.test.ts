import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getLecturersAction,
  addLecturerAction,
  updateLecturerAction,
  deleteLecturerAction,
  resetLecturerPasswordAction
} from '../../server/actions/lecturers'
import { createClient, checkAuth } from '@/lib/supabase/server'

describe('Lecturer Actions', () => {
  let mockSupabase: any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSupabase = await createClient()
  })

  it('should get lecturers', async () => {
    mockSupabase.select.mockReturnThis()
    mockSupabase.order.mockReturnThis()
    mockSupabase.range.mockResolvedValueOnce({ data: [{ id: '1' }], count: 1, error: null })

    const result = await getLecturersAction()
    expect(result.data).toBeDefined()
  })

  it('should add lecturer', async () => {
    // Mock user auth
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'admin', app_metadata: { role: 'SUPER_ADMIN' } } }, error: null })
    
    // Auth admin create user
    mockSupabase.auth.admin = {
      createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    }
    
    mockSupabase.insert.mockReturnThis()
    mockSupabase.select.mockReturnThis()
    mockSupabase.single.mockResolvedValueOnce({ data: { id: '1' }, error: null })

    const result = await addLecturerAction({ name: 'John Doe', email: 'j@example.com', password: 'password', status: 'Active' })
    expect(result.success).toBe(true)
  })

  it('should update lecturer', async () => {
    mockSupabase.update.mockReturnThis()
    mockSupabase.eq.mockResolvedValueOnce({ error: null })

    const result = await updateLecturerAction('1', { name: 'Updated Name', email: 'j@example.com', status: 'Active' })
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
  it('rejects non-admin updates before any privileged password change', async () => {
    vi.mocked(checkAuth).mockResolvedValueOnce({ user: { id: 'staff', app_metadata: { role: 'LECTURER' } } } as any)
    const updateUserById=vi.fn(); mockSupabase.auth.admin={updateUserById}
    expect(await updateLecturerAction('target',{name:'Name',password:'changed-password'})).toMatchObject({error:'Unauthorized.'})
    expect(updateUserById).not.toHaveBeenCalled()
  })
  it('rejects non-admin password resets before calling the auth admin API', async () => {
    vi.mocked(checkAuth).mockResolvedValueOnce({ user: { id: 'staff', app_metadata: { role: 'MODEL_HEAD' } } } as any)
    const updateUserById=vi.fn(); mockSupabase.auth.admin={updateUserById}
    expect(await resetLecturerPasswordAction('target','changed-password')).toMatchObject({error:'Unauthorized.'})
    expect(updateUserById).not.toHaveBeenCalled()
  })
})
