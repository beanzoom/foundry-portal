import { supabase } from '@/lib/supabase';

const CURRENT_NDA_VERSION = '1.0';

export const ndaService = {
  /**
   * Check if user has agreed to the current NDA version
   */
  async checkUserAgreement(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_user_nda_agreement', {
          p_user_id: userId,
          p_version: CURRENT_NDA_VERSION
        });

      if (error) {
        console.error('Error checking NDA agreement:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('Failed to check NDA agreement:', err);
      return false;
    }
  },

  /**
   * Save user's NDA agreement
   */
  async saveAgreement(
    userId: string,
    agreedText: string,
    typedName: string,
    expectedName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user's IP and user agent for audit trail
      const userAgent = navigator.userAgent;

      const { error } = await supabase
        .from('nda_agreements')
        .insert({
          user_id: userId,
          nda_version: CURRENT_NDA_VERSION,
          agreed_text: agreedText,
          typed_name: typedName,
          expected_name: expectedName,
          user_agent: userAgent,
          agreed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving NDA agreement:', error);
        return {
          success: false,
          error: error.message || 'Failed to save agreement'
        };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Failed to save NDA agreement:', err);
      return {
        success: false,
        error: err.message || 'An error occurred while saving the agreement'
      };
    }
  },

  /**
   * Get user's NDA agreement history
   */
  async getUserAgreements(userId: string) {
    try {
      const { data, error } = await supabase
        .from('nda_agreements')
        .select('*')
        .eq('user_id', userId)
        .order('agreed_at', { ascending: false });

      if (error) {
        console.error('Error fetching NDA agreements:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch NDA agreements:', err);
      return [];
    }
  },

  /**
   * Get the current NDA version
   */
  getCurrentVersion(): string {
    return CURRENT_NDA_VERSION;
  }
};