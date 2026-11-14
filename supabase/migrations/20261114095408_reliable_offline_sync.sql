BEGIN;

ALTER TABLE public.children ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Registered';
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS checked_in_at timestamptz;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS checked_out_at timestamptz;

CREATE TABLE IF NOT EXISTS public.offline_receipts (
  sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope text NOT NULL,
  operation_id text NOT NULL,
  actor_id uuid NOT NULL,
  operation jsonb NOT NULL,
  result jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scope, operation_id)
);
ALTER TABLE public.offline_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.offline_receipts FROM anon, authenticated;
GRANT ALL ON public.offline_receipts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.offline_receipts_sequence_seq TO service_role;

CREATE OR REPLACE FUNCTION public.apply_offline_operation(p_item jsonb, p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_scope text := p_item->>'scope';
  v_id text := p_item->>'id';
  v_entity text := p_item->>'entity';
  v_action text := p_item->>'action';
  p jsonb := p_item->'payload';
  receipt public.offline_receipts%ROWTYPE;
  child public.children%ROWTYPE;
  volunteer public.volunteers%ROWTYPE;
  session_row public.sessions%ROWTYPE;
  attendance_row public.attendance%ROWTYPE;
  target_id uuid;
  lecturer uuid;
  occurred timestamptz;
  service_date date;
  status_value text;
  result jsonb;
BEGIN
  IF v_scope IS NULL OR v_scope = '' OR v_id IS NULL OR length(v_id) > 100 OR p_actor IS NULL THEN
    RAISE EXCEPTION 'Invalid operation identity' USING ERRCODE = '22023';
  END IF;
  -- A scope lock orders receipt sequence assignment and commits, so pull cursors cannot skip late commits.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('offline:' || v_scope, 0));
  SELECT * INTO receipt FROM public.offline_receipts WHERE scope = v_scope AND operation_id = v_id;
  IF FOUND THEN
    IF receipt.actor_id <> p_actor OR (receipt.operation - 'credential' - 'signature') IS DISTINCT FROM (p_item - 'credential' - 'signature') THEN
      RAISE EXCEPTION 'Operation ID reused with different content' USING ERRCODE = '22023';
    END IF;
    RETURN receipt.result || jsonb_build_object('duplicate', true);
  END IF;
  IF v_entity = 'children' AND v_action = 'CREATE' THEN
    target_id := (p->>'id')::uuid;
    SELECT * INTO child FROM public.children WHERE id = target_id OR qr_id = (p->>'qr_id')::uuid FOR UPDATE;
    IF FOUND THEN
      IF child.id <> target_id OR child.qr_id <> (p->>'qr_id')::uuid OR child.name <> p->>'name' OR child.session_id IS DISTINCT FROM (p->>'session_id')::uuid THEN
        RAISE EXCEPTION 'This QR badge is already assigned to a different registration. Review the conflict.' USING ERRCODE = '23505';
      END IF;
      -- A repeated registration never writes over attendance recorded after registration.
    ELSE
      IF NOT EXISTS (SELECT 1 FROM public.qr_codes WHERE id = (p->>'qr_id')::uuid) THEN
        RAISE EXCEPTION 'Unknown QR badge' USING ERRCODE = '22023';
      END IF;
      INSERT INTO public.children(id, qr_id, name, contact_number, session_id, status)
      VALUES(target_id, (p->>'qr_id')::uuid, p->>'name', p->>'contact_number', (p->>'session_id')::uuid, 'Registered');
    END IF;
    result := jsonb_build_object('applied', true, 'subjectId', target_id);
  ELSIF v_entity = 'children' AND v_action = 'UPDATE' THEN
    SELECT * INTO child FROM public.children WHERE id = (p->>'id')::uuid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Registration has not arrived yet' USING ERRCODE = 'P0002'; END IF;
    IF p->>'status' = 'Checked In' THEN
      occurred := (p->>'checked_in_at')::timestamptz;
      IF occurred IS NULL THEN RAISE EXCEPTION 'Check-in timestamp required' USING ERRCODE = '22023'; END IF;
      child.checked_in_at := greatest(child.checked_in_at, occurred);
    ELSIF p->>'status' = 'Checked Out' THEN
      occurred := (p->>'checked_out_at')::timestamptz;
      IF occurred IS NULL THEN RAISE EXCEPTION 'Checkout timestamp required' USING ERRCODE = '22023'; END IF;
      child.checked_out_at := greatest(child.checked_out_at, occurred);
    ELSE RAISE EXCEPTION 'Unsupported child attendance status' USING ERRCODE = '22023';
    END IF;
    IF occurred > now() + interval '5 minutes' THEN RAISE EXCEPTION 'Device clock is ahead. Correct it and retry.' USING ERRCODE = '22023'; END IF;
    UPDATE public.children SET checked_in_at = child.checked_in_at, checked_out_at = child.checked_out_at,
      status = CASE WHEN child.checked_out_at IS NOT NULL AND (child.checked_in_at IS NULL OR child.checked_out_at >= child.checked_in_at) THEN 'Checked Out' ELSE 'Checked In' END
      WHERE id = child.id;
    result := jsonb_build_object('applied', true, 'subjectId', child.id);
  ELSIF v_entity = 'attendance_scans' AND v_action = 'CREATE' THEN
    occurred := (p->>'timestamp')::timestamptz;
    IF occurred IS NULL OR occurred > now() + interval '5 minutes' THEN RAISE EXCEPTION 'Invalid scan time. Check the device clock.' USING ERRCODE = '22023'; END IF;
    IF p->>'mode' NOT IN ('check-in', 'check-out') THEN RAISE EXCEPTION 'Invalid scan mode' USING ERRCODE = '22023'; END IF;
    SELECT * INTO session_row FROM public.sessions WHERE id = (p->>'sessionId')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'Session not found' USING ERRCODE = '22023'; END IF;
    SELECT * INTO child FROM public.children WHERE qr_id::text = p->>'scanData' FOR UPDATE;
    IF FOUND THEN
      IF p->>'mode' = 'check-in' THEN child.checked_in_at := greatest(child.checked_in_at, occurred);
      ELSE child.checked_out_at := greatest(child.checked_out_at, occurred); END IF;
      UPDATE public.children SET checked_in_at = child.checked_in_at, checked_out_at = child.checked_out_at,
        status = CASE WHEN child.checked_out_at IS NOT NULL AND (child.checked_in_at IS NULL OR child.checked_out_at >= child.checked_in_at) THEN 'Checked Out' ELSE 'Checked In' END
        WHERE id = child.id;
      result := jsonb_build_object('applied', true, 'subjectId', child.id, 'name', child.name, 'kind', 'child');
    ELSE
      SELECT * INTO volunteer FROM public.volunteers WHERE id::text = p->>'scanData' OR snk_id = p->>'scanData';
      IF NOT FOUND THEN RAISE EXCEPTION 'Participant or pending registration not found' USING ERRCODE = 'P0002'; END IF;
      IF NOT EXISTS (SELECT 1 FROM public.volunteer_sessions WHERE volunteer_id = volunteer.id AND session_id = session_row.id) THEN
        RAISE EXCEPTION 'Volunteer is not enrolled in this session' USING ERRCODE = '22023';
      END IF;
      service_date := session_row.date;
      IF (occurred AT TIME ZONE 'Asia/Kolkata')::date <> service_date AND NOT (session_row.end_time <= session_row.start_time AND (occurred AT TIME ZONE 'Asia/Kolkata')::date = service_date + 1) THEN
        RAISE EXCEPTION 'Scan date differs from the session date' USING ERRCODE = '22023';
      END IF;
      SELECT id INTO lecturer FROM public.lecturers WHERE id = p_actor;
      SELECT * INTO attendance_row FROM public.attendance WHERE volunteer_id = volunteer.id AND session_id = session_row.id AND attendance_date = service_date FOR UPDATE;
      IF p->>'mode' = 'check-in' THEN
        IF attendance_row.check_in_time IS NOT NULL THEN occurred := least(occurred, attendance_row.check_in_time); END IF;
        status_value := CASE WHEN occurred > ((session_row.date + session_row.start_time) AT TIME ZONE 'Asia/Kolkata') + interval '15 minutes' THEN 'Late' ELSE 'Present' END;
        IF attendance_row.id IS NULL THEN
          INSERT INTO public.attendance(volunteer_id, session_id, lecturer_id, attendance_status, check_in_time, attendance_date)
          VALUES(volunteer.id, session_row.id, lecturer, status_value, occurred, service_date);
        ELSE
          UPDATE public.attendance SET check_in_time = occurred, attendance_status = status_value WHERE id = attendance_row.id;
        END IF;
      ELSE
        IF attendance_row.id IS NULL OR attendance_row.check_in_time IS NULL THEN RAISE EXCEPTION 'Check-in has not arrived yet' USING ERRCODE = 'P0002'; END IF;
        IF occurred < attendance_row.check_in_time THEN RAISE EXCEPTION 'Checkout precedes check-in. Review the scan time.' USING ERRCODE = '22023'; END IF;
        UPDATE public.attendance SET check_out_time = greatest(check_out_time, occurred) WHERE id = attendance_row.id;
      END IF;
      result := jsonb_build_object('applied', true, 'subjectId', volunteer.id, 'name', volunteer.full_name, 'kind', 'volunteer');
    END IF;
  ELSE RAISE EXCEPTION 'Unsupported offline operation' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.offline_receipts(scope, operation_id, actor_id, operation, result) VALUES(v_scope, v_id, p_actor, p_item, result);
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_offline_operation(jsonb, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_offline_operation(jsonb, uuid) TO service_role;

-- Existing roles must be provisioned in server-controlled app_metadata before deployment.
DO $$
DECLARE policy_row record;
BEGIN
  FOR policy_row IN SELECT schemaname, tablename, policyname, qual, with_check, cmd, roles FROM pg_catalog.pg_policies
    WHERE schemaname = 'public' AND (qual LIKE '%user_metadata%' OR with_check LIKE '%user_metadata%')
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I %s %s', policy_row.policyname, policy_row.schemaname, policy_row.tablename,
      CASE WHEN policy_row.qual IS NOT NULL THEN 'USING (' || replace(policy_row.qual, 'user_metadata', 'app_metadata') || ')' ELSE '' END,
      CASE WHEN policy_row.with_check IS NOT NULL THEN 'WITH CHECK (' || replace(policy_row.with_check, 'user_metadata', 'app_metadata') || ')' ELSE '' END);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Authenticated users can do everything on children" ON public.children;
