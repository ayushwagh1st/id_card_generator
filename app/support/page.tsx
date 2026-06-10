import { Card, CardContent } from '@/components/ui/card'
import { Phone, ArrowLeft, HeadphonesIcon } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Support & Help Center | SNK ID Card System',
}

const contacts = [
  { name: 'Akshay Shriram ji', phone: '+91 99205 34540' },
  { name: 'Naresh ji', phone: '+91 72087 71142' },
  { name: 'Arvind Kanojiya ji', phone: '+91 90043 21660' },
  { name: 'Ayush wagh ji (Technical Support)', phone: '+91 96534 79985' },
]

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden pattern-dots">
      <div className="max-w-3xl w-full px-6 py-12 relative z-10 flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

        <div>
          <Link href="/" className="inline-flex items-center btn-secondary !py-2 !px-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="text-center space-y-6 bg-primary border-[3px] border-ink p-8 md:p-12 rounded-[32px] shadow-hard relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <HeadphonesIcon className="w-64 h-64 text-ink" />
          </div>
          <div className="relative z-10 text-left">
            <span className="eyebrow !text-ink !border-ink !bg-white/50 backdrop-blur-sm">Help Center</span>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-ink tracking-tight mb-4">Support Team</h1>
            <p className="text-ink/80 font-sans text-xl max-w-lg">
              Need assistance with volunteer registration, model assignment, or ID card generation? Contact our core support team below.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {contacts.map((contact, index) => (
            <Card key={index} className="bento-white shadow-hard border-ink hover:-translate-y-1 transition-transform duration-150 group">
              <CardContent className="p-8 flex flex-col space-y-4">
                <div className="icon-tile icon-tile-ink bg-secondary text-ink group-hover:scale-110 transition-transform duration-300">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink text-2xl mb-1">{contact.name}</h3>
                  <a href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`} className="font-sans font-bold text-xl text-primary hover:text-ink hover:underline underline-offset-4 decoration-2 decoration-ink inline-block transition-colors">
                    {contact.phone}
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
