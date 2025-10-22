import { supabase } from '@/lib/supabase';

const CURRENT_AGREEMENT_VERSION = '1.0';

export const membershipAgreementService = {
  /**
   * Check if user has agreed to the current Membership Agreement version
   */
  async checkUserAgreement(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_user_membership_agreement', {
          p_user_id: userId,
          p_version: CURRENT_AGREEMENT_VERSION
        });

      if (error) {
        console.error('Error checking Membership Agreement:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('Failed to check Membership Agreement:', err);
      return false;
    }
  },

  /**
   * Save user's Membership Agreement acceptance
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

      // Save to membership_agreements table
      const { error: agreementError } = await supabase
        .from('membership_agreements')
        .insert({
          user_id: userId,
          agreement_version: CURRENT_AGREEMENT_VERSION,
          agreed_text: agreedText,
          typed_name: typedName,
          expected_name: expectedName,
          user_agent: userAgent,
          agreed_at: new Date().toISOString()
        });

      if (agreementError) {
        console.error('Error saving Membership Agreement:', agreementError);
        return {
          success: false,
          error: agreementError.message || 'Failed to save agreement'
        };
      }


      return { success: true };
    } catch (err: any) {
      console.error('Failed to save Membership Agreement:', err);
      return {
        success: false,
        error: err.message || 'An error occurred while saving the agreement'
      };
    }
  },

  /**
   * Get user's Membership Agreement history
   */
  async getUserAgreements(userId: string) {
    try {
      const { data, error } = await supabase
        .from('membership_agreements')
        .select('*')
        .eq('user_id', userId)
        .order('agreed_at', { ascending: false });

      if (error) {
        console.error('Error fetching Membership Agreements:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch Membership Agreements:', err);
      return [];
    }
  },

  /**
   * Get the current Membership Agreement version
   */
  getCurrentVersion(): string {
    return CURRENT_AGREEMENT_VERSION;
  }
};