DROP POLICY IF EXISTS "Event operators can read children" ON public.children;
DROP POLICY IF EXISTS "Administrators manage children" ON public.children;
CREATE POLICY "Event operators can read children" ON public.children FOR SELECT TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') IN ('SUPER_ADMIN', 'MODEL_HEAD', 'LECTURER'));
CREATE POLICY "Administrators manage children" ON public.children FOR ALL TO authenticated
  USING ((auth.jwt()->'app_metadata'->>'role') = 'SUPER_ADMIN') WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'SUPER_ADMIN');

DO $$
DECLARE policy_row record;
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    FOR policy_row IN SELECT policyname FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='profiles' LOOP
      EXECUTE format('DROP POLICY %I ON public.profiles',policy_row.policyname);
    END LOOP;
    EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
    EXECUTE $policy$CREATE POLICY "Operators read own profile or administrators read all" ON public.profiles FOR SELECT TO authenticated
      USING (id=auth.uid() OR auth.jwt()->'app_metadata'->>'role'='SUPER_ADMIN')$policy$;
    EXECUTE $policy$CREATE POLICY "Administrators manage profiles" ON public.profiles FOR ALL TO authenticated
      USING (auth.jwt()->'app_metadata'->>'role'='SUPER_ADMIN') WITH CHECK (auth.jwt()->'app_metadata'->>'role'='SUPER_ADMIN')$policy$;
  END IF;
END $$;

COMMIT;
