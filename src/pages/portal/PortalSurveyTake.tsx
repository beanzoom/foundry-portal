import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Save,
  AlertCircle,
  X,
  ArrowRight,
  TestTube,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { YesNoQuestion } from '@/components/portal/surveys/YesNoQuestion';
import { MultipleChoiceQuestion } from '@/components/portal/surveys/MultipleChoiceQuestion';
import { SelectAllQuestion } from '@/components/portal/surveys/SelectAllQuestion';
import { OpenTextQuestion } from '@/components/portal/surveys/OpenTextQuestion';
import { SectionDivider } from '@/components/portal/surveys/SectionDivider';
import debounce from 'lodash/debounce';
import { portalRoute } from '@/lib/portal/navigation';

interface SurveySection {
  id: string;
  survey_id: string;
  title: string;
  description: string | null;
  display_order: number;
  show_condition?: Record<string, any>;
  is_required?: boolean;
  can_skip?: boolean;
  created_at: string;
  updated_at: string;
}

interface SurveyQuestion {
  id: string;
  question_type: 'yes_no' | 'multiple_choice' | 'select_all' | 'open_text';
  question_text: string;
  options: string[] | null;
  required: boolean;
  position: number;
  section_id?: string | null;
  section_order?: number;
}

interface Survey {
  id: string;
  title: string;
  description: string;
}

interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  current_question_position: number;
  is_complete: boolean;
}

