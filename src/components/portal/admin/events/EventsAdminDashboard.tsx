import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { triggerPublishNotification } from '@/services/portal-notifications.service';
import { createLogger } from '@/lib/logging';
import { supabase } from '@/lib/supabase';

const logger = createLogger('EventsAdminDashboard');
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Users,
  Eye,
  Plus,
  Edit,
  Trash2,
  Video,
  MapPin,
  Clock,
  TrendingUp,
  CalendarDays,
  Send,
  Archive,
  MoreVertical,
  RotateCcw,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { PortalEventsService } from '@/services/portal-events.service';
import { PortalEvent, EventAnalytics } from '@/types/portal-events';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function EventsAdminDashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<PortalEvent | null>(null);
  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadEvents();
  }, [activeTab]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      const data = await PortalEventsService.getEvents(status);
      setEvents(data);
    } catch (error) {
      logger.error('Error loading events:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load events'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (eventId: string) => {
    try {
      const data = await PortalEventsService.getEventAnalytics(eventId);
      setAnalytics(data);
    } catch (error) {
      logger.error('Error loading analytics:', error);
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      const event = events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // If publishing, get recipient information for confirmation
      if (newStatus === 'published') {
        // Get the notification rule for event_published to find the recipient list
        const { data: notificationRule, error: ruleError } = await supabase
          .from('notification_rules')
          .select('recipient_list_id')
          .eq('event_id', 'event_published')
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
                .eq('email_events', true);
              recipientCount = count || 0;
            } else if (recipientList.type === 'dynamic') {
              // Dynamic recipients determined at runtime
              recipientDescription = `${recipientList.name} (determined at send time)`;
            }
          }
        }

        // Show confirmation dialog
        const confirmMessage = recipientCount > 0
          ? `This will publish the event "${event.title}" and send email notifications to ${recipientCount} ${recipientDescription}.\n\nContinue?`
          : `This will publish the event "${event.title}" and send email notifications to ${recipientDescription}.\n\nContinue?`;
        const confirmed = window.confirm(confirmMessage);

        if (!confirmed) return;
      }

      await PortalEventsService.updateEventStatus(eventId, newStatus);
      const action = newStatus === 'published' ? 'published' : 'unpublished';

      // If publishing, trigger email notifications (exactly like Updates)
      if (newStatus === 'published') {
        // Trigger email notifications (database trigger handles batch creation)
        const result = await triggerPublishNotification('event', eventId, {
          metadata: {
            event_title: event?.title,
            event_date: event?.date,
            force_process: true  // Force processing even if batch exists
          }
        });

        // Show success message based on result
        if (result.success && result.recipientCount && result.recipientCount > 0) {
          toast({
            title: 'Success',
            description: `Event published and notifications sent to ${result.recipientCount} users.`
          });
        } else if (result.success) {
          toast({
            title: 'Event Published',
            description: 'Event published successfully (no email recipients configured).'
          });
        } else {
          toast({
            title: 'Warning',
            description: 'Event published but email notifications may not have been sent.',
            variant: 'default'
          });
        }
      } else {
        toast({
          title: 'Success',
          description: `Event ${action} successfully`
        });
      }

      loadEvents();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update event status'
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await PortalEventsService.deleteEvent(eventId);
      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      });
      loadEvents();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete event'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'draft': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventIcon = (type: string) => {
    return type === 'video_call' ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">Manage portal events and registrations</p>
        </div>
        <Button onClick={() => {
          const isSubdomain = window.location.hostname === 'portal.localhost' || 
                             window.location.hostname.startsWith('portal.');
          const path = isSubdomain ? '/admin/events/new' : '/portal/admin/events/new';
          navigate(path);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.status === 'published').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.reduce((sum, e) => sum + e.views_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => {
                const hasUpcomingDate = e.dates?.some(d => 
                  new Date(d.start_time) > new Date()
                );
                return e.status === 'published' && hasUpcomingDate;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events found. Create your first event to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <div 
                  key={event.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {getEventIcon(event.type)}
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                      
                      {event.dates && event.dates.length > 0 ? (
                        <div className="text-sm text-muted-foreground">
                          <Clock className="inline h-3 w-3 mr-1" />
                          Next: {format(new Date(event.dates[0].start_time), 'PPp')}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          <Clock className="inline h-3 w-3 mr-1" />
                          Coming Soon
                        </div>
                      )}
                      
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {event.views_count} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.dates?.reduce((sum, d) => sum + d.current_attendees, 0) || 0} registered
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.dates?.length || 0} dates
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {/* View/Preview - Always available */}
                        <DropdownMenuItem onClick={() => {
                          const isSubdomain = window.location.hostname === 'portal.localhost' ||
                                             window.location.hostname.startsWith('portal.');
                          const path = isSubdomain ? `/events/${event.id}` : `/portal/events/${event.id}`;
                          navigate(path);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>

                        {/* Draft actions */}
                        {event.status === 'draft' && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              const isSubdomain = window.location.hostname === 'portal.localhost' ||
                                                 window.location.hostname.startsWith('portal.');
                              const path = isSubdomain ? `/admin/events/${event.id}/edit` : `/portal/admin/events/${event.id}/edit`;
                              navigate(path);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(event.id, 'published')}
                              className="text-green-600"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Publish
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Published actions */}
                        {event.status === 'published' && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setSelectedEvent(event);
                              loadAnalytics(event.id);
                            }}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const isSubdomain = window.location.hostname === 'portal.localhost' ||
                                                 window.location.hostname.startsWith('portal.');
                              const path = isSubdomain ? `/admin/events/${event.id}/edit` : `/portal/admin/events/${event.id}/edit`;
                              navigate(path);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(event.id, 'draft')}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Unpublish
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(event.id, 'cancelled')}>
                              <Archive className="h-4 w-4 mr-2" />
                              Cancel Event
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Cancelled actions */}
                        {event.status === 'cancelled' && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setSelectedEvent(event);
                              loadAnalytics(event.id);
                            }}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(event.id, 'draft')}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Restore to Draft
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </>
                        )}

                        {/* Completed actions */}
                        {event.status === 'completed' && (
                          <>
                            <DropdownMenuItem onClick={() => {
                              setSelectedEvent(event);
                              loadAnalytics(event.id);
                            }}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Archive Event
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Modal */}
      {selectedEvent && analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics: {selectedEvent.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Registrations</p>
                <p className="text-2xl font-bold">{analytics.total_registrations}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendees</p>
                <p className="text-2xl font-bold">{analytics.total_attendees}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Guests</p>
                <p className="text-2xl font-bold">{analytics.total_guests}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{analytics.attendance_rate.toFixed(1)}%</p>
              </div>
            </div>
            
            {analytics.dates_summary.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">By Date</h4>
                <div className="space-y-2">
                  {analytics.dates_summary.map((date, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{format(new Date(date.date), 'PPp')}</span>
                      <span>{date.registrations} registered / {date.capacity_used.toFixed(0)}% capacity</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => {
                setSelectedEvent(null);
                setAnalytics(null);
              }}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}