-- Add Accommodation tracking column for volunteers
ALTER TABLE public.volunteers 
ADD COLUMN IF NOT EXISTS accommodation BOOLEAN DEFAULT false;
