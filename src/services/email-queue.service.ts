/**
 * Email Queue Service
 * Centralized service for processing email queue
 */

import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/logging';

const logger = createLogger('EmailQueueService');

export interface ProcessQueueOptions {
  batchSize?: number;
  maxRetries?: number;
}

export interface ProcessQueueResult {
  success: boolean;
  processed: number;
  sent: number;
  failed: number;
  errors?: Array<{
    queue_id: string;
    error: string;
  }>;
  message?: string;
}

export interface QueueStats {
  total: number;
  queued: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  cancelled: number;
}

export interface RecipientInfo {
  email: string;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  role: string | null;
}

/**
 * Process the email queue by calling the edge function
 */
export async function processEmailQueue(
  options: ProcessQueueOptions = {}
): Promise<ProcessQueueResult> {
  const { batchSize = 20, maxRetries = 3 } = options;

  logger.debug('Processing email queue', { batchSize, maxRetries });

  try {
    const { data, error } = await supabase.functions.invoke('process-email-queue', {
      body: {
        batchSize,
        source: 'manual'
      }
    });

    if (error) {
      logger.error('Error calling process-email-queue function:', error);
      throw error;
    }

    logger.info('Email queue processed successfully', data);

    return {
      success: true,
      processed: data?.processed || 0,
      sent: data?.sent || 0,
      failed: data?.failed || 0,
      errors: data?.errors || [],
      message: data?.message || 'Emails processed successfully'
    };
  } catch (error) {
    logger.error('Failed to process email queue:', error);

    return {
      success: false,
      processed: 0,
      sent: 0,
      failed: 0,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get current queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .select('status');

    if (error) throw error;

    const stats: QueueStats = {
      total: data?.length || 0,
      queued: 0,
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0
    };

    data?.forEach(item => {
      const status = item.status as keyof QueueStats;
      if (status in stats) {
        stats[status]++;
      }
    });

    return stats;
  } catch (error) {
    logger.error('Error getting queue stats:', error);
    return {
      total: 0,
      queued: 0,
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0
    };
  }
}

/**
 * Get recipients for a specific event type
 * This queries the notification rules and recipient lists to determine who will receive emails
 */
export async function getEventRecipients(
  eventId: string,
  eventType: 'update_published' | 'survey_published' | 'event_published'
): Promise<RecipientInfo[]> {
  logger.debug('Fetching recipients for event', { eventId, eventType });

  try {
    // Get the notification rule for this event type
    const { data: notificationRule, error: ruleError } = await supabase
      .from('notification_rules')
      .select('recipient_list_id, template_id')
      .eq('event_id', eventType)
      .eq('enabled', true)
      .single();

    if (ruleError || !notificationRule) {
      logger.warn('No notification rule found for event type', eventType);
      return [];
    }

    // Get the recipient list configuration
    const { data: recipientList, error: listError } = await supabase
      .from('recipient_lists')
      .select('name, type, config')
      .eq('id', notificationRule.recipient_list_id)
      .single();

    if (listError || !recipientList) {
      logger.warn('No recipient list found');
      return [];
    }

    const recipients: RecipientInfo[] = [];

    // Handle different recipient list types
    if (recipientList.type === 'role_based') {
      const roles = recipientList.config?.roles || [];

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, email_updates')
        .in('role', roles)
        .not('email', 'is', null)
        .or('email_updates.eq.true,email_updates.is.null'); // Include users with email_updates=true or null (defaults to true)

      if (profileError) {
        logger.error('Error fetching profiles:', profileError);
        return [];
      }

      profiles?.forEach(profile => {
        recipients.push({
          email: profile.email,
          userId: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email,
          role: profile.role
        });
      });

    } else if (recipientList.type === 'static') {
      const emails = recipientList.config?.emails || [];

      for (const email of emails) {
        // Try to find profile for this email
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role')
          .eq('email', email)
          .single();

        recipients.push({
          email,
          userId: profile?.id || null,
          firstName: profile?.first_name || null,
          lastName: profile?.last_name || null,
          fullName: profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || email
            : email,
          role: profile?.role || null
        });
      }

    } else if (recipientList.type === 'dynamic') {
      // Dynamic recipients are determined at send time based on event payload
      // We can't preview these ahead of time
      logger.info('Dynamic recipient list - cannot preview');
      return [];
    }

    logger.info(`Found ${recipients.length} recipients`);
    return recipients;

  } catch (error) {
    logger.error('Error getting event recipients:', error);
    return [];
  }
}

/**
 * Get count of queued emails for a specific event
 */
export async function getQueuedEmailCount(
  eventId: string,
  eventType: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('event_type', eventType)
      .in('status', ['queued', 'pending']);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    logger.error('Error getting queued email count:', error);
    return 0;
  }
}

/**
 * Retry failed emails
 */
export async function retryFailedEmails(queueIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'queued',
        updated_at: new Date().toISOString()
      })
      .in('id', queueIds);

    if (error) throw error;

    logger.info(`Reset ${queueIds.length} failed emails to queued status`);
    return true;
  } catch (error) {
    logger.error('Error retrying failed emails:', error);
    return false;
  }
}

/**
 * Cancel queued emails
 */
export async function cancelQueuedEmails(queueIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('email_queue')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .in('id', queueIds);

    if (error) throw error;

    logger.info(`Cancelled ${queueIds.length} queued emails`);
    return true;
  } catch (error) {
    logger.error('Error cancelling emails:', error);
    return false;
  }
}

// Export singleton instance
export const emailQueueService = {
  processQueue: processEmailQueue,
  getQueueStats,
  getEventRecipients,
  getQueuedEmailCount,
  retryFailedEmails,
  cancelQueuedEmails
};
