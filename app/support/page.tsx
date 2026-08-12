import { Phone, ArrowLeft, HeadphonesIcon, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Support & Help Center | Samagam Portal',
}

const contacts = [
  { name: 'Akshay Shriram ji', role: 'Organizing Executive', phone: '+91 99205 34540' },
  { name: 'Naresh ji', role: 'Operations Lead', phone: '+91 72087 71142' },
  { name: 'Arvind Kanojiya ji', role: 'Credential Supervisor', phone: '+91 90043 21660' },
  { name: 'Ayush Wagh ji', role: 'Technical Lead & Engineering', phone: '+91 96534 79985' },
]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] flex flex-col items-center justify-center relative overflow-hidden py-12 px-4">
      <div className="max-w-4xl w-full space-y-8 relative z-10">

        <div>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </Button>
          </Link>
        </div>

        <GlassCard className="p-8 sm:p-12" glowColor="blue">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-500 mb-2">
            <HeadphonesIcon className="w-4 h-4" />
            <span>Help Center</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
            Core Operations Support
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Need assistance with volunteer registration, model assignment, credential batch approval, or technical troubleshooting? Reach out directly to our committee leads.
          </p>
        </GlassCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <GlassCard key={contact.name} className="p-6" glowColor="cyan">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">{contact.role}</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{contact.name}</h3>
                  <a 
                    href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} 
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline block pt-1"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}
