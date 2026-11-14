import Link from 'next/link'
import { PublicShell } from '@/components/public/PublicShell'
import styles from '../public.module.css'

export const metadata = {
  title: 'Contact & Support | Bal Pradarshani',
}

const contacts = [
  { name: 'Akshay Shriram ji', role: 'Organizing Executive', phone: '+91 99205 34540' },
  { name: 'Naresh ji', role: 'Operations Lead', phone: '+91 72087 71142' },
  { name: 'Arvind Kanojiya ji', role: 'Credential Supervisor', phone: '+91 90043 21660' },
  { name: 'Ayush Wagh ji', role: 'Technical Lead & Engineering', phone: '+91 96534 79985' },
]

export default function SupportPage() {
  return (
    <PublicShell activePage="support">
      <main id="main-content" tabIndex={-1} className={`${styles.container} ${styles.supportMain}`}>
        <Link href="/" className={`${styles.textLink} ${styles.breadcrumb}`}>Back to the portal</Link>
        <div className={styles.supportIntro}>
          <div><p className={styles.sectionLabel}>A helping hand</p><h1>Let&apos;s get you<br />back on track.</h1></div>
          <p>For help with volunteer registration, model assignments, ID approvals, or a technical issue, contact the organizing team directly.</p>
        </div>
        <div className={styles.contactList}>
          {contacts.map((contact) => (
            <section className={styles.contact} key={contact.name} aria-label={contact.role}>
              <p className={styles.contactRole}>{contact.role}</p>
              <h2>{contact.name}</h2>
              <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} aria-label={`Call ${contact.name} at ${contact.phone}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m7 3 3 5-3 2c2 4 3 5 7 7l2-3 5 3-1 4C10 23 1 14 3 4Z" strokeLinejoin="round" /></svg>
                {contact.phone}
              </a>
            </section>
          ))}
        </div>
        <p className={styles.supportNote}>When you reach out, keep your model name and a brief description of the issue ready. Never share your password.</p>
      </main>
    </PublicShell>
  )
}
