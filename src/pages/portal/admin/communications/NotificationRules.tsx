import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell, Mail, Eye, Settings, Users, CheckCircle, AlertCircle,
  FileText, Send, Calendar, BarChart, MessageSquare, UserPlus,
  RefreshCw, Calculator, Lock, Save, ChevronRight, User, Shield,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { adminRoute } from '@/lib/portal/navigation';
import { RecipientSelectorModal } from '@/components/portal/admin/communications/RecipientSelectorModal';

const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <Shield className="h-3 w-3" />,
  Users: <Users className="h-3 w-3" />,
  User: <User className="h-3 w-3" />,
  UserPlus: <UserPlus className="h-3 w-3" />,
  TrendingUp: <TrendingUp className="h-3 w-3" />,
  Mail: <Mail className="h-3 w-3" />,
  Settings: <Settings className="h-3 w-3" />,
};

const COLOR_CLASSES: Record<string, string> = {
  red: 'bg-orange-100 text-orange-700 border-orange-200',  // Map red from DB to orange in UI
  orange: 'bg-orange-100 text-orange-700 border-orange-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
};

// More visible background colors for rule cards
const CARD_COLOR_CLASSES: Record<string, string> = {
  red: 'bg-orange-50 border-orange-300',  // Map red from DB to orange in UI
  orange: 'bg-orange-50 border-orange-300',
  green: 'bg-green-50 border-green-300',
  blue: 'bg-blue-50 border-blue-300',
  indigo: 'bg-indigo-50 border-indigo-300',
  purple: 'bg-purple-50 border-purple-300',
  yellow: 'bg-yellow-50 border-yellow-300',
  gray: 'bg-gray-50 border-gray-300',
};

interface NotificationRule {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  template_id: string;
  recipient_list_id: string;
  enabled: boolean | null;
  priority: number | null;
  conditions: any;
  metadata: any;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[] | null;
  category: string | null;
  is_active: boolean | null;
}

interface RecipientList {
  id: string;
  name: string;
  code: string;
  description: string | null;
  type: 'static' | 'role_based' | 'dynamic' | 'custom';
  config: any;
  is_system: boolean;
  is_active: boolean;
  icon: string | null;
  color: string | null;
}

interface EventGroup {
  category: string;
  title: string;
  icon: React.ReactNode;
  events: {
    id: string;
    name: string;
    description: string;
    rules?: NotificationRule[];
  }[];
}

