import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, LogIn, UserPlus, ShieldCheck, Printer, ArrowRight, Users, FileCheck } from 'lucide-react'
import GalleryImage from '@/components/GalleryImage'

const steps = [
  {
    step: '01',
    title: 'Login Securely',
    desc: 'Use your Model Head credentials to securely access the central registration portal.',
    icon: LogIn,
    variant: 'bento-white',
  },
  {
    step: '02',
    title: 'Submit Details',
    desc: 'Add volunteer information, upload their photo, and specify accommodation needs.',
    icon: UserPlus,
    variant: 'bento-lime',
  },
  {
    step: '03',
    title: 'Admin Approval',
    desc: 'The Super Admin will review and verify your submitted volunteer profiles for accuracy.',
    icon: ShieldCheck,
    variant: 'bento-lavender',
  },
  {
    step: '04',
    title: 'ID Printing',
    desc: 'Once approved, the admin generates and prints the official event badges.',
    icon: Printer,
    variant: 'bento-pastel',
  },
]

const stats = [
  { label: 'Volunteers', value: '300+', bg: 'bg-primary text-foreground' },
  { label: 'Models', value: '30+', bg: 'bg-secondary text-ink' },
  { label: 'Divisions', value: '3+', bg: 'bg-card text-ink' },
  { label: 'Year', value: '2027', bg: 'bg-bg-pastel text-ink' },
]

