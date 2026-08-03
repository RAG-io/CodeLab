import { supabase } from '@/lib/supabase';

export const adminService = {
  async getUsers() {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    if (profilesError) throw profilesError;

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');
    if (rolesError) throw rolesError;

    return profiles.map(profile => {
      const userRole = roles.find(r => r.user_id === profile.user_id);
      return {
        ...profile,
        role: userRole ? userRole.role : 'developer'
      };
    });
  },

  async getSubmissions() {
    const { data: subs, error: subsError } = await supabase
      .from('code_submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (subsError) throw subsError;

    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, name');

    const profileMap = {};
    if (profilesData) {
      profilesData.forEach(p => {
        profileMap[p.user_id] = p.name;
      });
    }

    return subs.map(sub => ({
      ...sub,
      author_name: profileMap[sub.developer_id] || 'Unknown User'
    }));
  },

  async updateUserRole(userId, newRole) {
    const { data, error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async deleteSubmission(submissionId) {
    const { error } = await supabase
      .from('code_submissions')
      .delete()
      .eq('id', submissionId);
    if (error) throw error;
  },

  async deleteUser(userId) {
    const { error } = await supabase.rpc('delete_user', { target_user_id: userId });
    if (error) throw error;
  },

  async assignReviewer(submissionId, reviewerId) {
    const { error } = await supabase
      .from('code_submissions')
      .update({
        reviewer_id: reviewerId,
        status: 'in_review'
      })
      .eq('id', submissionId);
    if (error) throw error;
  }
};
