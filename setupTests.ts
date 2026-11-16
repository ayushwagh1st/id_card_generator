import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '',
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}))

// Provide a global mock for supabase server client
vi.mock('@/lib/supabase/server', () => {
  const supabaseClientMock = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com', app_metadata: { role: 'SUPER_ADMIN' }, user_metadata: { role: 'SUPER_ADMIN' } } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      exchangeCodeForSession: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
  }
  return {
    createClient: vi.fn().mockResolvedValue(supabaseClientMock),
    checkAuth: vi.fn().mockResolvedValue({ user: { id: 'test-user', email: 'test@example.com', app_metadata: { role: 'SUPER_ADMIN' }, user_metadata: { role: 'SUPER_ADMIN' } } }),
    checkAdmin: vi.fn().mockResolvedValue({ user: { id: 'test-user', app_metadata: { role: 'SUPER_ADMIN' } } }),
  }
})

vi.mock('@supabase/ssr', async () => {
  const original = await vi.importActual<typeof import('@supabase/ssr')>('@supabase/ssr')
  const { createClient } = await import('@/lib/supabase/server')
  const client = await createClient()
  return { ...original, createServerClient: vi.fn(() => client) }
})
vi.mock('@supabase/supabase-js', async () => {
  const original = await vi.importActual<typeof import('@supabase/supabase-js')>('@supabase/supabase-js')
  const { createClient } = await import('@/lib/supabase/server')
  const client = await createClient()
  return { ...original, createClient: vi.fn(() => client) }
})
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(async () => ({ success: true })) }))
vi.mock('@/lib/email', () => ({ sendRegistrationEmail: vi.fn(async () => ({ success: true })) }))

// Provide a mock for jsPDF
const mockSave = vi.fn()
const mockLine = vi.fn()
const mockRoundedRect = vi.fn()
const mockSetPage = vi.fn()

vi.mock('jspdf', () => {
  return {
    default: class {
      constructor() {}
      setProperties = vi.fn()
      setFillColor = vi.fn()
      rect = vi.fn()
      setTextColor = vi.fn()
      setFontSize = vi.fn()
      setFont = vi.fn()
      text = vi.fn()
      setDrawColor = vi.fn()
      setLineWidth = vi.fn()
      roundedRect = mockRoundedRect
      save = mockSave
      line = mockLine
      getTextWidth = vi.fn(() => 20)
      splitTextToSize = vi.fn((text: string) => (Array.isArray(text) ? text : [text]))
      getNumberOfPages = vi.fn().mockReturnValue(1)
      setPage = mockSetPage
      internal = {
        getNumberOfPages: vi.fn().mockReturnValue(1),
        pageSize: { width: 297, height: 210 },
      }
    }
  }
})

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}))
