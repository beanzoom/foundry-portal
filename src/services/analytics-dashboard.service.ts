import { supabase } from '@/lib/supabase';

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalSurveys: number;
  activeSurveys: number;
  surveyResponseRate: number;
  totalEvents: number;
  upcomingEvents: number;
  eventAttendanceRate: number;
  totalUpdates: number;
  updateReadRate: number;
  totalReferrals: number;
  referralConversionRate: number;
}

export interface TopUser {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  engagement_score: number;
  activities_count: number;
  last_active: string;
}

export interface ContentPerformance {
  type: 'survey' | 'event' | 'update';
  id: string;
  title: string;
  engagement_count: number;
  engagement_rate: number;
  created_at: string;
}

export interface EngagementTrend {
  date: string;
  total_activities: number;
  unique_users: number;
}

/**
 * Fetch overall dashboard metrics
 */
export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all data in parallel
  const [
    usersData,
    newUsersData,
    surveysData,
    surveyResponsesData,
    eventsData,
    eventRegistrationsData,
    updatesData,
    updateReadsData,
    referralsData,
    referralConversionsData
  ] = await Promise.all([
    // Total users
    supabase
      .from('user_acquisition_details')
      .select('user_id', { count: 'exact', head: true }),

    // New users this month
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', firstOfMonth.toISOString()),

    // Surveys
    supabase
      .from('portal_surveys')
      .select('id, status', { count: 'exact' }),

    // Survey responses
    supabase
      .from('portal_survey_responses')
      .select('id, is_complete'),

    // Events
    supabase
      .from('portal_events')
      .select('id, status', { count: 'exact' }),

    // Event registrations
    supabase
      .from('portal_event_registrations')
      .select('id, attendance_status'),

    // Updates
    supabase
      .from('portal_updates')
      .select('id', { count: 'exact', head: true }),

    // Update reads
    supabase
      .from('portal_update_reads')
      .select('id', { count: 'exact', head: true }),

    // Referrals
    supabase
      .from('portal_referrals')
      .select('id', { count: 'exact', head: true }),

    // Referral conversions
    supabase
      .from('portal_referral_conversions')
      .select('id', { count: 'exact', head: true })
  ]);

  // Calculate metrics
  const totalUsers = usersData.count || 0;
  const newUsersThisMonth = newUsersData.count || 0;

  // Calculate active users (users with activity in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: activeUsersCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gte('last_sign_in_at', thirtyDaysAgo.toISOString());

  const activeUsers = activeUsersCount || 0;

  // Survey metrics
  const surveys = surveysData.data || [];
  const totalSurveys = surveys.length;
  const activeSurveys = surveys.filter(s => s.status === 'active' || s.status === 'published').length;

  const responses = surveyResponsesData.data || [];
  const completedResponses = responses.filter(r => r.is_complete).length;
  const surveyResponseRate = responses.length > 0
    ? Math.round((completedResponses / responses.length) * 100)
    : 0;

  // Event metrics
  const events = eventsData.data || [];
  const totalEvents = events.length;
  const upcomingEvents = events.filter(e => e.status === 'upcoming' || e.status === 'published').length;

  const registrations = eventRegistrationsData.data || [];
  const attendedRegistrations = registrations.filter(r => r.attendance_status === 'attended').length;
  const eventAttendanceRate = registrations.length > 0
    ? Math.round((attendedRegistrations / registrations.length) * 100)
    : 0;

  // Update metrics
  const totalUpdates = updatesData.count || 0;
  const totalUpdateReads = updateReadsData.count || 0;
  const updateReadRate = totalUpdates > 0
    ? Math.round((totalUpdateReads / totalUpdates) * 100)
    : 0;

  // Referral metrics
  const totalReferrals = referralsData.count || 0;
  const totalConversions = referralConversionsData.count || 0;
  const referralConversionRate = totalReferrals > 0
    ? Math.round((totalConversions / totalReferrals) * 100)
    : 0;

  return {
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    totalSurveys,
    activeSurveys,
    surveyResponseRate,
    totalEvents,
    upcomingEvents,
    eventAttendanceRate,
    totalUpdates,
    updateReadRate,
    totalReferrals,
    referralConversionRate
  };
}

/**
 * Fetch top engaged users
 */
