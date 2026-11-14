'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from '@/app/public.module.css'

export default function GalleryImage({ src, alt, enlarged = false }: { src: string; alt: string; enlarged?: boolean }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  return (
    <span className={`${styles.archiveImage} ${enlarged ? styles.archiveImageEnlarged : ''}`} aria-busy={status === 'loading'}>
      {status !== 'loaded' && <span className={styles.imageStatus} role="status">{status === 'error' ? 'This photograph could not load. Please try again later.' : 'Loading photograph…'}</span>}
      {status !== 'error' && <Image src={src} alt={alt} fill sizes={enlarged ? '90vw' : '(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw'} className={`${enlarged ? styles.containImage : ''} ${status === 'loaded' ? '' : styles.imagePending}`} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />}
    </span>
  )
}
