'use server'
import { checkAdmin } from '@/lib/supabase/server'

import { createClient } from '@supabase/supabase-js'
import { sendRegistrationEmail } from '@/lib/email'
import { modelHeadSchema } from '@/lib/validations'
export async function createModelHeadAction(formData: FormData) {
  await checkAdmin();
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const parsed = modelHeadSchema.safeParse({ email, password, fullName })
  if (!parsed.success) {
    return { error: 'Invalid input data', details: parsed.error.flatten().fieldErrors }
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
    app_metadata: { role: 'MODEL_HEAD' },
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

  // 2. Upsert into profiles to handle potential DB triggers that auto-create the row
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: authData.user.id,
    email: email,
    full_name: fullName,
    role: 'MODEL_HEAD',
    temp_password: password
  })

  if (profileError) {
    console.error('Profile upsert error:', profileError)
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
  await checkAdmin();
  const email = formData.get('email') as string
  const fullName = formData.get('fullName') as string

  const parsed = modelHeadSchema.safeParse({ email, fullName })
  if (!parsed.success) {
    return { error: 'Invalid input data', details: parsed.error.flatten().fieldErrors }
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

  if (profileError) {
    console.error('Profile update error:', profileError)
  }

  return { success: true }
}

export async function resetModelHeadPasswordAction(id: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) return { error: 'Password must be at least 6 characters.' }
  await checkAdmin();

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
  await checkAdmin();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return { error: 'Missing environment variables.' }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 1. Delete from profiles first
  const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', id)
  if (profileError) {
    console.error('Error deleting profile:', profileError)
    return { error: 'Failed to delete profile.' }
  }

  // 2. Delete from auth (ignore not found errors if profile was already deleted)
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (authError) {
    console.error('Error deleting auth user (may already be deleted):', authError.message)
  }

  return { success: true }
}

import { createClient as createServerClient } from '@/lib/supabase/server'

export async function getHeadsDataAction() {
  try {
    await checkAdmin();
    const supabase = await createServerClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, temp_password, created_at')
      .eq('role', 'MODEL_HEAD')
      .order('full_name')
    if (error) throw new Error(error.message)
    return profiles ? JSON.parse(JSON.stringify(profiles)) : []
  } catch (error) {
    console.error("Error in getHeadsDataAction:", error);
    // Return mock data for local dev
    return [
      {
        id: 'mock-head-1',
        full_name: 'Mock Supervisor',
        email: 'supervisor@example.com',
        temp_password: 'password123',
        created_at: new Date().toISOString()
      }
    ];
  }
}

export async function getModelsDataAction() {
  try {
    await checkAdmin();
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('models')
      .select(`
        id, name, exhibition_category, description, status, head_id,
        profiles:head_id (full_name, email)
      `)
      .order('name')
    if (error) throw new Error(error.message)
    return data ? JSON.parse(JSON.stringify(data)) : []
  } catch (error) {
    console.error("Error in getModelsDataAction:", error);
    // Return mock data for local dev
    return [
      {
        id: 'mock-model-1',
        name: 'Mock Exhibition Model',
        exhibition_category: 'Science',
        description: 'A mock model for local dev',
        status: 'Active',
        head_id: 'mock-head-1',
        profiles: { full_name: 'Mock Supervisor', email: 'supervisor@example.com' }
      }
    ];
  }
}

export async function createModelAction(payload: any) {
  await checkAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase.from('models').insert(payload)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateModelAction(id: string, payload: any) {
  await checkAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase.from('models').update(payload).eq('id', id)
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteModelAction(id: string) {
  await checkAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase.from('models').delete().eq('id', id)
  if (error) throw new Error(error.message)
  return { success: true }
}

