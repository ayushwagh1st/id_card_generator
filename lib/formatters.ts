/**
 * Global utility for formatting human-readable labels across dropdowns and UI components.
 * Guarantees a consistent pattern for data display and safe fallbacks to prevent raw UUID leakage.
 */

export function formatSessionLabel(session: any): string {
  if (!session) return 'Untitled Session'
  const name = session.name || 'Untitled Session'
  const date = session.date ? ` (${session.date})` : ''
  const time = session.start_time ? ` [${session.start_time}]` : ''
  return `${name}${date}${time}`
}

export function formatVolunteerLabel(volunteer: any): string {
  if (!volunteer) return 'Unnamed Volunteer'
  const name = volunteer.full_name || 'Unnamed Volunteer'
  const snk = volunteer.snk_id ? ` (${volunteer.snk_id})` : ''
  return `${name}${snk}`
}

export function formatModelLabel(model: any): string {
  if (!model) return 'Unknown Model'
  const name = model.name || 'Unknown Model'
  const category = model.category ? ` - ${model.category}` : ''
  return `${name}${category}`
}

export function formatLecturerLabel(lecturer: any): string {
  if (!lecturer) return 'Unnamed Lecturer'
  const name = lecturer.name || 'Unnamed Lecturer'
  const phone = lecturer.mobile_number ? ` (${lecturer.mobile_number})` : ''
  return `${name}${phone}`
}

export function formatHeadLabel(head: any): string {
  if (!head) return 'Unnamed Head'
  const name = head.name || head.full_name || 'Unnamed Head'
  const model = head.models?.name ? ` [Assigned: ${head.models.name}]` : ''
  return `${name}${model}`
}

// Aliases matching exact user request
export const getSessionDisplayName = formatSessionLabel;
export const getVolunteerDisplayName = formatVolunteerLabel;
export const getModelDisplayName = formatModelLabel;
export const getLecturerDisplayName = formatLecturerLabel;
export const getHeadDisplayName = formatHeadLabel;
