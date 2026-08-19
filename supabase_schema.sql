-- ==========================================================
-- Bible Study Guide (BSG) - Supabase Database Schema
-- Run this script in your Supabase SQL Editor
-- ==========================================================

-- 1. Ledgers Table
CREATE TABLE IF NOT EXISTS public.ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Through the Book, Together',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id UUID NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ledger_id, name)
);

-- 3. Reading Progress Table (1 to 189 days)
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id UUID NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 189),
    member_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ledger_id, day_number, member_name)
);

-- 4. Reflections & Spiritual Insights Table (Private or Public)
CREATE TABLE IF NOT EXISTS public.reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id UUID NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 189),
    member_name TEXT NOT NULL,
    note TEXT NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure is_public exists if table was previously created
ALTER TABLE public.reflections ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- 5. Fellowship Weekly Prayer Requests Table
CREATE TABLE IF NOT EXISTS public.prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id UUID NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    text TEXT NOT NULL,
    is_answered BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_requests ENABLE ROW LEVEL SECURITY;

-- 7. Open Policies for Group Participants
DROP POLICY IF EXISTS "Allow public read on ledgers" ON public.ledgers;
CREATE POLICY "Allow public read on ledgers" ON public.ledgers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on ledgers" ON public.ledgers;
CREATE POLICY "Allow public insert on ledgers" ON public.ledgers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on ledgers" ON public.ledgers;
CREATE POLICY "Allow public update on ledgers" ON public.ledgers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read on members" ON public.members;
CREATE POLICY "Allow public read on members" ON public.members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on members" ON public.members;
CREATE POLICY "Allow public insert on members" ON public.members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on reading_progress" ON public.reading_progress;
CREATE POLICY "Allow public read on reading_progress" ON public.reading_progress FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on reading_progress" ON public.reading_progress;
CREATE POLICY "Allow public insert on reading_progress" ON public.reading_progress FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on reading_progress" ON public.reading_progress;
CREATE POLICY "Allow public delete on reading_progress" ON public.reading_progress FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on reflections" ON public.reflections;
CREATE POLICY "Allow public read on reflections" ON public.reflections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on reflections" ON public.reflections;
CREATE POLICY "Allow public insert on reflections" ON public.reflections FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on reflections" ON public.reflections;
CREATE POLICY "Allow public delete on reflections" ON public.reflections FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read on prayer_requests" ON public.prayer_requests;
CREATE POLICY "Allow public read on prayer_requests" ON public.prayer_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on prayer_requests" ON public.prayer_requests;
CREATE POLICY "Allow public insert on prayer_requests" ON public.prayer_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public delete on prayer_requests" ON public.prayer_requests;
CREATE POLICY "Allow public delete on prayer_requests" ON public.prayer_requests FOR DELETE USING (true);

-- 8. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.ledgers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reflections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prayer_requests;
