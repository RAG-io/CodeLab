-- Add foreign key relationships from code_submissions to profiles
-- First, we need to add a column that references profiles.user_id since developer_id and reviewer_id are auth user IDs

-- Create a static_analysis_results table to store ESLint results
CREATE TABLE public.static_analysis_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.code_submissions(id) ON DELETE CASCADE,
  line_number INTEGER,
  rule_id TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('error', 'warning', 'info')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on static_analysis_results
ALTER TABLE public.static_analysis_results ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_static_analysis_submission ON public.static_analysis_results(submission_id);

-- RLS Policies for static_analysis_results

-- Reviewers and admins can view all analysis results
CREATE POLICY "Reviewers can view all analysis results"
ON public.static_analysis_results
FOR SELECT
USING (
  has_role(auth.uid(), 'reviewer') OR has_role(auth.uid(), 'admin')
);

-- Developers can view analysis results only for reviewed submissions
CREATE POLICY "Developers can view analysis for reviewed submissions"
ON public.static_analysis_results
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.code_submissions cs
    WHERE cs.id = static_analysis_results.submission_id
    AND cs.developer_id = auth.uid()
    AND cs.status IN ('approved', 'changes_requested')
  )
);

-- Reviewers can insert analysis results for submissions they're reviewing
CREATE POLICY "Reviewers can insert analysis results"
ON public.static_analysis_results
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.code_submissions cs
    WHERE cs.id = static_analysis_results.submission_id
    AND (cs.reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

-- Admins can do everything on static_analysis_results
CREATE POLICY "Admins full access to analysis results"
ON public.static_analysis_results
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for code_submissions
ALTER PUBLICATION supabase_realtime ADD TABLE public.code_submissions;