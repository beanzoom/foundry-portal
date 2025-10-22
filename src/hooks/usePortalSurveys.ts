import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Hook to get count of available surveys (not completed by user)
export function useAvailableSurveysCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['available-surveys-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get all published surveys
      const { data: surveys, error: surveysError } = await supabase
        .from('portal_surveys')
        .select('id')
        .eq('status', 'published')
        .eq('is_active', true);

      if (surveysError) {
        console.error('Error fetching surveys:', surveysError);
        return 0;
      }

      if (!surveys || surveys.length === 0) return 0;

      // Get user's completed surveys
      const { data: completedSurveys, error: completedError } = await supabase
        .from('portal_survey_responses')
        .select('survey_id')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (completedError) {
        console.error('Error fetching completed surveys:', completedError);
        return surveys.length;
      }

      // Calculate available surveys (not completed)
      const completedSurveyIds = new Set(completedSurveys?.map(r => r.survey_id) || []);
      const availableSurveys = surveys.filter(s => !completedSurveyIds.has(s.id));

      return availableSurveys.length;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hook to get all surveys with completion status
export function usePortalSurveys() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['portal-surveys', user?.id],
    queryFn: async () => {
      // Get all published surveys
      const { data: surveys, error: surveysError } = await supabase
        .from('portal_surveys')
        .select('*')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (surveysError) throw surveysError;

      if (!surveys || !user) return surveys || [];

      // Get user's survey responses
      const { data: responses, error: responsesError } = await supabase
        .from('portal_survey_responses')
        .select('survey_id, status, completed_at')
        .eq('user_id', user.id);

      if (responsesError) throw responsesError;

      // Map responses by survey_id for easy lookup
      const responseMap = new Map(
        responses?.map(r => [r.survey_id, r]) || []
      );

      // Add completion status to each survey
      return surveys.map(survey => ({
        ...survey,
        is_completed: responseMap.has(survey.id) && responseMap.get(survey.id)?.status === 'completed',
        response_status: responseMap.get(survey.id)?.status || null,
        completed_at: responseMap.get(survey.id)?.completed_at || null
      }));
    },
    enabled: !!user
  });
}