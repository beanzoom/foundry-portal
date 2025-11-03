import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Filter, X, FileText, Users, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  fetchAllSurveyMetrics,
  fetchSurveyResponses,
  getCompletionStatusInfo,
  type SurveyMetrics,
  type SurveyResponse
} from '@/services/survey-analytics.service';
import { UserAvatar } from '@/components/portal/admin/UserAvatar';
import { formatDistanceToNow, format } from 'date-fns';

export function SurveyAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [surveys, setSurveys] = useState<SurveyMetrics[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<SurveyMetrics[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('');
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [responseFilter, setResponseFilter] = useState<string>('all'); // For response list

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    const surveyIdParam = searchParams.get('survey_id');
    if (surveyIdParam && surveys.length > 0) {
      setSelectedSurveyId(surveyIdParam);
    }
  }, [searchParams, surveys]);

  useEffect(() => {
    if (selectedSurveyId) {
      loadSurveyResponses();
    }
  }, [selectedSurveyId]);

  useEffect(() => {
    applyFilters();
  }, [surveys, searchTerm, statusFilter]);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const data = await fetchAllSurveyMetrics();
      setSurveys(data);
    } catch (error) {
      console.error('Error loading surveys:', error);
      toast({
        title: "Error loading surveys",
        description: "Failed to load survey data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSurveyResponses = async () => {
    if (!selectedSurveyId) return;

    setLoadingResponses(true);
    try {
      const data = await fetchSurveyResponses(selectedSurveyId);
      setResponses(data);
    } catch (error) {
      console.error('Error loading responses:', error);
      toast({
        title: "Error loading responses",
        description: "Failed to load survey responses",
        variant: "destructive"
      });
    } finally {
      setLoadingResponses(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...surveys];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(survey =>
        survey.title.toLowerCase().includes(term) ||
        survey.description?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(survey => survey.status === statusFilter);
    }

    setFilteredSurveys(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const handleSurveySelect = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    setSearchParams({ survey_id: surveyId });
  };

  const handleBack = () => {
    setSelectedSurveyId('');
    setSearchParams({});
    setResponses([]);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all';
  const selectedSurvey = surveys.find(s => s.survey_id === selectedSurveyId);

  const filteredResponses = responses.filter(response => {
    if (responseFilter === 'completed') return response.is_complete;
    if (responseFilter === 'in_progress') return !response.is_complete;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Survey Analytics</h2>
        <p className="text-gray-600 mt-1">
          View survey responses and analyze completion rates
        </p>
      </div>

      {!selectedSurveyId ? (
        <>
          {/* Survey List View */}

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search surveys by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {hasActiveFilters && (
                  <div className="text-sm text-gray-600">
                    Showing {filteredSurveys.length} of {surveys.length} surveys
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Survey Cards */}
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Loading surveys...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSurveys.map(survey => {
                const statusInfo = getCompletionStatusInfo(survey.completion_rate);

                return (
                  <Card
                    key={survey.survey_id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleSurveySelect(survey.survey_id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{survey.title}</CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">
                              {survey.status}
                            </Badge>
                            <Badge className={statusInfo.color}>
                              {statusInfo.icon} {statusInfo.label}
                            </Badge>
                          </div>
                        </div>
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-gray-500">Total Responses</div>
                            <div className="text-2xl font-bold">{survey.total_responses}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Completion</div>
                            <div className="text-2xl font-bold">{survey.completion_rate}%</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Completed</div>
                            <div className="font-semibold text-green-600">{survey.completed_responses}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">In Progress</div>
                            <div className="font-semibold text-orange-600">{survey.in_progress_responses}</div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="pt-3 border-t space-y-1 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            {survey.question_count} questions
                          </div>
                          {survey.avg_completion_time_minutes && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              Avg: {survey.avg_completion_time_minutes} min
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Created {formatDistanceToNow(new Date(survey.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!loading && filteredSurveys.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {hasActiveFilters ? 'No surveys match your filters' : 'No surveys found'}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Survey Response View */}
          <div className="space-y-4">
            {/* Back Button */}
            <Button variant="outline" onClick={handleBack}>
              ← Back to Surveys
            </Button>

            {/* Survey Header */}
            {selectedSurvey && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedSurvey.title}</CardTitle>
                      {selectedSurvey.description && (
                        <p className="text-gray-600 mt-2">{selectedSurvey.description}</p>
                      )}
                    </div>
                    <Badge variant="outline">{selectedSurvey.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold">{selectedSurvey.total_responses}</div>
                      <div className="text-sm text-gray-600 mt-1">Total Responses</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{selectedSurvey.completed_responses}</div>
                      <div className="text-sm text-gray-600 mt-1">Completed</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-3xl font-bold text-orange-600">{selectedSurvey.in_progress_responses}</div>
                      <div className="text-sm text-gray-600 mt-1">In Progress</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{selectedSurvey.completion_rate}%</div>
                      <div className="text-sm text-gray-600 mt-1">Completion Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Response Filter */}
            <Card>
              <CardContent className="p-4">
                <Select value={responseFilter} onValueChange={setResponseFilter}>
                  <SelectTrigger className="w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Responses ({responses.length})</SelectItem>
                    <SelectItem value="completed">Completed ({responses.filter(r => r.is_complete).length})</SelectItem>
                    <SelectItem value="in_progress">In Progress ({responses.filter(r => !r.is_complete).length})</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Responses List */}
            {loadingResponses ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading responses...</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredResponses.map(response => (
                          <tr
                            key={response.response_id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedResponse(response)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <UserAvatar
                                  firstName={response.user_name.split(' ')[0]}
                                  lastName={response.user_name.split(' ')[1]}
                                  email={response.user_email}
                                  size="sm"
                                />
                                <div>
                                  <div className="font-medium text-sm">{response.user_name}</div>
                                  <div className="text-xs text-gray-500">{response.user_email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={response.is_complete ? "default" : "outline"}>
                                {response.is_complete ? (
                                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</>
                                ) : (
                                  <><AlertCircle className="h-3 w-3 mr-1" /> In Progress</>
                                )}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{
                                      width: `${(response.answered_questions / response.total_questions) * 100}%`
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600">
                                  {response.answered_questions}/{response.total_questions}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDistanceToNow(new Date(response.started_at), { addSuffix: true })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {response.completed_at
                                ? formatDistanceToNow(new Date(response.completed_at), { addSuffix: true })
                                : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {response.completion_time_minutes
                                ? `${Math.round(response.completion_time_minutes)} min`
                                : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedResponse(response);
                                }}
                              >
                                View Answers
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {!loadingResponses && filteredResponses.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No responses found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Response Detail Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedResponse?.user_name}'s Response
            </DialogTitle>
          </DialogHeader>

          {selectedResponse && (
            <div className="space-y-6">
              {/* Response Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>
                  <Badge className="ml-2" variant={selectedResponse.is_complete ? "default" : "outline"}>
                    {selectedResponse.is_complete ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Progress:</span>
                  <span className="ml-2 font-medium">
                    {selectedResponse.answered_questions}/{selectedResponse.total_questions} questions
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Started:</span>
                  <span className="ml-2">{format(new Date(selectedResponse.started_at), 'PPp')}</span>
                </div>
                {selectedResponse.completed_at && (
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <span className="ml-2">{format(new Date(selectedResponse.completed_at), 'PPp')}</span>
                  </div>
                )}
              </div>

              {/* Answers */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Answers</h3>
                {selectedResponse.answers.length > 0 ? (
                  selectedResponse.answers.map((answer, index) => (
                    <Card key={answer.question_id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="font-medium">
                            Q{index + 1}: {answer.question_text}
                          </div>
                          <div className="text-sm text-gray-600">
                            Type: {answer.question_type}
                          </div>
                          <div className="p-3 bg-gray-50 rounded">
                            <pre className="whitespace-pre-wrap text-sm">
                              {JSON.stringify(answer.answer_value, null, 2)}
                            </pre>
                          </div>
                          <div className="text-xs text-gray-500">
                            Answered {formatDistanceToNow(new Date(answer.answered_at), { addSuffix: true })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No answers recorded yet</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
