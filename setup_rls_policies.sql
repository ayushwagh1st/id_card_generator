-- Enable Row Level Security (RLS) on core tables
ALTER TABLE IF EXISTS public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.volunteer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;

-- 1. Volunteers Policies
-- Super Admin can do all operations on volunteers
CREATE POLICY "Super admin full access on volunteers"
ON public.volunteers FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'SUPER_ADMIN'
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'SUPER_ADMIN'
);

-- Model Head can view and insert volunteers under their assigned models
CREATE POLICY "Model head select volunteers"
ON public.volunteers FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'MODEL_HEAD' AND
  model_id IN (
    SELECT id FROM public.models WHERE head_id = auth.uid()
  )
);

CREATE POLICY "Model head insert volunteers"
ON public.volunteers FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'MODEL_HEAD' AND
  model_id IN (
    SELECT id FROM public.models WHERE head_id = auth.uid()
  )
);

-- 2. Sessions Policies
CREATE POLICY "Super admin full access on sessions"
ON public.sessions FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'SUPER_ADMIN'
);

CREATE POLICY "Lecturers view assigned sessions"
ON public.sessions FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'LECTURER' AND
  lecturer_id = auth.uid()
);

-- 3. Attendance Policies
CREATE POLICY "Super admin full access on attendance"
ON public.attendance FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'SUPER_ADMIN'
);

CREATE POLICY "Lecturer insert and select attendance"
ON public.attendance FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'LECTURER' AND
  lecturer_id = auth.uid()
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'LECTURER' AND
  lecturer_id = auth.uid()
);
