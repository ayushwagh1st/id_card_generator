import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Security staff | Admin | Bal Pradarshani',
}

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
