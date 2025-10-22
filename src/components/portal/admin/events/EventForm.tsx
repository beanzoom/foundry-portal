import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, setHours, setMinutes } from 'date-fns';
import { CalendarIcon, Plus, Trash2, Save, ArrowLeft, Clock } from 'lucide-react';
import { PortalEventsService } from '@/services/portal-events.service';
import { EventFormData, EventTemplate, PortalEvent } from '@/types/portal-events';
import { toast } from '@/hooks/use-toast';

export function EventForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EventTemplate[]>([]);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    type: 'in_person',
    dates: [],
    max_guests_per_registration: 1,
    is_private: true
  });

  useEffect(() => {
    loadTemplates();
    if (isEdit) {
      loadEvent();
    }
  }, [id]);

  const loadTemplates = async () => {
    try {
      const data = await PortalEventsService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadEvent = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const event = await PortalEventsService.getEvent(id);
      setFormData({
        title: event.title,
        description: event.description || '',
        type: event.type,
        dates: event.dates?.map(d => ({
          start_time: new Date(d.start_time),
          end_time: new Date(d.end_time),
          max_attendees: d.max_attendees
        })) || [],
        max_guests_per_registration: event.max_guests_per_registration,
        registration_deadline: event.registration_deadline ? new Date(event.registration_deadline) : undefined,
        is_private: event.is_private,
        location_name: event.location_name,
        location_address: event.location_address,
        location_url: event.location_url,
        video_platform: event.video_platform,
        video_url: event.video_url,
        video_meeting_id: event.video_meeting_id,
        video_passcode: event.video_passcode
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load event'
      });
      navigate('/portal/admin/events');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) return;
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setFormData(prev => ({
      ...prev,
      title: template.default_title || '',
      description: template.default_description || '',
      type: template.type,
      max_guests_per_registration: template.default_max_guests,
      location_name: template.default_location_name,
      location_address: template.default_location_address,
      video_platform: template.default_video_platform
    }));

    toast({
      title: 'Template Applied',
      description: `Applied "${template.name}" template`
    });
  };

  const addEventDate = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
    
    setFormData(prev => ({
      ...prev,
      dates: [...prev.dates, { start_time: startTime, end_time: endTime }]
    }));
  };

  const removeEventDate = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dates: prev.dates.filter((_, i) => i !== index)
    }));
  };

  const updateEventDate = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      dates: prev.dates.map((date, i) => 
        i === index ? { ...date, [field]: value } : date
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Event title is required'
      });
      return;
    }

    // Dates are now optional - events can be "Coming Soon"

    if (formData.type === 'in_person' && !formData.location_name) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Location is required for in-person events'
      });
      return;
    }

    if (formData.type === 'video_call' && !formData.video_url) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Video URL is required for video call events'
      });
      return;
    }

    try {
      setLoading(true);
      
      if (isEdit) {
        await PortalEventsService.updateEvent(id!, formData);
        toast({
          title: 'Success',
          description: 'Event updated successfully'
        });
      } else {
        console.log('Submitting event data:', formData);
        await PortalEventsService.createEvent(formData);
        toast({
          title: 'Success',
          description: 'Event created successfully'
        });
      }
      
      navigate('/portal/admin/events');
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: isEdit ? 'Failed to update event' : 'Failed to create event'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/portal/admin/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Event' : 'Create New Event'}</h1>
      </div>

      {/* Template Selection (only for new events) */}
      {!isEdit && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Use Template</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.type.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Event Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Event Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="video_call">Video Call</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter event description (HTML supported)"
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={formData.is_private}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_private: checked }))}
              />
              <Label htmlFor="private">Private Event (only visible to portal users)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Event Dates */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Event Dates</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addEventDate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Date
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.dates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No dates added. Event will show as "Coming Soon".
                Click "Add Date" to add event dates.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.dates.map((date, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Date {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEventDate(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Date Selection */}
                      <div>
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date.start_time && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date.start_time ? format(date.start_time, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={date.start_time}
                              onSelect={(newDate) => {
                                if (newDate) {
                                  // Preserve existing time when changing date
                                  const updatedStart = setHours(setMinutes(newDate, 
                                    date.start_time.getMinutes()), 
                                    date.start_time.getHours()
                                  );
                                  const updatedEnd = setHours(setMinutes(newDate,
                                    date.end_time.getMinutes()),
                                    date.end_time.getHours()
                                  );
                                  updateEventDate(index, 'start_time', updatedStart);
                                  updateEventDate(index, 'end_time', updatedEnd);
                                }
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Time Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Start Time</Label>
                          <div className="flex gap-2">
                            <Select
                              value={format(date.start_time, 'HH:mm')}
                              onValueChange={(time) => {
                                const [hours, minutes] = time.split(':').map(Number);
                                const newStart = setHours(setMinutes(date.start_time, minutes), hours);
                                updateEventDate(index, 'start_time', newStart);
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <div className="flex items-center">
                                  <Clock className="mr-2 h-4 w-4" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                {Array.from({ length: 24 }, (_, h) => 
                                  ['00', '30'].map(m => {
                                    const time = `${h.toString().padStart(2, '0')}:${m}`;
                                    const displayTime = h === 0 ? `12:${m} AM` : 
                                                       h < 12 ? `${h}:${m} AM` :
                                                       h === 12 ? `12:${m} PM` :
                                                       `${h - 12}:${m} PM`;
                                    return (
                                      <SelectItem key={time} value={time}>
                                        {displayTime}
                                      </SelectItem>
                                    );
                                  })
                                ).flat()}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div>
                          <Label>End Time</Label>
                          <div className="flex gap-2">
                            <Select
                              value={format(date.end_time, 'HH:mm')}
                              onValueChange={(time) => {
                                const [hours, minutes] = time.split(':').map(Number);
                                const newEnd = setHours(setMinutes(date.end_time, minutes), hours);
                                updateEventDate(index, 'end_time', newEnd);
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <div className="flex items-center">
                                  <Clock className="mr-2 h-4 w-4" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="max-h-[200px]">
                                {Array.from({ length: 24 }, (_, h) => 
                                  ['00', '30'].map(m => {
                                    const time = `${h.toString().padStart(2, '0')}:${m}`;
                                    const displayTime = h === 0 ? `12:${m} AM` : 
                                                       h < 12 ? `${h}:${m} AM` :
                                                       h === 12 ? `12:${m} PM` :
                                                       `${h - 12}:${m} PM`;
                                    return (
                                      <SelectItem key={time} value={time}>
                                        {displayTime}
                                      </SelectItem>
                                    );
                                  })
                                ).flat()}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Max Attendees (optional)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={date.max_attendees || ''}
                        onChange={(e) => updateEventDate(index, 'max_attendees', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location/Video Details */}
        {formData.type === 'in_person' ? (
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location_name">Location Name *</Label>
                <Input
                  id="location_name"
                  value={formData.location_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
                  placeholder="e.g., Conference Room A"
                  required={formData.type === 'in_person'}
                />
              </div>
              
              <div>
                <Label htmlFor="location_address">Address</Label>
                <Textarea
                  id="location_address"
                  value={formData.location_address || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_address: e.target.value }))}
                  placeholder="Full address"
                />
              </div>
              
              <div>
                <Label htmlFor="location_url">Location URL</Label>
                <Input
                  id="location_url"
                  type="url"
                  value={formData.location_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_url: e.target.value }))}
                  placeholder="Maps link or venue website"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Video Call Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="video_platform">Platform</Label>
                <Select 
                  value={formData.video_platform || ''} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, video_platform: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="teams">Microsoft Teams</SelectItem>
                    <SelectItem value="meet">Google Meet</SelectItem>
                    <SelectItem value="webex">Webex</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="video_url">Meeting URL *</Label>
                <Input
                  id="video_url"
                  type="url"
                  value={formData.video_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://zoom.us/j/..."
                  required={formData.type === 'video_call'}
                />
              </div>
              
              <div>
                <Label htmlFor="video_meeting_id">Meeting ID</Label>
                <Input
                  id="video_meeting_id"
                  value={formData.video_meeting_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_meeting_id: e.target.value }))}
                  placeholder="Optional meeting ID"
                />
              </div>
              
              <div>
                <Label htmlFor="video_passcode">Passcode</Label>
                <Input
                  id="video_passcode"
                  value={formData.video_passcode || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_passcode: e.target.value }))}
                  placeholder="Optional passcode"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max_guests">Max Guests per Registration</Label>
              <Input
                id="max_guests"
                type="number"
                min="0"
                value={formData.max_guests_per_registration}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    max_guests_per_registration: value === '' ? 0 : parseInt(value) 
                  }));
                }}
                onFocus={(e) => e.target.select()}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Set to 0 to disable guest registrations
              </p>
            </div>
            
            <div>
              <Label htmlFor="deadline">Registration Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.registration_deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.registration_deadline 
                      ? format(formData.registration_deadline, "PPP") 
                      : "Select deadline (optional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.registration_deadline}
                    onSelect={(date) => setFormData(prev => ({ 
                      ...prev, 
                      registration_deadline: date 
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/portal/admin/events')}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update Event' : 'Create Event')}
          </Button>
        </div>
      </form>
    </div>
  );
}