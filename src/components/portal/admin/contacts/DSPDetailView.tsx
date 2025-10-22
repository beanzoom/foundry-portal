import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { contactTrackingService } from '@/services/contact-tracking.service';
import { DSPFormEnhanced } from './DSPFormEnhanced';
import type { DSP, Contact, DSPLocation } from '@/types/contact-tracking';
import {
  Building,
  Globe,
  MapPin,
  Users,
  Edit,
  ArrowLeft,
  Phone,
  Mail,
  User,
  Calendar,
  MessageSquare,
  ExternalLink,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DSPDetailView() {
  const { dspId } = useParams<{ dspId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [dsp, setDSP] = useState<DSP | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (dspId) {
      loadDSPData();
    }
  }, [dspId]);

  const loadDSPData = async () => {
    if (!dspId) return;
    
    setLoading(true);
    try {
      // Load DSP with locations
      const dspData = await contactTrackingService.getDSPWithLocations(dspId);
      setDSP(dspData);
      
      // Load contacts
      const contactsData = await contactTrackingService.getDSPContacts(dspId);
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading DSP data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load DSP details',
      });
    } finally {
      setLoading(false);
    }
  };

  const getContactsByTitle = (title: string) => {
    return contacts.filter(c => c.title === title);
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!dsp) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">DSP Not Found</h3>
        <p className="text-muted-foreground mt-2">
          The requested DSP could not be found.
        </p>
        <Button onClick={() => navigate('/portal/admin/contacts')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  // Build breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Contacts', href: '/portal/admin/contacts' },
    { label: 'Organization', href: '/portal/admin/contacts/organization' },
    { label: 'DSPs', href: '/portal/admin/contacts/organization/dsps' },
    { label: dsp?.dsp_code || dsp?.dsp_name || 'Details', current: true },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/portal/admin/contacts/organization/dsps')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to DSPs
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {dsp.dsp_code && (
                <Badge variant="outline" className="text-base">
                  {dsp.dsp_code}
                </Badge>
              )}
              {dsp.dsp_name}
            </h1>
            {dsp.website && (
              <a
                href={dsp.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
              >
                <Globe className="h-3 w-3" />
                {dsp.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <Button onClick={() => setShowEditForm(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit DSP
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Operating Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dsp.locations?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contact Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div>
                <div className="text-lg font-bold">
                  {getContactsByTitle('Owner').length}
                </div>
                <p className="text-xs text-muted-foreground">Owners</p>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {getContactsByTitle('Ops').length}
                </div>
                <p className="text-xs text-muted-foreground">Ops</p>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {getContactsByTitle('Dispatch').length}
                </div>
                <p className="text-xs text-muted-foreground">Dispatch</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">
            Locations ({dsp.locations?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts ({contacts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DSP Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  DSP Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">DSP Code</p>
                  <p className="font-medium">{dsp.dsp_code || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DSP Name</p>
                  <p className="font-medium">{dsp.dsp_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  {dsp.website ? (
                    <a
                      href={dsp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {dsp.website}
                    </a>
                  ) : (
                    <p className="font-medium text-muted-foreground">Not set</p>
                  )}
                </div>
                {dsp.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded">{dsp.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Key Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contacts.slice(0, 5).map(contact => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/portal/admin/contacts/${contact.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(`${contact.first_name} ${contact.last_name}`)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {contact.title}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                {contacts.length > 5 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab('contacts')}
                  >
                    View All {contacts.length} Contacts
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Operating Locations</CardTitle>
            </CardHeader>
            <CardContent>
              {dsp.locations && dsp.locations.length > 0 ? (
                <div className="space-y-3">
                  {dsp.locations.map((location: DSPLocation) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {location.station_code}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {location.market_name}
                          </p>
                        </div>
                        {location.is_primary && (
                          <Badge variant="default" className="ml-2">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contacts.filter(c => 
                          c.dsp_locations?.some(dl => dl.id === location.id)
                        ).length} contacts
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No locations configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length > 0 ? (
                <div className="space-y-4">
                  {['Owner', 'Ops', 'Dispatch'].map(title => {
                    const titleContacts = getContactsByTitle(title);
                    if (titleContacts.length === 0) return null;
                    
                    return (
                      <div key={title}>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">
                          {title} ({titleContacts.length})
                        </h4>
                        <div className="space-y-2">
                          {titleContacts.map(contact => (
                            <div
                              key={contact.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {getInitials(`${contact.first_name} ${contact.last_name}`)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {contact.first_name} {contact.last_name}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    {contact.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        {contact.email}
                                      </span>
                                    )}
                                    {contact.phone && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {contact.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/portal/admin/contacts/${contact.id}`)}
                              >
                                View
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No contacts found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Form */}
      {showEditForm && (
        <DSPFormEnhanced
          dsp={dsp}
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSuccess={() => {
            setShowEditForm(false);
            loadDSPData();
          }}
        />
      )}
    </div>
  );
}