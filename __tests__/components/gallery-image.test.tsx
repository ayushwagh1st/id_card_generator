import { createElement } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GalleryImage from '@/components/GalleryImage'

vi.mock('next/image', () => ({
  default: ({ src, alt, onLoad, onError }: { src: string; alt: string; onLoad: () => void; onError: () => void }) =>
    createElement('img', { src, alt, onLoad, onError }),
}))

describe('Archive photograph feedback', () => {
  afterEach(cleanup)

  it('reserves the photograph area and removes loading feedback after load', () => {
    render(<GalleryImage src="/gallary/IMG_6584.JPG" alt="Archive photograph" />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading photograph')
    expect(screen.getByRole('img').parentElement).toHaveAttribute('aria-busy', 'true')
    fireEvent.load(screen.getByRole('img'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('img').parentElement).toHaveAttribute('aria-busy', 'false')
  })

  it('replaces a broken photograph with an explanation', () => {
    render(<GalleryImage src="/missing-photo.jpg" alt="Unavailable photograph" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByRole('status')).toHaveTextContent('This photograph could not load. Please try again later.')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
