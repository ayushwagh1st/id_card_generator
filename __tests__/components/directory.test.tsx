import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DirectoryPage from '@/app/admin/directory/page'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockSyncManager = {
  getLocalData: vi.fn(),
  eventTime: vi.fn().mockResolvedValue('2026-11-16T10:00:00.000Z'),
  mutate: vi.fn().mockResolvedValue({ id: 'op-1' }),
  subscribeState: vi.fn().mockReturnValue(() => {}),
}

vi.mock('@/components/SyncProvider', () => ({
  useSyncManager: () => ({
    syncManager: mockSyncManager,
  }),
}))

describe('Children Directory Page', () => {
  const sampleChildren = [
    {
      id: 'child-1',
      qr_id: 'qr-1',
      name: 'Rohan Sharma',
      serial_number: 'MSS-2027-001',
      contact_number: '9876543210',
      session_id: 'session-1',
      session_name: 'Morning Session',
      status: 'Checked In',
      checked_in_at: '2026-11-16T08:30:00.000Z',
      checked_out_at: null,
    },
    {
      id: 'child-2',
      qr_id: 'qr-2',
      name: 'Priya Patel',
      serial_number: 'MSS-2027-002',
      contact_number: '9876543211',
      session_id: 'session-1',
      session_name: 'Morning Session',
      status: 'Checked Out',
      checked_in_at: '2026-11-16T08:45:00.000Z',
      checked_out_at: '2026-11-16T12:15:00.000Z',
    },
    {
      id: 'child-3',
      qr_id: 'qr-3',
      name: 'Amit Verma',
      serial_number: 'MSS-2027-003',
      contact_number: '9876543212',
      session_id: 'session-1',
      session_name: 'Morning Session',
      status: 'Registered',
      checked_in_at: null,
      checked_out_at: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockSyncManager.getLocalData.mockImplementation((entity: string) => {
      if (entity === 'children') return Promise.resolve(sampleChildren)
      if (entity === 'sessions') return Promise.resolve([{ id: 'session-1', name: 'Morning Session' }])
      if (entity === 'qrCodes') return Promise.resolve([])
      return Promise.resolve([])
    })
  })

  it('renders check-in and check-out time columns in the directory', async () => {
    render(<DirectoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Rohan Sharma')).toBeInTheDocument()
    })

    // Check headers
    expect(screen.getByRole('columnheader', { name: /Check-In Time/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /Check-Out Time/i })).toBeInTheDocument()

    // Check Rohan (Checked In, no Check Out)
    expect(screen.getByText('Rohan Sharma')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Check Out$/i })).toBeInTheDocument()

    // Check Priya (Checked Out, has both times)
    expect(screen.getByText('Priya Patel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Re-check In$/i })).toBeInTheDocument()

    // Check Amit (Registered, no times)
    expect(screen.getByText('Amit Verma')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Check In$/i })).toBeInTheDocument()
  })

  it('records check-out when clicking Check Out button', async () => {
    render(<DirectoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Rohan Sharma')).toBeInTheDocument()
    })

    const checkOutBtn = screen.getByRole('button', { name: /^Check Out$/i })
    fireEvent.click(checkOutBtn)

    await waitFor(() => {
      expect(mockSyncManager.mutate).toHaveBeenCalledWith(
        'children',
        'UPDATE',
        expect.objectContaining({
          id: 'child-1',
          status: 'Checked Out',
          checked_out_at: '2026-11-16T10:00:00.000Z',
        })
      )
    })
  })

  it('records check-in when clicking Check In button for a registered child', async () => {
    render(<DirectoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Amit Verma')).toBeInTheDocument()
    })

    const checkInBtn = screen.getByRole('button', { name: /^Check In$/i })
    fireEvent.click(checkInBtn)

    await waitFor(() => {
      expect(mockSyncManager.mutate).toHaveBeenCalledWith(
        'children',
        'UPDATE',
        expect.objectContaining({
          id: 'child-3',
          status: 'Checked In',
          checked_in_at: '2026-11-16T10:00:00.000Z',
        })
      )
    })
  })

  it('opens record/edit attendance times modal when clicking edit button', async () => {
    render(<DirectoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Rohan Sharma')).toBeInTheDocument()
    })

    const editBtns = screen.getAllByRole('button', { name: /Record or edit attendance times/i })
    fireEvent.click(editBtns[0])

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Record Attendance Time/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Save Timestamps/i })).toBeInTheDocument()
    })
  })
})
