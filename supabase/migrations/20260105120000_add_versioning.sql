-- Migration to add versioning support to code_submissions
-- Adds group_id to link versions together and version number for ordering

-- 1. Add new columns
ALTER TABLE public.code_submissions 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS group_id UUID DEFAULT gen_random_uuid();

-- 2. Create index for faster querying by group
CREATE INDEX IF NOT EXISTS idx_code_submissions_group_id ON public.code_submissions(group_id);

-- 3. Backfill existing rows (already handled by DEFAULTs above, but being explicit isn't bad)
-- The DEFAULT gen_random_uuid() ensures every existing row gets a unique group_id, 
-- effectively making them the "V1" of their own history.
