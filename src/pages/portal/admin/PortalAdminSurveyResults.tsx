import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Users,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Survey {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  published_at: string;
}

interface Question {
  id: string;
  question_type: string;
  question_text: string;
  options: string[] | null;
  required: boolean;
  position: number;
}

interface Response {
  id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  is_complete: boolean;
  user?: {
    email: string;
    profiles?: {
      first_name: string;
      last_name: string;
    }[];
  };
}

interface Answer {
  response_id: string;
  question_id: string;
  answer_value: any;
}

interface QuestionStats {
  question: Question;
  answers: Answer[];
  totalResponses: number;
  answeredCount: number;
  stats?: any;
}

export function PortalAdminSurveyResults() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchSurveyData();
    }
  }, [surveyId]);

  const fetchSurveyData = async () => {
    if (!surveyId) return;

    setLoading(true);
    try {
      const [surveyResult, questionsResult, responsesResult, answersResult] = await Promise.all([
        supabase
          .from('portal_surveys')
          .select('*')
          .eq('id', surveyId)
          .single(),
        supabase
          .from('portal_survey_questions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('position'),
        supabase
          .from('portal_survey_responses')
          .select(`
            *,
            user:user_id (
              email,
              profiles (
                first_name,
                last_name
              )
            )
          `)
          .eq('survey_id', surveyId)
          .order('completed_at', { ascending: false, nullsFirst: false }),
        supabase
          .from('portal_survey_answers')
          .select('*')
          .in('response_id', await supabase
            .from('portal_survey_responses')
            .select('id')
            .eq('survey_id', surveyId)
            .then(res => res.data?.map(r => r.id) || []))
      ]);

      if (surveyResult.error) throw surveyResult.error;
      if (questionsResult.error) throw questionsResult.error;
      if (responsesResult.error) throw responsesResult.error;
      if (answersResult.error) throw answersResult.error;

      setSurvey(surveyResult.data);
      setQuestions(questionsResult.data || []);
      setResponses(responsesResult.data || []);
      setAnswers(answersResult.data || []);
    } catch (error) {
      console.error('Error fetching survey data:', error);
      toast({
        title: "Error",
        description: "Failed to load survey results",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getQuestionStats = (question: Question): QuestionStats => {
    const questionAnswers = answers.filter(a => a.question_id === question.id);
    const totalResponses = responses.length;
    const answeredCount = questionAnswers.length;

    let stats: any = {};

    switch (question.question_type) {
      case 'yes_no':
        const yesCount = questionAnswers.filter(a => a.answer_value === true).length;
        const noCount = questionAnswers.filter(a => a.answer_value === false).length;
        stats = {
          yes: yesCount,
          no: noCount,
          yesPercentage: answeredCount > 0 ? Math.round((yesCount / answeredCount) * 100) : 0,
          noPercentage: answeredCount > 0 ? Math.round((noCount / answeredCount) * 100) : 0
        };
        break;

      case 'multiple_choice':
        const choiceCounts: Record<string, number> = {};
        question.options?.forEach(option => {
          choiceCounts[option] = questionAnswers.filter(a => a.answer_value === option).length;
        });
        stats = {
          choices: choiceCounts,
          percentages: Object.fromEntries(
            Object.entries(choiceCounts).map(([option, count]) => [
              option,
              answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0
            ])
          )
        };
        break;

      case 'select_all':
        const optionCounts: Record<string, number> = {};
        question.options?.forEach(option => {
          optionCounts[option] = questionAnswers.filter(a => 
            Array.isArray(a.answer_value) && a.answer_value.includes(option)
          ).length;
        });
        stats = {
          options: optionCounts,
          percentages: Object.fromEntries(
            Object.entries(optionCounts).map(([option, count]) => [
              option,
              answeredCount > 0 ? Math.round((count / answeredCount) * 100) : 0
            ])
          )
        };
        break;

      case 'open_text':
        stats = {
          responses: questionAnswers.map(a => ({
            text: a.answer_value,
            responseId: a.response_id
          }))
        };
        break;
    }

    return {
      question,
      answers: questionAnswers,
      totalResponses,
      answeredCount,
      stats
    };
  };

  const exportResults = () => {
    const csvData = [];
    
    const headers = ['Response ID', 'User Email', 'Name', 'Started At', 'Completed At', 'Status'];
    questions.forEach(q => {
      headers.push(`Q${q.position}: ${q.question_text}`);
    });
    csvData.push(headers);

    responses.forEach(response => {
      const row = [
        response.id,
        response.user?.email || '',
        response.user?.profiles?.[0] 
          ? `${response.user.profiles[0].first_name} ${response.user.profiles[0].last_name}`
          : '',
        format(new Date(response.started_at), 'yyyy-MM-dd HH:mm'),
        response.completed_at 
          ? format(new Date(response.completed_at), 'yyyy-MM-dd HH:mm')
          : '',
        response.is_complete ? 'Complete' : 'In Progress'
      ];

      questions.forEach(question => {
        const answer = answers.find(a => 
          a.response_id === response.id && a.question_id === question.id
        );
        if (answer) {
          if (Array.isArray(answer.answer_value)) {
            row.push(answer.answer_value.join(', '));
          } else if (typeof answer.answer_value === 'boolean') {
            row.push(answer.answer_value ? 'Yes' : 'No');
          } else {
            row.push(answer.answer_value?.toString() || '');
          }
        } else {
          row.push('');
        }
      });

      csvData.push(row);
    });

    const csv = csvData.map(row => 
      row.map(cell => `"${cell?.toString().replace(/"/g, '""') || ''}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-results-${surveyId}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Results exported successfully",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold">Survey not found</h2>
      </div>
    );
  }

  const completedResponses = responses.filter(r => r.is_complete).length;
  const completionRate = responses.length > 0 
    ? Math.round((completedResponses / responses.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/portal/admin/surveys')}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Surveys
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{survey.title}</h1>
            {survey.description && (
              <p className="text-gray-600 mt-1">{survey.description}</p>
            )}
          </div>
        </div>
        <Button onClick={exportResults} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{responses.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{completedResponses}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold">{responses.length - completedResponses}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{completionRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Question Results</h2>
        
        {questions.map((question, index) => {
          const stats = getQuestionStats(question);
          
          return (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Question {index + 1}: {question.question_text}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{question.question_type.replace('_', ' ')}</Badge>
                      {question.required && <Badge variant="secondary">Required</Badge>}
                      <span className="text-sm text-gray-600">
                        {stats.answeredCount} of {stats.totalResponses} responses
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {question.question_type === 'yes_no' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Yes</span>
                      <div className="flex items-center gap-2">
                        <Progress value={stats.stats.yesPercentage} className="w-32" />
                        <span className="text-sm font-medium w-12">{stats.stats.yesPercentage}%</span>
                        <span className="text-sm text-gray-600">({stats.stats.yes})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>No</span>
                      <div className="flex items-center gap-2">
                        <Progress value={stats.stats.noPercentage} className="w-32" />
                        <span className="text-sm font-medium w-12">{stats.stats.noPercentage}%</span>
                        <span className="text-sm text-gray-600">({stats.stats.no})</span>
                      </div>
                    </div>
                  </div>
                )}

                {question.question_type === 'multiple_choice' && (
                  <div className="space-y-3">
                    {Object.entries(stats.stats.choices).map(([option, count]) => (
                      <div key={option} className="flex items-center justify-between">
                        <span>{option}</span>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={stats.stats.percentages[option]} 
                            className="w-32" 
                          />
                          <span className="text-sm font-medium w-12">
                            {stats.stats.percentages[option]}%
                          </span>
                          <span className="text-sm text-gray-600">({count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {question.question_type === 'select_all' && (
                  <div className="space-y-3">
                    {Object.entries(stats.stats.options).map(([option, count]) => (
                      <div key={option} className="flex items-center justify-between">
                        <span>{option}</span>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={stats.stats.percentages[option]} 
                            className="w-32" 
                          />
                          <span className="text-sm font-medium w-12">
                            {stats.stats.percentages[option]}%
                          </span>
                          <span className="text-sm text-gray-600">({count})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {question.question_type === 'open_text' && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stats.stats.responses.length === 0 ? (
                      <p className="text-gray-500 italic">No responses yet</p>
                    ) : (
                      stats.stats.responses.map((response: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm">{response.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Individual Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">User</th>
                  <th className="text-left py-2 px-4">Started</th>
                  <th className="text-left py-2 px-4">Completed</th>
                  <th className="text-left py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {responses.map(response => (
                  <tr key={response.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">
                      <div>
                        <div className="font-medium">
                          {response.user?.profiles?.[0] 
                            ? `${response.user.profiles[0].first_name} ${response.user.profiles[0].last_name}`
                            : 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-600">{response.user?.email}</div>
                      </div>
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {format(new Date(response.started_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="py-2 px-4 text-sm">
                      {response.completed_at 
                        ? format(new Date(response.completed_at), 'MMM d, yyyy h:mm a')
                        : '-'}
                    </td>
                    <td className="py-2 px-4">
                      {response.is_complete ? (
                        <Badge className="bg-green-100 text-green-800">Complete</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}