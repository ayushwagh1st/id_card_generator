-- Preserve the six existing operator assignments observed in the deployment preflight.
-- Explicit IDs prevent later changes to editable user_metadata from granting new privileges.
DO $$
DECLARE assignment record;
BEGIN
  FOR assignment IN SELECT * FROM (VALUES
    ('acd0faa0-0fcf-4511-82cc-ffaeb5cd5e2c'::uuid,'SUPER_ADMIN'),
    ('eecb54c8-ea5f-4c0d-ba98-285c3b2e31c2'::uuid,'SUPER_ADMIN'),
    ('04f263a4-a95c-4cdf-bc2e-fd31484d111c'::uuid,'MODEL_HEAD'),
    ('bab47dc8-cd73-4898-8da0-6239f6713bab'::uuid,'MODEL_HEAD'),
    ('7f0e35ef-8c83-4445-b337-1a7d69d5366b'::uuid,'MODEL_HEAD'),
    ('50de95b8-6e98-4f91-b872-55a2f8de2f03'::uuid,'LECTURER')
  ) AS assignments(id,role)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=assignment.id AND raw_user_meta_data->>'role'=assignment.role) THEN
      RAISE EXCEPTION 'Existing operator assignment changed. Review before migration.';
    END IF;
    IF EXISTS (SELECT 1 FROM auth.users WHERE id=assignment.id AND raw_app_meta_data->>'role' IS NOT NULL AND raw_app_meta_data->>'role'<>assignment.role) THEN
      RAISE EXCEPTION 'Trusted operator role differs from the preserved assignment. Review before migration.';
    END IF;
    UPDATE auth.users SET raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||jsonb_build_object('role',assignment.role) WHERE id=assignment.id;
  END LOOP;
END $$;
