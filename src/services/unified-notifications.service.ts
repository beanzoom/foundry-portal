/**
 * Unified Notification Service
 * Provides a centralized interface for queueing all types of notifications
 */

import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/logging';

const logger = createLogger('UnifiedNotifications');

export interface NotificationData {
  [key: string]: any;
}

export interface QueueNotificationOptions {
  eventId: string;
  data: NotificationData;
  triggeredBy?: string;
}

export interface NotificationResult {
  success: boolean;
  queuedCount?: number;
  error?: string;
}

/**
 * Queue a notification using the unified system
 */
export async function queueNotification({
  eventId,
  data,
  triggeredBy
}: QueueNotificationOptions): Promise<NotificationResult> {
  try {
    const { data: result, error } = await supabase.rpc('queue_notification', {
      p_event_id: eventId,
      p_event_data: data,
      p_triggered_by: triggeredBy || null
    });

    if (error) {
      logger.error('Failed to queue notification:', error);
      return {
        success: false,
        error: error.message
      };
    }

    logger.info(`Queued ${result.queued_count} notifications for event ${eventId}`);
    return {
      success: true,
      queuedCount: result.queued_count
    };
  } catch (error: any) {
    logger.error('Error queueing notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to queue notification'
    };
  }
}

/**
 * Migration adapters for existing notification systems
 * These functions help existing code work with the new unified system
 */

/**
 * Send referral invitation (adapter for existing code)
 */
export async function sendReferralInvitation(referralData: {
  referralId: string;
  referrerName: string;
  refereeName: string;
  refereeEmail: string;
  referralCode: string;
  referralUrl?: string;
}): Promise<NotificationResult> {
  return queueNotification({
    eventId: 'referral_created',
    data: {
      referral_id: referralData.referralId,
      referrer_name: referralData.referrerName,
      referee_name: referralData.refereeName,
      referee_email: referralData.refereeEmail,
      referral_code: referralData.referralCode,
      referral_url: referralData.referralUrl || `https://fleetdrms.com/portal/auth?ref=${referralData.referralCode}`
    }
  });
}

/**
 * Send contact form notification (adapter for existing code)
 */
export async function sendContactFormNotification(formData: {
  formId?: string;
  userName: string;
  userEmail: string;
  subject?: string;
  message: string;
  phone?: string;
  company?: string;
}): Promise<NotificationResult> {
  return queueNotification({
    eventId: 'contact_form_submitted',
    data: {
      form_id: formData.formId || 'contact',
      user_name: formData.userName,
      user_email: formData.userEmail,
      subject: formData.subject || 'Contact Form Submission',
      message: formData.message,
      phone: formData.phone,
      company: formData.company,
      submitted_at: new Date().toISOString()
    }
  });
}

/**
 * Send survey published notification (adapter for existing code)
 */
export async function sendSurveyPublishedNotification(surveyData: {
  surveyId: string;
  surveyTitle: string;
  surveyDescription?: string;
  dueDate?: string;
  adminEmail: string;
}): Promise<NotificationResult> {
  return queueNotification({
    eventId: 'survey_published',
    data: {
      survey_id: surveyData.surveyId,
      survey_title: surveyData.surveyTitle,
      survey_description: surveyData.surveyDescription,
      due_date: surveyData.dueDate,
      admin_email: surveyData.adminEmail,
      survey_url: `https://fleetdrms.com/portal/surveys/${surveyData.surveyId}`
    }
  });
}

/**
 * Send survey completion notification
 */
export async function sendSurveyCompletionNotification(responseData: {
  responseId: string;
  surveyId: string;
  surveyTitle: string;
  userId: string;
  userEmail: string;
  userName: string;
  completedAt: string;
  responseCount: number;
  questionsAnswers: Array<{
    question: string;
    answer: string;
  }>;
}): Promise<NotificationResult> {
  return queueNotification({
    eventId: 'survey_completed',
    data: {
      response_id: responseData.responseId,
      survey_id: responseData.surveyId,
      survey_title: responseData.surveyTitle,
      user_id: responseData.userId,
      user_email: responseData.userEmail,
      user_name: responseData.userName,
      completed_at: responseData.completedAt,
      response_count: responseData.responseCount,
      questions_answers: responseData.questionsAnswers,
      admin_url: `https://fleetdrms.com/portal/admin/surveys/${responseData.surveyId}/results`
    },
    triggeredBy: responseData.userId
  });
}

/**
 * Send update published notification (adapter for existing code)
 */
