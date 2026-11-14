import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import LoginPage from '@/app/login/page'

const { signIn, push, refresh } = vi.hoisted(() => ({
  signIn: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithPassword: signIn } }),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }) }))
vi.mock('@/components/public/PublicShell', () => ({
  PublicShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))

function submitCredentials() {
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'ui-check@example.invalid' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'test-only' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Sign in to your account' }).closest('form')!)
}

describe('Sign-in feedback', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('starts empty and lets the user show and hide the password', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Email address')).toHaveValue('')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByLabelText('Email address')).toBeRequired()
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })

  it('prevents duplicate submission, announces progress, and restores the form after rejection', async () => {
    let resolveSignIn!: (result: { data: { user: null }; error: { message: string } }) => void
    signIn.mockImplementation(() => new Promise((resolve) => { resolveSignIn = resolve }))
    render(<LoginPage />)
    submitCredentials()
    expect(await screen.findByRole('button', { name: 'Signing you in…' })).toBeDisabled()
    expect(screen.getByLabelText('Email address')).toBeDisabled()
    fireEvent.submit(screen.getByRole('button', { name: 'Signing you in…' }).closest('form')!)
    expect(signIn).toHaveBeenCalledTimes(1)
    resolveSignIn({ data: { user: null }, error: { message: 'Invalid login credentials' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials')
    expect(screen.getByRole('button', { name: 'Sign in to your account' })).toBeEnabled()
    expect(screen.getByLabelText('Email address')).toBeEnabled()
    expect(push).not.toHaveBeenCalled()
  })

  it('provides a next action when the connection fails', async () => {
    signIn.mockRejectedValue(new Error('Connection failed'))
    render(<LoginPage />)
    submitCredentials()
    expect(await screen.findByRole('alert')).toHaveTextContent('Please check your connection and try again.')
    expect(screen.getByRole('button', { name: 'Sign in to your account' })).toBeEnabled()
  })

  it.each([
    ['SUPER_ADMIN', '/admin/dashboard'],
    ['MODEL_HEAD', '/head/dashboard'],
    ['LECTURER', '/lecturer/dashboard'],
    ['UNKNOWN', '/'],
  ])('preserves the %s destination after success', async (role, destination) => {
    signIn.mockResolvedValue({ data: { user: { app_metadata: { role } } }, error: null })
    render(<LoginPage />)
    submitCredentials()
    await waitFor(() => expect(push).toHaveBeenCalledWith(destination))
    expect(refresh).toHaveBeenCalledOnce()
  })
  it('does not use an editable metadata role as a trusted destination', async () => {
    signIn.mockResolvedValue({ data: { user: { user_metadata: { role: 'SUPER_ADMIN' } } }, error: null })
    render(<LoginPage />); submitCredentials(); await waitFor(() => expect(push).toHaveBeenCalledWith('/'))
  })
})
