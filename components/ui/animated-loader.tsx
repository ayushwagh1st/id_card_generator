import Image from 'next/image'

export function AnimatedLoader({ className = "w-6 h-6", text }: { className?: string; text?: string }) {
  if (!text) {
    return <Image src="/loader.svg" alt="Loading..." width={24} height={24} className={className} />
  }

  return (
    <div className="flex items-center gap-2">
      <Image 
        src="/loader.svg" 
        alt="Loading..." 
        width={24} 
        height={24}
        className={className}
      />
      <span className="text-sm font-semibold">{text}</span>
    </div>
  )
}