export async function sendUpdatePublishedNotification(updateData: {
  updateId: string;
  updateTitle: string;
  updateContent?: string;
  priority?: string;
  adminEmail: string;
}): Promise<NotificationResult> {
  return queueNotification({
    eventId: 'update_published',
    data: {
      update_id: updateData.updateId,
      update_title: updateData.updateTitle,
      update_content: updateData.updateContent,
      priority: updateData.priority || 'normal',
      admin_email: updateData.adminEmail,
      update_url: `https://fleetdrms.com/portal/updates/${updateData.updateId}`
    }
  });
}

/**
 * Send event registration notification with calendar integration
 */
export async function sendEventRegistrationNotification(eventData: {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation?: string;
  eventDescription?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userCompany?: string;
  registrationDate: string;
  totalRegistrations?: number;
  maxAttendees?: number;
}): Promise<NotificationResult> {
  // Generate Google Calendar URL
  const startDate = new Date(`${eventData.eventDate} ${eventData.eventTime}`);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(eventData.eventTitle)}` +
    `&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}` +
    `&details=${encodeURIComponent(eventData.eventDescription || 'Event registration confirmed via FleetDRMS Portal')}` +
    (eventData.eventLocation ? `&location=${encodeURIComponent(eventData.eventLocation)}` : '');

  // Generate ICS download URL (placeholder - would need actual implementation)
  const icsDownloadUrl = `https://fleetdrms.com/portal/events/${eventData.eventId}/calendar.ics`;

  return queueNotification({
    eventId: 'event_registration',
    data: {
      event_id: eventData.eventId,
      event_title: eventData.eventTitle,
      event_date: eventData.eventDate,
      event_time: eventData.eventTime,
      event_location: eventData.eventLocation || '',
      event_description: eventData.eventDescription || '',
      user_id: eventData.userId,
      user_email: eventData.userEmail,
      user_name: eventData.userName,
      user_company: eventData.userCompany || '',
      registration_date: eventData.registrationDate,
      total_registrations: eventData.totalRegistrations || 1,
      max_attendees: eventData.maxAttendees || null,
      google_calendar_url: googleCalendarUrl,
      ics_download_url: icsDownloadUrl,
      portal_url: 'https://fleetdrms.com/portal',
      admin_event_url: `https://fleetdrms.com/portal/admin/events/${eventData.eventId}`,
      admin_registrations_url: `https://fleetdrms.com/portal/admin/events/${eventData.eventId}/registrations`
    },
    triggeredBy: eventData.userId
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(userData: {
  userId: string;
  userEmail: string;
  userName: string;
  userRole?: string;
}): Promise<NotificationResult> {
  return queueNotification({
    eventId: 'user_registered',
    data: {
      user_id: userData.userId,
      user_email: userData.userEmail,
      user_name: userData.userName,
      user_role: userData.userRole || 'user',
      portal_url: 'https://fleetdrms.com/portal',
      registered_at: new Date().toISOString()
    }
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(resetData: {
  userEmail: string;
  resetToken: string;
  expiresAt: string;
}): Promise<NotificationResult> {
  return queueNotification({
    eventId: 'password_reset_requested',
    data: {
      user_email: resetData.userEmail,
      reset_token: resetData.resetToken,
      expires_at: resetData.expiresAt,
      reset_url: `https://fleetdrms.com/portal/reset-password?token=${resetData.resetToken}`
    }
  });
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(hours: number = 24) {
  try {
    const { data, error } = await supabase.rpc('get_notification_stats', {
      p_hours: hours
    });

    if (error) {
      logger.error('Failed to get notification stats:', error);
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Error getting notification stats:', error);
    return null;
  }
}

/**
 * Process email queue manually (for testing or immediate processing)
 */
export async function processEmailQueue(batchSize: number = 20): Promise<{
  success: boolean;
  processed?: number;
  sent?: number;
  failed?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('process-email-queue', {
      body: { batchSize }
    });

    if (error) {
      logger.error('Failed to process email queue:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      processed: data.processed,
      sent: data.sent,
      failed: data.failed
    };
  } catch (error: any) {
    logger.error('Error processing email queue:', error);
    return {
      success: false,
      error: error.message || 'Failed to process queue'
    };
  }
}

// Export all functions for easy access
export default {
  queueNotification,
  sendReferralInvitation,
  sendContactFormNotification,
  sendSurveyPublishedNotification,
  sendSurveyCompletionNotification,
  sendUpdatePublishedNotification,
  sendEventRegistrationNotification,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  getNotificationStats,
  processEmailQueue
};