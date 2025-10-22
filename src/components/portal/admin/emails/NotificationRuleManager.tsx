import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
  Bell, Edit, Trash2, Plus, AlertCircle, CheckCircle,
  Settings, Users, FileText, ArrowRight, Save, X
} from 'lucide-react';

interface NotificationType {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  default_template_id: string;
  requires_confirmation: boolean;
  is_active: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: string;
  is_active: boolean;
}

interface NotificationRule {
  id: string;
  notification_type_id: string;
  template_id: string;
  name: string;
  description: string;
  conditions: any;
  recipient_filters: any;
  priority: number;
  is_active: boolean;
  send_to_roles: string[];
  exclude_roles: string[];
  metadata: any;
  notification_type?: NotificationType;
  template?: EmailTemplate;
}

export function NotificationRuleManager() {
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedType, setSelectedType] = useState<NotificationType | null>(null);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    rule: NotificationRule;
    newTemplateId: string;
  } | null>(null);
  const { toast } = useToast();

  const availableRoles = [
    { value: 'portal_member', label: 'Portal Member' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'investor', label: 'Investor' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load notification types
      const { data: typesData, error: typesError } = await supabase
        .from('notification_types')
        .select('*')
        .order('name');

      if (typesError) throw typesError;
      setNotificationTypes(typesData || []);

      // Load notification rules with related data
      const { data: rulesData, error: rulesError } = await supabase
        .from('notification_rules')
        .select(`
          *,
          notification_type:notification_types(*),
          template:email_templates(id, name, subject, category, is_active)
        `)
        .order('priority', { ascending: false });

      if (rulesError) throw rulesError;
      setRules(rulesData || []);

      // Load email templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('id, name, subject, category, is_active')
        .eq('is_active', true)
        .order('name');

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification rules',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationTypeTemplate = async (typeId: string, templateId: string, requiresConfirmation: boolean) => {
    if (requiresConfirmation) {
      const rule = rules.find(r => r.notification_type_id === typeId && r.priority === 0);
      if (rule) {
        setPendingChange({ rule, newTemplateId: templateId });
        setShowConfirmDialog(true);
        return;
      }
    }

    try {
      // Update the default template for the notification type
      const { error: typeError } = await supabase
        .from('notification_types')
        .update({ default_template_id: templateId })
        .eq('id', typeId);

      if (typeError) throw typeError;

      // Update the default rule
      const { error: ruleError } = await supabase
        .from('notification_rules')
        .update({ template_id: templateId })
        .eq('notification_type_id', typeId)
        .eq('priority', 0);

      if (ruleError) throw ruleError;

      toast({
        title: 'Success',
        description: 'Template assignment updated successfully'
      });

      loadData();
    } catch (error) {
      console.error('Error updating template assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template assignment',
        variant: 'destructive'
      });
    }
  };

  const confirmTemplateChange = async () => {
    if (!pendingChange) return;

    await updateNotificationTypeTemplate(
      pendingChange.rule.notification_type_id,
      pendingChange.newTemplateId,
      false
    );

    setShowConfirmDialog(false);
    setPendingChange(null);
  };

  const toggleRuleStatus = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Rule ${!isActive ? 'activated' : 'deactivated'} successfully`
      });

      loadData();
    } catch (error) {
      console.error('Error toggling rule status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rule status',
        variant: 'destructive'
      });
    }
  };

  const updateRoleSettings = async (ruleId: string, sendToRoles: string[], excludeRoles: string[]) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .update({
          send_to_roles: sendToRoles,
          exclude_roles: excludeRoles
        })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role settings updated successfully'
      });

      loadData();
    } catch (error) {
      console.error('Error updating role settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role settings',
        variant: 'destructive'
      });
    }
  };

  // Group rules by notification type
  const groupedRules = notificationTypes.map(type => ({
    type,
    rules: rules.filter(r => r.notification_type_id === type.id)
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Rules</h2>
        <p className="text-muted-foreground">
          Configure when and how notifications are sent
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">Loading notification rules...</div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedRules.map(({ type, rules: typeRules }) => {
            const defaultRule = typeRules.find(r => r.priority === 0);
            const currentTemplate = templates.find(t => t.id === defaultRule?.template_id);

            return (
              <Card key={type.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {type.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {type.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={type.is_active ? 'default' : 'secondary'}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {type.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Assignment */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <Label className="text-base font-semibold mb-2 block">
                      Email Template Assignment
                    </Label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Select
                          value={defaultRule?.template_id}
                          onValueChange={(value) => {
                            if (defaultRule) {
                              updateNotificationTypeTemplate(type.id, value, type.requires_confirmation);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                <div>
                                  <div className="font-medium">{template.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {template.subject}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {type.requires_confirmation && (
                        <Alert className="flex-1">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Changes to this template require confirmation
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    {currentTemplate && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Current: <span className="font-medium">{currentTemplate.name}</span> - {currentTemplate.subject}
                      </div>
                    )}
                  </div>

                  {/* Role Settings */}
                  {defaultRule && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <Label className="text-base font-semibold mb-2 block">
                        Recipient Roles
                      </Label>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm mb-1 block">Send to these roles:</Label>
                          <div className="flex flex-wrap gap-2">
                            {availableRoles.map((role) => (
                              <label
                                key={role.value}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={defaultRule.send_to_roles.includes(role.value)}
                                  onChange={(e) => {
                                    const newRoles = e.target.checked
                                      ? [...defaultRule.send_to_roles, role.value]
                                      : defaultRule.send_to_roles.filter(r => r !== role.value);
                                    updateRoleSettings(
                                      defaultRule.id,
                                      newRoles,
                                      defaultRule.exclude_roles
                                    );
                                  }}
                                  className="rounded"
                                />
                                <span className="text-sm">{role.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rule Status */}
                  {defaultRule && (
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={defaultRule.is_active}
                          onCheckedChange={() => toggleRuleStatus(defaultRule.id, defaultRule.is_active)}
                        />
                        <Label className="cursor-pointer">
                          {defaultRule.is_active ? 'Rule Active' : 'Rule Inactive'}
                        </Label>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Priority: {defaultRule.priority}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Template Change</DialogTitle>
            <DialogDescription>
              This notification type requires confirmation before changing the template.
              Are you sure you want to update the email template?
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Changing the template will affect all future notifications of this type.
              Make sure the new template has all required variables.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmTemplateChange}>
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}