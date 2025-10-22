import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { portalRoute } from '@/lib/portal/navigation';

interface SurveyWithStatus {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed';
  userStatus: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  started_at?: string;
  completed_at?: string;
  response_id?: string;
  is_complete?: boolean;
  answered_questions?: number;
  total_questions?: number;
  due_date?: string;
}

// Portal Surveys Component - Updated
export function PortalSurveys() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<SurveyWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSurveys();
    } else {
      // If no user yet, keep loading state
      setLoading(true);
    }
  }, [user]);

  const fetchSurveys = async () => {
    if (!user) return;

    try {
      // Try to get user's survey status using the RPC function
      const { data, error } = await supabase
        .rpc('get_user_survey_status', { p_user_id: user.id });

      if (error) {
        console.warn('RPC function failed, using fallback query:', error);

        // Fallback: Query surveys and responses directly
        const { data: surveys, error: surveyError } = await supabase
          .from('portal_surveys')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (surveyError) throw surveyError;

        // Get user's responses
        const { data: responses } = await supabase
          .from('portal_survey_responses')
          .select('*')
          .eq('user_id', user.id);

        // Get question counts and answered counts for each survey
        const surveysWithCounts = await Promise.all(
          (surveys || []).map(async (survey) => {
            // Get total question count
            const { count: questionCount } = await supabase
              .from('portal_survey_questions')
              .select('*', { count: 'exact', head: true })
              .eq('survey_id', survey.id);

            const userResponse = responses?.find(r => r.survey_id === survey.id);

            // Calculate answered questions if response exists
            let answeredQuestions = 0;
            if (userResponse) {
              // Try to use answered_questions column if it exists
              if ('answered_questions' in userResponse && userResponse.answered_questions !== undefined) {
                answeredQuestions = userResponse.answered_questions;
              } else {
                // Fallback: Count actual answers
                const { count: answerCount } = await supabase
                  .from('portal_survey_answers')
                  .select('*', { count: 'exact', head: true })
                  .eq('response_id', userResponse.id);
                answeredQuestions = answerCount || 0;
              }
            }

            return {
              id: survey.id,
              title: survey.title,
              description: survey.description || '',
              status: survey.status,
              userStatus: userResponse?.is_complete
                ? 'completed'
                : userResponse
                  ? 'in_progress'
                  : 'not_started',
              progressPercentage: (questionCount && answeredQuestions)
                ? Math.round((answeredQuestions / questionCount) * 100)
                : 0,
              started_at: userResponse?.started_at,
              completed_at: userResponse?.completed_at,
              response_id: userResponse?.id,
              is_complete: userResponse?.is_complete || false,
              answered_questions: answeredQuestions,
              total_questions: questionCount || 0,
              due_date: survey.due_date
            } as SurveyWithStatus;
          })
        );

        setSurveys(surveysWithCounts);
      } else {
        // RPC function succeeded
        const surveysWithStatus: SurveyWithStatus[] = data?.map((item: any) => ({
          id: item.survey_id,
          title: item.survey_title,
          description: item.survey_description || '',
          status: item.survey_status,
          userStatus: item.user_status,
          progressPercentage: item.progress_percentage || 0,
          started_at: item.started_at,
          completed_at: item.completed_at,
          response_id: item.response_id,
          is_complete: item.is_complete || false,
          answered_questions: item.answered_questions,
          total_questions: item.total_questions,
          due_date: item.due_date
        })) || [];

        setSurveys(surveysWithStatus);
      }
    } catch (error) {
      console.error('Error fetching surveys:', error);
      toast({
        title: "Error",
        description: "Failed to load surveys. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSurveyClick = (survey: SurveyWithStatus) => {
    // Allow users to view and edit completed surveys
    navigate(portalRoute(`/surveys/${survey.id}`));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <ClipboardList className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">{progress}% Complete</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Surveys</h1>
        <p className="text-gray-600 mt-2">
          Help us improve by sharing your feedback through our surveys
        </p>
      </div>

      {/* Separate surveys by status */}
      {surveys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Surveys Available</h3>
            <p className="text-gray-600 text-center max-w-md">
              There are no surveys available at this time. Check back later for new surveys.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active Surveys (not submitted and not closed) */}
          {surveys.filter(s => !s.is_complete && s.status !== 'closed').length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Active Surveys</h2>
              <div className="grid gap-4">
                {surveys.filter(s => !s.is_complete && s.status !== 'closed').map((survey) => {
                  const isFullyAnswered = survey.progressPercentage === 100;
                  
                  return (
                    <Card key={survey.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(survey.userStatus)}
                            <div className="flex-1">
                              <CardTitle className="text-xl">{survey.title}</CardTitle>
                              <CardDescription className="mt-2">
                                {survey.description}
                              </CardDescription>
                              {survey.due_date && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm text-gray-600">
                                    Due {new Date(survey.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(survey.userStatus, survey.progressPercentage)}
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        {/* Progress bar for in-progress surveys */}
                        {survey.userStatus === 'in_progress' && (
                          <div className="mb-4">
                            <Progress value={survey.progressPercentage} className="h-2" />
                            <p className="text-sm text-gray-600 mt-2">
                              {isFullyAnswered 
                                ? 'All questions answered - click to submit' 
                                : 'Resume where you left off'}
                            </p>
                          </div>
                        )}

                        {/* Action button */}
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            {survey.progressPercentage > 0 && survey.progressPercentage < 100 && (
                              <span>{survey.answered_questions || 0} of {survey.total_questions || 0} questions answered</span>
                            )}
                          </div>
                          
                          <Button
                            onClick={() => handleSurveyClick(survey)}
                            variant={isFullyAnswered ? 'default' : survey.userStatus === 'in_progress' ? 'default' : 'default'}
                            className={isFullyAnswered ? 'bg-green-600 hover:bg-green-700' : survey.userStatus === 'in_progress' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                          >
                            {(survey.userStatus === 'not_started' || survey.progressPercentage === 0) ? (
                              <>
                                Begin Survey
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            ) : (
                              <>
                                Continue Survey
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Closed Surveys (past due date) */}
          {surveys.filter(s => s.status === 'closed' && !s.is_complete).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Closed Surveys</h2>
              <div className="grid gap-4">
                {surveys.filter(s => s.status === 'closed' && !s.is_complete).map((survey) => (
                  <Card key={survey.id} className="hover:shadow-lg transition-shadow bg-gray-50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Lock className="h-5 w-5 text-gray-500" />
                          <div className="flex-1">
                            <CardTitle className="text-xl text-gray-600">{survey.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {survey.description}
                            </CardDescription>
                            {survey.due_date && (
                              <p className="text-sm text-red-600 mt-2">
                                Closed on {new Date(survey.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-gray-600">Closed</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="text-sm text-gray-500">
                        This survey is no longer accepting responses
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Completed Surveys (submitted only) */}
          {surveys.filter(s => s.is_complete).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Completed Surveys</h2>
              <div className="grid gap-4">
                {surveys.filter(s => s.is_complete).map((survey) => (
                  <Card key={survey.id} className="hover:shadow-lg transition-shadow bg-green-50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div className="flex-1">
                            <CardTitle className="text-xl">{survey.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {survey.description}
                            </CardDescription>
                            {survey.completed_at && (
                              <p className="text-sm text-gray-500 mt-2">
                                Submitted on {new Date(survey.completed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Submitted</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          View your submitted responses (read-only)
                        </span>
                        
                        <Button
                          onClick={() => handleSurveyClick(survey)}
                          variant="outline"
                        >
                          View Survey
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">About Surveys</h3>
            <p className="text-sm text-blue-800 mt-1">
              Your responses are saved automatically as you progress through each survey. 
              You can leave and return at any time to complete them. All responses help 
              us improve our services for you.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
