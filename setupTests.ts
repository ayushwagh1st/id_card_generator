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
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null }),
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
    checkAuth: vi.fn().mockResolvedValue({ user: { id: 'test-user', email: 'test@example.com' } }),
  }
})

// Provide a mock for jsPDF
const mockSave = vi.fn()

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
      roundedRect = vi.fn()
      save = mockSave
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

vi.mock('browser-image-compression', () => {
  return {
    default: vi.fn().mockResolvedValue(new File([''], 'compressed.jpg', { type: 'image/jpeg' })),
  }
})
