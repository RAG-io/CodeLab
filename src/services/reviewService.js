import { supabase } from '@/lib/supabase';

export const reviewService = {
  async getReviewerSubmissions(reviewerId) {
    const { data: subs, error } = await supabase
      .from('code_submissions')
      .select('*')
      .eq('reviewer_id', reviewerId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const developerIds = [...new Set(subs.map(s => s.developer_id))];
    let developerMap = {};

    if (developerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', developerIds);

      if (profiles) {
        developerMap = profiles.reduce((acc, p) => {
          acc[p.user_id] = p.name;
          return acc;
        }, {});
      }
    }

    return subs.map(s => ({
      ...s,
      developer: { name: developerMap[s.developer_id] || 'Unknown Developer' }
    }));
  },

  async getReviewerHistory(reviewerId) {
    const { data: subs, error } = await supabase
      .from('code_submissions')
      .select('*')
      .eq('reviewer_id', reviewerId)
      .in('status', ['approved', 'changes_requested'])
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const developerIds = [...new Set(subs.map(s => s.developer_id))];
    let developerMap = {};

    if (developerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', developerIds);

      if (profiles) {
        developerMap = profiles.reduce((acc, p) => {
          acc[p.user_id] = p.name;
          return acc;
        }, {});
      }
    }

    return subs.map(s => ({
      ...s,
      developer: { name: developerMap[s.developer_id] || 'Unknown Developer' }
    }));
  },

  async updateSubmissionStatus(submissionId, status) {
    const { error } = await supabase
      .from('code_submissions')
      .update({ status })
      .eq('id', submissionId);
    if (error) throw error;
  },

  async addReviewComment(submissionId, reviewerId, content) {
    const { error } = await supabase
      .from('review_comments')
      .insert({
        submission_id: submissionId,
        reviewer_id: reviewerId,
        content
      });
    if (error) throw error;
  },

  async saveAnalysisResults(submissionId, analysisIssues) {
    // Delete existing results for this submission
    await supabase
      .from('static_analysis_results')
      .delete()
      .eq('submission_id', submissionId);

    if (!analysisIssues || analysisIssues.length === 0) return;

    const results = analysisIssues.map(issue => ({
      submission_id: submissionId,
      line_number: issue.line,
      rule_id: issue.rule,
      message: issue.message,
      severity: issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'info',
    }));

    const { error } = await supabase
      .from('static_analysis_results')
      .insert(results);
    if (error) throw error;
  }
};
