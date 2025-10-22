import { supabase } from '@/lib/supabase';
import { settingsService } from './settings.service';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  from?: string;
  userId?: string;
  relatedTo?: string;
  relatedId?: string;
  metadata?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
  details?: any;
}

export interface EmailStatus {
  id: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'delivered';
  sentAt?: string;
  error?: string;
  retryCount: number;
}

class EmailService {
  private debug = false;

  /**
   * Enable or disable debug mode
   */
  setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  /**
   * Send an email immediately
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    try {
      // In development, just log the email
      if (process.env.NODE_ENV === 'development' && this.debug) {
        console.log('📧 Email would be sent:', {
          to: options.to,
          subject: options.subject,
          template: options.template,
          templateData: options.templateData
        });
        return { 
          success: true, 
          id: 'dev-' + Date.now(),
          details: { mode: 'development', logged: true }
        };
      }

      // Get the current user if not provided
      if (!options.userId) {
        const { data: { user } } = await supabase.auth.getUser();
        options.userId = user?.id;
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          template: options.template,
          templateData: options.templateData,
          cc: options.cc,
          bcc: options.bcc,
          replyTo: options.replyTo,
          from: options.from
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw error;
      }

      // Check if the response indicates an error
      if (data && !data.success) {
        console.error('Email send failed:', data);
        const errorMsg = data.error || 'Failed to send email';
        const details = data.details ? ` (${JSON.stringify(data.details)})` : '';
        throw new Error(errorMsg + details);
      }

      return {
        success: true,
        id: data?.id,
        details: data
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
        details: error
      };
    }
  }

  /**
   * Send email using a template
   */
  async sendTemplate(
    templateName: string,
    templateData: Record<string, any>,
    options: Partial<EmailOptions> = {}
  ): Promise<EmailResult> {
    return this.send({
      ...options,
      template: templateName,
      templateData,
      to: options.to || '',
      subject: options.subject || this.getDefaultSubject(templateName)
    });
  }

  /**
   * Queue an email for later sending
   */
  async queueEmail(
    options: EmailOptions,
    scheduledFor?: Date,
    priority: number = 5
  ): Promise<EmailResult> {
    try {
      const { data, error } = await supabase
        .from('email_queue')
        .insert({
          email_options: options,
          scheduled_for: scheduledFor?.toISOString() || new Date().toISOString(),
          priority: Math.min(10, Math.max(1, priority)),
          status: 'queued'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        id: data.id,
        details: { queued: true, scheduledFor, priority }
      };
    } catch (error: any) {
      console.error('Error queuing email:', error);
      return {
        success: false,
        error: error.message || 'Failed to queue email'
      };
    }
  }

  /**
   * Send bulk emails (queues them for processing)
   */
  async sendBulk(
    emails: EmailOptions[],
    options: {
      priority?: number;
      batchSize?: number;
      delayBetween?: number; // milliseconds
    } = {}
  ): Promise<EmailResult[]> {
    const results: EmailResult[] = [];
    const { priority = 5, batchSize = 10, delayBetween = 1000 } = options;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      // Calculate scheduled time with delay
      const scheduledFor = new Date(Date.now() + (i / batchSize) * delayBetween);
      
      const batchResults = await Promise.all(
        batch.map(email => this.queueEmail(email, scheduledFor, priority))
      );
      
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Get email status by ID
   */
  async getStatus(emailId: string): Promise<EmailStatus | null> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('id, status, sent_at, error_message, retry_count')
        .eq('id', emailId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        status: data.status,
        sentAt: data.sent_at,
        error: data.error_message,
        retryCount: data.retry_count
      };
    } catch (error) {
      console.error('Error getting email status:', error);
      return null;
    }
  }

  /**
   * Retry a failed email
   */
  async retry(emailId: string): Promise<EmailResult> {
    try {
      // Get the original email from logs
      const { data: emailLog, error: fetchError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('id', emailId)
        .single();

      if (fetchError || !emailLog) {
        throw new Error('Email not found');
      }

      if (emailLog.status !== 'failed') {
        return {
          success: false,
          error: 'Can only retry failed emails'
        };
      }

      // Resend the email
      return this.send({
        to: emailLog.to_email,
        subject: emailLog.subject,
        html: emailLog.html_content,
        text: emailLog.text_content,
        template: emailLog.template,
        templateData: emailLog.template_data,
        cc: emailLog.cc_email,
        bcc: emailLog.bcc_email,
        replyTo: emailLog.reply_to,
        from: emailLog.from_email,
        relatedTo: emailLog.related_to,
        relatedId: emailLog.related_id,
        metadata: { ...emailLog.metadata, retryOf: emailId }
      });
    } catch (error: any) {
      console.error('Error retrying email:', error);
      return {
        success: false,
        error: error.message || 'Failed to retry email'
      };
    }
  }

  /**
   * Get email statistics
   */
  async getStats(days: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_email_stats', { p_days: days });

      if (error) throw error;

      return data?.[0] || null;
    } catch (error) {
      console.error('Error getting email stats:', error);
      return null;
    }
  }

