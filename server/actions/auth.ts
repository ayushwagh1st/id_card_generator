'use server'
import { checkAuth, createClient } from '@/lib/supabase/server'

export async function loginAction(email: string, password: string) {
  try {
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
  } catch (err: any) {
    console.error('loginAction unexpected error:', err)
    return { error: 'An unexpected server error occurred. Please try again.' }
  }
}

// oxlint-disable-next-line react-doctor/server-auth-actions -- logout is safe to run by unauthenticated users and checking auth beforehand might throw unhandled exceptions
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function getCurrentUserAction() {
  try {
    const { user } = await checkAuth();
    return user ? structuredClone(user) : null;
  } catch (error: any) {
    if (error?.message !== 'Unauthorized') {
      console.error("Error in getCurrentUserAction:", error);
    }
    return null;
  }
}
