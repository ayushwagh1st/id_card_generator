import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

describe('Workspace navigation', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('opens with the keyboard shortcut and safely handles an empty search', async () => {
    render(<CommandPalette />)
    fireEvent.keyDown(window, { ctrlKey: true, key: 'k' })
    const input = await screen.findByRole('combobox', { name: 'Search pages and tools' })
    await waitFor(() => expect(input).toHaveFocus())
    fireEvent.change(input, { target: { value: 'no-such-page' } })
    expect(screen.getByText('No matching pages. Try a shorter search or a different task.')).toBeVisible()
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).not.toHaveBeenCalled()
    expect(input).toHaveAttribute('aria-expanded', 'true')
  })

  it('filters the existing destinations and opens the keyboard selection', async () => {
    render(<CommandPalette />)
    fireEvent.click(screen.getByRole('button', { name: 'Search pages and tools' }))
    const input = await screen.findByRole('combobox', { name: 'Search pages and tools' })
    fireEvent.change(input, { target: { value: 'Session' } })
    expect(screen.getByRole('option', { name: /^Sessions: / })).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(push).toHaveBeenCalledWith('/admin/sessions')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('displays friendly labels for selected values and preserves value callbacks', async () => {
    const onChange = vi.fn()
    render(<><label htmlFor="test-filter">Model filter</label><Select defaultValue="all" onValueChange={onChange}>
      <SelectTrigger id="test-filter"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all" label="All exhibition models">All exhibition models</SelectItem><SelectItem value="model-1">First model</SelectItem></SelectContent>
    </Select></>)
    const trigger = screen.getByRole('combobox', { name: 'Model filter' })
    expect(trigger).toHaveTextContent('All exhibition models')
    fireEvent.click(trigger)
    const option = await screen.findByRole('option', { name: 'First model' })
    fireEvent.pointerDown(option, { pointerType: 'mouse' })
    fireEvent.click(option)
    expect(onChange.mock.calls[0][0]).toBe('model-1')
    await waitFor(() => expect(trigger).toHaveTextContent('First model'))
  })
})
