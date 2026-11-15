export const formatSessionLabel = (s?: { name?: string | null; title?: string | null; date?: string | null; start_time?: string | null } | null) =>
  !s ? 'Unknown Session' : `${s.name || s.title || 'Unknown Session'}${s.date ? ` (${s.date})` : ''}${s.start_time ? ` [${s.start_time}]` : ''}`;

export const formatVolunteerLabel = (v?: { full_name?: string | null; name?: string | null; snk_id?: string | null } | null) =>
  !v ? 'Unknown Volunteer' : `${v.full_name || v.name || 'Unknown Volunteer'}${v.snk_id ? ` (${v.snk_id})` : ''}`;

export const formatModelLabel = (m?: { name?: string | null; category?: string | null } | null) =>
  !m ? 'Unknown Model' : `${m.name || 'Unknown Model'}${m.category ? ` - ${m.category}` : ''}`;

export const formatLecturerLabel = (l?: { name?: string | null; full_name?: string | null; mobile_number?: string | null; mobile?: string | null } | null) =>
  !l ? 'Unknown Lecturer' : `${l.name || l.full_name || 'Unknown Lecturer'}${l.mobile_number || l.mobile ? ` (${l.mobile_number || l.mobile})` : ''}`;

export const formatHeadLabel = (h?: { name?: string | null; full_name?: string | null; models?: { name?: string | null } | null } | null) =>
  !h ? 'Unknown Head' : `${h.name || h.full_name || 'Unknown Head'}${h.models?.name ? ` [Assigned: ${h.models.name}]` : ''}`;

export const getSessionDisplayName = formatSessionLabel;
export const getVolunteerDisplayName = formatVolunteerLabel;
export const getModelDisplayName = formatModelLabel;
export const getLecturerDisplayName = formatLecturerLabel;
export const getHeadDisplayName = formatHeadLabel;
