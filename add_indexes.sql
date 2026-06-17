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

-- Attendance / Logs (if exist, commonly queried by session or volunteer)
-- Assuming a table named attendance_logs exists based on previous files, uncomment if applicable:
-- CREATE INDEX IF NOT EXISTS idx_attendance_logs_volunteer_id ON public.attendance_logs (volunteer_id);
-- CREATE INDEX IF NOT EXISTS idx_attendance_logs_session_id ON public.attendance_logs (session_id);
