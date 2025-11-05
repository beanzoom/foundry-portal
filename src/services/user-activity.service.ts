import { supabase } from '@/lib/supabase';

/**
 * User Activity Service
 * Fetches detailed activity records for individual users
 * This is the "user-centric" view showing all activities for a specific user
 */

export interface ActivityEvent {
  id: string;
  type: 'survey' | 'event' | 'update' | 'calculator' | 'referral' | 'auth' | 'profile';
  timestamp: string;
  title: string;
  description: string;
  status?: string;
  metadata?: Record<string, any>;
  related_id?: string; // ID of the related content (survey_id, event_id, etc.)
}

export interface UserActivitySummary {
  user_id: string;
  total_activities: number;
  activities: ActivityEvent[];
  date_range: {
    earliest: string | null;
    latest: string | null;
  };
}

/**
 * Fetch all activity for a specific user
 * Returns chronologically sorted activity events
 */
export async function fetchUserActivity(userId: string, options?: {
  type?: ActivityEvent['type'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<UserActivitySummary> {
  try {
    const activities: ActivityEvent[] = [];

    // Fetch survey responses
    if (!options?.type || options.type === 'survey') {
      const { data: surveys, error: surveysError } = await supabase
        .from('portal_survey_responses')
        .select(`
          id,
          survey_id,
          started_at,
          completed_at,
          is_complete,
          status,
          portal_surveys (
            title,
            description
          )
        `)
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (!surveysError && surveys) {
        surveys.forEach(survey => {
          const surveyData = survey.portal_surveys as any;
          activities.push({
            id: survey.id,
            type: 'survey',
            timestamp: survey.completed_at || survey.started_at,
            title: surveyData?.title || 'Survey',
            description: survey.is_complete
              ? 'Completed survey'
              : `Survey in progress (${survey.status})`,
            status: survey.is_complete ? 'completed' : survey.status || 'in_progress',
            related_id: survey.survey_id,
            metadata: {
              started_at: survey.started_at,
              completed_at: survey.completed_at,
              is_complete: survey.is_complete
            }
          });
        });
      }
    }

    // Fetch event registrations
    if (!options?.type || options.type === 'event') {
      const { data: events, error: eventsError } = await supabase
        .from('portal_event_registrations')
        .select(`
          id,
          event_id,
          registered_at,
          attendance_status,
          attended,
          check_in_time,
          cancelled_at,
          portal_events (
            title,
            description
          )
        `)
        .eq('user_id', userId)
        .order('registered_at', { ascending: false });

      if (!eventsError && events) {
        events.forEach(event => {
          const eventData = event.portal_events as any;
          let description = 'Registered for event';
          if (event.cancelled_at) {
            description = 'Registration cancelled';
          } else if (event.attended) {
            description = 'Attended event';
          } else if (event.check_in_time) {
            description = 'Checked in to event';
          }

          activities.push({
            id: event.id,
            type: 'event',
            timestamp: event.check_in_time || event.registered_at,
            title: eventData?.title || 'Event',
            description,
            status: event.cancelled_at ? 'cancelled' : (event.attended ? 'attended' : event.attendance_status),
            related_id: event.event_id,
            metadata: {
              registered_at: event.registered_at,
              attendance_status: event.attendance_status,
              attended: event.attended,
              check_in_time: event.check_in_time,
              cancelled_at: event.cancelled_at
            }
          });
        });
      }
    }

    // Fetch update reads/acknowledgements
    if (!options?.type || options.type === 'update') {
      const { data: updates, error: updatesError } = await supabase
        .from('portal_update_reads')
        .select(`
          id,
          update_id,
          first_viewed_at,
          acknowledged_at,
          dismissed_at,
          view_count,
          portal_updates (
            title,
            content,
            update_type
          )
        `)
        .eq('user_id', userId)
        .order('first_viewed_at', { ascending: false });

      if (!updatesError && updates) {
        updates.forEach(update => {
          const updateData = update.portal_updates as any;
          let description = `Viewed update`;
          let status = 'viewed';

          if (update.acknowledged_at) {
            description = 'Acknowledged update';
            status = 'acknowledged';
          } else if (update.dismissed_at) {
            description = 'Dismissed update';
            status = 'dismissed';
          }

          if (update.view_count > 1) {
            description += ` (${update.view_count} views)`;
          }

          activities.push({
            id: update.id,
            type: 'update',
            timestamp: update.acknowledged_at || update.dismissed_at || update.first_viewed_at,
            title: updateData?.title || 'Update',
            description,
            status,
            related_id: update.update_id,
            metadata: {
              first_viewed_at: update.first_viewed_at,
              acknowledged_at: update.acknowledged_at,
              dismissed_at: update.dismissed_at,
              view_count: update.view_count,
              update_type: updateData?.update_type
            }
          });
        });
      }
    }

    // Fetch calculator submissions
    if (!options?.type || options.type === 'calculator') {
      const { data: calculators, error: calculatorsError } = await supabase
        .from('calculator_submissions')
        .select('id, created_at, total_annual_savings, fleet_size, company_name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!calculatorsError && calculators) {
        calculators.forEach(calc => {
          activities.push({
            id: calc.id,
            type: 'calculator',
            timestamp: calc.created_at,
            title: 'ROI Calculator',
            description: `Submitted calculator for ${calc.fleet_size || 'N/A'} vehicles`,
            status: 'completed',
            metadata: {
              company_name: calc.company_name,
              fleet_size: calc.fleet_size,
              total_annual_savings: calc.total_annual_savings
            }
          });
        });
      }
    }

    // Fetch referrals made
    if (!options?.type || options.type === 'referral') {
      const { data: referrals, error: referralsError } = await supabase
        .from('portal_referrals')
        .select('id, created_at, referee_first_name, referee_last_name, referee_email, status')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (!referralsError && referrals) {
        referrals.forEach(referral => {
          activities.push({
            id: referral.id,
            type: 'referral',
            timestamp: referral.created_at,
            title: 'Referral',
            description: `Referred ${referral.referee_first_name} ${referral.referee_last_name}`,
            status: referral.status,
            metadata: {
              referee_name: `${referral.referee_first_name} ${referral.referee_last_name}`,
              referee_email: referral.referee_email,
              status: referral.status
            }
          });
        });
      }
    }

    // Fetch authentication/profile events
    if (!options?.type || options.type === 'auth' || options.type === 'profile') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, created_at, updated_at, last_sign_in_at, portal_registered_at, terms_accepted_at, profile_complete')
        .eq('id', userId)
        .single();

      if (!profileError && profile) {
        // Account created
        if (profile.created_at) {
          activities.push({
            id: `${profile.id}-created`,
            type: 'auth',
            timestamp: profile.created_at,
            title: 'Account Created',
            description: 'User account was created',
            status: 'completed',
            metadata: {
              event_type: 'account_created'
            }
          });
        }

        // Portal registration
        if (profile.portal_registered_at) {
          activities.push({
            id: `${profile.id}-portal-registered`,
            type: 'auth',
            timestamp: profile.portal_registered_at,
            title: 'Portal Access Granted',
            description: 'User was granted portal access',
            status: 'completed',
            metadata: {
              event_type: 'portal_registered'
            }
          });
        }

        // NDA accepted (fetch from nda_agreements table)
        const { data: ndaAgreements, error: ndaError } = await supabase
          .from('nda_agreements')
          .select('id, agreed_at, nda_version')
          .eq('user_id', userId)
          .order('agreed_at', { ascending: false })
          .limit(1);

        if (!ndaError && ndaAgreements && ndaAgreements.length > 0) {
          const nda = ndaAgreements[0];
          activities.push({
            id: nda.id,
            type: 'profile',
            timestamp: nda.agreed_at,
            title: 'NDA Accepted',
            description: `User accepted NDA (version ${nda.nda_version})`,
            status: 'completed',
            metadata: {
              event_type: 'nda_accepted',
              nda_version: nda.nda_version
            }
          });
        }

        // Terms accepted
        if (profile.terms_accepted_at) {
          activities.push({
            id: `${profile.id}-terms`,
            type: 'profile',
            timestamp: profile.terms_accepted_at,
            title: 'Terms Accepted',
            description: 'User accepted terms and conditions',
            status: 'completed',
            metadata: {
              event_type: 'terms_accepted'
            }
          });
        }

        // Last sign in
        if (profile.last_sign_in_at) {
          activities.push({
            id: `${profile.id}-last-signin`,
            type: 'auth',
            timestamp: profile.last_sign_in_at,
            title: 'Last Sign In',
            description: 'User signed in to portal',
            status: 'completed',
            metadata: {
              event_type: 'sign_in'
            }
          });
        }

        // Profile completed
        if (profile.profile_complete && profile.updated_at) {
          activities.push({
            id: `${profile.id}-profile-complete`,
            type: 'profile',
            timestamp: profile.updated_at,
            title: 'Profile Completed',
            description: 'User completed their profile',
            status: 'completed',
            metadata: {
              event_type: 'profile_completed'
            }
          });
        }
      }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Apply date filters if provided
    let filteredActivities = activities;
    if (options?.startDate) {
      filteredActivities = filteredActivities.filter(a =>
        new Date(a.timestamp) >= options.startDate!
      );
    }
    if (options?.endDate) {
      filteredActivities = filteredActivities.filter(a =>
        new Date(a.timestamp) <= options.endDate!
      );
    }

    // Apply limit if provided
    if (options?.limit) {
      filteredActivities = filteredActivities.slice(0, options.limit);
    }

    // Calculate date range
    const timestamps = filteredActivities.map(a => new Date(a.timestamp).getTime());
    const dateRange = {
      earliest: timestamps.length > 0 ? new Date(Math.min(...timestamps)).toISOString() : null,
      latest: timestamps.length > 0 ? new Date(Math.max(...timestamps)).toISOString() : null
    };

    return {
      user_id: userId,
      total_activities: filteredActivities.length,
      activities: filteredActivities,
      date_range: dateRange
    };

  } catch (error) {
    console.error('Error fetching user activity:', error);
    return {
      user_id: userId,
      total_activities: 0,
      activities: [],
      date_range: { earliest: null, latest: null }
    };
  }
}

/**
 * Fetch activity statistics for a user
 */
export async function fetchUserActivityStats(userId: string) {
  const activity = await fetchUserActivity(userId);

  const stats = {
    total: activity.total_activities,
    by_type: {
      survey: activity.activities.filter(a => a.type === 'survey').length,
      event: activity.activities.filter(a => a.type === 'event').length,
      update: activity.activities.filter(a => a.type === 'update').length,
      calculator: activity.activities.filter(a => a.type === 'calculator').length,
      referral: activity.activities.filter(a => a.type === 'referral').length,
      auth: activity.activities.filter(a => a.type === 'auth').length,
      profile: activity.activities.filter(a => a.type === 'profile').length,
    },
    date_range: activity.date_range
  };

  return stats;
}

/**
 * Get activity type display information
 */
export function getActivityTypeInfo(type: ActivityEvent['type']): {
  label: string;
  icon: string;
  color: string;
} {
  switch (type) {
    case 'survey':
      return { label: 'Survey', icon: '📋', color: 'bg-blue-100 text-blue-700' };
    case 'event':
      return { label: 'Event', icon: '📅', color: 'bg-purple-100 text-purple-700' };
    case 'update':
      return { label: 'Update', icon: '📢', color: 'bg-green-100 text-green-700' };
    case 'calculator':
      return { label: 'Calculator', icon: '🧮', color: 'bg-orange-100 text-orange-700' };
    case 'referral':
      return { label: 'Referral', icon: '👥', color: 'bg-pink-100 text-pink-700' };
    case 'auth':
      return { label: 'Authentication', icon: '🔐', color: 'bg-indigo-100 text-indigo-700' };
    case 'profile':
      return { label: 'Profile', icon: '👤', color: 'bg-cyan-100 text-cyan-700' };
  }
}

/**
 * Get activity status display information
 */
export function getActivityStatusInfo(status: string | undefined): {
  label: string;
  color: string;
} | null {
  if (!status) return null;

  switch (status.toLowerCase()) {
    case 'completed':
    case 'acknowledged':
    case 'attended':
      return { label: status, color: 'bg-green-100 text-green-700' };
    case 'in_progress':
    case 'viewed':
    case 'registered':
      return { label: status.replace('_', ' '), color: 'bg-blue-100 text-blue-700' };
    case 'cancelled':
    case 'dismissed':
      return { label: status, color: 'bg-red-100 text-red-700' };
    case 'pending':
      return { label: status, color: 'bg-yellow-100 text-yellow-700' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700' };
  }
}