export default function Home() {

  return (
    <div className="bg-background min-h-screen">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-[100] bg-card border-ink border-b-[3px] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Bal Pradarshani Logo" width={40} height={40} className="w-10 h-10 rounded-lg border-2 border-ink object-cover bg-white" />
            <span className="font-display font-bold text-xl text-foreground">Bal Pradarshani</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="font-display font-semibold text-foreground text-[15px] hover:text-primary transition-colors">Home</Link>
            <Link href="#process" className="font-display font-semibold text-foreground text-[15px] hover:text-primary transition-colors">Process</Link>
            <Link href="#gallery" className="font-display font-semibold text-foreground text-[15px] hover:text-primary transition-colors">Gallery</Link>
            <Link href="/support" className="font-display font-semibold text-foreground text-[15px] hover:text-primary transition-colors">Support</Link>
          </div>

          <Link href="/login" className="btn-primary py-2.5 text-base">
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative pt-20 pb-24 overflow-hidden">
        {/* Ghost letter */}
        <div
          className="absolute left-[-0.1em] top-1/2 -translate-y-1/2 font-display font-bold text-foreground select-none pointer-events-none z-0"
          style={{ fontSize: 'clamp(180px, 30vw, 380px)', opacity: 0.04, lineHeight: 1 }}
          aria-hidden="true"
        >
          B
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <span className="badge-flat whitespace-nowrap">60th Nirankari Sant Samagam Maharashtra 2027</span>
              <div className="relative group cursor-default inline-flex">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                <span className="relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-amber-200/50 text-[#1e3a5f] font-display font-bold text-[15px] shadow-sm hover:scale-105 transition-transform duration-300">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="whitespace-nowrap">Theme: जागृति - The Awakening</span>
                </span>
              </div>
            </div>

            <h1
              className="font-display font-bold text-foreground mb-8 leading-[0.95]"
              style={{ fontSize: 'clamp(52px, 8vw, 88px)' }}
            >
              The Smart{' '}
              <span className="text-primary underline decoration-3 decoration-ink decoration-skip-ink">ID Generation</span>{' '}
              Portal
            </h1>

            <p className="text-xl text-foreground/70 mb-12 leading-relaxed max-w-2xl font-sans">
              A streamlined 4-step workflow built for Model Heads to register volunteers and manage event badges with precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/login" className="btn-primary text-center">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#process" className="btn-secondary text-center">
                See How It Works
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative border-3 border-ink rounded-[24px] shadow-hard overflow-hidden bg-card aspect-square w-full max-w-[360px] animate-in zoom-in-95 duration-500">
              <Image src="/hero_illustration.png" alt="Portal Illustration" width={360} height={360} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Stat Band ── */}
      <section className="border-y-[4px] border-ink" aria-label="Key numbers">
        <div className="grid grid-cols-2 md:grid-cols-4 bg-ink">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`${s.bg} flex flex-col items-center justify-center py-10 px-6 text-center ${i < 3 ? 'border-r-[4px] border-ink' : ''}`}
            >
              <span className="font-display font-bold text-5xl leading-none">{s.value}</span>
              <span className="eyebrow mt-2 !text-current opacity-70">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Process Bento ── */}
      <section id="process" className="py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="eyebrow">The Process</span>
            <h2 className="font-display font-bold text-5xl text-foreground mb-4">
              How it Works
            </h2>
            <p className="text-lg text-foreground/70 max-w-xl">
              From authentication to final printing, every step is optimized for documentation-first management.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className={`${step.variant} flex flex-col gap-5 shadow-hard-sm hover:-translate-y-1 transition-transform duration-150`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="icon-tile icon-tile-ink">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-display font-bold text-4xl opacity-20 leading-none">{step.step}</span>
                  </div>
                  <h3 className="font-display font-bold text-2xl leading-tight">{step.title}</h3>
                  <p className="text-base leading-relaxed opacity-80">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="py-24 bg-ink text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <span className="eyebrow !text-primary">Memories</span>
            <h2 className="font-display font-bold text-5xl mb-4">
              Glimpses of Samagam
            </h2>
            <p className="text-lg text-white/70 max-w-xl">
              A look back at the beautiful moments captured during previous events.
            </p>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {[
              "IMG_6584.JPG", "IMG_6602.JPG", "IMG_6627.JPG",
              "IMG_6694.JPG", "IMG_6724.JPG", "IMG_6808.JPG",
              "IMG_6840.JPG", "IMG_6899.JPG", "IMG_6975.JPG",
              "IMG_6980.JPG", "IMG_7052.JPG", "IMG_7125.JPG",
              "IMG_7192.JPG", "IMG_7280.JPG", "IMG_7295.JPG"
            ].map((img, idx) => (
              <div key={idx} className="break-inside-avoid relative rounded-[20px] overflow-hidden border-2 border-white/10 group shadow-hard-sm">
                <div className="absolute inset-0 bg-ink/10 group-hover:bg-transparent transition-colors duration-300 z-10 pointer-events-none" />
                <GalleryImage src={`/gallary/${img}`} alt={`Gallery image ${idx + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ── */}
      <section className="bg-primary border-y-[3px] border-ink py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="font-display font-bold text-foreground mb-6" style={{ fontSize: 'clamp(36px,5vw,60px)' }}>
            Ready to streamline volunteer management?
          </h2>
          <p className="text-foreground/80 text-lg mb-10 max-w-xl mx-auto">
            Join organizers making the 60th Nirankari Sant Samagam Maharashtra a grand success.
          </p>
          <Link
            href="/login"
            className="btn-secondary inline-flex"
          >
            Start registering now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-ink text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Image src="/logo.png" alt="Bal Pradarshani Logo" width={40} height={40} className="w-10 h-10 rounded-lg border-2 border-ink object-cover bg-white" />
                <span className="font-display font-bold text-xl">Bal Pradarshani</span>
              </div>
              <p className="text-white/60 max-w-xs leading-relaxed">
                The modern standard for volunteer registration and ID management.
              </p>
            </div>

            <div>
              <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-white/40 mb-6">Support</h4>
              <ul className="space-y-4">
                <li><Link href="/support" className="text-white/70 hover:text-primary transition-colors">Help Center</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 gap-4 text-sm text-white/40 font-display">
            <p>© 2027 <a href="https://www.nirankari.org/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">Sant Nirankari Mandal</a>. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
              <span>All systems normal</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
