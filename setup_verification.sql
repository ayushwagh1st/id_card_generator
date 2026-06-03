-- Drop existing if any
DROP FUNCTION IF EXISTS verify_volunteer(text);
DROP FUNCTION IF EXISTS verify_volunteer(uuid);

-- Create a secure RPC function to fetch a single volunteer's verification data
-- SECURITY DEFINER allows it to bypass RLS so anonymous users (like security guards scanning the QR) can see the data
CREATE OR REPLACE FUNCTION verify_volunteer(v_id TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  res json;
BEGIN
  -- Basic UUID format validation to prevent cast errors
  IF v_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', v.id,
    'full_name', v.full_name,
    'snk_id', v.snk_id,
    'status', v.status,
    'photo_url', v.photo_url,
    'branch', v.branch,
    'designation', v.designation,
    'role', v.role,
    'mobile_number', v.mobile_number,
    'models', json_build_object('name', m.name)
  )
  INTO res
  FROM volunteers v
  LEFT JOIN models m ON v.model_id = m.id
  WHERE v.id = v_id::uuid;
  
  RETURN res;
END;
$$;
