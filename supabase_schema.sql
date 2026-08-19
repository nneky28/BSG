-- ==========================================================
-- Bible Study Guide (BSG) - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ==========================================================

-- 1. Create / Update Ledgers (Reading Groups) Table
CREATE TABLE IF NOT EXISTS public.ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Through the Book, Together',
    plan_id TEXT NOT NULL DEFAULT '365-day',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure plan_id column exists if table was already created
ALTER TABLE public.ledgers ADD COLUMN IF NOT EXISTS plan_id TEXT NOT NULL DEFAULT '365-day';

-- 2. Create Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id UUID NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ledger_id, name)
);

-- 3. Create Reading Progress Table
CREATE TABLE IF NOT EXISTS public.reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id UUID NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 365),
    member_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ledger_id, day_number, member_name)
);

-- 4. Create Spiritual Reflections & Key Takeaways Table
CREATE TABLE IF NOT EXISTS public.reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id UUID NOT NULL REFERENCES public.ledgers(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 365),
    member_name TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- 6. Open access policies for group participants (anon key)
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

-- 7. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.ledgers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reading_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reflections;
