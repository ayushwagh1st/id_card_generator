import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import AdminDashboard from '@/app/admin/dashboard/page'

const { getStats } = vi.hoisted(() => ({ getStats: vi.fn() }))
vi.mock('@/server/actions/dashboard', () => ({ getDashboardStatsAction: getStats }))
vi.mock('next/dynamic', () => ({ default: () => () => <div>Allocation chart</div> }))
vi.mock('next/link', () => ({ default: ({children, href, ...props}: {children:ReactNode;href:string}) => <a href={href} {...props}>{children}</a> }))
vi.mock('@/components/QRScannerDialog', () => ({ QRScannerDialog: () => null }))

const data = { stats: { totalVolunteers:7,totalModels:2,approvedCount:2,pendingCount:3,totalSessions:1,totalLecturers:1,todaySessions:0,attendancePercentage:60,totalChildren:5,checkedInChildren:1 }, chartData:[],activities:[] }
afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())

describe('Event overview data feedback', () => {
  it('shows a persistent error for returned failures and retries without rendering false zero counts', async () => {
    getStats.mockResolvedValueOnce({error:'Connection unavailable'}).mockResolvedValueOnce(data)
    render(<AdminDashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection unavailable')
    expect(screen.queryByRole('link', {name:/Pending approvals/})).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name:'Retry'}))
    expect(await screen.findByRole('link', {name:/Pending approvals/})).toHaveTextContent('3')
    expect(screen.getByRole('link', {name:/Approved volunteers/})).toHaveTextContent('2')
    expect(screen.getByRole('link', {name:/Approved volunteers/})).toHaveAttribute('href','/admin/volunteers?status=Approved')
    expect(screen.getByText('Registered volunteers')).toBeVisible()
    expect(screen.queryByText('Active Volunteers')).not.toBeInTheDocument()
  })
  it('handles thrown request failures through the same retry state', async () => {
    getStats.mockRejectedValue(new Error('Network request failed'))
    render(<AdminDashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Network request failed')
    expect(screen.getByRole('button',{name:'Retry'})).toBeEnabled()
  })
})
