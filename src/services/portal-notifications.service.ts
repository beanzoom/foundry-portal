/**
 * Portal Notification Service
 * Centralized service for handling all portal notifications
 */

import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logging';

// Create logger for this service
const logger = createLogger('Notifications');

/**
 * Types for notification handling
 */
export type ContentType = 'survey' | 'event' | 'update' | 'referral';

export interface NotificationOptions {
  testMode?: boolean;
  metadata?: Record<string, any>;
  silent?: boolean; // Don't show toast notifications
  skipEmailIfEmpty?: boolean; // Skip if no recipients
}

export interface NotificationResult {
  success: boolean;
  recipientCount?: number;
  message?: string;
  error?: Error;
}

/**
 * Custom error class for notification failures
 */
export class NotificationError extends Error {
  constructor(
    message: string,
    public readonly originalError?: any,
    public readonly contentType?: ContentType,
    public readonly contentId?: string
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

/**
 * Trigger email notifications when content is published
 * @param contentType - Type of content being published
 * @param contentId - ID of the content
 * @param options - Additional options for the notification
 * @returns Result of the notification attempt
 */
export async function triggerPublishNotification(
  contentType: ContentType,
  contentId: string,
  options: NotificationOptions = {}
): Promise<NotificationResult> {
  const { testMode = false, metadata = {}, silent = false, skipEmailIfEmpty = false } = options;

  try {
    // Log the notification attempt
    logger.debug(`Publishing ${contentType} ${contentId}, emails queued by database trigger`);

    // The database trigger handles everything automatically!
    // When content status changes to 'published', the trigger:
    // 1. Calls trigger_email_notification() function
    // 2. Looks up notification rules for this event type
    // 3. Gets the correct template and recipient list
    // 4. Queues emails in email_queue table with 'pending' status
    // 5. Emails are processed by cron job or manual trigger

    // For test mode, we might want to query the queue to see what was added
    let recipientCount = 0;
    let message = `Emails queued for ${contentType}`;

    if (!testMode) {
      // Query to get approximate recipient count (optional)
      const { data: queuedEmails } = await supabase
        .from('email_queue')
        .select('id')
        .eq('event_id', contentId)
        .eq('event_type', `${contentType}_published`);

      if (queuedEmails) {
        recipientCount = queuedEmails.length;
        message = `${recipientCount} email${recipientCount !== 1 ? 's' : ''} queued for processing`;
      }
    }

    // Check if we should skip empty notifications
    if (skipEmailIfEmpty && recipientCount === 0) {
      logger.debug(`No recipients for ${contentType} ${contentId}`);
      return {
        success: true,
        recipientCount: 0,
        message: 'No recipients configured'
      };
    }

    // Show success toast unless silent
    if (!silent && recipientCount > 0) {
      toast({
        title: 'Notifications Queued',
        description: message,
      });
    }

    // Log success
    logger.info(`${contentType} published, ${recipientCount} emails queued`);

    return {
      success: true,
      recipientCount,
      message
    };
  } catch (error) {
    // Log the error
    logger.error(`Error sending ${contentType} notifications:`, error);

    // Show error toast unless silent
    if (!silent) {
      toast({
        title: 'Notification Error',
        description: error instanceof NotificationError
          ? error.message
          : 'Failed to send notifications. Please try again.',
        variant: 'destructive'
      });
    }

    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
      message: 'Failed to send notifications'
    };
  }
}

/**
 * Send test notifications for development/testing
 * @param contentType - Type of content to test
 * @param options - Test options
 */
export async function sendTestNotification(
  contentType: ContentType,
  options: Omit<NotificationOptions, 'testMode'> = {}
): Promise<NotificationResult> {
  return triggerPublishNotification(contentType, 'test-' + Date.now(), {
    ...options,
    testMode: true,
    metadata: {
      ...options.metadata,
      is_test: true
    }
  });
}

/**
 * Batch send notifications for multiple content items
 * @param items - Array of content items to notify about
 * @param options - Notification options
 */
export async function batchTriggerNotifications(
  items: Array<{ type: ContentType; id: string }>,
  options: NotificationOptions = {}
): Promise<NotificationResult[]> {
  logger.info(`Batch sending notifications for ${items.length} items`);

  const results = await Promise.all(
    items.map(item =>
      triggerPublishNotification(item.type, item.id, {
        ...options,
        silent: true // Don't show individual toasts for batch
      })
    )
  );

  // Show summary toast
  const successCount = results.filter(r => r.success).length;
  const totalRecipients = results.reduce((sum, r) => sum + (r.recipientCount || 0), 0);

  if (!options.silent) {
    if (successCount === items.length) {
      toast({
        title: 'Batch Notifications Sent',
        description: `Successfully notified ${totalRecipients} recipients across ${successCount} items`,
      });
    } else {
      toast({
        title: 'Partial Success',
        description: `Sent notifications for ${successCount}/${items.length} items`,
        variant: 'destructive'
      });
    }
  }

  return results;
}

/**
 * Check if notifications are enabled for a specific content type
 * This could be extended to check user preferences, feature flags, etc.
 */
export async function areNotificationsEnabled(
  contentType: ContentType
): Promise<boolean> {
  // For now, always return true
  // In the future, this could check:
  // - Feature flags
  // - User preferences
  // - System settings
  // - Rate limits
  return true;
}

/**
 * Get notification statistics for reporting
 */
export async function getNotificationStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number;
  byType: Record<ContentType, number>;
  byStatus: Record<string, number>;
}> {
  // This would query a notifications log table
  // For now, return mock data
  logger.debug('Getting stats for date range:', { startDate, endDate });

  return {
    total: 0,
    byType: {
      survey: 0,
      event: 0,
      update: 0,
      referral: 0
    },
    byStatus: {
      sent: 0,
      failed: 0,
      pending: 0
    }
  };
}

/**
 * Utility to format notification messages based on content type
 */
export function formatNotificationMessage(
  contentType: ContentType,
  action: 'published' | 'updated' | 'deleted',
  title?: string
): string {
  const contentLabels: Record<ContentType, string> = {
    survey: 'Survey',
    event: 'Event',
    update: 'Update',
    referral: 'Referral'
  };

  const actionLabels: Record<string, string> = {
    published: 'has been published',
    updated: 'has been updated',
    deleted: 'has been removed'
  };

  const contentLabel = contentLabels[contentType] || contentType;
  const actionLabel = actionLabels[action] || action;

  if (title) {
    return `${contentLabel} "${title}" ${actionLabel}`;
  }

  return `${contentLabel} ${actionLabel}`;
}

/**
 * Helper to determine if we should send immediate notifications
 * based on content type and timing
 */
export function shouldSendImmediateNotification(
  contentType: ContentType,
  publishDate?: Date
): boolean {
  // If no publish date or publish date is in the past, send immediately
  if (!publishDate || publishDate <= new Date()) {
    return true;
  }

  // For future-dated content, don't send immediately
  // This could be handled by a scheduled job instead
  return false;
}

// Export a singleton instance for convenience
export const notificationService = {
  triggerPublish: triggerPublishNotification,
  sendTest: sendTestNotification,
  batchTrigger: batchTriggerNotifications,
  areEnabled: areNotificationsEnabled,
  getStats: getNotificationStats,
  formatMessage: formatNotificationMessage,
  shouldSendImmediate: shouldSendImmediateNotification
};