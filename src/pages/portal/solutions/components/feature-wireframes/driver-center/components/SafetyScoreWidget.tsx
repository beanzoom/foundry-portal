import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { NetradyneEvent } from '../mockData';

interface SafetyScoreWidgetProps {
  events: NetradyneEvent[];
  weeklyScore: number;
  trend: 'improving' | 'declining' | 'stable';
}

export function SafetyScoreWidget({ events, weeklyScore, trend }: SafetyScoreWidgetProps) {
  // Count events by type for today
  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.timestamp).toDateString();
    const today = new Date().toDateString();
    return eventDate === today;
  });

  const eventCounts = {
    speeding: todayEvents.filter(e => e.type === 'speeding').length,
    distraction: todayEvents.filter(e => e.type === 'distraction').length,
    seatbelt: todayEvents.filter(e => e.type === 'seatbelt').length,
    other: todayEvents.filter(e => !['speeding', 'distraction', 'seatbelt'].includes(e.type)).length
  };

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = () => {
    if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const totalTodayEvents = Object.values(eventCounts).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Safety Performance</CardTitle>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getScoreColor(weeklyScore)}`}>
              {weeklyScore.toFixed(1)}
            </span>
            {getTrendIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Today's Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {totalTodayEvents === 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Perfect Day!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Today's Events</span>
                </>
              )}
            </div>
            <Badge variant={totalTodayEvents === 0 ? 'outline' : 'secondary'}>
              {totalTodayEvents}
            </Badge>
          </div>

          {/* Event Breakdown */}
          {totalTodayEvents > 0 && (
            <div className="space-y-2">
              {eventCounts.speeding > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Speeding</span>
                  <Badge variant="outline" className="bg-yellow-50">
                    {eventCounts.speeding}
                  </Badge>
                </div>
              )}
              {eventCounts.distraction > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Distraction</span>
                  <Badge variant="outline" className="bg-orange-50">
                    {eventCounts.distraction}
                  </Badge>
                </div>
              )}
              {eventCounts.seatbelt > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Seatbelt</span>
                  <Badge variant="outline" className="bg-red-50">
                    {eventCounts.seatbelt}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Weekly Summary */}
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">This Week</span>
              <span className="font-medium">{events.length} total events</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}