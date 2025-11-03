import { supabase } from '@/lib/supabase';

/**
 * Survey Analytics Service
 * Content-centric view: Select a survey → see all user responses
 */

export interface SurveyMetrics {
  survey_id: string;
  title: string;
  description: string | null;
  status: string;
  question_count: number;
  total_responses: number;
  completed_responses: number;
  in_progress_responses: number;
  completion_rate: number; // 0-100
  avg_completion_time_minutes: number | null;
  created_at: string;
  published_at: string | null;
}

export interface SurveyResponse {
  response_id: string;
  survey_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  is_complete: boolean;
  status: string;
  started_at: string;
  completed_at: string | null;
  completion_time_minutes: number | null;
  answered_questions: number;
  total_questions: number;
  answers: SurveyAnswer[];
}

export interface SurveyAnswer {
  question_id: string;
  question_text: string;
  question_type: string;
  answer_value: any;
  answered_at: string;
}

/**
 * Fetch metrics for all surveys
 */
export async function fetchAllSurveyMetrics(): Promise<SurveyMetrics[]> {
  try {
    // Get all surveys
    const { data: surveys, error: surveysError } = await supabase
      .from('portal_surveys')
      .select('id, title, description, status, question_count, created_at, published_at')
      .order('created_at', { ascending: false });

    if (surveysError) throw surveysError;
    if (!surveys || surveys.length === 0) return [];

    // Get response counts for each survey
    const surveyIds = surveys.map(s => s.id);

    const { data: responses, error: responsesError } = await supabase
      .from('portal_survey_responses')
      .select('survey_id, is_complete, started_at, completed_at')
      .in('survey_id', surveyIds);

    if (responsesError) console.error('Error fetching responses:', responsesError);

    // Calculate metrics for each survey
    const metrics: SurveyMetrics[] = surveys.map(survey => {
      const surveyResponses = responses?.filter(r => r.survey_id === survey.id) || [];
      const completed = surveyResponses.filter(r => r.is_complete);
      const inProgress = surveyResponses.filter(r => !r.is_complete);

      // Calculate average completion time
      const completionTimes = completed
        .filter(r => r.started_at && r.completed_at)
        .map(r => {
          const start = new Date(r.started_at).getTime();
          const end = new Date(r.completed_at!).getTime();
          return (end - start) / (1000 * 60); // minutes
        });

      const avgCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        : null;

      const completionRate = surveyResponses.length > 0
        ? (completed.length / surveyResponses.length) * 100
        : 0;

      return {
        survey_id: survey.id,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        question_count: survey.question_count,
        total_responses: surveyResponses.length,
        completed_responses: completed.length,
        in_progress_responses: inProgress.length,
        completion_rate: Math.round(completionRate),
        avg_completion_time_minutes: avgCompletionTime ? Math.round(avgCompletionTime) : null,
        created_at: survey.created_at,
        published_at: survey.published_at
      };
    });

    return metrics;

  } catch (error) {
    console.error('Error fetching survey metrics:', error);
    return [];
  }
}

/**
 * Fetch all responses for a specific survey
 */
export async function fetchSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  try {
    // Get survey responses with user info
    const { data: responses, error: responsesError } = await supabase
      .from('portal_survey_responses')
      .select(`
        id,
        survey_id,
        user_id,
        is_complete,
        status,
        started_at,
        completed_at,
        answered_questions,
        current_question_position
      `)
      .eq('survey_id', surveyId)
      .order('started_at', { ascending: false });

    if (responsesError) throw responsesError;
    if (!responses || responses.length === 0) return [];

    // Get user info
    const userIds = [...new Set(responses.map(r => r.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .in('id', userIds);

    if (usersError) console.error('Error fetching users:', usersError);

    // Get survey info for question count
    const { data: survey, error: surveyError } = await supabase
      .from('portal_surveys')
      .select('question_count')
      .eq('id', surveyId)
      .single();

    if (surveyError) console.error('Error fetching survey:', surveyError);

    // Get all answers for these responses
    const responseIds = responses.map(r => r.id);
    const { data: answers, error: answersError } = await supabase
      .from('portal_survey_answers')
      .select(`
        id,
        response_id,
        question_id,
        answer_value,
        answered_at,
        portal_survey_questions (
          question_text,
          question_type
        )
      `)
      .in('response_id', responseIds);

    if (answersError) console.error('Error fetching answers:', answersError);

    // Map responses with user and answer data
    const surveyResponses: SurveyResponse[] = responses.map(response => {
      const user = users?.find(u => u.id === response.user_id);
      const responseAnswers = answers?.filter(a => a.response_id === response.id) || [];

      const userName = user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.first_name || user?.last_name || 'Unknown';

      const completionTime = response.started_at && response.completed_at
        ? (new Date(response.completed_at).getTime() - new Date(response.started_at).getTime()) / (1000 * 60)
        : null;

      return {
        response_id: response.id,
        survey_id: response.survey_id,
        user_id: response.user_id,
        user_email: user?.email || 'Unknown',
        user_name: userName,
        is_complete: response.is_complete,
        status: response.status,
        started_at: response.started_at,
        completed_at: response.completed_at,
        completion_time_minutes: completionTime,
        answered_questions: response.answered_questions,
        total_questions: survey?.question_count || 0,
        answers: responseAnswers.map(answer => {
          const questionData = answer.portal_survey_questions as any;
          return {
            question_id: answer.question_id,
            question_text: questionData?.question_text || 'Unknown question',
            question_type: questionData?.question_type || 'text',
            answer_value: answer.answer_value,
            answered_at: answer.answered_at
          };
        })
      };
    });

    return surveyResponses;

  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return [];
  }
}

/**
 * Get completion status info
 */
export function getCompletionStatusInfo(completionRate: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (completionRate >= 80) {
    return { label: 'Excellent', color: 'text-green-700 bg-green-100', icon: '🎯' };
  } else if (completionRate >= 60) {
    return { label: 'Good', color: 'text-blue-700 bg-blue-100', icon: '✅' };
  } else if (completionRate >= 40) {
    return { label: 'Moderate', color: 'text-yellow-700 bg-yellow-100', icon: '📊' };
  } else if (completionRate > 0) {
    return { label: 'Low', color: 'text-orange-700 bg-orange-100', icon: '⚠️' };
  } else {
    return { label: 'No Responses', color: 'text-gray-700 bg-gray-100', icon: '📭' };
  }
}
