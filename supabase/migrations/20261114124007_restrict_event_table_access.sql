BEGIN;

REVOKE ALL ON public.lecturers, public.sessions, public.volunteer_sessions, public.attendance FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lecturers, public.sessions, public.volunteer_sessions, public.attendance TO authenticated;
GRANT ALL ON public.lecturers, public.sessions, public.volunteer_sessions, public.attendance TO service_role;

ALTER TABLE public.lecturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE existing record;
BEGIN
  FOR existing IN SELECT tablename,policyname FROM pg_catalog.pg_policies
    WHERE schemaname='public' AND tablename IN ('lecturers','sessions','volunteer_sessions','attendance')
  LOOP EXECUTE format('DROP POLICY %I ON public.%I',existing.policyname,existing.tablename); END LOOP;
END $$;

-- Lecturer rows include stored account details; staff can see only their own row.
CREATE POLICY "Administrators manage lecturers" ON public.lecturers FOR ALL TO authenticated
  USING (auth.jwt()->'app_metadata'->>'role'='SUPER_ADMIN') WITH CHECK (auth.jwt()->'app_metadata'->>'role'='SUPER_ADMIN');
CREATE POLICY "Lecturers read own record" ON public.lecturers FOR SELECT TO authenticated
  USING (auth.jwt()->'app_metadata'->>'role'='LECTURER' AND id=auth.uid());

CREATE POLICY "Event operators read sessions" ON public.sessions FOR SELECT TO authenticated
  USING (auth.jwt()->'app_metadata'->>'role' IN ('SUPER_ADMIN','MODEL_HEAD','LECTURER'));
CREATE POLICY "Administrators manage sessions" ON public.sessions FOR ALL TO authenticated
  USING (auth.jwt()->'app_metadata'->>'role'='SUPER_ADMIN') WITH CHECK (auth.jwt()->'app_metadata'->>'role'='SUPER_ADMIN');

CREATE POLICY "Event operators read enrollments" ON public.volunteer_sessions FOR SELECT TO authenticated
  USING (auth.jwt()->'app_metadata'->>'role' IN ('SUPER_ADMIN','MODEL_HEAD','LECTURER'));
CREATE POLICY "Administrators manage enrollments" ON public.volunteer_sessions FOR ALL TO authenticated
  USING (auth.jwt()->'app_metadata'->>'role'='SUPER_ADMIN') WITH CHECK (auth.jwt()->'app_metadata'->>'role'='SUPER_ADMIN');

-- Existing check-in and bulk-checkout actions authorize all three operator roles.
CREATE POLICY "Event operators manage attendance" ON public.attendance FOR ALL TO authenticated
  USING (auth.jwt()->'app_metadata'->>'role' IN ('SUPER_ADMIN','MODEL_HEAD','LECTURER'))
  WITH CHECK (auth.jwt()->'app_metadata'->>'role' IN ('SUPER_ADMIN','MODEL_HEAD','LECTURER'));

ALTER VIEW public.attendance_stats SET (security_invoker=true);
REVOKE ALL ON public.attendance_stats FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.attendance_stats TO authenticated, service_role;

COMMIT;
