import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MapPin, Package, Clock, CheckCircle } from 'lucide-react';
import { WavePlanningData } from '../mockData';

interface RouteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeData: WavePlanningData;
  deliveredCount: number;
}

export function RouteDetailsModal({ isOpen, onClose, routeData, deliveredCount }: RouteDetailsModalProps) {
  if (!isOpen) return null;

  const completedStops = routeData.stops.filter(s => s.status === 'completed').length;
  const currentStop = routeData.stops.find(s => s.status === 'in-progress');
  const upcomingStops = routeData.stops.filter(s => s.status === 'pending').slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-w-md mx-auto max-h-[85vh] animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Route Details</h2>
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
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Route Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Route Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Route ID</p>
                  <p className="font-medium">{routeData.routeId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Wave/Pad</p>
                  <p className="font-medium">Wave {routeData.waveNumber} • {routeData.padNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Progress</p>
                  <p className="font-medium">{deliveredCount}/{routeData.packageCount} packages</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stops</p>
                  <p className="font-medium">{completedStops}/{routeData.stops.length} completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Stop */}
          {currentStop && (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  Current Stop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{currentStop.address}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          <Package className="h-3 w-3 inline mr-1" />
                          {currentStop.packages} packages
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          ETA: {currentStop.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Stops */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Stops</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingStops.map((stop, idx) => (
                <div key={stop.id} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                    {completedStops + idx + 2}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{stop.address}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {stop.packages} packages
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {stop.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {routeData.stops.filter(s => s.status === 'pending').length > 5 && (
                <p className="text-center text-sm text-muted-foreground">
                  +{routeData.stops.filter(s => s.status === 'pending').length - 5} more stops
                </p>
              )}
            </CardContent>
          </Card>

          {/* Completed Stops Summary */}
          {completedStops > 0 && (
            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">{completedStops} Stops Completed</p>
                    <p className="text-sm text-green-700">Great progress! Keep it up!</p>
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