export function PortalSurveyTake() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check for preview mode
  const searchParams = new URLSearchParams(window.location.search);
  const isPreviewMode = searchParams.get('preview') === 'true';
  const previewToken = searchParams.get('token');
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [sections, setSections] = useState<SurveySection[]>([]);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [response, setResponse] = useState<SurveyResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [validPreview, setValidPreview] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Get the current question's section (always, not just first in section)
  const getCurrentQuestionSection = (): SurveySection | null => {
    if (!currentQuestion || !currentQuestion.section_id || sections.length === 0) {
      return null;
    }
    return sections.find(s => s.id === currentQuestion.section_id) || null;
  };

  // Determine if we should show a section divider for the current question
  const isFirstQuestionInSection = (): boolean => {
    if (!currentQuestion || !currentQuestion.section_id || sections.length === 0) {
      return false;
    }

    // Check if this is the first question in this section
    const previousQuestion = currentQuestionIndex > 0 ? questions[currentQuestionIndex - 1] : null;
    return !previousQuestion || previousQuestion.section_id !== currentQuestion.section_id;
  };

  // Validate preview token
  const validatePreviewMode = useCallback(() => {
    if (!isPreviewMode || !previewToken) return false;
    
    try {
      const decoded = JSON.parse(atob(previewToken));
      return decoded.expires > Date.now() && decoded.surveyId === surveyId;
    } catch {
      return false;
    }
  }, [isPreviewMode, previewToken, surveyId]);

  // Load survey data and existing response
  useEffect(() => {
    if (surveyId) {
      if (user) {
        const isValid = validatePreviewMode();
        setValidPreview(isValid);
        loadSurvey();
      } else {
        // Set loading to false to show the "not authenticated" message
        setLoading(false);
      }
    }
  }, [user, surveyId, validatePreviewMode]);

  const loadSurvey = async () => {
    if (!user || !surveyId) return;

    setLoading(true);
    setLoadError(null);

    try {
      // Check if user is admin for preview mode
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'super_admin']);

      const isAdmin = userRoles && userRoles.length > 0;

      // Load survey details - admins can see drafts, others only published
      let surveyQuery = supabase
        .from('portal_surveys')
        .select('*')
        .eq('id', surveyId);
      
      // Only filter by published status for non-admins
      if (!isAdmin) {
        surveyQuery = surveyQuery.eq('status', 'published');
      }
      
      const { data: surveyData, error: surveyError } = await surveyQuery.single();

      if (surveyError) throw surveyError;
      setSurvey(surveyData);

      // Load sections (if any exist)
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('portal_survey_sections')
        .select('*')
        .eq('survey_id', surveyId)
        .order('display_order');

      if (sectionsError && sectionsError.code !== 'PGRST116') {
        // Ignore "not found" errors (table might not exist yet)
        console.warn('Error loading sections:', sectionsError);
      }
      setSections(sectionsData || []);

      // Load questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('portal_survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('position');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      // Skip response creation in preview mode
      if (!validPreview) {
        // Create or get existing response
        // First, try to get existing response
        const { data: existingResponse } = await supabase
          .from('portal_survey_responses')
          .select('*')
          .eq('survey_id', surveyId)
          .eq('user_id', user.id)
          .maybeSingle();

        let responseData;
        if (existingResponse) {
          // Update existing response
          const { data, error } = await supabase
            .from('portal_survey_responses')
            .update({
              started_at: existingResponse.started_at || new Date().toISOString(),
              last_saved_at: new Date().toISOString()
            })
            .eq('id', existingResponse.id)
            .select()
            .single();

          if (error) throw error;
          responseData = data;
        } else {
          // Create new response
          const { data, error } = await supabase
            .from('portal_survey_responses')
            .insert({
              survey_id: surveyId,
              user_id: user.id,
              is_test_response: false,
              started_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) throw error;
          responseData = data;
        }

        const responseError = !responseData ? new Error('Failed to create response') : null;
        if (responseError) throw responseError;

        setResponse(responseData);

        // If survey is completed, show view-only notification
        if (responseData.is_complete) {
          toast({
            title: "View-Only Mode",
            description: "This survey has been submitted and cannot be modified. You are viewing your submitted responses.",
          });
        }

        // Load existing answers
        const { data: answersData, error: answersError } = await supabase
          .from('portal_survey_answers')
          .select('*')
          .eq('response_id', responseData.id);

        if (answersError) throw answersError;

        // Convert answers to a map
        const answersMap: Record<string, any> = {};
        answersData?.forEach(answer => {
          answersMap[answer.question_id] = answer.answer_value;
        });
        setAnswers(answersMap);

        // Resume from last position
        const resumePosition = responseData.current_question_position - 1;
        if (resumePosition > 0 && resumePosition < questionsData.length) {
          setCurrentQuestionIndex(resumePosition);
        }
      } else {
        // Preview mode - create mock response
        setResponse({
          id: 'preview-' + Date.now(),
          survey_id: surveyId,
          user_id: user.id,
          current_question_position: 1,
          is_complete: false
        } as SurveyResponse);
      }

    } catch (error) {
      console.error('Error loading survey:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save answer with debounce for text input
  const saveAnswer = useCallback(async (questionId: string, value: any) => {
    if (!response) return;

    // Skip saving in preview mode
    if (validPreview) {
      // Preview mode - skip saving
      setSaving(true);
      setTimeout(() => setSaving(false), 300); // Simulate save delay
      return;
    }

    setSaving(true);
    try {
      // Save answer
      await supabase
        .from('portal_survey_answers')
        .upsert({
          response_id: response.id,
          question_id: questionId,
          answer_value: value,
          answered_at: new Date().toISOString()
        }, {
          onConflict: 'response_id,question_id'
        });

      // Update current position
      await supabase
        .from('portal_survey_responses')
        .update({
          current_question_position: currentQuestionIndex + 1,
          last_saved_at: new Date().toISOString()
        })
        .eq('id', response.id);

    } catch (error) {
      console.error('Error saving answer:', error);
      toast({
        title: "Save Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [response, currentQuestionIndex, validPreview]);

  // Debounced save for text input
  const debouncedSaveAnswer = useCallback(
    debounce((questionId: string, value: any) => {
      saveAnswer(questionId, value);
    }, 1000),
    [saveAnswer]
  );

  const handleAnswerChange = (value: any) => {
    if (!currentQuestion) return;
    
    // Don't allow changes if survey is submitted
    if (response?.is_complete) {
      return;
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));

    // Immediate save for selections, debounced for text
    if (currentQuestion.question_type === 'open_text') {
      debouncedSaveAnswer(currentQuestion.id, value);
    } else {
      saveAnswer(currentQuestion.id, value);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    // Skip validation in preview mode or for completed surveys
    if (!validPreview && !response?.is_complete) {
      // Check if current question is required and answered
      if (currentQuestion?.required && !answers[currentQuestion.id]) {
        toast({
          title: "Required Question",
          description: "Please answer this question before continuing.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleExit = async () => {
    // Save current progress before exiting
    if (currentQuestion && answers[currentQuestion.id] !== undefined && !saving) {
      await saveAnswer(currentQuestion.id, answers[currentQuestion.id]);
    }
    
    // Navigate back to surveys page
    navigate(portalRoute('/surveys'));
  };

  const handleComplete = async () => {
    if (!response) return;

    // Don't allow editing submitted surveys
    if (response.is_complete) {
      toast({
        title: "Survey Already Submitted",
        description: "This survey has been submitted and cannot be modified.",
        variant: "destructive",
      });
      return;
    }

    // Check all required questions are answered
    const unansweredRequired = questions.filter(
      q => q.required && !answers[q.id]
    );

    if (unansweredRequired.length > 0) {
      toast({
        title: "Incomplete Survey",
        description: `Please answer all required questions (${unansweredRequired.length} remaining).`,
        variant: "destructive",
      });
      // Jump to first unanswered required question
      const firstUnansweredIndex = questions.findIndex(
        q => q.required && !answers[q.id]
      );
      if (firstUnansweredIndex !== -1) {
        setCurrentQuestionIndex(firstUnansweredIndex);
      }
      return;
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Once submitted, this survey cannot be edited. Are you sure you want to submit your responses?"
    );
    
    if (!confirmed) return;

    setCompleting(true);
    try {
      // Mark survey as complete
      await supabase
        .from('portal_survey_responses')
        .update({
          is_complete: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', response.id);

      toast({
        title: "Survey Submitted!",
        description: "Thank you for your feedback. This survey is now locked and cannot be edited.",
      });

      navigate(portalRoute('/surveys'));
    } catch (error) {
      console.error('Error completing survey:', error);
      toast({
        title: "Error",
        description: "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const value = answers[currentQuestion.id];

    switch (currentQuestion.question_type) {
      case 'yes_no':
        return (
          <YesNoQuestion
            question={currentQuestion}
            value={value || null}
            onChange={handleAnswerChange}
            disabled={saving || response?.is_complete}
          />
        );
      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={{
              ...currentQuestion,
              options: currentQuestion.options || []
            }}
            value={value || null}
            onChange={handleAnswerChange}
            disabled={saving || response?.is_complete}
          />
        );
      case 'select_all':
        return (
          <SelectAllQuestion
            question={{
              ...currentQuestion,
              options: currentQuestion.options || []
            }}
            value={value || []}
            onChange={handleAnswerChange}
            disabled={saving || response?.is_complete}
          />
        );
      case 'open_text':
        return (
          <OpenTextQuestion
            question={currentQuestion}
            value={value || ''}
            onChange={handleAnswerChange}
            disabled={saving}
          />
        );
      default:
        return null;
    }
  };

  // Show error state if loading failed
  if (loadError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Survey</h2>
        <p className="text-gray-600 mb-4">{loadError}</p>
        <div className="space-x-4">
          <Button onClick={() => { setLoadError(null); setLoading(true); loadSurvey(); }}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate(portalRoute('/surveys'))}>
            Back to Surveys
          </Button>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600 mb-4">Please log in to take this survey.</p>
        <div className="space-x-4">
          <Button onClick={() => navigate(portalRoute('/auth'))}>
            Log In
          </Button>
          <Button variant="outline" onClick={() => navigate(portalRoute('/surveys'))}>
            Back to Surveys
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state with skeleton while data is being fetched
  // Only show "not found" when loading is complete AND we confirmed no survey exists
  if (loading || (!survey && !loadError)) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Progress skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-2 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>

        {/* Question skeleton */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-5/6"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation skeleton */}
        <div className="flex justify-between items-center">
          <div className="h-10 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    );
  }

  // Only show "not found" after loading is complete AND no error occurred AND survey is definitely null
  if (!survey || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Survey Not Found</h2>
        <p className="text-gray-600 mb-4">This survey is not available.</p>
        <Button onClick={() => navigate(portalRoute('/surveys'))}>
          Back to Surveys
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Preview Mode Banner - Test Only */}
      {validPreview && (
        <Alert className="bg-orange-50 border-orange-500 sticky top-0 z-50">
          <TestTube className="h-4 w-4 text-orange-600" />
          <div>
            <div className="font-semibold">PREVIEW MODE - TEST ONLY</div>
            <AlertDescription>
              Your responses will NOT be saved. This is for testing the survey flow and questions.
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Draft Preview Banner for Admins */}
      {survey.status === 'draft' && !validPreview && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Admin Preview Mode</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            This survey is currently a draft and is not visible to users.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{survey.title}</h1>
            {survey.description && (
              <div className="mt-3">
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {descriptionExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Description
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show Description
                    </>
                  )}
                </button>
                {descriptionExpanded && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{survey.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExit}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Exit Survey
          </Button>
        </div>
        {response?.is_complete && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This survey has been submitted and is now read-only. You can review your responses but cannot make changes.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Current Section Indicator (Persistent) */}
      {getCurrentQuestionSection() && (
        <div className="bg-purple-50 border-l-4 border-purple-500 px-4 py-3 rounded">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-900">
                {getCurrentQuestionSection()!.title}
              </p>
              {getCurrentQuestionSection()!.description && (
                <p className="text-xs text-purple-700 mt-1">
                  {getCurrentQuestionSection()!.description}
                </p>
              )}
            </div>
            <Badge variant="outline" className="bg-white text-purple-700 border-purple-300">
              Section {sections.findIndex(s => s.id === getCurrentQuestionSection()!.id) + 1} of {sections.length}
            </Badge>
          </div>
        </div>
      )}

      {/* Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            {saving && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Save className="h-3 w-3" />
                Saving...
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardContent className="pt-6">
          {isFirstQuestionInSection() && getCurrentQuestionSection() && (
            <div className="mb-6 pb-4 border-b-2 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {getCurrentQuestionSection()!.title}
                </h2>
                <Badge className="bg-purple-600">New Section</Badge>
              </div>
              {getCurrentQuestionSection()!.description && (
                <p className="text-gray-600">{getCurrentQuestionSection()!.description}</p>
              )}
            </div>
          )}
          {renderQuestion()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <span className="text-sm text-gray-500">
          {Object.keys(answers).length} of {questions.length} answered
        </span>

        {currentQuestionIndex === questions.length - 1 ? (
          validPreview ? (
            <Button 
              disabled 
              variant="outline"
              className="opacity-50"
            >
              Cannot Submit in Preview Mode
            </Button>
          ) : !response?.is_complete ? (
            <Button
              onClick={handleComplete}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700"
            >
              {completing ? 'Submitting...' : (
                <>
                  Submit Survey
                  <CheckCircle className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={() => navigate(portalRoute('/surveys'))} variant="outline">
              Return to Surveys
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Info */}
      {!validPreview ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your answers are saved automatically. Use the "Exit Survey" button to save progress and return later, or click outside the survey area.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-orange-200 bg-orange-50">
          <TestTube className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            This is a test preview. Navigate through questions to test the survey flow. No responses will be saved.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}