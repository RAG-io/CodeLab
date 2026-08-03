import { supabase } from '@/lib/supabase';

export const submissionService = {
  async getDeveloperSubmissions(developerId) {
    const { data: subs, error } = await supabase
      .from('code_submissions')
      .select('*')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Fetch reviewer names separately
    const reviewerIds = [...new Set(subs.filter(s => s.reviewer_id).map(s => s.reviewer_id))];
    let reviewerMap = {};

    if (reviewerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', reviewerIds);

      if (profiles) {
        reviewerMap = profiles.reduce((acc, p) => {
          acc[p.user_id] = p.name;
          return acc;
        }, {});
      }
    }

    return subs.map(s => ({
      ...s,
      reviewer: s.reviewer_id ? { name: reviewerMap[s.reviewer_id] } : null
    }));
  },

  async createSubmission(data) {
    const { error } = await supabase
      .from('code_submissions')
      .insert(data);
      
    if (error) throw error;
  },

  async deleteSubmission(submissionId, developerId) {
    const { error, count } = await supabase
      .from('code_submissions')
      .delete({ count: 'exact' })
      .eq('id', submissionId)
      .eq('developer_id', developerId);

    if (error) throw error;
    if (count === 0) throw new Error('Submission not found or could not be deleted');
  },

  async getSubmissionHistory(groupId) {
    const { data: versions, error: versionsError } = await supabase
      .from('code_submissions')
      .select('*')
      .eq('group_id', groupId)
      .order('version', { ascending: true });

    if (versionsError) throw versionsError;

    const versionIds = versions.map(v => v.id);
    const { data: comments, error: commentsError } = await supabase
      .from('review_comments')
      .select('*')
      .in('submission_id', versionIds)
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    const reviewerIds = [...new Set(comments.map(c => c.reviewer_id))];
    let reviewerMap = {};

    if (reviewerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', reviewerIds);

      if (profiles) {
        reviewerMap = profiles.reduce((acc, p) => {
          acc[p.user_id] = p.name;
          return acc;
        }, {});
      }
    }

    return versions.map(v => ({
      ...v,
      comments: comments.filter(c => c.submission_id === v.id).map(c => ({
        ...c,
        reviewer_name: reviewerMap[c.reviewer_id] || 'Reviewer'
      }))
    }));
  },
  
  async getAnalysisResults(submissionId) {
    const { data, error } = await supabase
      .from('static_analysis_results')
      .select('*')
      .eq('submission_id', submissionId)
      .order('line_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};
