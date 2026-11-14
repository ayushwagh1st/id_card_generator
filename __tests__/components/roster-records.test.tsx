import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { VolunteersTable } from '@/app/admin/volunteers/_components/VolunteersTable'
import { VolunteerSummaryCard } from '@/components/volunteers/VolunteerSummaryCard'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

afterEach(cleanup)
const volunteer = {id:'record-1',full_name:'[Test volunteer]',snk_id:'TEST-1',status:'Rejected',models:{name:'[Test model]'}}

describe('Roster interactions', () => {
  it('does not write status changes when records render or update', () => {
    const onStatusChange = vi.fn()
    const props = {volunteers:[volunteer],loading:false,selectedIds:[],page:1,totalPages:1,totalCount:1,searchTerm:'',filterStatus:'all',filterModel:'all',onToggleSelectAll:vi.fn(),onToggleSelect:vi.fn(),onOpenEdit:vi.fn(),onPrintSingle:vi.fn(),onStatusChange,onPageChange:vi.fn()}
    const view = render(<VolunteersTable {...props} />)
    expect(screen.getAllByRole('combobox',{name:'Status for [Test volunteer]'}).every(element => element.textContent?.includes('Rejected'))).toBe(true)
    view.rerender(<VolunteersTable {...props} selectedIds={['record-1']} />)
    expect(onStatusChange).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox',{name:'Select all volunteers on this page'})).toBeChecked()
  })
  it('opens approved Model Head profiles through a view-details action', () => {
    const onOpen = vi.fn()
    render(<VolunteerSummaryCard volunteer={{...volunteer,status:'Approved'}} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole('button',{name:'View [Test volunteer]'}))
    expect(onOpen).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button',{name:/Edit/})).not.toBeInTheDocument()
  })
  it('cancels a destructive confirmation without firing its action', async () => {
    const action = vi.fn()
    render(<AlertDialog><AlertDialogTrigger>Delete test record</AlertDialogTrigger><AlertDialogContent><AlertDialogTitle>Delete selected record?</AlertDialogTitle><AlertDialogDescription>This test uses a local callback only.</AlertDialogDescription><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={action}>Confirm deletion</AlertDialogAction></AlertDialogContent></AlertDialog>)
    fireEvent.click(screen.getByRole('button',{name:'Delete test record'}))
    expect(await screen.findByRole('alertdialog')).toBeVisible()
    fireEvent.click(screen.getByRole('button',{name:'Cancel'}))
    expect(action).not.toHaveBeenCalled()
  })
})