export async function fetchTopUsers(limit: number = 10): Promise<TopUser[]> {
  // Get all users
  const { data: users } = await supabase
    .from('user_acquisition_details')
    .select('user_id, email, first_name, last_name');

  if (!users || users.length === 0) return [];

  const userIds = users.map(u => u.user_id);

  // Get activity counts for each user (using correct column names)
  const [surveyResponses, eventRegistrations, updateReads] = await Promise.all([
    supabase
      .from('portal_survey_responses')
      .select('user_id, started_at'),

    supabase
      .from('portal_event_registrations')
      .select('user_id, registered_at'),

    supabase
      .from('portal_update_reads')
      .select('user_id, first_viewed_at')
  ]);

  // Calculate 30 days ago for filtering in JavaScript
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoTime = thirtyDaysAgo.getTime();

  // Calculate engagement for each user (filter to last 30 days in JavaScript)
  const userEngagement = users.map(user => {
    // Filter activities to last 30 days
    const surveyCount = surveyResponses.data?.filter(r =>
      r.user_id === user.user_id &&
      r.started_at &&
      new Date(r.started_at).getTime() >= thirtyDaysAgoTime
    ).length || 0;

    const eventCount = eventRegistrations.data?.filter(r =>
      r.user_id === user.user_id &&
      r.registered_at &&
      new Date(r.registered_at).getTime() >= thirtyDaysAgoTime
    ).length || 0;

    const updateCount = updateReads.data?.filter(r =>
      r.user_id === user.user_id &&
      r.first_viewed_at &&
      new Date(r.first_viewed_at).getTime() >= thirtyDaysAgoTime
    ).length || 0;

    const activities_count = surveyCount + eventCount + updateCount;

    // Calculate engagement score (weighted)
    const engagement_score = Math.min(100, Math.round(
      (surveyCount * 10) +  // Surveys worth 10 points
      (eventCount * 8) +    // Events worth 8 points
      (updateCount * 2)     // Updates worth 2 points
    ));

    return {
      user_id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      engagement_score,
      activities_count,
      last_active: new Date().toISOString() // We'll get actual last_active from profiles
    };
  });

  // Get last active times from profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, last_sign_in_at')
    .in('id', userIds);

  // Merge last_active data
  const enrichedUsers = userEngagement.map(user => ({
    ...user,
    last_active: profiles?.find(p => p.id === user.user_id)?.last_sign_in_at || user.last_active
  }));

  // Sort by engagement score and return top users
  return enrichedUsers
    .sort((a, b) => b.engagement_score - a.engagement_score)
    .slice(0, limit);
}

/**
 * Fetch top performing content
 */
export async function fetchTopContent(limit: number = 5): Promise<ContentPerformance[]> {
  const [surveys, events, updates] = await Promise.all([
    // Top surveys by response count
    supabase
      .from('portal_surveys')
      .select(`
        id,
        title,
        created_at,
        portal_survey_responses(count)
      `)
      .limit(limit),

    // Top events by registration count
    supabase
      .from('portal_events')
      .select(`
        id,
        title,
        created_at,
        portal_event_registrations(count)
      `)
      .limit(limit),

    // Top updates by read count
    supabase
      .from('portal_updates')
      .select(`
        id,
        title,
        created_at,
        portal_update_reads(count)
      `)
      .limit(limit)
  ]);

  const content: ContentPerformance[] = [];

  // Process surveys
  if (surveys.data) {
    surveys.data.forEach(survey => {
      content.push({
        type: 'survey',
        id: survey.id,
        title: survey.title,
        engagement_count: Array.isArray(survey.portal_survey_responses)
          ? survey.portal_survey_responses.length
          : 0,
        engagement_rate: 0, // We'd need total user count to calculate rate
        created_at: survey.created_at
      });
    });
  }

  // Process events
  if (events.data) {
    events.data.forEach(event => {
      content.push({
        type: 'event',
        id: event.id,
        title: event.title,
        engagement_count: Array.isArray(event.portal_event_registrations)
          ? event.portal_event_registrations.length
          : 0,
        engagement_rate: 0,
        created_at: event.created_at
      });
    });
  }

  // Process updates
  if (updates.data) {
    updates.data.forEach(update => {
      content.push({
        type: 'update',
        id: update.id,
        title: update.title,
        engagement_count: Array.isArray(update.portal_update_reads)
          ? update.portal_update_reads.length
          : 0,
        engagement_rate: 0,
        created_at: update.created_at
      });
    });
  }

  // Sort by engagement count and return top items
  return content
    .sort((a, b) => b.engagement_count - a.engagement_count)
    .slice(0, limit);
}

/**
 * Fetch engagement trends over the last 30 days
 */
export async function fetchEngagementTrends(): Promise<EngagementTrend[]> {
  // Fetch all activity (using correct column names)
  const [surveyResponses, eventRegistrations, updateReads] = await Promise.all([
    supabase
      .from('portal_survey_responses')
      .select('user_id, started_at'),

    supabase
      .from('portal_event_registrations')
      .select('user_id, registered_at'),

    supabase
      .from('portal_update_reads')
      .select('user_id, first_viewed_at')
  ]);

  // Calculate 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoTime = thirtyDaysAgo.getTime();

  // Group activities by date
  const activityByDate = new Map<string, { activities: number; users: Set<string> }>();

  const processActivities = (activities: any[], dateField: string) => {
    activities.forEach(activity => {
      // Filter to last 30 days
      if (!activity[dateField]) return;

      const activityDate = new Date(activity[dateField]);
      if (activityDate.getTime() < thirtyDaysAgoTime) return;

      const date = activityDate.toISOString().split('T')[0];

      if (!activityByDate.has(date)) {
        activityByDate.set(date, { activities: 0, users: new Set() });
      }

      const dayData = activityByDate.get(date)!;
      dayData.activities++;
      dayData.users.add(activity.user_id);
    });
  };

  processActivities(surveyResponses.data || [], 'started_at');
  processActivities(eventRegistrations.data || [], 'registered_at');
  processActivities(updateReads.data || [], 'first_viewed_at');

  // Convert to array and sort by date
  const trends: EngagementTrend[] = Array.from(activityByDate.entries())
    .map(([date, data]) => ({
      date,
      total_activities: data.activities,
      unique_users: data.users.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return trends;
}
