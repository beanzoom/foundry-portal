/**
 * useFeaturedContent Hook
 * Intelligently determines what content to feature on the dashboard
 * Based on actual portal data - no invented content
 */

import { useState, useEffect, useMemo } from 'react';
import { usePortal } from '@/contexts/PortalContext';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logging';
import { portalRoute } from '@/lib/portal/navigation';
import {
  User,
  Calendar,
  ClipboardList,
  Megaphone,
  AlertCircle,
  Clock,
  Star,
  TrendingUp,
  CheckCircle,
  Home
} from 'lucide-react';

interface FeaturedContent {
  type: 'onboarding' | 'urgent_survey' | 'upcoming_event' | 'new_survey' |
        'new_event' | 'important_update' | 'welcome_back' | 'default';
  title: string;
  description: string;
  primaryAction: string;
  primaryLink: string;
  secondaryAction?: string;
  secondaryLink?: string;
  icon: any;
  variant: 'default' | 'info' | 'warning' | 'success' | 'important';
  progress?: number;
  metadata?: Record<string, any>;
}

export function useFeaturedContent(skipProfileCompletion: boolean = false) {
  const { portalUser } = usePortal();
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!portalUser) {
      setLoading(false);
      return;
    }

    loadFeaturedContent();
  }, [portalUser]);

  const loadFeaturedContent = async () => {
    if (!portalUser) return;

    try {
      const now = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

      // 1. Check profile completeness (for new/incomplete profiles)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', portalUser.id)
        .single();

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', portalUser.id);

      const profileFields = profileData ? [
        profileData.first_name,
        profileData.last_name,
        profileData.phone,
        profileData.title,
        profileData.department
      ] : [];

      const filledFields = profileFields.filter(field => field && field !== '').length;
      const totalFields = 5; // first_name, last_name, phone, title, department
      const hasBusinesses = businessData && businessData.length > 0;
      const profileCompleteness = Math.round(((filledFields + (hasBusinesses ? 1 : 0)) / (totalFields + 1)) * 100);

      // If profile is less than 80% complete and account is less than 30 days old
      const accountAge = profileData?.created_at ?
        Math.floor((now.getTime() - new Date(profileData.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;

      if (profileCompleteness < 80 && accountAge < 30 && !skipProfileCompletion) {
        setFeaturedContent({
          type: 'onboarding',
          title: 'Complete Your Profile',
          description: `Your profile is ${profileCompleteness}% complete. Add missing information to unlock all portal features.`,
          primaryAction: 'Complete Profile',
          primaryLink: portalRoute('/profile/edit'),
          icon: User,
          variant: 'info',
          progress: profileCompleteness
        });
        setLoading(false);
        return;
      }

      // 2. Check for surveys closing soon that user hasn't completed
      // Try to get user survey status - fallback to simpler query if RPC fails
      let userSurveys: any = null;

      try {
        const { data, error } = await supabase
          .rpc('get_user_survey_status', { p_user_id: portalUser.id });

        if (!error) {
          userSurveys = data;
        } else {
          logger.warn('RPC get_user_survey_status failed, using fallback query', error);
        }
      } catch (e) {
        logger.warn('RPC get_user_survey_status not available, using fallback query', e);
      }

      // Fallback: Direct query if RPC is not available
      if (!userSurveys) {
        const { data: surveys } = await supabase
          .from('portal_surveys')
          .select(`
            id,
            title,
            description,
            status,
            due_date
          `)
          .eq('status', 'published')
          .not('due_date', 'is', null)
          .order('due_date', { ascending: true });

        if (surveys) {
          // Get user's responses
          const { data: responses } = await supabase
            .from('portal_survey_responses')
            .select('survey_id, is_complete, answered_questions')
            .eq('user_id', portalUser.id);

          const responseMap = new Map(responses?.map(r => [r.survey_id, r]) || []);

          // Get question counts for each survey
          const surveyQuestionCounts = await Promise.all(
            surveys.map(async (survey) => {
              const { count } = await supabase
                .from('portal_survey_questions')
                .select('*', { count: 'exact', head: true })
                .eq('survey_id', survey.id);
              return { surveyId: survey.id, questionCount: count || 0 };
            })
          );

          const questionCountMap = new Map(
            surveyQuestionCounts.map(sq => [sq.surveyId, sq.questionCount])
          );

          userSurveys = surveys.map(survey => {
            const questionCount = questionCountMap.get(survey.id) || 0;
            const response = responseMap.get(survey.id);

            return {
              survey_id: survey.id,
              title: survey.title,
              description: survey.description,
              due_date: survey.due_date,
              user_status: response
                ? (response.is_complete ? 'completed' : 'in_progress')
                : 'not_started',
              progress_percentage: questionCount > 0 && response
                ? Math.round((response.answered_questions || 0) / questionCount * 100)
                : 0
            };
          });
        }
      }

      if (userSurveys) {
        // Find surveys that are in progress or not started, with a due date
        const urgentSurvey = userSurveys.find((survey: any) => {
          if (survey.user_status === 'completed' || !survey.due_date) return false;
          const dueDate = new Date(survey.due_date);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilDue > 0 && daysUntilDue <= 3;
        });

        if (urgentSurvey) {
          const dueDate = new Date(urgentSurvey.due_date);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          setFeaturedContent({
            type: 'urgent_survey',
            title: 'Survey Closing Soon!',
            description: `"${urgentSurvey.title}" closes in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}. ${urgentSurvey.user_status === 'in_progress' ? `You're ${urgentSurvey.progress_percentage}% complete.` : 'Get started now!'}`,
            primaryAction: urgentSurvey.user_status === 'in_progress' ? 'Continue Survey' : 'Start Survey',
            primaryLink: `/portal/surveys/${urgentSurvey.survey_id}`,
            icon: Clock,
            variant: 'warning',
            progress: urgentSurvey.user_status === 'in_progress' ? urgentSurvey.progress_percentage : undefined
          });
          setLoading(false);
          return;
        }
      }

      // 3. Check for user's registered upcoming events (within 7 days)
      const { data: registrations } = await supabase
        .from('portal_event_registrations')
        .select('event_id')
        .eq('user_id', portalUser.id)
        .eq('attendance_status', 'registered');

      if (registrations && registrations.length > 0) {
        const eventIds = registrations.map(r => r.event_id);

        const { data: myEvents } = await supabase
          .from('portal_events')
          .select('*')
          .in('id', eventIds)
          .gte('start_datetime', now.toISOString())
          .order('start_datetime', { ascending: true })
          .limit(1);

        if (myEvents && myEvents.length > 0) {
          const event = myEvents[0];
          const eventDate = new Date(event.start_datetime);
          const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilEvent <= 7) {
            setFeaturedContent({
              type: 'upcoming_event',
              title: daysUntilEvent === 0 ? 'Event Today!' : `Event in ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''}`,
              description: `${event.title} - ${eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`,
              primaryAction: 'View Details',
              primaryLink: `/portal/events/${event.id}`,
              secondaryAction: 'My Events',
              secondaryLink: portalRoute('/events'),
              icon: Calendar,
              variant: 'success'
            });
            setLoading(false);
            return;
          }
        }
      }

      // 4. Check for new surveys (published in last 3 days) that user hasn't completed
      const { data: newSurveys } = await supabase
        .from('portal_surveys')
        .select('*')
        .eq('status', 'published')
        .gte('published_at', threeDaysAgo.toISOString())
        .order('published_at', { ascending: false });

      if (newSurveys && newSurveys.length > 0) {
        // Check each new survey to see if user has completed it
        for (const survey of newSurveys) {
          const { data: userResponse } = await supabase
            .from('portal_survey_responses')
            .select('is_complete')
            .eq('survey_id', survey.id)
            .eq('user_id', portalUser.id)
            .single();

          // If user hasn't completed this survey, feature it
          if (!userResponse || !userResponse.is_complete) {
            setFeaturedContent({
              type: 'new_survey',
              title: 'New Survey Available',
              description: survey.description || `Help us improve with your feedback on "${survey.title}"`,
              primaryAction: 'Take Survey',
              primaryLink: `/portal/surveys/${survey.id}`,
              secondaryAction: 'View All Surveys',
              secondaryLink: portalRoute('/surveys'),
              icon: ClipboardList,
              variant: 'default'
            });
            setLoading(false);
            return;
          }
        }
        // If we get here, user has completed all new surveys - continue to next priority
      }

      // 5. Check for new events open for registration
      const { data: newEvents } = await supabase
        .from('portal_events')
        .select('*')
        .eq('status', 'published')
        .eq('registration_open', true)
        .gte('published_at', sevenDaysAgo.toISOString())
        .gte('start_datetime', now.toISOString())
        .order('published_at', { ascending: false })
        .limit(1);

      if (newEvents && newEvents.length > 0) {
        const event = newEvents[0];
        const eventDate = new Date(event.start_datetime);
        setFeaturedContent({
          type: 'new_event',
          title: 'New Event: ' + event.title,
          description: event.description || `Join us on ${eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          primaryAction: 'Register Now',
          primaryLink: `/portal/events/${event.id}`,
          secondaryAction: 'View All Events',
          secondaryLink: '/portal/events',
          icon: Star,
          variant: 'default'
        });
        setLoading(false);
        return;
      }

      // 6. Check for unacknowledged compulsory updates
      const { data: compulsoryUpdates } = await supabase
        .from('portal_updates')
        .select('*')
        .eq('status', 'published')
        .eq('update_type', 'compulsory')
        .order('created_at', { ascending: false });

      if (compulsoryUpdates && compulsoryUpdates.length > 0) {
        // Check if user has acknowledged these updates
        const { data: acknowledgments } = await supabase
          .from('portal_update_acknowledgments')
          .select('update_id')
          .eq('user_id', portalUser.id);

        const acknowledgedIds = acknowledgments?.map(a => a.update_id) || [];
        const unacknowledged = compulsoryUpdates.find(u => !acknowledgedIds.includes(u.id));

        if (unacknowledged) {
          setFeaturedContent({
            type: 'important_update',
            title: 'Important Update Required',
            description: unacknowledged.title,
            primaryAction: 'Review & Acknowledge',
            primaryLink: portalRoute('/updates'),
            icon: AlertCircle,
            variant: 'important'
          });
          setLoading(false);
          return;
        }
      }

      // 7. Check if user hasn't visited in a while (last login)
      if (profileData?.last_login) {
        const lastLogin = new Date(profileData.last_login);
        const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceLogin > 14) {
          // Check if there's anything new since their last visit
          const { count: newUpdateCount } = await supabase
            .from('portal_updates')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .gte('created_at', lastLogin.toISOString());

          if (newUpdateCount && newUpdateCount > 0) {
            setFeaturedContent({
              type: 'welcome_back',
              title: 'Welcome Back!',
              description: `You have ${newUpdateCount} new update${newUpdateCount !== 1 ? 's' : ''} since your last visit ${daysSinceLogin} days ago.`,
              primaryAction: 'View Updates',
              primaryLink: portalRoute('/updates'),
              icon: TrendingUp,
              variant: 'info'
            });
            setLoading(false);
            return;
          }
        }
      }

      // 8. Default welcome message
      setFeaturedContent({
        type: 'default',
        title: 'Welcome to FleetDRMS Portal',
        description: 'Your hub for fleet management resources, tools, and community engagement.',
        primaryAction: 'Explore Portal',
        primaryLink: portalRoute('/dashboard'),
        secondaryAction: 'View Solutions',
        secondaryLink: portalRoute('/solutions'),
        icon: Home,
        variant: 'default'
      });

    } catch (error) {
      logger.error('Error loading featured content:', error);
      // Fallback to default on error
      setFeaturedContent({
        type: 'default',
        title: 'Welcome to FleetDRMS Portal',
        description: 'Your hub for fleet management resources and tools.',
        primaryAction: 'Explore Portal',
        primaryLink: portalRoute('/dashboard'),
        icon: Home,
        variant: 'default'
      });
    } finally {
      setLoading(false);
    }
  };

  return { featuredContent, loading };
}