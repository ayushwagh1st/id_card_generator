-- Run only against a project where the offline migration is installed.
-- Operational fixtures are enclosed in a transaction that is always rolled back.
BEGIN;
SET LOCAL ROLE service_role;
DO $$
<<offline_production_smoke>>
DECLARE
  actor uuid := 'acd0faa0-0fcf-4511-82cc-ffaeb5cd5e2c';
  session_id uuid := gen_random_uuid();
  qr uuid := gen_random_uuid();
  child_id uuid := gen_random_uuid();
  volunteer_id text := gen_random_uuid()::text;
  test_scope text := '__offline_smoke__:' || gen_random_uuid()::text;
  scan_time timestamptz := now() - interval '1 minute';
  registration jsonb;
  check_in jsonb;
  check_out jsonb;
  result jsonb;
  caught boolean;
  serial_value integer;
BEGIN
  SELECT coalesce(min(serial_number),0)-1 INTO serial_value FROM public.qr_codes;
  INSERT INTO public.sessions(id,name,date,start_time,end_time)
    VALUES(session_id,'__OFFLINE_SMOKE_TEST__',(scan_time AT TIME ZONE 'Asia/Kolkata')::date,'00:00','00:00');
  -- Supply a serial explicitly so no printed-badge sequence is advanced by this rollback test.
  INSERT INTO public.qr_codes(id,serial_number) VALUES(qr,serial_value);
  INSERT INTO public.volunteers(id,full_name,mobile_number) VALUES(volunteer_id,'__OFFLINE_SMOKE_TEST__','0000000000');
  INSERT INTO public.volunteer_sessions(volunteer_id,session_id) VALUES(volunteer_id,session_id);

  registration := jsonb_build_object('id','registration','scope',test_scope,'entity','children','action','CREATE','timestamp',1,
    'payload',jsonb_build_object('id',child_id,'qr_id',qr,'name','__OFFLINE_SMOKE_TEST__','contact_number','0000000000','session_id',session_id));
  result := public.apply_offline_operation(registration,actor);
  IF result->>'applied' <> 'true' THEN RAISE EXCEPTION 'Registration was not applied'; END IF;
  PERFORM public.apply_offline_operation(jsonb_build_object('id','child-checkout','scope',test_scope,'entity','children','action','UPDATE','timestamp',2,
    'payload',jsonb_build_object('id',child_id,'status','Checked Out','checked_out_at',scan_time)),actor);
  result := public.apply_offline_operation(registration,actor);
  IF result->>'duplicate' <> 'true' OR (SELECT status FROM public.children WHERE id=child_id) <> 'Checked Out' THEN
    RAISE EXCEPTION 'Registration replay changed newer attendance';
  END IF;

  result := public.apply_offline_operation(jsonb_build_object('id','child-scan','scope',test_scope,'entity','attendance_scans','action','CREATE','timestamp',3,
    'payload',jsonb_build_object('scanData',qr,'sessionId',session_id,'mode','check-in','timestamp',scan_time-interval '1 second')),actor);
  IF result->>'kind' <> 'child' THEN RAISE EXCEPTION 'Child QR replay did not resolve the child'; END IF;

  check_in := jsonb_build_object('id','volunteer-checkin','scope',test_scope,'entity','attendance_scans','action','CREATE','timestamp',4,
    'payload',jsonb_build_object('scanData',volunteer_id,'sessionId',session_id,'mode','check-in','timestamp',scan_time));
  check_out := jsonb_build_object('id','volunteer-checkout','scope',test_scope,'entity','attendance_scans','action','CREATE','timestamp',5,
    'payload',jsonb_build_object('scanData',volunteer_id,'sessionId',session_id,'mode','check-out','timestamp',scan_time+interval '1 second'));
  caught := false;
  BEGIN PERFORM public.apply_offline_operation(check_out,actor);
  EXCEPTION WHEN SQLSTATE 'P0002' THEN caught := true; END;
  IF NOT caught THEN RAISE EXCEPTION 'Missing check-in was falsely acknowledged'; END IF;
  PERFORM public.apply_offline_operation(check_in,actor);
  PERFORM public.apply_offline_operation(check_out,actor);
  result := public.apply_offline_operation(check_in,actor);
  IF result->>'duplicate' <> 'true' OR (SELECT count(*) FROM public.attendance a WHERE a.volunteer_id=offline_production_smoke.volunteer_id) <> 1 THEN
    RAISE EXCEPTION 'Volunteer replay created duplicate attendance';
  END IF;

  caught := false;
  BEGIN PERFORM public.apply_offline_operation(jsonb_set(registration,'{payload,name}','"ALTERED"'::jsonb),actor);
  EXCEPTION WHEN SQLSTATE '22023' THEN caught := true; END;
  IF NOT caught THEN RAISE EXCEPTION 'Changed operation content was not rejected'; END IF;
  IF (SELECT count(*) FROM public.offline_receipts WHERE scope=test_scope) <> 5 THEN RAISE EXCEPTION 'Receipt count is incorrect'; END IF;
  IF EXISTS(SELECT 1 FROM public.attendance a WHERE a.volunteer_id=offline_production_smoke.volunteer_id AND (a.check_in_time IS NULL OR a.check_out_time IS NULL OR a.attendance_date<>(scan_time AT TIME ZONE 'Asia/Kolkata')::date)) THEN
    RAISE EXCEPTION 'Attendance timestamps or India service date are incorrect';
  END IF;
END $$;
ROLLBACK;
SELECT jsonb_build_object(
  'smoke_assertions','passed',
  'remaining_test_children',(SELECT count(*) FROM public.children WHERE name='__OFFLINE_SMOKE_TEST__'),
  'remaining_test_volunteers',(SELECT count(*) FROM public.volunteers WHERE full_name='__OFFLINE_SMOKE_TEST__'),
  'remaining_test_sessions',(SELECT count(*) FROM public.sessions WHERE name='__OFFLINE_SMOKE_TEST__'),
  'remaining_test_receipts',(SELECT count(*) FROM public.offline_receipts WHERE scope LIKE '__offline_smoke__:%')
) AS result;
