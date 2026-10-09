-- Migration to create the complaints table in Supabase
CREATE TABLE IF NOT EXISTS public.complaints (
    id TEXT PRIMARY KEY,
    ref_no TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    department_key TEXT NOT NULL,
    department_name TEXT NOT NULL,
    summary_en TEXT,
    summary_local TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    address TEXT,
    ward_id INT,
    ward_name TEXT,
    status TEXT DEFAULT 'pending',
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) and configure for API access if needed
-- We'll allow inserts from anon/service role and selects
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Allow read access for everyone
CREATE POLICY "Allow public read access" ON public.complaints
    FOR SELECT
    USING (true);

-- Allow insert access for service role or anon
CREATE POLICY "Allow anon insert" ON public.complaints
    FOR INSERT
    WITH CHECK (true);
