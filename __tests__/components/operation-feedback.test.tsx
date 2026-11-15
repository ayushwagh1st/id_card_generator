import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActionForm } from '@/components/ui/action-form'
import { AsyncButton } from '@/components/ui/async-button'
import { VolunteersTable } from '@/app/admin/volunteers/_components/VolunteersTable'
import { touchFeedback, setTouchFeedback } from '@/lib/touch-feedback'

afterEach(() => { cleanup(); localStorage.clear(); vi.unstubAllGlobals() })

function deferred() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

describe('Operation feedback', () => {
  it('locks a form immediately and ignores repeated submissions until the request finishes', async () => {
    const request = deferred()
    const submit = vi.fn(() => request.promise)
    const view = render(<ActionForm onSubmit={submit}><label>Name<input name="name" /></label><button type="submit">Save profile</button></ActionForm>)
    const form = view.container.querySelector('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(submit).toHaveBeenCalledOnce()
    expect(form).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('Saving changes…')
    await act(async () => request.resolve())
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeEnabled()
    expect(form).toHaveAttribute('aria-busy', 'false')
  })

  it('unlocks a failed form and keeps an actionable error', async () => {
    const request = deferred()
    const view = render(<ActionForm onSubmit={() => request.promise}><button type="submit">Save</button></ActionForm>)
    fireEvent.submit(view.container.querySelector('form')!)
    await act(async () => request.reject(new Error('Request failed')))
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('blocks repeated bulk-action clicks and restores the original label', async () => {
    const request = deferred()
    const action = vi.fn(() => request.promise)
    render(<AsyncButton onClick={action} busyLabel="Approving…">Approve selected</AsyncButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Approve selected' }))
    fireEvent.click(screen.getByRole('button', { name: 'Approving…' }))
    expect(action).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Approving…' })).toBeDisabled()
    await act(async () => request.resolve())
    expect(screen.getByRole('button', { name: 'Approve selected' })).toBeEnabled()
  })

  it('shows status saving immediately, disables changes, and preserves the original value after failure', async () => {
    const request = deferred()
    const action = vi.fn(() => request.promise)
    render(<VolunteersTable volunteers={[{ id: 'test-record', full_name: '[Test volunteer]', status: 'Pending' }]} loading={false} selectedIds={[]} page={1} totalPages={1} totalCount={1} searchTerm="" filterStatus="all" filterModel="all" onToggleSelectAll={vi.fn()} onToggleSelect={vi.fn()} onOpenEdit={vi.fn()} onPrintSingle={vi.fn()} onStatusChange={action} onPageChange={vi.fn()} />)
    const trigger = screen.getAllByRole('combobox', { name: 'Status for [Test volunteer]' })[0]
    fireEvent.click(trigger)
    const option = await screen.findByRole('option', { name: 'Approved' })
    fireEvent.pointerDown(option, { pointerType: 'mouse' })
    fireEvent.click(option)
    await waitFor(() => expect(action).toHaveBeenCalledOnce())
    expect(trigger).toBeDisabled()
    expect(screen.getByText('Saving approved…')).toBeVisible()
    expect(trigger).toHaveTextContent('Pending')
    await act(async () => request.reject(new Error('Status rejected')))
    expect(trigger).toBeEnabled()
    expect(trigger).toHaveTextContent('Pending')
    expect(screen.getByText('Not saved. Try again.')).toBeVisible()
  })

  it('keeps haptics opt-in, suppresses them for reduced motion, and tolerates unsupported devices', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate })
    const media = vi.fn((query: string) => ({ matches: query === '(pointer: coarse)' }))
    vi.stubGlobal('matchMedia', media)
    touchFeedback()
    expect(vibrate).not.toHaveBeenCalled()
    setTouchFeedback(true)
    touchFeedback()
    expect(vibrate).toHaveBeenCalledWith(10)
    media.mockImplementation(() => ({ matches: true }))
    touchFeedback()
    expect(vibrate).toHaveBeenCalledOnce()
    vi.stubGlobal('navigator', {})
    expect(() => touchFeedback()).not.toThrow()
  })
})
