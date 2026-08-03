import { supabase } from '@/lib/supabase';

export const profileService = {
  async getProfile(userId) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) throw error;
    return profile;
  },

  async updateProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', userId);
      
    if (error) throw error;
    return data;
  }
};
