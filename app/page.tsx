import Image from 'next/image'
import Link from 'next/link'
import { PublicShell } from '@/components/public/PublicShell'
import { EventGallery } from '@/components/public/EventGallery'
import styles from './public.module.css'

const steps = [
  { title: 'Sign in with your account', description: 'Use the credentials provided to you as a Model Head to access your volunteer roster.' },
  { title: 'Bring your team together', description: 'Add volunteer details, upload a clear photograph, and record accommodation needs.' },
  { title: 'Send profiles for review', description: 'The admin team reviews the submitted information before approving each profile.' },
  { title: 'Leave the badges to us', description: 'Once profiles are approved, the admin team generates and prints the event IDs.' },
]

export default function Home() {
  return (
    <PublicShell>
      <main id="main-content" tabIndex={-1}>
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <p className={styles.eventLine}>60th Nirankari Sant Samagam <span>Maharashtra, 2027</span></p>
            <h1 id="home-title" className={styles.heroTitle}>Every volunteer.<br /><em>One shared<br className={styles.desktopBreak} /> purpose.</em></h1>
            <p className={styles.heroDescription}>Behind every memorable Samagam is a team that cares. Register your volunteers and prepare their event IDs, all in one place.</p>
            <div className={styles.actions}>
              <Link href="/login" className={styles.primaryButton}>Sign in to register</Link>
              <a href="#process" className={styles.textLink}>How registration works <span aria-hidden="true">↓</span></a>
            </div>
            <p className={styles.helperText}>For Model Heads and the organizing team.</p>
          </div>
          <figure className={styles.heroFigure}>
            <div className={styles.heroPhoto}>
              <Image src="/gallary/IMG_6584.JPG" alt="Children exploring the Bal Pradarshani exhibition with a volunteer" fill sizes="(max-width: 760px) 100vw, 52vw" loading="eager" fetchPriority="high" />
            </div>
            <figcaption className={styles.photoCaption}><span>A little curiosity. A lot of connection.</span><span>From the Samagam archive</span></figcaption>
          </figure>
        </section>

        <section className={styles.themeBand} aria-label="Event theme">
          <div className={`${styles.container} ${styles.themeBandInner}`}>
            <p className={styles.themeName}><span lang="hi">जागृति</span><span>The Awakening</span></p>
            <p>Coming together in service.<br />Growing together in awareness.</p>
            <span className={styles.eventEdition}>Bal Pradarshani <span>Samagam 2027</span></span>
          </div>
        </section>

        <section id="process" className={`${styles.container} ${styles.process}`} aria-labelledby="process-title">
          <div className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>Volunteer registration</p>
            <h2 id="process-title" className={styles.sectionTitle}>From a helping hand<br />to an event badge.</h2>
            <p>A clear path for every volunteer, from the first details to the printed ID.</p>
            <aside className={styles.preparationNote}>
              <h3>Before you begin</h3>
              <p>Keep your volunteer details, photographs, and accommodation requirements ready.</p>
            </aside>
          </div>
          <ol className={styles.stepList}>
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber} aria-hidden="true">0{index + 1}</span>
                <div><h3>{step.title}</h3><p>{step.description}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section id="gallery" className={styles.gallerySection} aria-labelledby="gallery-title">
          <div className={styles.container}>
            <div className={styles.galleryHeading}>
              <div><p className={styles.sectionLabel}>The people behind the purpose</p><h2 id="gallery-title" className={styles.sectionTitle}>Moments of togetherness.</h2></div>
              <p>A look back at the learning, service, and shared joy of Samagam.</p>
            </div>
            <EventGallery />
          </div>
        </section>

        <section className={`${styles.container} ${styles.registrationCta}`} aria-labelledby="registration-title">
          <div><p className={styles.sectionLabel}>Your team starts here</p><h2 id="registration-title" className={styles.sectionTitle}>Make room for every volunteer.</h2><p>Sign in with your assigned account to register your team.</p></div>
          <div className={styles.ctaActions}><Link href="/login" className={styles.primaryButton}>Open registration portal</Link><Link href="/support" className={styles.textLink}>Need help signing in?</Link></div>
        </section>
      </main>
    </PublicShell>
  )
}
