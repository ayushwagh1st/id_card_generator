'use server'
import { checkAuth, createClient } from '@/lib/supabase/server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPasswordResetEmail } from '@/lib/email'

// oxlint-disable-next-line react-doctor/server-auth-actions -- password reset is meant to be called by anonymous users who forgot their credentials
async function sendPasswordResetEmailAction(email: string) {
  if (!email) {
    return { error: 'Email is required.' }
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Generate the recovery link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/update-password`
      }
    })

    if (error) {
      console.error('Error generating recovery link:', error)
      return { error: 'Failed to generate reset link. Please check if the email is registered.' }
    }

    let resetLink = data.properties.action_link

    // Force the link to point to /update-password in case Supabase ignored the redirectTo option
    try {
      const urlObj = new URL(resetLink)
      urlObj.pathname = '/update-password'
      resetLink = urlObj.toString()
    } catch (e) {
      console.error('Failed to parse reset link URL')
    }

    // Send the email via Resend
    const emailResult = await sendPasswordResetEmail({
      email,
      resetLink
    })

    if (emailResult.error) {
      return { error: 'Failed to send the email. Please try again later.' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Unexpected error in forgot password flow:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function loginAction(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  const role = data.user?.user_metadata?.role
  return { success: true, role }
}

// oxlint-disable-next-line react-doctor/server-auth-actions -- logout is safe to run by unauthenticated users and checking auth beforehand might throw unhandled exceptions
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function getCurrentUserAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
