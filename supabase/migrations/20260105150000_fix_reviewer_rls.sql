-- Fix RLS policy to allow reviewers to claim (update) unassigned submissions

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Reviewers can update assigned submissions" ON public.code_submissions;

-- 2. Create the corrected policy
-- Allow update if:
-- a) User is the assigned reviewer
-- b) User is an admin
-- c) Submission is unassigned (reviewer_id is null) AND User is a reviewer (to allow claiming)
CREATE POLICY "Reviewers can manage submissions" ON public.code_submissions
  FOR UPDATE TO authenticated USING (
    reviewer_id = auth.uid() 
    OR 
    public.has_role(auth.uid(), 'admin')
    OR 
    (reviewer_id IS NULL AND public.has_role(auth.uid(), 'reviewer'))
  );
