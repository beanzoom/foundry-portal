import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Mail, Megaphone, ClipboardList, Calendar, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePortal } from '@/contexts/PortalContext';

interface EmailPreferencesData {
  email_updates: boolean;
  email_surveys: boolean;
  email_events: boolean;
}

export function EmailPreferences() {
  const { portalUser } = usePortal();
  const [preferences, setPreferences] = useState<EmailPreferencesData>({
    email_updates: true,
    email_surveys: true,
    email_events: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] = useState<EmailPreferencesData>({
    email_updates: true,
    email_surveys: true,
    email_events: true
  });

  useEffect(() => {
    loadPreferences();
  }, [portalUser]);

  useEffect(() => {
    // Check if preferences have changed from original
    const changed = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  const loadPreferences = async () => {
    if (!portalUser?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('email_updates, email_surveys, email_events')
        .eq('id', portalUser.id)
        .single();

      if (error) throw error;

      if (data) {
        const prefs = {
          email_updates: data.email_updates ?? true,
          email_surveys: data.email_surveys ?? true,
          email_events: data.email_events ?? true
        };
        setPreferences(prefs);
        setOriginalPreferences(prefs);
      }
    } catch (error: any) {
      console.error('Error loading preferences:', error);
      // Check if it's a column doesn't exist error
      if (error?.code === '42703' || error?.message?.includes('does not exist')) {
        // Columns don't exist yet, use defaults
        const defaultPrefs = {
          email_updates: true,
          email_surveys: true,
          email_events: true
        };
        setPreferences(defaultPrefs);
        setOriginalPreferences(defaultPrefs);
        toast({
          title: 'Note',
          description: 'Email preferences are being set up. Please contact your administrator if this persists.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load email preferences',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!portalUser?.id) return;
    
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          email_updates: preferences.email_updates,
          email_surveys: preferences.email_surveys,
          email_events: preferences.email_events
        })
        .eq('id', portalUser.id);

      if (error) throw error;

      setOriginalPreferences(preferences);
      setHasChanges(false);
      
      toast({
        title: 'Success',
        description: 'Your email preferences have been updated'
      });
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      // Check if it's a column doesn't exist error
      if (error?.code === '42703' || error?.message?.includes('does not exist')) {
        toast({
          title: 'Setup Required',
          description: 'Email preferences need to be configured in the database. Please contact your administrator.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save email preferences',
          variant: 'destructive'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof EmailPreferencesData) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <CardTitle>Email Preferences</CardTitle>
        </div>
        <CardDescription>
          Manage which email notifications you'd like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Updates Preference */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3 flex-1">
            <Megaphone className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <Label htmlFor="email-updates" className="text-base font-medium">
                Portal Updates
              </Label>
              <p className="text-sm text-gray-500">
                Receive notifications about new features, announcements, and important updates
              </p>
            </div>
          </div>
          <Switch
            id="email-updates"
            checked={preferences.email_updates}
            onCheckedChange={() => handleToggle('email_updates')}
            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
          />
        </div>

        {/* Surveys Preference */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3 flex-1">
            <ClipboardList className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <Label htmlFor="email-surveys" className="text-base font-medium">
                Surveys
              </Label>
              <p className="text-sm text-gray-500">
                Get notified when new surveys are available for you to complete
              </p>
            </div>
          </div>
          <Switch
            id="email-surveys"
            checked={preferences.email_surveys}
            onCheckedChange={() => handleToggle('email_surveys')}
            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
          />
        </div>

        {/* Events Preference */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3 flex-1">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div className="flex-1">
              <Label htmlFor="email-events" className="text-base font-medium">
                Events
              </Label>
              <p className="text-sm text-gray-500">
                Stay informed about upcoming events, webinars, and meetings
              </p>
            </div>
          </div>
          <Switch
            id="email-events"
            checked={preferences.email_events}
            onCheckedChange={() => handleToggle('email_events')}
            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={savePreferences} 
            disabled={!hasChanges || saving}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </>
            )}
          </Button>
          {hasChanges && !saving && (
            <p className="text-sm text-amber-600 mt-2">
              You have unsaved changes
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}