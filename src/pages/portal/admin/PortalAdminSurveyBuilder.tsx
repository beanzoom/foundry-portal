import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { triggerPublishNotification } from '@/services/portal-notifications.service';
import { createLogger } from '@/lib/logging';
import { PublishConfirmDialog } from '@/components/portal/admin/notifications/PublishConfirmDialog';

const logger = createLogger('PortalAdminSurveyBuilder');
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Plus, 
  Trash2, 
  Save, 
  MoveUp, 
  MoveDown,
  ArrowLeft,
  FileText,
  CheckCircle,
  List,
  Hash,
  Type,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Calendar,
  Rocket
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface SurveySection {
  id?: string;
  survey_id?: string;
  title: string;
  description?: string;
  display_order: number;
}

interface Question {
  id?: string;
  question_type: 'yes_no' | 'multiple_choice' | 'select_all' | 'open_text';
  question_text: string;
  options?: string[];
  required: boolean;
  position: number;
  section_id?: string | null;
  section_order?: number;
}

interface Survey {
  id?: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed';
  due_date?: string;
  sections: SurveySection[];
  questions: Question[];
}

export function PortalAdminSurveyBuilder() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey>({
    title: '',
    description: '',
    status: 'draft',
    due_date: undefined,
    sections: [],
    questions: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [surveyToPublish, setSurveyToPublish] = useState<{id: string; title: string} | null>(null);
  const [recipientListName, setRecipientListName] = useState<string>('');
  const [templateName, setTemplateName] = useState<string>('');

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

  const fetchSurvey = async () => {
    if (!surveyId) return;
    
    setLoading(true);
    try {
      const { data: surveyData, error: surveyError } = await supabase
        .from('portal_surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;

      // Load sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('portal_survey_sections')
        .select('*')
        .eq('survey_id', surveyId)
        .order('display_order');

      if (sectionsError && sectionsError.code !== 'PGRST116') {
        console.warn('Error loading sections:', sectionsError);
      }

      const { data: questionsData, error: questionsError } = await supabase
        .from('portal_survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('position');

      if (questionsError) throw questionsError;

      const questions: Question[] = questionsData
        .sort((a, b) => a.position - b.position) // Sort by position
        .map((q, index) => ({
          id: q.id,
          question_type: q.question_type,
          question_text: q.question_text,
          options: q.options || [],
          required: q.required,
          position: index + 1, // Renumber positions sequentially
          section_id: q.section_id || null,
          section_order: q.section_order || 0
        }));

      const sections: SurveySection[] = (sectionsData || []).map(s => ({
        id: s.id,
        survey_id: s.survey_id,
        title: s.title,
        description: s.description || '',
        display_order: s.display_order
      }));

      setSurvey({
        id: surveyData.id,
        title: surveyData.title,
        description: surveyData.description || '',
        status: surveyData.status,
        due_date: surveyData.due_date,
        sections,
        questions
      });
    } catch (error) {
      logger.error('Error fetching survey:', error);
      toast({
        title: "Error",
        description: "Failed to load survey",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestionIndex = survey.questions.length;
    const newQuestion: Question = {
      question_type: 'yes_no',
      question_text: '',
      required: true,
      position: newQuestionIndex + 1
    };
    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    // Auto-expand the new question
    setExpandedQuestions(prev => new Set([...prev, newQuestionIndex]));
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, ...updates } : q
      )
    }));
  };

  const deleteQuestion = (index: number) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index).map((q, i) => ({
        ...q,
        position: i + 1
      }))
    }));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= survey.questions.length) return;

    setSurvey(prev => {
      const questions = [...prev.questions];
      [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
      return {
        ...prev,
        questions: questions.map((q, i) => ({ ...q, position: i + 1 }))
      };
    });
  };

  const addOption = (questionIndex: number) => {
    const question = survey.questions[questionIndex];
    const newOptions = [...(question.options || []), ''];
    updateQuestion(questionIndex, { options: newOptions });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = survey.questions[questionIndex];
    const newOptions = [...(question.options || [])];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, { options: newOptions });
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = survey.questions[questionIndex];
    const newOptions = (question.options || []).filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, { options: newOptions });
  };

  // Section Management Functions
  const addSection = () => {
    const newSection: SurveySection = {
      title: '',
      description: '',
      display_order: survey.sections.length
    };
    setSurvey(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (index: number, updates: Partial<SurveySection>) => {
    setSurvey(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) =>
        i === index ? { ...s, ...updates } : s
      )
    }));
  };

  const deleteSection = (index: number) => {
    const sectionToDelete = survey.sections[index];

    // Remove section
    const newSections = survey.sections.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      display_order: i
    }));

    // Clear section_id from questions that were in this section
    const newQuestions = survey.questions.map(q =>
      q.section_id === sectionToDelete.id ? { ...q, section_id: null, section_order: 0 } : q
    );

    setSurvey(prev => ({
      ...prev,
      sections: newSections,
      questions: newQuestions
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= survey.sections.length) return;

    setSurvey(prev => {
      const sections = [...prev.sections];
      [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
      return {
        ...prev,
        sections: sections.map((s, i) => ({ ...s, display_order: i }))
      };
    });
  };

  const assignQuestionToSection = (questionIndex: number, sectionId: string | null) => {
    updateQuestion(questionIndex, {
      section_id: sectionId,
      section_order: sectionId ? survey.questions.filter(q => q.section_id === sectionId).length : 0
    });
  };

  // Publish handlers
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

  const handleConfirmPublish = async () => {
    if (!surveyToPublish) return;

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
  };

  const handleCancelPublish = () => {
    setSurveyToPublish(null);
    setPublishDialogOpen(false);
    setRecipientListName('');
    setTemplateName('');
  };

  const saveSurvey = async () => {
    if (!survey.title) {
      toast({
        title: "Error",
        description: "Survey title is required",
        variant: "destructive",
      });
      return;
    }

    if (survey.questions.length === 0) {
      toast({
        title: "Error",
        description: "Add at least one question",
        variant: "destructive",
      });
      return;
    }

    const invalidQuestions = survey.questions.some(q => !q.question_text);
    if (invalidQuestions) {
      toast({
        title: "Error",
        description: "All questions must have text",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let surveyId = survey.id;

      if (surveyId) {
        const { error } = await supabase
          .from('portal_surveys')
          .update({
            title: survey.title,
            description: survey.description,
            due_date: survey.due_date || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', surveyId);

        if (error) throw error;

        // Delete existing sections and questions
        await supabase
          .from('portal_survey_sections')
          .delete()
          .eq('survey_id', surveyId);

        await supabase
          .from('portal_survey_questions')
          .delete()
          .eq('survey_id', surveyId);
      } else {
        const { data, error } = await supabase
          .from('portal_surveys')
          .insert({
            title: survey.title,
            description: survey.description,
            due_date: survey.due_date || null,
            status: 'draft'
          })
          .select()
          .single();

        if (error) throw error;
        surveyId = data.id;
      }

      // Save sections first (if any)
      if (survey.sections.length > 0) {
        const sectionsToInsert = survey.sections.map(s => ({
          survey_id: surveyId,
          title: s.title,
          description: s.description || null,
          display_order: s.display_order
        }));

        const { data: insertedSections, error: sectionsError } = await supabase
          .from('portal_survey_sections')
          .insert(sectionsToInsert)
          .select();

        if (sectionsError) throw sectionsError;

        // Create a map of old section index to new section ID
        const sectionIdMap = new Map();
        insertedSections?.forEach((inserted, index) => {
          sectionIdMap.set(index, inserted.id);
        });

        // Update questions with new section IDs
        const questionsToInsert = survey.questions.map(q => {
          const sectionIndex = survey.sections.findIndex(s => s.id === q.section_id);
          const newSectionId = sectionIndex >= 0 ? sectionIdMap.get(sectionIndex) : null;

          return {
            survey_id: surveyId,
            question_type: q.question_type,
            question_text: q.question_text,
            options: (q.question_type === 'multiple_choice' || q.question_type === 'select_all')
              ? q.options?.filter(o => o.trim() !== '')
              : null,
            required: q.required,
            position: q.position,
            section_id: newSectionId,
            section_order: q.section_order || 0
          };
        });

        const { error: questionsError } = await supabase
          .from('portal_survey_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      } else {
        // No sections - just insert questions
        const questionsToInsert = survey.questions.map(q => ({
          survey_id: surveyId,
          question_type: q.question_type,
          question_text: q.question_text,
          options: (q.question_type === 'multiple_choice' || q.question_type === 'select_all')
            ? q.options?.filter(o => o.trim() !== '')
            : null,
          required: q.required,
          position: q.position,
          section_id: null,
          section_order: 0
        }));

        const { error: questionsError } = await supabase
          .from('portal_survey_questions')
          .insert(questionsToInsert);

        if (questionsError) throw questionsError;
      }

      toast({
        title: "Success",
        description: "Survey saved successfully",
      });

      navigate('/portal/admin/surveys');
    } catch (error) {
      logger.error('Error saving survey:', error);
      toast({
        title: "Error",
        description: "Failed to save survey",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'yes_no':
        return <CheckCircle className="h-4 w-4" />;
      case 'multiple_choice':
        return <List className="h-4 w-4" />;
      case 'select_all':
        return <Hash className="h-4 w-4" />;
      case 'open_text':
        return <Type className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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
          <h1 className="text-3xl font-bold">
            {surveyId ? 'Edit Survey' : 'Create Survey'}
          </h1>
        </div>
        <Button
          onClick={saveSurvey}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Survey'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Survey Title *</Label>
            <Input
              id="title"
              value={survey.title}
              onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter survey title"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={survey.description}
              onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter survey description (optional)"
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="due_date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date (Optional)
            </Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={survey.due_date ? new Date(survey.due_date).toISOString().slice(0, 16) : ''}
              onChange={(e) => setSurvey(prev => ({ 
                ...prev, 
                due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined 
              }))}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              If set, the survey will automatically close on this date
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Options */}
      {survey.status === 'draft' && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Ready to Publish?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Once published, this survey will be visible to all portal members. 
              {survey.due_date && ` It will automatically close on ${new Date(survey.due_date).toLocaleDateString()}.`}
            </p>
            <Button
              onClick={async () => {
                await saveSurvey();
                // After saving, open publish dialog with fetched recipient info
                if (survey.id && survey.title) {
                  await handleOpenPublishDialog(survey.id, survey.title);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Rocket className="h-4 w-4 mr-2" />
              Save & Publish Survey
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sections Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Survey Sections</CardTitle>
            <Button onClick={addSection} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {survey.sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No sections yet</p>
              <p className="text-sm">Sections help organize questions into categories</p>
            </div>
          ) : (
            <div className="space-y-3">
              {survey.sections.map((section, index) => (
                <Card key={index} className="border-purple-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(index, 'up')}
                          disabled={index === 0}
                          className="h-7 w-7 p-0"
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSection(index, 'down')}
                          disabled={index === survey.sections.length - 1}
                          className="h-7 w-7 p-0"
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Section {index + 1}</Badge>
                          <Input
                            value={section.title}
                            onChange={(e) => updateSection(index, { title: e.target.value })}
                            placeholder="Section title (e.g., Category 1: Current Process)"
                            className="flex-1"
                          />
                        </div>
                        <Textarea
                          value={section.description || ''}
                          onChange={(e) => updateSection(index, { description: e.target.value })}
                          placeholder="Section description (optional)"
                          rows={2}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSection(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Questions</h2>
          <Button onClick={addQuestion} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {survey.questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
              <p className="text-gray-600 mb-4">Add your first question to get started</p>
              <Button onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {survey.questions.map((question, qIndex) => (
              <Card key={qIndex} className="overflow-hidden">
                <Collapsible 
                  open={expandedQuestions.has(qIndex)}
                  onOpenChange={() => toggleQuestion(qIndex)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="w-full">
                      <CardHeader className="hover:bg-gray-50 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 text-left">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-sm">
                              {qIndex + 1}
                            </div>
                            <GripVertical className="h-4 w-4 text-gray-400" />
                            {getQuestionIcon(question.question_type)}
                            <div className="flex-1">
                              <CardTitle className="text-base">
                                Question {qIndex + 1}
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">
                                {question.question_text || "(No question text yet)"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {question.question_type.replace('_', ' ')}
                              </Badge>
                              {question.required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                              {question.section_id && survey.sections.find(s => s.id === question.section_id) && (
                                <Badge className="text-xs bg-purple-600">
                                  {survey.sections.find(s => s.id === question.section_id)?.title || 'Section'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveQuestion(qIndex, 'up');
                                }}
                                disabled={qIndex === 0}
                                variant="ghost"
                                size="sm"
                                type="button"
                              >
                                <MoveUp className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveQuestion(qIndex, 'down');
                                }}
                                disabled={qIndex === survey.questions.length - 1}
                                variant="ghost"
                                size="sm"
                                type="button"
                              >
                                <MoveDown className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteQuestion(qIndex);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {expandedQuestions.has(qIndex) ? (
                              <ChevronUp className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Question Type</Label>
                    <Select
                      value={question.question_type}
                      onValueChange={(value: any) => {
                        updateQuestion(qIndex, { 
                          question_type: value,
                          options: (value === 'multiple_choice' || value === 'select_all') ? [''] : undefined
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes_no">Yes/No</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="select_all">Select All That Apply</SelectItem>
                        <SelectItem value="open_text">Open Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-6">
                    <Label htmlFor={`required-${qIndex}`}>Required</Label>
                    <Switch
                      id={`required-${qIndex}`}
                      checked={question.required}
                      onCheckedChange={(checked) => updateQuestion(qIndex, { required: checked })}
                    />
                  </div>
                </div>

                {/* Section Assignment */}
                {survey.sections.length > 0 && (
                  <div>
                    <Label>Assign to Section (Optional)</Label>
                    <Select
                      value={question.section_id || 'none'}
                      onValueChange={(value) => assignQuestionToSection(qIndex, value === 'none' ? null : value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="No section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No section</SelectItem>
                        {survey.sections.map((section, sIndex) => (
                          <SelectItem key={section.id || sIndex} value={section.id || `temp-${sIndex}`}>
                            Section {sIndex + 1}: {section.title || '(Untitled)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Question Text *</Label>
                  <Textarea
                    value={question.question_text}
                    onChange={(e) => updateQuestion(qIndex, { question_text: e.target.value })}
                    placeholder="Enter your question"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {(question.question_type === 'multiple_choice' || question.question_type === 'select_all') && (
                  <div>
                    <Label>Options</Label>
                    <div className="space-y-2 mt-2">
                      {(question.options || []).map((option, oIndex) => (
                        <div key={oIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Option ${oIndex + 1}`}
                          />
                          <Button
                            onClick={() => deleteOption(qIndex, oIndex)}
                            variant="ghost"
                            size="sm"
                            disabled={(question.options?.length || 0) <= 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        onClick={() => addOption(qIndex)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
            
            {/* Action buttons after the last question */}
            {survey.questions.length > 0 && (
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Button onClick={addQuestion} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Question
                </Button>
                <Button
                  onClick={saveSurvey}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Survey'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Publish Confirm Dialog */}
      {surveyToPublish && (
        <PublishConfirmDialog
          open={publishDialogOpen}
          onOpenChange={(open) => {
            setPublishDialogOpen(open);
            if (!open) {
              // Navigate after dialog closes successfully
              navigate('/portal/admin/surveys');
            }
          }}
          contentType="survey"
          contentId={surveyToPublish.id}
          contentTitle={surveyToPublish.title}
          templateName={templateName}
          recipientListName={recipientListName}
          onConfirm={handleConfirmPublish}
          onCancel={handleCancelPublish}
        />
      )}
    </div>
  );
}