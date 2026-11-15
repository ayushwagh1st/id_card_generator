'use client'

import { openOfflineSession } from '@/lib/offline/session'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { PublicShell } from '@/components/public/PublicShell'
import styles from '../public.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const submitting = useRef(false)
  const router = useRouter()

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setErrorMessage('')
    setLoading(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })

      if (error || !data.user) {
        setErrorMessage(error?.message || 'We could not sign you in. Please check your details and try again.')
        return
      }

      toast.success('Welcome back', { description: 'You are signed in. Opening your workspace…', id: 'sign-in' })
      const role = data.user.app_metadata?.role
      if (data.user.id) openOfflineSession(data.user.id)
      router.refresh()
      router.push(role === 'SUPER_ADMIN' ? '/admin/dashboard' : role === 'MODEL_HEAD' ? '/head/dashboard' : role === 'LECTURER' ? '/lecturer/dashboard' : '/')
    } catch {
      setErrorMessage('We could not connect to the portal. Please check your connection and try again.')
    } finally {
      submitting.current = false
      setLoading(false)
    }
  }

  return (
    <PublicShell activePage="login">
      <main id="main-content" tabIndex={-1} className={`${styles.container} ${styles.loginMain}`}>
        <aside className={styles.loginEditorial} aria-label="About the event">
          <p className={styles.sectionLabel}>Bal Pradarshani · Samagam 2027</p>
          <p className={styles.sectionTitle}>A shared purpose.<br />A place for everyone.</p>
          <p>Your work behind the scenes brings the event together. This is where your team&apos;s journey begins.</p>
          <figure>
            <div className={styles.loginPhoto}><Image src="/gallary/IMG_6584.JPG" alt="Young visitors learning together at Bal Pradarshani" fill sizes="(max-width: 760px) 0px, 45vw" loading="eager" fetchPriority="high" /></div>
            <figcaption className={styles.photoCaption}>From the Samagam archive</figcaption>
          </figure>
        </aside>
        <section className={styles.loginFormSection} aria-labelledby="login-title">
          <p className={styles.sectionLabel}>Welcome back</p>
          <h1 id="login-title" className={styles.loginTitle}>Sign in to the portal.</h1>
          <p className={styles.loginDescription}>Use your assigned account to manage volunteers, registrations, and event IDs.</p>
          <form onSubmit={handleLogin} className={styles.loginForm} aria-busy={loading}>
            <div className={styles.field}>
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="username" placeholder="Your email address" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} aria-describedby={errorMessage ? 'login-error' : undefined} />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordField}>
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" required value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} aria-describedby={errorMessage ? 'login-error' : undefined} />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} disabled={loading}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            {errorMessage && <p id="login-error" role="alert" className={styles.formError}>{errorMessage}</p>}
            <button type="submit" className={styles.primaryButton} disabled={loading}>{loading ? 'Signing you in…' : 'Sign in to your account'}</button>
          </form>
          <div className={styles.loginHelp}><p>Need an account or help with access?</p><Link href="/support" className={styles.textLink}>Contact the organizing team</Link></div>
        </section>
      </main>
    </PublicShell>
  )
}
