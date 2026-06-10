'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

export default function GalleryImage({ src, alt }: { src: string, alt: string }) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="relative w-full overflow-hidden">
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full bg-white/10 rounded-none z-0" />
      )}
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`w-full h-auto object-cover transform group-hover:scale-105 transition-all duration-700 relative z-0 ${
          isLoading ? 'opacity-0 blur-sm scale-110' : 'opacity-100 blur-0 scale-100'
        }`}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  )
}
