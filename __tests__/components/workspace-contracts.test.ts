import { describe, expect, it } from 'vitest'
import { getWorkspaceCommands, getWorkspaceNavigation, type WorkspaceRole } from '@/components/layout/navigation'
import { readVolunteerQuery, updateVolunteerQuery } from '@/app/admin/volunteers/_hooks/volunteer-query'
import { A4_HEIGHT_PX, A4_WIDTH_PX, getPreviewFitZoom, PREVIEW_SHEET_GAP_PX } from '@/app/admin/print/_components/preview-fit'

describe('Role navigation contracts', () => {
  it.each([['SUPER_ADMIN', '/admin/'], ['MODEL_HEAD', '/head/'], ['LECTURER', '/lecturer/']] as [WorkspaceRole, string][])('keeps %s commands in its existing workspace', (role, prefix) => {
    const commands = getWorkspaceCommands(role)
    const destinations = getWorkspaceNavigation(role).flatMap(group => group.links.map(link => link.href))
    expect(commands.filter(command => command.href !== '/support').map(command => command.href)).toEqual(destinations)
    expect(commands.every(command => command.href === '/support' || command.href.startsWith(prefix))).toBe(true)
    expect(new Set(commands.map(command => command.id)).size).toBe(commands.length)
  })
  it('identifies child records separately from the volunteer roster', () => {
    const commands = getWorkspaceCommands('SUPER_ADMIN')
    expect(commands.find(command => command.href === '/admin/directory')?.name).toContain('Children')
    expect(commands.find(command => command.href === '/admin/volunteers')?.name).toBe('Volunteer roster')
  })
})

describe('Roster query state', () => {
  it('opens a dashboard approval link with the correct filter', () => {
    expect(readVolunteerQuery(new URLSearchParams('status=Pending'))).toEqual({searchTerm:'',filterStatus:'Pending',filterModel:'all',page:1})
  })
  it('restores search, model, and page while rejecting invalid status/page values', () => {
    expect(readVolunteerQuery(new URLSearchParams('q=SNK&model=model-1&page=3&status=Approved'))).toEqual({searchTerm:'SNK',filterStatus:'Approved',filterModel:'model-1',page:3})
    expect(readVolunteerQuery(new URLSearchParams('status=unknown&page=-2')).page).toBe(1)
    expect(readVolunteerQuery(new URLSearchParams('status=unknown&page=Infinity')).filterStatus).toBe('all')
  })
  it('updates one filter without losing other page context and removes defaults', () => {
    const params = new URLSearchParams('model=model-1&status=Pending&page=3')
    updateVolunteerQuery(params, 'searchTerm', 'Name & ID')
    updateVolunteerQuery(params, 'page', 1)
    updateVolunteerQuery(params, 'filterStatus', 'all')
    expect(params.get('q')).toBe('Name & ID')
    expect(params.get('model')).toBe('model-1')
    expect(params.has('status')).toBe(false)
    expect(params.has('page')).toBe(false)
    expect(updateVolunteerQuery(params, 'isAddOpen', true)).toBe(false)
  })
})

describe('A4 screen-preview fitting', () => {
  it.each([[235, 420], [289, 500], [650, 500], [1000, 800]])('fits a full sheet inside %sx%s without changing its A4 dimensions', (width, height) => {
    const scale = getPreviewFitZoom(width, height, 'page') / 100
    expect(A4_WIDTH_PX * scale).toBeLessThanOrEqual(width)
    expect((A4_HEIGHT_PX + PREVIEW_SHEET_GAP_PX) * scale).toBeLessThanOrEqual(height)
  })
  it('fits phone widths below the old 50-percent minimum', () => {
    const zoom = getPreviewFitZoom(235, 420, 'width')
    expect(zoom).toBeLessThan(50)
    expect(A4_WIDTH_PX * zoom / 100).toBeLessThanOrEqual(235)
  })
})