  /**
   * Get recent emails
   */
  async getRecentEmails(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting recent emails:', error);
      return [];
    }
  }

  /**
   * Helper: Get default subject for template
   */
  private getDefaultSubject(templateName: string): string {
    const subjects: Record<string, string> = {
      'contact-admin-notification': 'New Contact Form Submission',
      'contact-user-confirmation': 'We received your message',
      'welcome': 'Welcome to FleetDRMS',
      'password-reset': 'Reset your password',
      'event-reminder': 'Event Reminder',
      'survey-invitation': 'Your feedback matters',
      'update-notification': 'Important Update'
    };

    return subjects[templateName] || 'Notification from FleetDRMS';
  }

  /**
   * Send contact form notifications
   */
  async sendContactFormNotifications(submission: {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    category: string;
    subject: string;
    message: string;
  }): Promise<{ adminResult: EmailResult; userResult: EmailResult }> {
    // Get admin email from database settings
    const adminEmail = await settingsService.getAdminEmail();
    
    // Get email templates from settings
    const confirmationTemplate = await settingsService.getContactConfirmationTemplate();
    const adminTemplate = await settingsService.getEmailTemplate('contact_admin_template') || {
      subject: 'New Contact Form: {{subject}}',
      body: 'New contact form submission from {{name}}'
    };
    
    // Prepare template variables
    const templateVars = {
      ...submission,
      ticketNumber: submission.id.slice(0, 8).toUpperCase(),
      viewLink: `${window.location.origin}/portal/admin/contact-submissions`,
      company: submission.company || 'Not provided',
      phone: submission.phone || 'Not provided'
    };
    
    // Render templates
    const userSubject = settingsService.renderTemplate(confirmationTemplate.subject, templateVars);
    const userBody = settingsService.renderTemplate(confirmationTemplate.body, templateVars);
    const adminSubject = settingsService.renderTemplate(adminTemplate.subject, templateVars);
    const adminBody = settingsService.renderTemplate(adminTemplate.body, templateVars);
    
    // Convert markdown-style body to HTML
    const userHtml = this.markdownToHtml(userBody);
    const adminHtml = this.markdownToHtml(adminBody);
    
    // Send admin notification
    const adminResult = await this.send({
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
      relatedTo: 'contact_submission',
      relatedId: submission.id
    });

    // Send user confirmation
    const userResult = await this.send({
      to: submission.email,
      subject: userSubject,
      html: userHtml,
      relatedTo: 'contact_submission',
      relatedId: submission.id
    });

    return { adminResult, userResult };
  }

  /**
   * Convert markdown-style text to HTML
   */
  private markdownToHtml(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>') // Links
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/<br><br>/g, '</p><p>') // Paragraphs
      .replace(/^/, '<p>') // Start paragraph
      .replace(/$/, '</p>'); // End paragraph
  }

  /**
   * Get email notification batches
   */
  async getBatches(status?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('email_notification_batches')
        .select('*')
        .order('started_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting batches:', error);
      return [];
    }
  }

  /**
   * Delete an email batch
   */
  async deleteBatch(batchId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_notification_batches')
        .delete()
        .eq('id', batchId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting batch:', error);
      return false;
    }
  }

  /**
   * Reset a batch from processing to pending
   */
  async resetBatch(batchId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('email_notification_batches')
        .update({ 
          status: 'pending',
          processed_count: 0,
          failed_count: 0
        })
        .eq('id', batchId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resetting batch:', error);
      return false;
    }
  }

  /**
   * Process a batch manually (trigger edge function)
   */
  async processBatch(batchId: string): Promise<EmailResult> {
    try {
      const { data, error } = await supabase.functions.invoke('send-update-notifications', {
        body: { batchId }
      });

      if (error) throw error;

      return {
        success: true,
        id: batchId,
        details: data
      };
    } catch (error: any) {
      console.error('Error processing batch:', error);
      return {
        success: false,
        error: error.message || 'Failed to process batch'
      };
    }
  }

  /**
   * Get available content for testing
   */
  async getTestContent(type: 'updates' | 'surveys' | 'events'): Promise<any[]> {
    try {
      const table = type === 'updates' ? 'portal_updates' : 
                   type === 'surveys' ? 'portal_surveys' : 
                   'portal_events';
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error getting ${type}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types
export type { EmailOptions, EmailResult, EmailStatus };