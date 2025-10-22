import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  ChevronRight,
  ArrowLeft,
  Share2,
  Heart,
  Star,
  Sparkles,
  UserPlus,
  CheckCircle,
  Globe,
  Building,
  Mail,
  Link
} from 'lucide-react';
import { PortalEventsService } from '@/services/portal-events.service';
import { PortalEvent, EventDate } from '@/types/portal-events';
import { format, isFuture, isPast } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { portalRoute } from '@/lib/portal/navigation';

export function EventDetailsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<PortalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<EventDate | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
      checkRegistration();
    }
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await PortalEventsService.getEvent(id);
      setEvent(data);
      
      // Auto-select first upcoming date
      const upcomingDates = data.dates?.filter(d => 
        isFuture(new Date(d.start_time))
      ).sort((a, b) => 
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
      
      if (upcomingDates && upcomingDates.length > 0) {
        setSelectedDate(upcomingDates[0]);
      } else if (data.dates && data.dates.length > 0) {
        setSelectedDate(data.dates[0]);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load event details'
      });
      navigate(portalRoute('/events'));
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    try {
      const registrations = await PortalEventsService.getUserRegistrations();
      setIsRegistered(registrations.some(r => r.event_id === id));
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const handleRegister = async () => {
    if (!selectedDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select an event date'
      });
      return;
    }

    try {
      await PortalEventsService.registerForEvent({
        event_date_id: selectedDate.id,
        guests: []
      });
      
      toast({
        title: 'Success!',
        description: 'You have successfully registered for this event'
      });
      
      setIsRegistered(true);
      loadEvent(); // Refresh to update attendee counts
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to register for event'
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: `Check out this event: ${event?.title}`,
        url: window.location.href
      });
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied!',
      description: 'Event link has been copied to your clipboard'
    });
    setShowShareMenu(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found</p>
        <Button className="mt-4" onClick={() => navigate(portalRoute('/events'))}>
          Back to Events
        </Button>
      </div>
    );
  }

  const isVideoEvent = event.type === 'video_call';
  const hasUpcomingDates = event.dates?.some(d => isFuture(new Date(d.start_time)));
  const totalCapacity = event.dates?.reduce((sum, date) => 
    sum + (date.max_attendees || 0), 0
  ) || 0;
  const totalRegistered = event.dates?.reduce((sum, date) => 
    sum + date.current_attendees, 0
  ) || 0;
  const spotsRemaining = totalCapacity > 0 ? totalCapacity - totalRegistered : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="relative p-8 md:p-12">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm"
            className="mb-6"
            onClick={() => navigate(portalRoute('/events'))}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>

          {/* Event Title & Badges */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {hasUpcomingDates && (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Upcoming Event
                </Badge>
              )}
              <Badge variant={isVideoEvent ? "secondary" : "default"}>
                {isVideoEvent ? (
                  <><Video className="h-3 w-3 mr-1" /> Virtual Event</>
                ) : (
                  <><MapPin className="h-3 w-3 mr-1" /> In-Person</>
                )}
              </Badge>
              {event.is_private && (
                <Badge variant="outline">
                  Portal Members Only
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {event.title}
            </h1>

            {/* Key Stats */}
            <div className="flex flex-wrap gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{totalRegistered} Registered</span>
              </div>
              {spotsRemaining !== null && spotsRemaining > 0 && (
                <div className="flex items-center gap-2 text-orange-500">
                  <Star className="h-4 w-4" />
                  <span className="font-semibold">Only {spotsRemaining} spots left!</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{event.dates?.length || 0} Session{event.dates?.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-8">
            {hasUpcomingDates && !isRegistered && (
              <Button size="lg" className="shadow-lg" onClick={handleRegister}>
                <CheckCircle className="h-5 w-5 mr-2" />
                Register Now
              </Button>
            )}
            {isRegistered && (
              <Button size="lg" variant="secondary" disabled>
                <CheckCircle className="h-5 w-5 mr-2" />
                You're Registered!
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={handleShare}>
              <Share2 className="h-5 w-5 mr-2" />
              Share Event
            </Button>
            
            {/* Share Menu Dropdown */}
            {showShareMenu && (
              <div className="absolute top-full mt-2 right-8 bg-popover border rounded-lg shadow-lg p-2 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={copyLink}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    window.open(`mailto:?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(`Check out this event: ${window.location.href}`)}`);
                    setShowShareMenu(false);
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {event.description && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-primary" />
                  About This Event
                </h2>
                <div 
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              </CardContent>
            </Card>
          )}

          {/* Event Dates */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <CalendarDays className="h-5 w-5 mr-2 text-primary" />
                Event Schedule
              </h2>
              
              <div className="space-y-3">
                {event.dates?.map((date) => {
                  const isUpcoming = isFuture(new Date(date.start_time));
                  const isPastDate = isPast(new Date(date.end_time));
                  const isFull = date.max_attendees ? date.current_attendees >= date.max_attendees : false;
                  
                  return (
                    <div
                      key={date.id}
                      onClick={() => isUpcoming && !isFull ? setSelectedDate(date) : null}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        selectedDate?.id === date.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50",
                        isPastDate && "opacity-50",
                        isFull && "opacity-75",
                        isUpcoming && !isFull && "cursor-pointer"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-semibold">
                              {format(new Date(date.start_time), 'EEEE, MMMM d, yyyy')}
                            </span>
                            {selectedDate?.id === date.id && (
                              <Badge className="bg-primary/10">Selected</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(new Date(date.start_time), 'h:mm a')} - 
                              {format(new Date(date.end_time), 'h:mm a')}
                            </span>
                          </div>
                          
                          {date.max_attendees && (
                            <div className="flex items-center gap-3">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {date.current_attendees} / {date.max_attendees} attendees
                                </span>
                                {isFull && (
                                  <Badge variant="destructive" className="text-xs">FULL</Badge>
                                )}
                                {!isFull && date.max_attendees - date.current_attendees <= 5 && (
                                  <Badge variant="outline" className="text-xs text-orange-500 border-orange-500">
                                    {date.max_attendees - date.current_attendees} spots left
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {isPastDate && (
                          <Badge variant="secondary">Past</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Location/Video Details */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center">
                {isVideoEvent ? (
                  <><Video className="h-4 w-4 mr-2 text-primary" /> Join Online</>
                ) : (
                  <><MapPin className="h-4 w-4 mr-2 text-primary" /> Event Location</>
                )}
              </h3>
              
              {isVideoEvent ? (
                <div className="space-y-3">
                  {event.video_platform && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium capitalize">{event.video_platform}</p>
                        <p className="text-sm text-muted-foreground">Video Platform</p>
                      </div>
                    </div>
                  )}
                  
                  {isRegistered && event.video_url && (
                    <div className="pt-3 border-t">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => window.open(event.video_url, '_blank')}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Video Call
                      </Button>
                      {event.video_passcode && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Passcode: <code className="bg-muted px-1 rounded">{event.video_passcode}</code>
                        </p>
                      )}
                    </div>
                  )}
                  
                  {!isRegistered && (
                    <p className="text-sm text-muted-foreground italic">
                      Video link will be available after registration
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {event.location_name && (
                    <div className="flex items-start gap-3">
                      <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{event.location_name}</p>
                        {event.location_address && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {event.location_address}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {event.location_url && (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => window.open(event.location_url, '_blank')}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Map
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registration Info */}
          {event.registration_deadline && (
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-orange-500" />
                  Registration Deadline
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.registration_deadline), 'PPP')}
                </p>
                {isFuture(new Date(event.registration_deadline)) && (
                  <p className="text-xs text-orange-500 mt-2">
                    Register before it's too late!
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Guest Policy */}
          {event.max_guests_per_registration > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center">
                  <UserPlus className="h-4 w-4 mr-2 text-primary" />
                  Guest Policy
                </h3>
                <p className="text-sm text-muted-foreground">
                  You can bring up to {event.max_guests_per_registration} guest{event.max_guests_per_registration > 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Event Host */}
          {event.creator && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Event Host</h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {event.creator.first_name} {event.creator.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{event.creator.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}