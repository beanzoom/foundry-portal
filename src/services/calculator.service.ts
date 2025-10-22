import { supabase } from '@/lib/supabase';

export interface CalculatorSubmission {
  id?: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  company_name?: string;
  total_monthly_savings: number;
  total_annual_savings: number;
  afs_savings_total?: number;
  labor_savings_total: number;
  system_savings_total: number;
  fixed_savings_total: number;
  afs_savings_items?: any[];
  labor_savings_items: any[];
  system_replacement_items: any[];
  fixed_savings_items: any[];
  fleet_size?: number;
  notes?: string;
  submission_date?: string;
  created_at?: string;
  updated_at?: string;
  is_latest?: boolean;
}

export interface CalculatorStats {
  total_submissions: number;
  unique_users: number;
  avg_monthly_savings: number;
  avg_annual_savings: number;
  max_monthly_savings: number;
  min_monthly_savings: number;
  total_potential_monthly: number;
  total_potential_annual: number;
  avg_afs_savings?: number;
  total_afs_savings?: number;
  submissions_with_afs?: number;
  submissions_last_30_days: number;
  submissions_last_7_days: number;
}

class CalculatorService {
  /**
   * Submit a calculator result
   */
  async submitCalculation(data: Partial<CalculatorSubmission>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get user profile for additional info
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, company_name')
        .eq('id', user.id)
        .single();

      // Prepare submission data
      const submission: Partial<CalculatorSubmission> = {
        ...data,
        user_id: user.id,
        user_email: user.email,
        user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : user.email,
        company_name: data.company_name || profile?.company_name || ''
      };

      // Insert submission
      const { data: result, error } = await supabase
        .from('calculator_submissions')
        .insert(submission)
        .select()
        .single();

      if (error) {
        console.error('Error submitting calculation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: result.id };
    } catch (error: any) {
      console.error('Error in submitCalculation:', error);
      return { success: false, error: error.message || 'Failed to submit calculation' };
    }
  }

  /**
   * Get user's own submissions
   */
  async getUserSubmissions(userId?: string): Promise<CalculatorSubmission[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('calculator_submissions')
        .select('*')
        .eq('user_id', targetUserId)
        .order('submission_date', { ascending: false });

      if (error) {
        console.error('Error fetching user submissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserSubmissions:', error);
      return [];
    }
  }

  /**
   * Get all submissions (admin only)
   */
  async getAllSubmissions(filters?: {
    startDate?: string;
    endDate?: string;
    minSavings?: number;
    maxSavings?: number;
    search?: string;
  }): Promise<CalculatorSubmission[]> {
    try {
      let query = supabase
        .from('calculator_submissions')
        .select('*')
        .order('submission_date', { ascending: false });

      // Apply filters
      if (filters?.startDate) {
        query = query.gte('submission_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('submission_date', filters.endDate);
      }
      if (filters?.minSavings) {
        query = query.gte('total_monthly_savings', filters.minSavings);
      }
      if (filters?.maxSavings) {
        query = query.lte('total_monthly_savings', filters.maxSavings);
      }
      if (filters?.search) {
        query = query.or(`user_email.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all submissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllSubmissions:', error);
      return [];
    }
  }

  /**
   * Get submission by ID
   */
  async getSubmissionById(id: string): Promise<CalculatorSubmission | null> {
    try {
      const { data, error } = await supabase
        .from('calculator_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching submission:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSubmissionById:', error);
      return null;
    }
  }

  /**
   * Get calculator statistics (admin only)
   */
  async getStatistics(): Promise<CalculatorStats | null> {
    try {
      const { data, error } = await supabase
        .from('calculator_submission_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching statistics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getStatistics:', error);
      return null;
    }
  }

  /**
   * Get top savers
   */
  async getTopSavers(limit: number = 10): Promise<CalculatorSubmission[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_top_calculator_savers', { p_limit: limit });

      if (error) {
        console.error('Error fetching top savers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTopSavers:', error);
      return [];
    }
  }

  /**
   * Update submission (user can update within 24 hours)
   */
  async updateSubmission(id: string, updates: Partial<CalculatorSubmission>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calculator_submissions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating submission:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateSubmission:', error);
      return { success: false, error: error.message || 'Failed to update submission' };
    }
  }

  /**
   * Delete submission (admin only)
   */
  async deleteSubmission(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('calculator_submissions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting submission:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in deleteSubmission:', error);
      return { success: false, error: error.message || 'Failed to delete submission' };
    }
  }

  /**
   * Export submissions to CSV format
   */
  exportToCSV(submissions: CalculatorSubmission[]): string {
    const headers = [
      'Date',
      'User Name',
      'Email',
      'Company',
      'Monthly Savings',
      'Annual Savings',
      'AFS Savings',
      'Labor Savings',
      'System Savings',
      'Fixed Savings',
      'Notes'
    ];

    const rows = submissions.map(sub => [
      new Date(sub.submission_date || '').toLocaleDateString(),
      sub.user_name || '',
      sub.user_email || '',
      sub.company_name || '',
      sub.total_monthly_savings.toFixed(2),
      sub.total_annual_savings.toFixed(2),
      (sub.afs_savings_total || 0).toFixed(2),
      sub.labor_savings_total.toFixed(2),
      sub.system_savings_total.toFixed(2),
      sub.fixed_savings_total.toFixed(2),
      (sub.notes || '').replace(/"/g, '""') // Escape quotes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download CSV file
   */
  downloadCSV(submissions: CalculatorSubmission[], filename: string = 'calculator-submissions.csv'): void {
    const csv = this.exportToCSV(submissions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export singleton instance
export const calculatorService = new CalculatorService();