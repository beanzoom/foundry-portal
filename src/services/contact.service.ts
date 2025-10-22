import { supabase } from '@/lib/supabase';

export interface ContactSubmission {
  id?: string;
  user_id?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  subject: string;
  category: string;
  message: string;
  status?: string;
  priority?: string;
  admin_notes?: string | null;
  assigned_to?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at?: string;
  updated_at?: string;
  read_at?: string | null;
}

export interface ContactSubmissionWithUser extends ContactSubmission {
  user_email?: string;
  user_full_name?: string;
  assigned_to_name?: string;
  resolved_by_name?: string;
}

class ContactService {
  async submitContactForm(data: Omit<ContactSubmission, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data: submission, error } = await supabase
        .from('contact_submissions')
        .insert([{
          ...data,
          status: data.status || 'new',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      // TODO: In production, this would trigger an email notification
      // For now, we'll just log it
      console.log('Contact form submitted:', submission);
      
      return { data: submission, error: null };
    } catch (error) {
      console.error('Error submitting contact form:', error);
      return { data: null, error };
    }
  }

  async getSubmissions(filters?: {
    status?: string;
    category?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Try using the direct table instead of the view to avoid potential issues
      let query = supabase
        .from('contact_submissions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data, error: null, count };
    } catch (error) {
      console.error('Error fetching submissions:', error);
      return { data: null, error, count: 0 };
    }
  }

  async getSubmissionById(id: string) {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching submission:', error);
      return { data: null, error };
    }
  }

  async updateSubmission(id: string, updates: Partial<ContactSubmission>) {
    try {
      // Debug: Check current auth state
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current auth user in updateSubmission:', user?.id, user?.email);
      
      // First check if the submission exists and user has access
      const { data: existing, error: checkError } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('Cannot find submission to update:', checkError);
        console.error('Submission ID:', id);
        return { data: null, error: checkError };
      }

      console.log('Found submission to update:', existing);

      // Now perform the update
      const { data, error } = await supabase
        .from('contact_submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('Successfully updated submission:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating submission:', error);
      return { data: null, error };
    }
  }

  async markAsRead(id: string) {
    return this.updateSubmission(id, {
      status: 'read',
      read_at: new Date().toISOString()
    });
  }

  async assignToUser(id: string, userId: string) {
    return this.updateSubmission(id, {
      assigned_to: userId,
      status: 'in_progress'
    });
  }

  async resolveSubmission(id: string, resolvedBy: string, notes?: string) {
    return this.updateSubmission(id, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      admin_notes: notes
    });
  }

  async getSubmissionStats() {
    try {
      const { data, error } = await supabase
        .rpc('get_contact_submission_stats');

      if (error) throw error;

      return { data: data?.[0] || null, error: null };
    } catch (error) {
      console.error('Error fetching submission stats:', error);
      return { data: null, error };
    }
  }

  async deleteSubmission(id: string) {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting submission:', error);
      return { error };
    }
  }
}

export const contactService = new ContactService();