import Link from 'next/link'
import type { ReactNode } from 'react'
import { PublicThemeToggle } from './PublicThemeToggle'
import styles from '@/app/public.module.css'

export function PublicShell({ children, activePage }: { children: ReactNode; activePage?: 'login' | 'support' }) {
  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>Skip to content</a>
      <header className={styles.siteHeader}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Link href="/" className={styles.wordmark} aria-label="Bal Pradarshani home"><span>Bal Pradarshani<span className={styles.wordmarkDot}>.</span></span><small>Volunteer & ID portal</small></Link>
          <nav aria-label="Main navigation" className={styles.navigation}>
            {/* Native anchors replace the current fragment correctly on repeated section navigation. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/#process">Registration</a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/#gallery">Gallery</a>
            <Link href="/support" aria-current={activePage === 'support' ? 'page' : undefined}>Support</Link>
          </nav>
          <div className={styles.headerActions}>
            <PublicThemeToggle />
            <Link href="/login" className={styles.headerSignIn} aria-current={activePage === 'login' ? 'page' : undefined}>Sign in <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </header>
      {children}
      <footer className={styles.siteFooter}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <div><p className={styles.footerBrand}>Bal Pradarshani</p><p>In the spirit of service and togetherness.</p></div>
          <div className={styles.footerLinks}><Link href="/support">Contact the organizing team</Link><a href="https://www.nirankari.org/" target="_blank" rel="noopener noreferrer">Sant Nirankari Mandal <span className={styles.srOnly}>(opens in a new tab)</span></a></div>
        </div>
      </footer>
    </div>
  )
}
