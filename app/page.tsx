import Link from 'next/link'
import { LogIn, UserPlus, ShieldCheck, Printer, ArrowRight, Tent, Sparkles, Star } from 'lucide-react'

export default function Home() {
  const steps = [
    {
      title: 'Step 1: Login',
      desc: 'Use your Model Head credentials to securely access the portal.',
      icon: LogIn,
      color: 'bg-pink-100 text-pink-600',
    },
    {
      title: 'Step 2: Submit Details',
      desc: 'Add volunteer information, upload their photo, and specify accommodation needs.',
      icon: UserPlus,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: 'Step 3: Admin Approval',
      desc: 'The Super Admin will review and verify your submitted volunteer profiles.',
      icon: ShieldCheck,
      color: 'bg-cyan-100 text-cyan-600',
    },
    {
      title: 'Step 4: Printing',
      desc: 'Once approved, the admin generates and prints the official ID cards.',
      icon: Printer,
      color: 'bg-purple-100 text-purple-600',
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-tr from-cyan-50 via-yellow-50 to-pink-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-pink-500 selection:text-white overflow-hidden relative">
      
      {/* Decorative Vectors */}
      <Tent className="absolute top-20 right-10 w-32 h-32 text-pink-400/20 -rotate-12 blur-[1px]" strokeWidth={1} />
      <Star className="absolute bottom-40 left-10 w-24 h-24 text-yellow-500/20 animate-pulse blur-[1px]" strokeWidth={1.5} />
      <Sparkles className="absolute top-1/2 left-1/4 w-16 h-16 text-cyan-400/20 animate-bounce blur-[1px]" strokeWidth={1} />

      {/* Navbar */}
      <header className="border-b border-white/40 bg-white/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-orange-400">
            <div className="bg-gradient-to-tr from-pink-500 to-orange-400 p-1.5 rounded shadow-sm">
              <Tent className="h-4 w-4 text-white" />
            </div>
            <span>Bal Pradarshani</span>
          </div>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white text-sm font-bold h-9 px-5 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-md"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full z-10">
        
        {/* Header Title */}
        <div className="text-center space-y-6 mb-16">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-white shadow-sm text-pink-500 uppercase tracking-widest border border-pink-100">
            60th Maharashtra Samagam 2027
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 tracking-tight leading-tight">
            How to Use the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 drop-shadow-sm">
              ID Generation Portal
            </span>
          </h1>
          <p className="text-slate-600 text-lg sm:text-xl font-bold max-w-2xl mx-auto leading-relaxed">
            A simple 4-step guide for Model Heads to register their volunteers and get official event badges!
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector Line (hidden on mobile) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-white/60 -translate-y-1/2 z-0 rounded-full shadow-inner" />
          
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={idx} className="bg-white/80 backdrop-blur-md border-2 border-white rounded-[2rem] p-6 shadow-xl relative z-10 hover:-translate-y-2 transition-transform duration-300 group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step.color} shadow-inner mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-black text-xl text-slate-800 mb-3">{step.title}</h3>
                <p className="text-slate-600 font-semibold text-sm leading-relaxed">{step.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Action Button */}
        <div className="mt-20 flex justify-center">
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 text-white font-black text-lg h-14 px-8 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl gap-3 group"
          >
            Start the Process 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/40 backdrop-blur-sm border-t border-white/40 py-6 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 text-xs font-bold text-slate-500">
          <p>© 2027 Sant Nirankari Mandal. All Rights Reserved.</p>
          <div className="flex gap-4 items-center">
            <a href="https://nirankari.org" className="hover:text-pink-500 transition-colors">Official Website</a>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">Bal Pradarshani ID System</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
