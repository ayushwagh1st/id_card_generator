import { Users } from 'lucide-react'

export function VolunteersHeader() {
  return (
    <div className="rounded-[32px] bg-[var(--color-yellow)] p-6 md:p-10 text-ink border-ink shadow-hard pattern-grid relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="relative z-10 space-y-3">
        <div className="inline-flex badge-flat bg-white text-ink border-ink transform -rotate-2">
          <Users className="w-4 h-4 mr-2" /> Directory
        </div>
        <h1 className="font-display font-bold text-4xl md:text-5xl leading-tight">Volunteer Directory</h1>
        <p className="font-sans font-medium text-ink/80 text-lg max-w-xl">
          Approve, manage, and print ID cards for all active volunteers. Import datasets via CSV securely.
        </p>
      </div>
    </div>
  )
}
