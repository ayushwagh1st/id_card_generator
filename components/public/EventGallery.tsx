'use client'

import { useRef, useState } from 'react'
import GalleryImage from '@/components/GalleryImage'
import styles from '@/app/public.module.css'

const photographs = [
  { file: 'IMG_6584.JPG', alt: 'Children exploring the exhibition with a volunteer' },
  { file: 'IMG_6602.JPG', alt: 'Children gathered for a presentation at Bal Pradarshani' },
  { file: 'IMG_6627.JPG', alt: 'Visitors discussing the exhibits at Bal Pradarshani' },
  { file: 'IMG_6694.JPG', alt: 'Schoolchildren watching an exhibition demonstration' },
  { file: 'IMG_6724.JPG', alt: 'A young visitor speaking into a microphone' },
  { file: 'IMG_6808.JPG', alt: 'A visitor adding a brushstroke to a shared artwork' },
  { file: 'IMG_6840.JPG', alt: 'From the Samagam event archive' },
  { file: 'IMG_6899.JPG', alt: 'From the Bal Pradarshani archive' },
  { file: 'IMG_6975.JPG', alt: 'An exhibition moment from Samagam' },
  { file: 'IMG_6980.JPG', alt: 'A photograph from the Samagam exhibition' },
  { file: 'IMG_7052.JPG', alt: 'From the Samagam event archive' },
  { file: 'IMG_7125.JPG', alt: 'From the Bal Pradarshani archive' },
  { file: 'IMG_7192.JPG', alt: 'An exhibition moment from Samagam' },
  { file: 'IMG_7280.JPG', alt: 'A photograph from the Samagam exhibition' },
  { file: 'IMG_7295.JPG', alt: 'From the Bal Pradarshani event archive' },
]

export function EventGallery() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState(0)
  const openPhotograph = (index: number) => {
    setSelected(index)
    dialogRef.current?.showModal()
  }
  const move = (direction: number) => setSelected((current) => (current + direction + photographs.length) % photographs.length)
  const photograph = photographs[selected]

  return (
    <>
      <div className={styles.galleryGrid}>
        {photographs.slice(0, 6).map((photo, index) => (
          <button type="button" key={photo.file} className={styles.galleryTile} onClick={() => openPhotograph(index)} aria-label={`Enlarge photograph ${index + 1}: ${photo.alt}`} aria-haspopup="dialog">
            <GalleryImage src={`/gallary/${photo.file}`} alt={photo.alt} />
            <span className={styles.photoEnlarge} aria-hidden="true">View photograph ↗</span>
          </button>
        ))}
      </div>
      <div className={styles.galleryBottom}><p>Photographs from the Samagam archive.</p><button type="button" className={styles.secondaryButton} onClick={() => openPhotograph(0)} aria-haspopup="dialog">View all {photographs.length} photographs</button></div>
      <dialog ref={dialogRef} className={styles.lightbox} aria-labelledby="photo-title" onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close() }} onKeyDown={(event) => {
        if (event.key === 'ArrowRight') move(1)
        if (event.key === 'ArrowLeft') move(-1)
        if (event.key === 'Tab') {
          const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
          const first = buttons[0]
          const last = buttons[buttons.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }}>
        <div className={styles.lightboxContent}>
          <div className={styles.lightboxHeader}><h2 id="photo-title">Samagam archive <span>{selected + 1} / {photographs.length}</span></h2><button type="button" onClick={() => dialogRef.current?.close()} className={styles.secondaryButton} autoFocus>Close <span aria-hidden="true">×</span></button></div>
          <div className={styles.lightboxPhoto}><GalleryImage key={photograph.file} src={`/gallary/${photograph.file}`} alt={photograph.alt} enlarged /></div>
          <div className={styles.lightboxControls}><button type="button" className={styles.secondaryButton} onClick={() => move(-1)}>Previous</button><p className={styles.lightboxHint}>Use the arrow keys to browse</p><button type="button" className={styles.secondaryButton} onClick={() => move(1)}>Next</button></div>
        </div>
      </dialog>
    </>
  )
}
