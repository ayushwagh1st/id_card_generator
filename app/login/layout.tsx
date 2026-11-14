import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Sign in | Bal Pradarshani',
  description: 'Sign in with your assigned account to manage volunteer registration and event IDs.',
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children
}
