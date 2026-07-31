/**
 * Global utility for formatting human-readable labels across dropdowns and UI components.
 * Guarantees a consistent pattern for data display and safe fallbacks to prevent raw UUID leakage.
 */

export interface FormattableSession {
  name?: string | null;
  title?: string | null;
  date?: string | null;
  start_time?: string | null;
}

export interface FormattableVolunteer {
  full_name?: string | null;
  name?: string | null;
  snk_id?: string | null;
}

export interface FormattableModel {
  name?: string | null;
  category?: string | null;
}

export interface FormattableLecturer {
  name?: string | null;
  full_name?: string | null;
  mobile_number?: string | null;
  mobile?: string | null;
}

export interface FormattableHead {
  name?: string | null;
  full_name?: string | null;
  models?: { name?: string | null } | null;
}

export function formatSessionLabel(session?: FormattableSession | null): string {
  if (!session) return 'Unknown Session'
  const name = session.name || session.title || 'Unknown Session'
  const date = session.date ? ` (${session.date})` : ''
  const time = session.start_time ? ` [${session.start_time}]` : ''
  return `${name}${date}${time}`
}

export function formatVolunteerLabel(volunteer?: FormattableVolunteer | null): string {
  if (!volunteer) return 'Unknown Volunteer'
  const name = volunteer.full_name || volunteer.name || 'Unknown Volunteer'
  const snk = volunteer.snk_id ? ` (${volunteer.snk_id})` : ''
  return `${name}${snk}`
}

export function formatModelLabel(model?: FormattableModel | null): string {
  if (!model) return 'Unknown Model'
  const name = model.name || 'Unknown Model'
  const category = model.category ? ` - ${model.category}` : ''
  return `${name}${category}`
}

export function formatLecturerLabel(lecturer?: FormattableLecturer | null): string {
  if (!lecturer) return 'Unknown Lecturer'
  const name = lecturer.name || lecturer.full_name || 'Unknown Lecturer'
  const phone = (lecturer.mobile_number || lecturer.mobile) ? ` (${lecturer.mobile_number || lecturer.mobile})` : ''
  return `${name}${phone}`
}

export function formatHeadLabel(head?: FormattableHead | null): string {
  if (!head) return 'Unknown Head'
  const name = head.name || head.full_name || 'Unknown Head'
  const model = head.models?.name ? ` [Assigned: ${head.models.name}]` : ''
  return `${name}${model}`
}

// Aliases matching exact user request
export const getSessionDisplayName = formatSessionLabel;
export const getVolunteerDisplayName = formatVolunteerLabel;
export const getModelDisplayName = formatModelLabel;
export const getLecturerDisplayName = formatLecturerLabel;
export const getHeadDisplayName = formatHeadLabel;
