-- Create the children table
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    contact_number TEXT,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Policies for children
CREATE POLICY "Authenticated users can do everything on children"
    ON public.children
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
