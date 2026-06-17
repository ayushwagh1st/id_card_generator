'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPasswordResetEmail } from '@/lib/email'

export async function sendPasswordResetEmailAction(email: string) {
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

    const resetLink = data.properties.action_link

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
