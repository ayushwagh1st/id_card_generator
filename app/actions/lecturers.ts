'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { lecturerSchema } from '@/lib/validations'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendRegistrationEmail } from '@/lib/email'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function getLecturersAction(
  page: number = 1,
  limit: number = 20,
  query: string = '',
  statusFilter: string = 'all'
) {
  const supabase = await createClient()

  let dbQuery = supabase
    .from('lecturers')
    .select('*', { count: 'exact' })

  if (statusFilter && statusFilter !== 'all') {
    dbQuery = dbQuery.eq('status', statusFilter)
  }

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%,mobile.ilike.%${query}%`)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await dbQuery.order('created_at', { ascending: false }).range(from, to)

  if (error) {
    console.error('Error fetching lecturers:', error)
    throw new Error('Could not fetch lecturers.')
  }

  return { data, count }
}

export async function addLecturerAction(formData: any) {
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rateLimit = await checkRateLimit(`add_lecturer_${ip}`, 5, 60000)
  if (!rateLimit.success) return { error: 'Too many requests. Please try again later.' }

  const parsed = lecturerSchema.safeParse(formData)
  if (!parsed.success) return { error: 'Invalid input data', details: parsed.error.flatten().fieldErrors }

  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY

  let userId = crypto.randomUUID()

  if (!isMockMode) {
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: formData.email,
      password: formData.password,
      email_confirm: true,
      user_metadata: { role: 'LECTURER', name: formData.name }
    })

    if (authError) {
      console.error('Error creating lecturer auth user:', authError)
      return { error: authError.message }
    }
    
    if (authData.user) {
        userId = authData.user.id
    }
  }

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user || user.user_metadata?.role !== 'SUPER_ADMIN') {
      return { error: 'Unauthorized.' }
  }

  // Insert into lecturers table using Admin client to bypass RLS
  const { data, error } = await supabaseAdmin.from('lecturers').insert([{
    id: userId,
    name: parsed.data.name,
    email: parsed.data.email,
    mobile: parsed.data.mobile,
    password: parsed.data.password,
    status: parsed.data.status || 'Active'
  }]).select().single()

  if (error) {
    console.error('Error inserting lecturer profile:', error)
    // Attempt rollback of auth user if profile fails
    if (!isMockMode) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
    }
    return { error: 'Failed to create lecturer profile.' }
  }

  // Send email to the security personnel
  await sendRegistrationEmail({
    email: parsed.data.email,
    name: parsed.data.name,
    loginId: parsed.data.email,
    loginPass: parsed.data.password,
    role: 'Security Personnel'
  })

  revalidatePath('/admin/lecturers')
  return { success: true, data }
}

export async function updateLecturerAction(id: string, formData: any) {
  const ip = (await headers()).get('x-forwarded-for') || 'unknown'
  const rateLimit = await checkRateLimit(`update_lecturer_${ip}`, 10, 60000)
  if (!rateLimit.success) return { error: 'Too many requests. Please try again later.' }

  const parsed = lecturerSchema.partial().safeParse(formData)
  if (!parsed.success) return { error: 'Invalid input data', details: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()

  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY

  // If password is changed, update auth user
  if (parsed.data.password && !isMockMode) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
          password: parsed.data.password
      })
      if (authError) {
          console.error('Error updating lecturer auth password:', authError)
          return { error: 'Failed to update password in authentication system.' }
      }
  }

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user || user.user_metadata?.role !== 'SUPER_ADMIN') {
      return { error: 'Unauthorized.' }
  }

  const { error } = await supabaseAdmin.from('lecturers').update({
      name: parsed.data.name,
      email: parsed.data.email,
      mobile: parsed.data.mobile,
      password: parsed.data.password,
      status: parsed.data.status
  }).eq('id', id)

  if (error) {
    console.error('Error updating lecturer:', error)
    return { error: 'Failed to update lecturer record.' }
  }

  revalidatePath('/admin/lecturers')
  return { success: true }
}

export async function deleteLecturerAction(id: string) {
  const supabase = await createClient()
  
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user || user.user_metadata?.role !== 'SUPER_ADMIN') {
      return { error: 'Unauthorized.' }
  }

  // Delete from profile first (cascade might not be set up on auth side)
  const { error } = await supabaseAdmin.from('lecturers').delete().eq('id', id)
  if (error) {
    console.error('Error deleting lecturer:', error)
    return { error: 'Failed to delete lecturer profile.' }
  }

  if (!isMockMode) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (authError) {
          console.error('Error deleting lecturer auth user:', authError)
      }
  }

  revalidatePath('/admin/lecturers')
  return { success: true }
}

export async function resetLecturerPasswordAction(id: string, newPassword: string) {
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  if (!isMockMode) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
          password: newPassword
      })
      if (authError) {
          console.error('Error updating lecturer auth password:', authError)
          return { error: 'Failed to update password in authentication system.' }
      }
  }

  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user || user.user_metadata?.role !== 'SUPER_ADMIN') {
      return { error: 'Unauthorized.' }
  }

  const { error } = await supabaseAdmin.from('lecturers').update({
      password: newPassword
  }).eq('id', id)

  if (error) {
    console.error('Error resetting lecturer password:', error)
    return { error: 'Failed to reset lecturer password.' }
  }

  revalidatePath('/admin/lecturers')
  return { success: true }
}
