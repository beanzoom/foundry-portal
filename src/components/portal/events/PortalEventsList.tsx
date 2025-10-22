import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { PortalEventsService } from '@/services/portal-events.service';
import { PortalEvent } from '@/types/portal-events';
import { format, isPast, isFuture } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { portalRoute } from '@/lib/portal/navigation';

export function PortalEventsList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await PortalEventsService.getEvents('published');
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load events'
      });
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingEvents = () => {
    return events.filter(event => {
      // If no dates, consider it upcoming (admin needs to add dates)
      if (!event.dates || event.dates.length === 0) {
        console.log(`Event "${event.title}" has no dates, treating as upcoming`);
        return true;
      }
      const hasUpcoming = event.dates.some(date => isFuture(new Date(date.start_time)));
      console.log(`Event "${event.title}" has upcoming dates:`, hasUpcoming, event.dates);
      return hasUpcoming;
    });
  };

  const getPastEvents = () => {
    return events.filter(event => {
      // If no dates, don't show in past
      if (!event.dates || event.dates.length === 0) {
        return false;
      }
      const isPastEvent = event.dates.every(date => isPast(new Date(date.end_time)));
      console.log(`Event "${event.title}" is past:`, isPastEvent, event.dates);
      return isPastEvent;
    });
  };

  const getNextEventDate = (event: PortalEvent) => {
    const futureDates = event.dates?.filter(date => 
      isFuture(new Date(date.start_time))
    ).sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    
    return futureDates?.[0];
  };

  const EventCard = ({ event }: { event: PortalEvent }) => {
    const nextDate = getNextEventDate(event);
    const isVideoEvent = event.type === 'video_call';
    const totalCapacity = event.dates?.reduce((sum, date) => 
      sum + (date.max_attendees || 0), 0
    ) || 0;
    const totalRegistered = event.dates?.reduce((sum, date) => 
      sum + date.current_attendees, 0
    ) || 0;

    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(portalRoute(`/events/${event.id}`))}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              {nextDate ? (
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(nextDate.start_time), 'PPP')}
                  <Clock className="h-4 w-4 ml-2" />
                  {format(new Date(nextDate.start_time), 'p')}
                </CardDescription>
              ) : event.dates && event.dates.length > 0 ? (
                <CardDescription className="text-muted-foreground">
                  All dates have passed
                </CardDescription>
              ) : (
                <CardDescription className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Coming Soon
                </CardDescription>
              )}
            </div>
            <Badge variant={isVideoEvent ? "secondary" : "default"}>
              {isVideoEvent ? (
                <><Video className="h-3 w-3 mr-1" /> Video Call</>
              ) : (
                <><MapPin className="h-3 w-3 mr-1" /> In-Person</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {event.description && (
            <div 
              className="text-sm text-muted-foreground mb-4 line-clamp-2"
              dangerouslySetInnerHTML={{ 
                __html: event.description.replace(/<[^>]*>/g, '') 
              }}
            />
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {isVideoEvent ? (
                <span className="flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  {event.video_platform || 'Online'}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location_name}
                </span>
              )}
              
              {totalCapacity > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {totalRegistered}/{totalCapacity}
                </span>
              )}
              
              {event.dates && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  {event.dates.length} {event.dates.length === 1 ? 'date' : 'dates'}
                </span>
              )}
            </div>
            
            <Button variant="ghost" size="sm">
              View Details
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  const upcomingEvents = getUpcomingEvents();
  const pastEvents = getPastEvents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portal Events</h1>
        <p className="text-muted-foreground">
          Browse and register for upcoming events
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
                <p className="text-muted-foreground">
                  There are no upcoming events at this time. Check back later!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastEvents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Past Events</h3>
                <p className="text-muted-foreground">
                  There are no past events to display.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}