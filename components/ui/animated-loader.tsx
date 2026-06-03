import Image from 'next/image'

export function AnimatedLoader({ className = "w-6 h-6", text }: { className?: string; text?: string }) {
  if (!text) {
    return <img src="/loader.svg" alt="Loading..." className={className} />
  }

  return (
    <div className="flex items-center gap-2">
      <img 
        src="/loader.svg" 
        alt="Loading..." 
        className={className}
      />
      <span className="text-sm font-semibold">{text}</span>
    </div>
  )
}
