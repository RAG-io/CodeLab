-- Allow developers to delete their own pending submissions
CREATE POLICY "Developers can delete own pending submissions" 
ON public.code_submissions 
FOR DELETE 
USING (developer_id = auth.uid() AND status = 'pending');