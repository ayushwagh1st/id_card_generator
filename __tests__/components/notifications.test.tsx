import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

vi.mock('next-themes', () => ({ useTheme: () => ({ resolvedTheme: 'dark' }) }))
afterEach(() => { toast.dismiss(); cleanup() })

describe('Application notifications', () => {
  it('renders readable outcome/detail content with a named dismiss control in the active theme', async () => {
    render(<Toaster />)
    act(() => { toast.success('[Test] Profile saved', { id: 'notification-test', description: '[Test] Your changes were saved.', duration: Infinity }) })
    expect(await screen.findByText('[Test] Profile saved')).toBeVisible()
    expect(screen.getByText('[Test] Your changes were saved.')).toBeVisible()
    expect(document.querySelector('[data-sonner-toaster]')).toHaveAttribute('data-sonner-theme', 'dark')
    fireEvent.click(screen.getByRole('button', { name: 'Close toast' }))
    await waitFor(() => expect(screen.queryByText('[Test] Profile saved')).not.toBeInTheDocument())
  })

  it('keeps recovery actions operable and replaces an existing outcome rather than duplicating it', async () => {
    const retry = vi.fn()
    render(<Toaster />)
    act(() => { toast.error('[Test] Not saved', { id: 'retry-test', description: '[Test] Try again.', duration: Infinity, action: { label: 'Retry', onClick: event => { event.preventDefault(); retry(); toast.loading('[Test] Trying again', { id: 'retry-test', duration: Infinity }) } } }) })
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }))
    expect(retry).toHaveBeenCalledOnce()
    act(() => { toast.success('[Test] Saved after retry', { id: 'retry-test', duration: Infinity }) })
    expect(await screen.findByText('[Test] Saved after retry')).toBeVisible()
    expect(screen.queryByText('[Test] Not saved')).not.toBeInTheDocument()
  })
})
