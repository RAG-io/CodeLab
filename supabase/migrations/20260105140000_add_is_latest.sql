-- Add is_latest column to track the head of the version history
ALTER TABLE public.code_submissions 
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_code_submissions_is_latest ON public.code_submissions(is_latest);

-- Backfill: correct is_latest for existing rows
-- This ensures only the most recent version in each group is marked as latest
WITH ranked AS (
  SELECT id, group_id, ROW_NUMBER() OVER (PARTITION BY group_id ORDER BY version DESC, created_at DESC) as rn
  FROM public.code_submissions
)
UPDATE public.code_submissions
SET is_latest = (rn = 1)
FROM ranked
WHERE code_submissions.id = ranked.id;

-- Function to maintain is_latest
-- When a new submission is inserted, mark all previous ones in the same group as not latest
CREATE OR REPLACE FUNCTION public.handle_new_submission_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set is_latest = false for all OTHER submissions in the same group
  UPDATE public.code_submissions
  SET is_latest = false
  WHERE group_id = NEW.group_id 
  AND id != NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger
DROP TRIGGER IF EXISTS on_submission_created_versioning ON public.code_submissions;
CREATE TRIGGER on_submission_created_versioning
AFTER INSERT ON public.code_submissions
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_submission_version();
