import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, AlertTriangle, TrendingUp, Award, Calendar, Clock, MapPin } from 'lucide-react';
import { NetradyneEvent } from '../mockData';

interface NetradyneEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: NetradyneEvent[];
  driverMetrics: any;
}

export function NetradyneEventsModal({ isOpen, onClose, events, driverMetrics }: NetradyneEventsModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  if (!isOpen) return null;

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      speeding: 'Speeding',
      hardBraking: 'Hard Braking',
      phoneUse: 'Phone Use',
      seatbelt: 'Seatbelt',
      stopSign: 'Stop Sign',
      following: 'Following Distance'
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      speeding: 'bg-red-50 text-red-700',
      hardBraking: 'bg-orange-50 text-orange-700',
      phoneUse: 'bg-purple-50 text-purple-700',
      seatbelt: 'bg-yellow-50 text-yellow-700',
      stopSign: 'bg-red-50 text-red-700',
      following: 'bg-blue-50 text-blue-700'
    };
    return colors[type] || 'bg-gray-50 text-gray-700';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  // Group events by type for analytics
  const eventsByType = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-w-md mx-auto max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Safety Performance</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto">
          {/* Safety Score Overview */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Current Safety Score</p>
              <p className="text-5xl font-bold text-primary mb-2">
                {driverMetrics.weeklyAverage.safetyScore}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">Improving trend</span>
              </div>
            </div>
            
            {/* Achievements */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {driverMetrics.achievements.slice(0, 3).map((achievement: any) => (
                <div key={achievement.id} className="bg-white rounded-lg p-2 text-center">
                  <Award className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                  <p className="text-xs font-medium line-clamp-1">{achievement.title}</p>
                </div>
              ))}
            </div>
          </div>

          <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-2 m-4">
              <TabsTrigger value="events">Recent Events</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="px-4 pb-4 space-y-3">
              {/* Period Selector */}
              <div className="flex gap-2">
                {['today', 'week', 'month'].map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className="flex-1 capitalize"
                  >
                    {period}
                  </Button>
                ))}
              </div>

              {/* Events List */}
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getEventTypeColor(event.type)}>
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        <Badge variant="outline" className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                        {event.speed && (
                          <div className="font-medium">
                            Speed: {event.speed} mph
                          </div>
                        )}
                        {event.duration && (
                          <div className="font-medium">
                            Duration: {event.duration}s
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="px-4 pb-4 space-y-4">
              {/* Event Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Event Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(eventsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{getEventTypeLabel(type)}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(count / events.length) * 100}%` }}
                            />
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Weekly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">This Week</span>
                      <span className="font-bold">{events.filter(e => {
                        const eventDate = new Date(e.timestamp);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return eventDate >= weekAgo;
                      }).length} events</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Week</span>
                      <span className="font-bold">5 events</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 pt-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">40% improvement</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    Safety Tips
                  </h3>
                  <ul className="text-sm space-y-1 text-blue-800">
                    <li>• Maintain 3-second following distance</li>
                    <li>• Use cruise control on highways</li>
                    <li>• Take breaks every 2 hours</li>
                    <li>• Check blind spots before lane changes</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}