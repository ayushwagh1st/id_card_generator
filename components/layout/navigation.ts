import { Activity, BarChart3, Calendar, Database, FileSpreadsheet, FileText, Headphones, Printer, ScanLine, Shield, UserCheck, Users, type LucideIcon } from 'lucide-react'

export type WorkspaceRole = 'SUPER_ADMIN' | 'MODEL_HEAD' | 'LECTURER'
export interface WorkspaceDestination {
  id: string
  name: string
  href: string
  description: string
  icon: LucideIcon
}
export interface WorkspaceNavigationGroup { label: string; links: WorkspaceDestination[] }

const adminGroups: WorkspaceNavigationGroup[] = [
  { label: 'Overview', links: [{ id: 'dashboard', name: 'Dashboard', href: '/admin/dashboard', description: 'Review event totals and pending approvals', icon: BarChart3 }] },
  { label: 'Volunteers', links: [
    { id: 'volunteers', name: 'Volunteer roster', href: '/admin/volunteers', description: 'Find, review, and approve volunteer profiles', icon: Users },
    { id: 'models', name: 'Exhibition models', href: '/admin/models', description: 'Manage duty areas and model assignments', icon: Database },
    { id: 'heads', name: 'Model Heads', href: '/admin/heads', description: 'Manage model-head accounts', icon: Shield },
  ] },
  { label: 'Children', links: [
    { id: 'directory', name: 'Children’s directory', href: '/admin/directory', description: 'Find registered children and attendance status', icon: Users },
    { id: 'spot-reg', name: 'Spot registration', href: '/admin/spot-registration', description: 'Register children and scan child QR stickers', icon: UserCheck },
    { id: 'bulk-qr', name: 'QR stickers', href: '/admin/bulk-qr', description: 'Generate printable child-registration QR stickers', icon: FileSpreadsheet },
  ] },
  { label: 'Event operations', links: [
    { id: 'sessions', name: 'Sessions', href: '/admin/sessions', description: 'Manage event sessions, venues, and times', icon: Calendar },
    { id: 'enrollment', name: 'Enrollment', href: '/admin/session-enrollment', description: 'Assign volunteers to event sessions', icon: UserCheck },
    { id: 'live-attendance', name: 'Live attendance', href: '/admin/live-attendance', description: 'Monitor volunteer check-ins and late arrivals', icon: Activity },
    { id: 'security', name: 'Security staff', href: '/admin/lecturers', description: 'Manage security staff accounts', icon: Shield },
  ] },
  { label: 'Outputs', links: [
    { id: 'print', name: 'Print IDs', href: '/admin/print', description: 'Prepare and print volunteer event badges', icon: Printer },
    { id: 'reports', name: 'Reports', href: '/admin/reports', description: 'Export registration and attendance reports', icon: FileText },
  ] },
]
const headGroups: WorkspaceNavigationGroup[] = [{ label: 'Your workspace', links: [
  { id: 'dashboard', name: 'Dashboard', href: '/head/dashboard', description: 'Review your team and model assignments', icon: BarChart3 },
  { id: 'volunteers', name: 'My volunteers', href: '/head/volunteers', description: 'Register and review your volunteers', icon: Users },
  { id: 'reports', name: 'Reports', href: '/head/reports', description: 'Export your team’s registration details', icon: FileText },
] }]
const securityGroups: WorkspaceNavigationGroup[] = [{ label: 'Event operations', links: [
  { id: 'dashboard', name: 'Dashboard', href: '/lecturer/dashboard', description: 'Review your duty overview', icon: BarChart3 },
  { id: 'sessions', name: 'Sessions', href: '/lecturer/sessions', description: 'Find session details and venues', icon: Calendar },
  { id: 'scanner', name: 'Volunteer scanner', href: '/lecturer/scanner', description: 'Scan volunteer badges for check-in or check-out', icon: ScanLine },
  { id: 'directory', name: 'Children’s directory', href: '/lecturer/directory', description: 'Find registered children and attendance status', icon: Users },
  { id: 'spot-reg', name: 'Child registration', href: '/lecturer/spot-registration', description: 'Register children and scan child QR stickers', icon: UserCheck },
  { id: 'reports', name: 'Attendance reports', href: '/lecturer/reports', description: 'Review and export session attendance', icon: FileText },
] }]

export function getWorkspaceNavigation(role: WorkspaceRole): WorkspaceNavigationGroup[] {
  return role === 'SUPER_ADMIN' ? adminGroups : role === 'MODEL_HEAD' ? headGroups : securityGroups
}

export function getWorkspaceCommands(role: WorkspaceRole) {
  return [
    ...getWorkspaceNavigation(role).flatMap(group => group.links.map(link => ({ ...link, category: group.label }))),
    { id: 'support', name: 'Help & support', href: '/support', description: 'Contact the organizing team', category: 'Help', icon: Headphones },
  ]
}
