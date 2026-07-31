-- Indexes for performance on commonly searched/filtered fields

-- Volunteers Table
-- Optimizes searches by snk_id and mobile_number
CREATE INDEX IF NOT EXISTS idx_volunteers_snk_id ON public.volunteers (snk_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_mobile_number ON public.volunteers (mobile_number);

-- Optimizes filtering by status and model_id
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON public.volunteers (status);
CREATE INDEX IF NOT EXISTS idx_volunteers_model_id ON public.volunteers (model_id);

-- Lecturers Table
-- Optimizes searches and authentication lookups
CREATE INDEX IF NOT EXISTS idx_lecturers_email ON public.lecturers (email);
CREATE INDEX IF NOT EXISTS idx_lecturers_status ON public.lecturers (status);

-- Models Table
-- Optimizes reverse lookups by head_id
CREATE INDEX IF NOT EXISTS idx_models_head_id ON public.models (head_id);

-- Attendance / Volunteer Sessions Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_volunteer_id ON public.attendance (volunteer_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON public.attendance (session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance (attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_composite ON public.attendance (volunteer_id, session_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_volunteer_sessions_volunteer_id ON public.volunteer_sessions (volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_sessions_session_id ON public.volunteer_sessions (session_id);

