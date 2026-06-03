import Link from 'next/link'
import { Layers, Shield, Users, CheckCircle, Printer, ArrowRight, Database } from 'lucide-react'

export default function Home() {
  const features = [
    {
      title: 'Vertical ID Badges',
      desc: 'Strict 54x86mm and 60x95mm event card dimensions suitable for Nirankari Samagam volunteers.',
      icon: Layers,
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400'
    },
    {
      title: 'Smart A4 Duplexing',
      desc: 'Dynamic grid layout with long-edge mirroring for perfect front-to-back card alignment on A4 paper.',
      icon: Printer,
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
    },
    {
      title: 'Role-Based Access',
      desc: 'Dedicated interfaces for Super Admins and Division Heads to manage lists, approvals, and credentials.',
      icon: Shield,
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400'
    },
    {
      title: 'Exhibition Models',
      desc: 'Easily register exhibition categories, model structures, and link supervisor accounts in one click.',
      icon: Database,
      color: 'bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Navbar */}
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-xl text-[#E65100] tracking-tight">
            <Users className="h-6 w-6" />
            <span>VolunTrack</span>
          </div>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-[#E65100] hover:bg-[#F57C00] text-white text-sm font-semibold h-9 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-orange-50 via-white to-slate-50">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] rounded-full bg-orange-100/40 blur-3xl -translate-y-24 translate-x-24 -z-10" />
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] rounded-full bg-indigo-50/50 blur-3xl -translate-x-24 translate-y-24 -z-10" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-[#E65100] uppercase tracking-wider">
                60th Maharashtra Samagam 2027
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none">
                Volunteer Badging <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E65100] to-indigo-600">
                  Made Seamless.
                </span>
              </h1>
              <p className="text-slate-600 text-lg sm:text-xl font-medium max-w-2xl leading-relaxed">
                VolunTrack is a professional volunteer database and ID card generator. Import lists, manage supervisors, and print aligned duplex event badges in seconds.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center lg:justify-start">
                <Link 
                  href="/login" 
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-bold h-12 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-md gap-2"
                >
                  Enter Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <a 
                  href="https://nirankari.org" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold h-12 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-sm"
                >
                  Mandal Website
                </a>
              </div>
            </div>
            
            {/* Visual Feature Card Mockup */}
            <div className="flex-1 relative w-full max-w-md lg:max-w-none">
              <div className="bg-white rounded-2xl shadow-2xl border p-6 space-y-6 relative overflow-hidden group hover:shadow-3xl transition-shadow duration-300">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-emerald-500 w-5 h-5" />
                    <span className="font-bold text-sm text-slate-700">A4 Print Queue Ready</span>
                  </div>
                  <span className="text-[11px] font-bold bg-orange-50 text-[#E65100] px-2 py-0.5 rounded-full border border-orange-200/50">Vertical Format</span>
                </div>
                {/* Simulated Badge Row */}
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-20 bg-slate-100 rounded-lg flex items-center justify-center border text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                  <div className="p-2.5 bg-slate-50 rounded-lg">Width: 54mm</div>
                  <div className="p-2.5 bg-slate-50 rounded-lg">Height: 86mm</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-3 mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Engineered for Event Logistics</h2>
              <p className="text-slate-500 text-sm max-w-lg mx-auto">
                Purpose-built modules to simplify the badge issuing and auditing lifecycle of 60th Maharashtra Samagam volunteers.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feat, idx) => {
                const Icon = feat.icon
                return (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-6 rounded-2xl hover:bg-slate-50/50 hover:shadow-md transition-all duration-300">
                    <div className={`p-3 rounded-xl w-fit ${feat.color} mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">{feat.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{feat.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-slate-900 text-slate-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <p>© 2027 Sant Nirankari Mandal. All Rights Reserved.</p>
          <div className="flex gap-4">
            <a href="https://nirankari.org" className="hover:text-white transition-colors">Official Website</a>
            <span className="text-slate-700">|</span>
            <span className="text-slate-500">VolunTrack v2.1</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