export function NotificationRules() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [recipientLists, setRecipientLists] = useState<RecipientList[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Removed pendingChanges and hasChanges - now saving immediately
  const [recipientSelectorOpen, setRecipientSelectorOpen] = useState(false);
  const [selectedRuleForRecipient, setSelectedRuleForRecipient] = useState<NotificationRule | null>(null);

  // Define all event groups with proper categorization
  const eventGroups: EventGroup[] = [
    {
      category: 'content',
      title: 'Content Publishing',
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      events: [
        {
          id: 'update_published',
          name: 'Update Published',
          description: 'When a portal update is published to members'
        },
        {
          id: 'survey_published',
          name: 'Survey Published',
          description: 'When a new survey is available for completion'
        },
        {
          id: 'event_published',
          name: 'Event Published',
          description: 'When a new event is announced'
        }
      ]
    },
    {
      category: 'user_actions',
      title: 'User Actions',
      icon: <Users className="h-5 w-5 text-green-500" />,
      events: [
        {
          id: 'contact_form_submitted',
          name: 'Contact Form Submitted',
          description: 'When someone submits the contact form'
        },
        {
          id: 'event_registration',
          name: 'Event Registration',
          description: 'When someone registers for an event'
        },
        {
          id: 'survey_completed',
          name: 'Survey Completed',
          description: 'When a user completes a survey'
        },
        {
          id: 'calculator_submission',
          name: 'Calculator Submission',
          description: 'When someone submits ROI calculations'
        }
      ]
    },
    {
      category: 'system',
      title: 'System Events',
      icon: <Settings className="h-5 w-5 text-purple-500" />,
      events: [
        {
          id: 'user_registered',
          name: 'User Registered',
          description: 'When a new user completes registration'
        },
        {
          id: 'referral_created',
          name: 'Referral Created',
          description: 'When a user sends a referral invitation'
        },
        {
          id: 'password_reset_requested',
          name: 'Password Reset',
          description: 'When a user requests a password reset'
        }
      ]
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load notification rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('notification_rules')
        .select('*')
        .order('event_id');

      if (rulesError) throw rulesError;

      // Load email templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (templatesError) throw templatesError;

      // Load recipient lists
      const { data: listsData, error: listsError } = await supabase
        .from('recipient_lists')
        .select('*')
        .eq('is_active', true)
        .order('is_system', { ascending: false })
        .order('name');

      if (listsError) throw listsError;

      // Filter out duplicate 'Notify Admins of New Registration' rule
      const filteredRules = (rulesData || []).filter(rule =>
        rule.name !== 'Notify Admins of New Registration'
      );

      setRules(filteredRules);
      setTemplates(templatesData || []);
      setRecipientLists(listsData || []);

      // Attach rules to events
      eventGroups.forEach(group => {
        group.events.forEach(event => {
          event.rules = filteredRules.filter(r => r.event_id === event.id);
        });
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification rules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (ruleId: string, templateId: string) => {
    console.log('Changing template for rule:', ruleId, 'to template:', templateId);

    try {
      // Save immediately to database
      const { error } = await supabase
        .from('notification_rules')
        .update({ template_id: templateId })
        .eq('id', ruleId);

      if (error) throw error;

      // Update the rules state to show the change immediately
      setRules(prevRules =>
        prevRules.map(rule =>
          rule.id === ruleId
            ? { ...rule, template_id: templateId }
            : rule
        )
      );

      // Find the template name for the toast
      const templateName = templates.find(t => t.id === templateId)?.name || 'selected template';

      toast({
        title: 'Template updated',
        description: `Successfully changed to ${templateName}`,
      });
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive',
      });
      // Reload to show correct data
      loadData();
    }
  };

  const handleRecipientListChange = async (ruleId: string, listId: string) => {
    console.log('Changing recipient list for rule:', ruleId, 'to list:', listId);

    try {
      // Save immediately to database
      const { error } = await supabase
        .from('notification_rules')
        .update({ recipient_list_id: listId })
        .eq('id', ruleId);

      if (error) throw error;

      // Update the rules state to show the change immediately
      setRules(prevRules =>
        prevRules.map(rule =>
          rule.id === ruleId
            ? { ...rule, recipient_list_id: listId }
            : rule
        )
      );

      // Find the list name for the toast
      const listName = recipientLists.find(l => l.id === listId)?.name || 'selected list';

      toast({
        title: 'Recipient list updated',
        description: `Successfully changed to ${listName}`,
      });
    } catch (error) {
      console.error('Error updating recipient list:', error);
      toast({
        title: 'Error',
        description: 'Failed to update recipient list',
        variant: 'destructive',
      });
      // Reload to show correct data
      loadData();
    }
  };

  const openRecipientSelector = (rule: NotificationRule) => {
    console.log('Opening recipient selector for rule:', rule.id, rule.name);
    setSelectedRuleForRecipient(rule);
    setRecipientSelectorOpen(true);
  };

  // Removed saveChanges function - now saving immediately on change

  const toggleRule = async (rule: NotificationRule) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .update({ enabled: !rule.enabled })
        .eq('id', rule.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Rule ${rule.enabled ? 'disabled' : 'enabled'}`,
      });

      loadData();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rule status',
        variant: 'destructive',
      });
    }
  };

  const getEventIcon = (eventId: string) => {
    switch (eventId) {
      case 'update_published': return <Send className="h-4 w-4" />;
      case 'survey_published': return <BarChart className="h-4 w-4" />;
      case 'event_published': return <Calendar className="h-4 w-4" />;
      case 'contact_form_submitted': return <MessageSquare className="h-4 w-4" />;
      case 'event_registration': return <Calendar className="h-4 w-4" />;
      case 'survey_completed': return <CheckCircle className="h-4 w-4" />;
      case 'calculator_submission': return <Calculator className="h-4 w-4" />;
      case 'user_registered': return <UserPlus className="h-4 w-4" />;
      case 'referral_created': return <RefreshCw className="h-4 w-4" />;
      case 'password_reset_requested': return <Lock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getRuleCardColor = (rule: NotificationRule): string => {
    // All rules now have recipient_list_id (enforced by Migration 111)
    const list = recipientLists.find(l => l.id === rule.recipient_list_id);
    if (list && list.color) {
      return CARD_COLOR_CLASSES[list.color] || '';
    }

    // Fallback if recipient list not found or has no color
    return CARD_COLOR_CLASSES.gray;
  };

  const getRecipientBadge = (rule: NotificationRule) => {
    // All rules now have recipient_list_id (enforced by Migration 111)
    const list = recipientLists.find(l => l.id === rule.recipient_list_id);

    if (list) {
      const colorClass = COLOR_CLASSES[list.color || 'gray'];
      const icon = ICON_MAP[list.icon || 'Users'] || <Users className="h-3 w-3" />;

      return (
        <Button
          variant="ghost"
          size="sm"
          className={cn("px-2 py-1 h-auto", colorClass)}
          onClick={() => openRecipientSelector(rule)}
        >
          {icon}
          <span className="ml-1">{list.name}</span>
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      );
    }

    // Fallback if recipient list not found (shouldn't happen with FK constraint)
    return (
      <Button
        variant="ghost"
        size="sm"
        className="px-2 py-1 h-auto bg-gray-100 text-gray-700 border-gray-200"
        onClick={() => openRecipientSelector(rule)}
      >
        <Users className="h-3 w-3 mr-1" />
        Unknown Recipient
        <ChevronRight className="ml-1 h-3 w-3" />
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading notification rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Link to={adminRoute('settings')} className="hover:text-foreground">Settings</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <Link to={adminRoute('settings/communications')} className="hover:text-foreground">Communications</Link>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="text-foreground">Notification Rules</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Notification Rules</h1>
          <p className="text-muted-foreground">
            Configure which email templates are sent for each system event
          </p>
        </div>
        {/* Changes save automatically now */}
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          Each event can have multiple notification rules. Rules are processed in priority order.
          Select the appropriate email template for each rule to ensure the correct message is sent.
        </AlertDescription>
      </Alert>

      {/* Event Groups */}
      <Tabs defaultValue="content" className="space-y-4">
        <TabsList>
          {eventGroups.map(group => (
            <TabsTrigger key={group.category} value={group.category}>
              {group.icon}
              <span className="ml-2">{group.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {eventGroups.map(group => (
          <TabsContent key={group.category} value={group.category} className="space-y-4">
            {group.events.map(event => {
              const eventRules = rules.filter(r => r.event_id === event.id);

              return (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getEventIcon(event.id)}
                        <div>
                          <CardTitle className="text-lg">{event.name}</CardTitle>
                          <CardDescription>{event.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={eventRules.some(r => r.enabled) ? 'default' : 'outline'} className={eventRules.some(r => r.enabled) ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {eventRules.filter(r => r.enabled).length}/{eventRules.length} Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {eventRules.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg">
                        <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No notification rules configured</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {eventRules.map(rule => {
                          const currentTemplateId = rule.template_id;
                          const currentTemplate = templates.find(t => t.id === currentTemplateId);

                          return (
                            <div
                              key={rule.id}
                              className={cn(
                                "p-4 border rounded-lg transition-colors",
                                getRuleCardColor(rule),
                                !rule.enabled && "opacity-60"
                              )}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Switch
                                    checked={rule.enabled === true}
                                    onCheckedChange={() => toggleRule(rule)}
                                  />
                                  <div>
                                    <p className="font-medium">{rule.name}</p>
                                    {rule.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {rule.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getRecipientBadge(rule)}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Label className="text-sm w-24">Template:</Label>
                                <Select
                                  value={currentTemplateId}
                                  onValueChange={(value) => handleTemplateChange(rule.id, value)}
                                  disabled={!rule.enabled}
                                >
                                  <SelectTrigger className="flex-1 min-w-[400px] max-w-[600px]">
                                    <SelectValue placeholder="Select template" />
                                  </SelectTrigger>
                                  <SelectContent className="w-[600px]">
                                    {templates.map(template => (
                                      <SelectItem key={template.id} value={template.id}>
                                        <div className="py-1">
                                          <div className="font-medium">{template.name}</div>
                                          <div className="text-xs text-muted-foreground truncate max-w-[550px]">
                                            {template.subject}
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTemplate(currentTemplate || null);
                                    setPreviewOpen(true);
                                  }}
                                  disabled={!currentTemplate}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Preview of the email template
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Subject</h4>
                <p className="p-2 bg-muted rounded">{selectedTemplate.subject}</p>
              </div>
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Required Variables</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map(v => (
                      <Badge key={v} variant="secondary">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h4 className="font-medium mb-2">Email Preview</h4>
                <div className="border rounded p-4 bg-white">
                  <iframe
                    srcDoc={selectedTemplate.body_html}
                    className="w-full h-[400px] border-0"
                    title="Email Preview"
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recipient Selector Modal */}
      {selectedRuleForRecipient && (
        <RecipientSelectorModal
          isOpen={recipientSelectorOpen}
          currentListId={selectedRuleForRecipient.recipient_list_id}
          eventId={selectedRuleForRecipient.event_id}
          eventName={selectedRuleForRecipient.name}
          onSelect={(listId) => {
            handleRecipientListChange(selectedRuleForRecipient.id, listId);
            setRecipientSelectorOpen(false);
          }}
          onClose={() => {
            setRecipientSelectorOpen(false);
            setSelectedRuleForRecipient(null);
          }}
        />
      )}
    </div>
  );
}