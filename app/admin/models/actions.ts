'use server'

import { createClient } from '@supabase/supabase-js'
import { sendRegistrationEmail } from '@/lib/email'

export async function createModelHeadAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (!email || !password || !fullName) {
    return { error: 'All fields are required.' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: 'Supabase URL or Service Role Key is missing in environment variables.' }
  }

  // Create an admin client using the service role key
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // 1. Create the user via admin API (bypasses email confirmation issues)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'MODEL_HEAD'
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user. Unknown error.' }
  }

  // 2. Try to manually insert into profiles
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: authData.user.id,
    email: email,
    full_name: fullName,
    role: 'MODEL_HEAD',
    temp_password: password
  })

  if (profileError) {
    if (profileError.code !== '23505') {
      console.warn('Profile insertion error:', profileError)
    }
  }

  // 3. Send Email via Resend
  await sendRegistrationEmail({
    email,
    name: fullName,
    loginId: email,
    loginPass: password,
    role: 'Model Head'
  })

  return { success: true }
}

export async function updateModelHeadAction(id: string, formData: FormData) {
  const email = formData.get('email') as string
  const fullName = formData.get('fullName') as string

  if (!email || !fullName) {
    return { error: 'Email and Full Name are required.' }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return { error: 'Missing environment variables.' }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 1. Update Auth User
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
    email,
    user_metadata: { full_name: fullName }
  })

  if (authError) return { error: authError.message }

  // 2. Update Profile
  const { error: profileError } = await supabaseAdmin.from('profiles').update({
    email,
    full_name: fullName
  }).eq('id', id)

  if (profileError) return { error: profileError.message }

  return { success: true }
}

export async function resetModelHeadPasswordAction(id: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) return { error: 'Password must be at least 6 characters.' }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return { error: 'Missing environment variables.' }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
    password: newPassword
  })

  if (authError) return { error: authError.message }

  const { error: profileError } = await supabaseAdmin.from('profiles').update({
    temp_password: newPassword
  }).eq('id', id)

  if (profileError) return { error: profileError.message }

  return { success: true }
}

export async function deleteModelHeadAction(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return { error: 'Missing environment variables.' }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Profile is usually deleted via CASCADE, but we explicitly delete both to be safe
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authError) return { error: authError.message }

  return { success: true }
}

