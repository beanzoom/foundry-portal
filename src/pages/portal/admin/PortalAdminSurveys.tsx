import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { triggerPublishNotification } from '@/services/portal-notifications.service';
import { createLogger } from '@/lib/logging';
import { PublishConfirmDialog } from '@/components/portal/admin/notifications/PublishConfirmDialog';

const logger = createLogger('PortalAdminSurveys');
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  BarChart, 
  Archive,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Eye,
  Trash2,
  Calendar,
  AlertCircle,
  RefreshCw,
  TestTube,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ForceDeleteSurveyDialog } from '@/components/portal/admin/ForceDeleteSurveyDialog';
import { ReopenSurveyDialog, ReopenOptions } from '@/components/portal/admin/ReopenSurveyDialog';
import { useAuth } from '@/hooks/useAuth';

interface Survey {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed';
  created_at: string;
  published_at: string | null;
  closed_at: string | null;
  due_date: string | null;
  response_count?: number;
  completion_rate?: number;
  question_count?: number;
  test_response_count?: number;
}

export function PortalAdminSurveys() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [forceDeleteSurvey, setForceDeleteSurvey] = useState<Survey | null>(null);
  const [reopenSurvey, setReopenSurvey] = useState<Survey | null>(null);
  const [testStats, setTestStats] = useState<any>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [surveyToPublish, setSurveyToPublish] = useState<{id: string; title: string} | null>(null);
  const [recipientListName, setRecipientListName] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      // Fetch all surveys
      const { data: surveysData, error: surveysError } = await supabase
        .from('portal_surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (surveysError) throw surveysError;

      // Fetch response statistics for each survey
      const surveysWithStats = await Promise.all(
        (surveysData || []).map(async (survey) => {
          // Get regular responses
          const { data: responses } = await supabase
            .from('portal_survey_responses')
            .select('is_complete, is_test_response')
            .eq('survey_id', survey.id);

          // Get question count
          const { data: questions } = await supabase
            .from('portal_survey_questions')
            .select('id')
            .eq('survey_id', survey.id);

          const regularResponses = responses?.filter(r => !r.is_test_response) || [];
          const testResponses = responses?.filter(r => r.is_test_response) || [];
          const completedResponses = regularResponses.filter(r => r.is_complete).length;
          
          return {
            ...survey,
            response_count: regularResponses.length,
            test_response_count: testResponses.length,
            question_count: questions?.length || 0,
            completion_rate: regularResponses.length > 0 
              ? Math.round((completedResponses / regularResponses.length) * 100)
              : 0
          };
        })
      );

      // Fetch test response stats
      const { data: stats } = await supabase
        .rpc('get_test_response_stats');
      setTestStats(stats);

      setSurveys(surveysWithStats);
    } catch (error) {
      logger.error('Error fetching surveys:', error);
      toast({
        title: "Error",
        description: "Failed to load surveys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPublishDialog = async (surveyId: string, surveyTitle: string) => {
    try {
      // Get the notification rule and template info for surveys
      const { data: notificationRule, error: ruleError } = await supabase
        .from('notification_rules')
        .select('recipient_list_id, template_id')
        .eq('event_id', 'survey_published')
        .eq('enabled', true)
        .single();

      if (!ruleError && notificationRule) {
        // Get recipient list name
        const { data: recipientList } = await supabase
          .from('recipient_lists')
          .select('name')
          .eq('id', notificationRule.recipient_list_id)
          .single();

        // Get template name
        const { data: template } = await supabase
          .from('email_templates')
          .select('name')
          .eq('id', notificationRule.template_id)
          .single();

        setRecipientListName(recipientList?.name || 'Unknown');
        setTemplateName(template?.name || 'Unknown');
      }

      setSurveyToPublish({ id: surveyId, title: surveyTitle });
      setPublishDialogOpen(true);

    } catch (error) {
      logger.error('Error opening publish dialog:', error);
      toast({
        title: "Error",
        description: "Failed to prepare publish dialog",
        variant: "destructive"
      });
    }
  };

  const handleForceDelete = async (surveyId: string, confirmTitle: string) => {
    try {
      const { data, error } = await supabase
        .rpc('delete_survey_force', { 
          p_survey_id: surveyId,
          p_confirm_title: confirmTitle,
          p_admin_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Survey Deleted",
        description: `Deleted survey "${confirmTitle}" with ${data.deleted_responses} responses`,
      });

      setForceDeleteSurvey(null);
      fetchSurveys();
    } catch (error: any) {
      logger.error('Error force deleting survey:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete survey",
        variant: "destructive",
      });
    }
  };

  const handleReopen = async (options: ReopenOptions) => {
    if (!reopenSurvey) return;

    try {
      const { data, error } = await supabase
        .rpc('reopen_survey', {
          p_survey_id: reopenSurvey.id,
          p_new_due_date: options.newDueDate ? new Date(options.newDueDate).toISOString() : null,
          p_clear_responses: options.clearResponses,
          p_admin_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Survey Reopened",
        description: options.clearResponses 
          ? `Reopened "${reopenSurvey.title}" and cleared ${data.responses_cleared} responses`
          : `Reopened "${reopenSurvey.title}"`,
      });

      setReopenSurvey(null);
      fetchSurveys();
    } catch (error: any) {
      logger.error('Error reopening survey:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reopen survey",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (surveyId: string) => {
    // Generate preview token
    const token = btoa(JSON.stringify({
      surveyId,
      adminId: user?.id,
      expires: Date.now() + 3600000 // 1 hour
    }));
    
    const previewUrl = `/portal/surveys/${surveyId}?preview=true&token=${token}`;
    window.open(previewUrl, '_blank');
  };

  const handleClearTestData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all test response data?\n\nThis will delete all responses marked as test data.'
    );
    
    if (!confirmed) return;

    try {
      const { data, error } = await supabase
        .rpc('clear_test_responses', {
          p_admin_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Test Data Cleared",
        description: `Deleted ${data.deleted_responses} test responses`,
      });

      fetchSurveys();
    } catch (error) {
      logger.error('Error clearing test data:', error);
      toast({
        title: "Error",
        description: "Failed to clear test data",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (surveyId: string, newStatus: 'published' | 'closed') => {
    try {
      // Find the current survey to check its status
      const currentSurvey = surveys.find(s => s.id === surveyId);
      if (!currentSurvey) {
        throw new Error('Survey not found');
      }

      // Validate status transitions
      if (newStatus === 'published' && currentSurvey.status === 'published') {
        toast({
          title: "Already Published",
          description: "This survey is already published",
        });
        return;
      }
      if (newStatus === 'published' && currentSurvey.status !== 'draft') {
        throw new Error('Only draft surveys can be published');
      }
      if (newStatus === 'closed' && currentSurvey.status !== 'published') {
        throw new Error('Only published surveys can be closed');
      }

      // If publishing, get recipient information for confirmation
      if (newStatus === 'published') {
        // Get the notification rule for survey_published to find the recipient list
        const { data: notificationRule, error: ruleError } = await supabase
          .from('notification_rules')
          .select('recipient_list_id')
          .eq('event_id', 'survey_published')
          .eq('enabled', true)
          .single();

        let recipientDescription = 'portal users';
        let recipientCount = 0;

        if (!ruleError && notificationRule?.recipient_list_id) {
          // Get the recipient list details
          const { data: recipientList, error: listError } = await supabase
            .from('recipient_lists')
            .select('name, type, config')
            .eq('id', notificationRule.recipient_list_id)
            .single();

          if (!listError && recipientList) {
            recipientDescription = recipientList.name;

            // Try to get actual count based on list type
            if (recipientList.type === 'static' && recipientList.config?.emails) {
              recipientCount = recipientList.config.emails.length;
            } else if (recipientList.type === 'role_based') {
              // For role-based lists, get count of users with those roles
              const roles = recipientList.config?.roles || [];

              // Build role filter - match any role in the recipient list config
              const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .in('role', roles)
                .eq('email_surveys', true);
              recipientCount = count || 0;
            } else if (recipientList.type === 'dynamic') {
              // Dynamic recipients determined at runtime
              recipientDescription = `${recipientList.name} (determined at send time)`;
            }
          }
        }

        // Show confirmation dialog
        const confirmMessage = recipientCount > 0
          ? `This will publish the survey "${currentSurvey.title}" and send email notifications to ${recipientCount} ${recipientDescription}.\n\nContinue?`
          : `This will publish the survey "${currentSurvey.title}" and send email notifications to ${recipientDescription}.\n\nContinue?`;
        const confirmed = window.confirm(confirmMessage);

        if (!confirmed) return;
      }

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'published') {
        updateData.published_at = new Date().toISOString();
      } else if (newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      // Update the survey status
      const { data, error } = await supabase
        .from('portal_surveys')
        .update(updateData)
        .eq('id', surveyId)
        .select()
        .single();

      if (error) {
        logger.error('Database error updating survey status:', error);
        throw error;
      }

      // If publishing, trigger email notifications (exactly like Updates)
      if (newStatus === 'published') {
        logger.debug('Survey published, triggering email notifications...');

        // Trigger email notifications (database trigger handles batch creation)
        const result = await triggerPublishNotification('survey', surveyId, {
          metadata: {
            survey_title: currentSurvey.title,
            survey_description: currentSurvey.description
          }
        });

        // Show success message based on result
        if (result.success && result.recipientCount && result.recipientCount > 0) {
          toast({
            title: "Success",
            description: `Survey published and notifications sent to ${result.recipientCount} users.`
          });
        } else if (result.success) {
          toast({
            title: "Survey Published",
            description: "Survey published successfully (no email recipients configured)."
          });
        } else {
          toast({
            title: "Warning",
            description: "Survey published but email notifications may not have been sent.",
            variant: "default"
          });
        }
      } else {
        toast({
          title: "Success",
          description: `Survey ${newStatus} successfully`,
        });
      }

      fetchSurveys();
    } catch (error) {
      logger.error('Error updating survey status:', error);
      toast({
        title: "Error",
        description: `Failed to update survey status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleUnpublish = async (surveyId: string) => {
    try {
      const { error } = await supabase
        .from('portal_surveys')
        .update({
          status: 'draft',
          published_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', surveyId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Survey unpublished successfully. You can now republish it to trigger email notifications.",
      });

      fetchSurveys();
    } catch (error) {
      logger.error('Error unpublishing survey:', error);
      toast({
        title: "Error",
        description: "Failed to unpublish survey",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'published':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'closed':
        return <Archive className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Survey Management</h1>
          <p className="text-gray-600 mt-2">Create and manage surveys for portal members</p>
        </div>
        <Button
          onClick={() => navigate('/portal/admin/surveys/new')}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Survey
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Surveys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surveys.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {surveys.filter(s => s.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {surveys.filter(s => s.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {surveys.reduce((sum, s) => sum + (s.response_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Surveys Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Surveys</CardTitle>
        </CardHeader>
        <CardContent>
          {surveys.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Surveys Yet</h3>
              <p className="text-gray-600 mb-4">Create your first survey to get started</p>
              <Button
                onClick={() => navigate('/portal/admin/surveys/new')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Responses</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(survey.status)}
                        {getStatusBadge(survey.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{survey.title}</div>
                        {survey.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {survey.description.substring(0, 50)}
                            {survey.description.length > 50 && '...'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(survey.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {survey.due_date ? (
                        <div className="flex items-center gap-1">
                          {new Date(survey.due_date) < new Date() && survey.status === 'published' ? (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <Calendar className="h-4 w-4 text-gray-500" />
                          )}
                          <span className={new Date(survey.due_date) < new Date() && survey.status === 'published' ? 'text-red-600 font-medium' : ''}>
                            {format(new Date(survey.due_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        {survey.response_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {survey.response_count ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${survey.completion_rate}%` }}
                            />
                          </div>
                          <span className="text-sm">{survey.completion_rate}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* View/Preview - Always available */}
                          <DropdownMenuItem onClick={() => navigate(`/portal/surveys/${survey.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePreview(survey.id)}>
                            <TestTube className="h-4 w-4 mr-2" />
                            Preview (Test Mode)
                          </DropdownMenuItem>

                          {/* Draft actions */}
                          {survey.status === 'draft' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/portal/admin/surveys/${survey.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenPublishDialog(survey.id, survey.title)}
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setForceDeleteSurvey(survey)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Published actions */}
                          {survey.status === 'published' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/portal/admin/surveys/${survey.id}/results`)}>
                                <BarChart className="h-4 w-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleUnpublish(survey.id)}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Unpublish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(survey.id, 'closed')}>
                                <Archive className="h-4 w-4 mr-2" />
                                Close Survey
                              </DropdownMenuItem>
                            </>
                          )}

                          {/* Closed actions */}
                          {survey.status === 'closed' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/portal/admin/surveys/${survey.id}/results`)}>
                                <BarChart className="h-4 w-4 mr-2" />
                                View Analytics
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setReopenSurvey(survey)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reopen Survey
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setForceDeleteSurvey(survey)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Test Data Management */}
      {testStats && (testStats.total_test_responses > 0 || testStats.test_surveys > 0) && (
        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <TestTube className="h-5 w-5" />
                Test Data Management
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearTestData}
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Test Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Test Responses</p>
                <p className="text-2xl font-bold text-orange-600">
                  {testStats?.total_test_responses || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Surveys with Test Data</p>
                <p className="text-2xl font-bold text-orange-600">
                  {testStats?.test_surveys || 0}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Last Test Response</p>
                <p className="text-sm text-gray-700">
                  {testStats?.newest_test_response 
                    ? format(new Date(testStats.newest_test_response), 'MMM d, h:mm a')
                    : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <ForceDeleteSurveyDialog
        survey={forceDeleteSurvey}
        open={!!forceDeleteSurvey}
        onConfirm={handleForceDelete}
        onCancel={() => setForceDeleteSurvey(null)}
      />

      <ReopenSurveyDialog
        survey={reopenSurvey}
        open={!!reopenSurvey}
        onConfirm={handleReopen}
        onCancel={() => setReopenSurvey(null)}
      />

      {/* Publish Confirm Dialog */}
      {surveyToPublish && (
        <PublishConfirmDialog
          open={publishDialogOpen}
          onOpenChange={(open) => {
            setPublishDialogOpen(open);
            if (!open) {
              setSurveyToPublish(null);
              fetchSurveys(); // Refresh list after publish
            }
          }}
          contentType="survey"
          contentId={surveyToPublish.id}
          contentTitle={surveyToPublish.title}
          templateName={templateName}
          recipientListName={recipientListName}
          onConfirm={async () => {
            const { error } = await supabase
              .from('portal_surveys')
              .update({
                status: 'published',
                is_active: true,
                published_at: new Date().toISOString()
              })
              .eq('id', surveyToPublish.id);

            if (error) {
              logger.error('Error publishing survey:', error);
              throw error;
            }
            logger.info('Survey published successfully');
          }}
          onCancel={() => {
            setSurveyToPublish(null);
            setPublishDialogOpen(false);
            setRecipientListName('');
            setTemplateName('');
          }}
        />
      )}
    </div>
  );
}