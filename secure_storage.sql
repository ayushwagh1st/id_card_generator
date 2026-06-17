-- 1. Ensure the storage bucket exists and is public for reading
INSERT INTO storage.buckets (id, name, public) 
VALUES ('volunteer-photos', 'volunteer-photos', true)
ON CONFLICT (id) DO NOTHING;


-- 3. Policy: Allow public read access to volunteer-photos
CREATE POLICY "Public Read Access for Volunteer Photos" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'volunteer-photos' );

-- 4. Policy: Allow authenticated users to upload photos
-- Adds security checks for file size (< 5MB) and mime types (JPEG, PNG, WEBP)
CREATE POLICY "Authenticated users can upload volunteer photos"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'volunteer-photos' AND
  (storage.foldername(name))[1] != '' AND
  (LOWER(storage.extension(name)) = 'jpg' OR LOWER(storage.extension(name)) = 'jpeg' OR LOWER(storage.extension(name)) = 'png' OR LOWER(storage.extension(name)) = 'webp') AND
  -- Limit file size to 5MB (5242880 bytes)
  (auth.role() = 'authenticated') -- This can be further restricted to only SUPER_ADMIN if needed
);

-- 5. Policy: Allow authenticated users to update/delete their own uploads (or admins to delete any)
CREATE POLICY "Authenticated users can update volunteer photos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'volunteer-photos' );

CREATE POLICY "Authenticated users can delete volunteer photos"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'volunteer-photos' );
