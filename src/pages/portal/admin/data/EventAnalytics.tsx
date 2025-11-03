import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
  Calendar,
  Users,
  MapPin,
  Video,
  Search,
  Filter,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  fetchAllEventMetrics,
  fetchEventRegistrations,
  getEventStatusInfo,
  getAttendanceStatusInfo,
  type EventMetrics,
  type EventRegistrationDetail
} from '@/services/event-analytics.service';
import { UserAvatar } from '@/components/portal/admin/UserAvatar';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

// Helper to strip HTML tags and limit length
const stripHtml = (html: string | null | undefined, maxLength: number = 200): string => {
  if (!html) return '';
  // Remove HTML tags
  const stripped = html.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  const decoded = stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Trim whitespace
  const trimmed = decoded.trim().replace(/\s+/g, ' ');
  // Limit length
  if (trimmed.length > maxLength) {
    return trimmed.substring(0, maxLength) + '...';
  }
  return trimmed;
};

export function EventAnalytics() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState<EventMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [registrations, setRegistrations] = useState<EventRegistrationDetail[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<EventRegistrationDetail | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');

  // Load events
  useEffect(() => {
    loadEvents();
  }, []);

  // Load cached event from URL
  useEffect(() => {
    const eventIdParam = searchParams.get('event_id');
    if (eventIdParam && events.length > 0) {
      setSelectedEventId(eventIdParam);
    }
  }, [searchParams, events]);

  // Load registrations when event is selected
  useEffect(() => {
    if (selectedEventId) {
      loadRegistrations(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await fetchAllEventMetrics();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async (eventId: string) => {
    try {
      setLoadingRegistrations(true);
      const data = await fetchEventRegistrations(eventId);
      setRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load registrations',
        variant: 'destructive'
      });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    setSearchParams({ event_id: eventId });
  };

  const handleBackToList = () => {
    setSelectedEventId('');
    setSearchParams({});
    setRegistrations([]);
  };

  // Apply filters
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.user_email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAttendance = attendanceFilter === 'all' || reg.attendance_status === attendanceFilter;

    return matchesSearch && matchesAttendance;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Event Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track event performance and attendance metrics
          </p>
        </div>
        {selectedEventId && (
          <Button variant="outline" onClick={handleBackToList}>
            <X className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        )}
      </div>

      {!selectedEventId ? (
        /* Event List View */
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {events.length === 0
                    ? 'There are no events in the system yet. Events will appear here once they are created.'
                    : 'No events match your current filters. Try adjusting your search or filter criteria.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map(event => {
                const statusInfo = getEventStatusInfo(event.status);

                return (
                  <Card
                    key={event.event_id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleEventSelect(event.event_id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Event Date & Time */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(event.event_date), 'MMM d, yyyy')}</span>
                      </div>

                      {/* Location/Type */}
                      <div className="flex items-center gap-2 text-sm">
                        {event.type === 'virtual' || event.virtual_link ? (
                          <><Video className="h-4 w-4 text-muted-foreground" /><span>Virtual</span></>
                        ) : (
                          <><MapPin className="h-4 w-4 text-muted-foreground" /><span>{event.location || 'TBD'}</span></>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div>
                          <div className="text-2xl font-bold">{event.total_registrations}</div>
                          <div className="text-xs text-muted-foreground">Registrations</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{event.attendance_rate}%</div>
                          <div className="text-xs text-muted-foreground">Attendance</div>
                        </div>
                      </div>

                      {/* Capacity */}
                      {event.registration_limit && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Capacity</span>
                            <span className="font-medium">
                              {event.total_registrations}/{event.registration_limit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(event.capacity_percentage || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Created */}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Created {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Registration Detail View */
        <div className="space-y-4">
          {/* Event Info Card */}
          {events.find(e => e.event_id === selectedEventId) && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-2xl">
                      {events.find(e => e.event_id === selectedEventId)?.title}
                    </CardTitle>
                    {stripHtml(events.find(e => e.event_id === selectedEventId)?.description, 300) && (
                      <p className="text-muted-foreground mt-2">
                        {stripHtml(events.find(e => e.event_id === selectedEventId)?.description, 300)}
                      </p>
                    )}
                  </div>
                  <Badge className={getEventStatusInfo(events.find(e => e.event_id === selectedEventId)?.status).color}>
                    {getEventStatusInfo(events.find(e => e.event_id === selectedEventId)?.status).icon}{' '}
                    {getEventStatusInfo(events.find(e => e.event_id === selectedEventId)?.status).label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['total_registrations', 'attended_count', 'cancelled_count', 'no_show_count'].map(metric => {
                    const event = events.find(e => e.event_id === selectedEventId)!;
                    const value = event[metric as keyof EventMetrics];
                    const labels = {
                      total_registrations: { label: 'Total Registrations', icon: Users },
                      attended_count: { label: 'Attended', icon: CheckCircle2 },
                      cancelled_count: { label: 'Cancelled', icon: XCircle },
                      no_show_count: { label: 'No Shows', icon: AlertCircle }
                    };
                    const info = labels[metric as keyof typeof labels];
                    const Icon = info.icon;

                    return (
                      <div key={metric} className="text-center p-4 bg-gray-50 rounded-lg">
                        <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <div className="text-3xl font-bold">{value as number}</div>
                        <div className="text-sm text-muted-foreground">{info.label}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters for Registrations */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Registrations Table */}
          {loadingRegistrations ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No registrations found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {registrations.length === 0
                    ? 'There are no registrations for this event yet.'
                    : 'No registrations match your current filters.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredRegistrations.map(registration => {
                        const statusInfo = getAttendanceStatusInfo(registration.attendance_status);

                        return (
                          <tr key={registration.registration_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <UserAvatar
                                  firstName={registration.user_first_name}
                                  lastName={registration.user_last_name}
                                  email={registration.user_email}
                                  size="sm"
                                />
                                <div>
                                  <div className="font-medium">{registration.user_name}</div>
                                  <div className="text-sm text-muted-foreground">{registration.user_email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={statusInfo.color}>
                                {statusInfo.icon} {statusInfo.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">
                                {format(new Date(registration.registered_at), 'MMM d, yyyy')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(registration.registered_at), 'h:mm a')}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {registration.check_in_time ? (
                                <div className="text-sm">
                                  {format(new Date(registration.check_in_time), 'MMM d, h:mm a')}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRegistration(registration)}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Registration Detail Dialog */}
      <Dialog open={!!selectedRegistration} onOpenChange={(open) => !open && setSelectedRegistration(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <UserAvatar
                  firstName={selectedRegistration.user_first_name}
                  lastName={selectedRegistration.user_last_name}
                  email={selectedRegistration.user_email}
                  size="lg"
                />
                <div>
                  <div className="font-semibold text-lg">{selectedRegistration.user_name}</div>
                  <div className="text-sm text-muted-foreground">{selectedRegistration.user_email}</div>
                </div>
              </div>

              {/* Status */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                <Badge className={getAttendanceStatusInfo(selectedRegistration.attendance_status).color}>
                  {getAttendanceStatusInfo(selectedRegistration.attendance_status).icon}{' '}
                  {getAttendanceStatusInfo(selectedRegistration.attendance_status).label}
                </Badge>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Timeline</div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">Registered</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(selectedRegistration.registered_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>
                  {selectedRegistration.check_in_time && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                      <div>
                        <div className="text-sm font-medium">Checked In</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(selectedRegistration.check_in_time), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedRegistration.attended_at && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />
                      <div>
                        <div className="text-sm font-medium">Attended</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(selectedRegistration.attended_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </div>
                  )}
                  {selectedRegistration.cancelled_at && (
                    <div className="flex items-start gap-3">
                      <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
                      <div>
                        <div className="text-sm font-medium">Cancelled</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(selectedRegistration.cancelled_at), 'MMM d, yyyy h:mm a')}
                        </div>
                        {selectedRegistration.cancellation_reason && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Reason: {selectedRegistration.cancellation_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              {selectedRegistration.payment_amount && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Payment</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      ${selectedRegistration.payment_amount.toFixed(2)}
                    </span>
                    {selectedRegistration.payment_status && (
                      <Badge variant="outline">{selectedRegistration.payment_status}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRegistration.notes && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
                  <div className="text-sm p-3 bg-gray-50 rounded-lg">{selectedRegistration.notes}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
