import { supabase } from '@/lib/supabase';

export interface UserActivityMetrics {
  user_id: string;
  surveys_completed: number;
  surveys_started: number;
  events_registered: number;
  updates_acknowledged: number;
  calculator_submissions: number;
  referrals_made: number;
  last_activity_at: string | null;
  engagement_score: number;
}

export interface UserWithActivity {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  user_created_at: string;
  profile_complete: boolean;
  phone: string | null;
  user_updated_at: string | null;
  dsp_id: string | null;
  dsp_name: string | null;
  dsp_code: string | null;
  acquisition_source: 'marketing' | 'referral' | 'direct';
  source_display: string;
  campaign_code: string | null;
  campaign_name: string | null;
  funnel_name: string | null;
  marketing_converted_at: string | null;
  referrer_id: string | null;
  referrer_name: string | null;
  referrer_email: string | null;
  referral_status: string | null;

  // Activity metrics
  surveys_completed: number;
  surveys_started: number;
  events_registered: number;
  updates_acknowledged: number;
  calculator_submissions: number;
  referrals_made: number;
  last_activity_at: string | null;
  engagement_score: number;
}

/**
 * Fetch activity metrics for all users
 * Queries actual data from portal tables - no mock data
 */
export async function fetchUserActivityMetrics(): Promise<Map<string, UserActivityMetrics>> {
  try {
    // Get all users first
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) throw usersError;
    if (!users || users.length === 0) return new Map();

    const userIds = users.map(u => u.id);

    // Fetch all activity data in parallel
    const [
      surveysData,
      eventsData,
      updatesData,
      calculatorsData,
      referralsData
    ] = await Promise.all([
      // Survey responses
      supabase
        .from('portal_survey_responses')
        .select('user_id, is_complete, started_at, completed_at')
        .in('user_id', userIds),

      // Event registrations
      supabase
        .from('portal_event_registrations')
        .select('user_id, registered_at')
        .in('user_id', userIds),

      // Update reads/acknowledgements
      supabase
        .from('portal_update_reads')
        .select('user_id, acknowledged_at')
        .in('user_id', userIds),

      // Calculator submissions
      supabase
        .from('calculator_submissions')
        .select('user_id, created_at')
        .in('user_id', userIds),

      // Referrals
      supabase
        .from('portal_referrals')
        .select('referrer_id, created_at')
        .in('referrer_id', userIds)
    ]);

    // Check for errors
    if (surveysData.error) console.error('Error fetching surveys:', surveysData.error);
    if (eventsData.error) console.error('Error fetching events:', eventsData.error);
    if (updatesData.error) console.error('Error fetching updates:', updatesData.error);
    if (calculatorsData.error) console.error('Error fetching calculators:', calculatorsData.error);
    if (referralsData.error) console.error('Error fetching referrals:', referralsData.error);

    // Calculate metrics per user
    const metricsMap = new Map<string, UserActivityMetrics>();

    userIds.forEach(userId => {
      const surveys = surveysData.data?.filter(s => s.user_id === userId) || [];
      const events = eventsData.data?.filter(e => e.user_id === userId) || [];
      const updates = updatesData.data?.filter(u => u.user_id === userId) || [];
      const calculators = calculatorsData.data?.filter(c => c.user_id === userId) || [];
      const referrals = referralsData.data?.filter(r => r.referrer_id === userId) || [];

      const surveysCompleted = surveys.filter(s => s.is_complete).length;
      const surveysStarted = surveys.length;
      const eventsRegistered = events.length;
      const updatesAcknowledged = updates.length;
      const calculatorSubmissions = calculators.length;
      const referralsMade = referrals.length;

      // Find last activity date
      const allDates = [
        ...surveys.map(s => s.completed_at || s.started_at),
        ...events.map(e => e.registered_at),
        ...updates.map(u => u.acknowledged_at),
        ...calculators.map(c => c.created_at),
        ...referrals.map(r => r.created_at)
      ].filter(Boolean).map(d => new Date(d!));

      const lastActivityAt = allDates.length > 0
        ? new Date(Math.max(...allDates.map(d => d.getTime()))).toISOString()
        : null;

      // Calculate engagement score (0-100)
      const engagementScore = calculateEngagementScore({
        surveysCompleted,
        surveysStarted,
        eventsRegistered,
        updatesAcknowledged,
        calculatorSubmissions,
        referralsMade
      });

      metricsMap.set(userId, {
        user_id: userId,
        surveys_completed: surveysCompleted,
        surveys_started: surveysStarted,
        events_registered: eventsRegistered,
        updates_acknowledged: updatesAcknowledged,
        calculator_submissions: calculatorSubmissions,
        referrals_made: referralsMade,
        last_activity_at: lastActivityAt,
        engagement_score: engagementScore
      });
    });

    return metricsMap;

  } catch (error) {
    console.error('Error fetching user activity metrics:', error);
    return new Map();
  }
}

/**
 * Calculate engagement score based on user activity
 * Score ranges from 0-100
 *
 * Weights:
 * - Surveys completed: 30%
 * - Events registered: 20%
 * - Updates acknowledged: 20%
 * - Calculator submissions: 15%
 * - Referrals made: 15%
 */
function calculateEngagementScore(metrics: {
  surveysCompleted: number;
  surveysStarted: number;
  eventsRegistered: number;
  updatesAcknowledged: number;
  calculatorSubmissions: number;
  referralsMade: number;
}): number {
  // Define max values for normalization (adjust based on typical user behavior)
  const MAX_SURVEYS = 10;
  const MAX_EVENTS = 5;
  const MAX_UPDATES = 20;
  const MAX_CALCULATORS = 3;
  const MAX_REFERRALS = 5;

  // Normalize each metric to 0-100 scale
  const surveysScore = Math.min(100, (metrics.surveysCompleted / MAX_SURVEYS) * 100);
  const eventsScore = Math.min(100, (metrics.eventsRegistered / MAX_EVENTS) * 100);
  const updatesScore = Math.min(100, (metrics.updatesAcknowledged / MAX_UPDATES) * 100);
  const calculatorsScore = Math.min(100, (metrics.calculatorSubmissions / MAX_CALCULATORS) * 100);
  const referralsScore = Math.min(100, (metrics.referralsMade / MAX_REFERRALS) * 100);

  // Apply weights
  const weightedScore =
    (surveysScore * 0.30) +
    (eventsScore * 0.20) +
    (updatesScore * 0.20) +
    (calculatorsScore * 0.15) +
    (referralsScore * 0.15);

  return Math.round(weightedScore);
}

/**
 * Get engagement level label based on score
 */
export function getEngagementLevel(score: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (score >= 80) {
    return { label: 'Very Active', color: 'text-green-700 bg-green-100', icon: '🔥' };
  } else if (score >= 50) {
    return { label: 'Active', color: 'text-blue-700 bg-blue-100', icon: '⚡' };
  } else if (score >= 20) {
    return { label: 'Moderate', color: 'text-yellow-700 bg-yellow-100', icon: '📊' };
  } else if (score > 0) {
    return { label: 'Low Activity', color: 'text-orange-700 bg-orange-100', icon: '💤' };
  } else {
    return { label: 'Inactive', color: 'text-gray-700 bg-gray-100', icon: '😴' };
  }
}
