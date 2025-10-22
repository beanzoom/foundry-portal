/**
 * Referral Deletion Service
 * Provides comprehensive referral removal functionality for admins
 */

import { supabase } from '@/lib/supabase';

export interface DeletionEligibilityResponse {
  eligible: boolean;
  reasons?: string[];
  referral?: any;
  related_data?: {
    contacts: number;
    pending_emails: number;
    rate_limits: number;
  };
  message?: string;
}

export interface DeletionResult {
  success: boolean;
  message?: string;
  error?: string;
  deleted?: {
    referral_id: string;
    contacts_deleted: number;
    emails_cancelled: number;
    referee_email: string;
    referrer_id: string;
  };
}

/**
 * Check if a referral is eligible for deletion
 * Returns detailed information about what would be deleted
 */
export async function checkReferralDeletionEligibility(
  referralId: string
): Promise<DeletionEligibilityResponse> {
  try {
    const { data, error } = await supabase.rpc('check_referral_deletion_eligibility', {
      p_referral_id: referralId
    });

    if (error) {
      console.error('Error checking deletion eligibility:', error);
      return {
        eligible: false,
        reasons: ['Failed to check eligibility: ' + error.message]
      };
    }

    return data as DeletionEligibilityResponse;
  } catch (error) {
    console.error('Error in checkReferralDeletionEligibility:', error);
    return {
      eligible: false,
      reasons: ['An unexpected error occurred']
    };
  }
}

/**
 * Delete a referral and all related data
 * Only works for non-registered referrals
 */
export async function deleteReferral(
  referralId: string,
  reason?: string,
  adminNote?: string
): Promise<DeletionResult> {
  try {
    // First check eligibility
    const eligibility = await checkReferralDeletionEligibility(referralId);

    if (!eligibility.eligible) {
      return {
        success: false,
        error: `Cannot delete referral: ${eligibility.reasons?.join(', ')}`
      };
    }

    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Proceed with deletion using the fixed function
    const { data, error } = await supabase.rpc('delete_referral_admin_fixed', {
      p_referral_id: referralId,
      p_admin_user_id: user.id,
      p_deletion_reason: reason || null,
      p_admin_note: adminNote || null
    });

    if (error) {
      console.error('Error deleting referral:', error);
      return {
        success: false,
        error: 'Failed to delete referral: ' + error.message
      };
    }

    return data as DeletionResult;
  } catch (error) {
    console.error('Error in deleteReferral:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the referral'
    };
  }
}

/**
 * Get deletion history for audit purposes
 */
export async function getReferralDeletionLogs(
  limit: number = 50,
  offset: number = 0
) {
  try {
    const { data, error } = await supabase
      .from('referral_deletion_logs')
      .select(`
        *,
        deleted_by_user:profiles!deleted_by (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching deletion logs:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getReferralDeletionLogs:', error);
    return { data: null, error };
  }
}

/**
 * Get archived referrals
 */
export async function getArchivedReferrals(
  limit: number = 50,
  offset: number = 0
) {
  try {
    const { data, error } = await supabase
      .from('portal_referrals_archive')
      .select(`
        *,
        deleted_by_user:profiles!deleted_by (
          id,
          email,
          first_name,
          last_name
        )
      `)
      .order('deleted_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching archived referrals:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getArchivedReferrals:', error);
    return { data: null, error };
  }
}

/**
 * Batch check eligibility for multiple referrals
 */
export async function batchCheckDeletionEligibility(
  referralIds: string[]
): Promise<Map<string, DeletionEligibilityResponse>> {
  const results = new Map<string, DeletionEligibilityResponse>();

  // Check each referral in parallel
  const promises = referralIds.map(async (id) => {
    const eligibility = await checkReferralDeletionEligibility(id);
    results.set(id, eligibility);
  });

  await Promise.all(promises);
  return results;
}

/**
 * Helper to format deletion summary for display
 */
export function formatDeletionSummary(eligibility: DeletionEligibilityResponse): string[] {
  const summary: string[] = [];

  if (eligibility.related_data) {
    if (eligibility.related_data.contacts > 0) {
      summary.push(`${eligibility.related_data.contacts} contact record(s)`);
    }
    if (eligibility.related_data.pending_emails > 0) {
      summary.push(`${eligibility.related_data.pending_emails} pending email(s)`);
    }
    if (eligibility.related_data.rate_limits > 0) {
      summary.push(`${eligibility.related_data.rate_limits} rate limit record(s)`);
    }
  }

  if (summary.length === 0) {
    summary.push('No additional related data');
  }

  return summary;
}

/**
 * Check if current user can delete referrals
 */
export async function canDeleteReferrals(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin' || profile?.role === 'super_admin';
  } catch (error) {
    console.error('Error checking delete permissions:', error);
    return false;
  }
}