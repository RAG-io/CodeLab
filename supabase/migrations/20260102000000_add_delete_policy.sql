-- Policy to allow developers to delete their own submissions
CREATE POLICY "Developers can delete own submissions" ON public.code_submissions
  FOR DELETE TO authenticated USING (developer_id = auth.uid());
