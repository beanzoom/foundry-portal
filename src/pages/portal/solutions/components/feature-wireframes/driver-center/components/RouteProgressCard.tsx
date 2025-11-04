import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Truck, Package, Clock, MapPin, ChevronRight, X, Gauge } from 'lucide-react';
import { WavePlanningData } from '../mockData';

interface RouteProgressCardProps {
  routeData: WavePlanningData;
  deliveredCount: number;
}

export function RouteProgressCard({ routeData, deliveredCount }: RouteProgressCardProps) {
  const [showStationInfo, setShowStationInfo] = useState(true);
  
  const progress = (deliveredCount / routeData.packageCount) * 100;
  
  return (
    <Card className="border-l-4 border-l-purple-600 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Route {routeData.routeId}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Badge variant="outline" className="border-purple-600 text-purple-700">
            Active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Station Info - Wave, Pad, Time, Staging */}
        {showStationInfo && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Wave</p>
                    <p className="font-bold text-lg text-gray-900">{routeData.waveNumber}</p>
                  </div>
                  <div className="border-l border-gray-300 pl-4">
                    <p className="text-xs text-gray-500">Pad</p>
                    <p className="font-bold text-lg text-gray-900">{routeData.padNumber}</p>
                  </div>
                  <div className="border-l border-gray-300 pl-4">
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-bold text-lg text-gray-900">{routeData.padTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Staging</p>
                    <p className="font-semibold text-gray-900">{routeData.stagingLocation}</p>
                  </div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-gray-400 hover:text-gray-600"
                onClick={() => setShowStationInfo(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Vehicle Info with Mileage */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Truck className="h-5 w-5 text-purple-700" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{routeData.vehicleName}</p>
              <p className="text-xs text-gray-500">
                {routeData.vehicleMake} {routeData.vehicleModel}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-gray-600">
                <Gauge className="h-4 w-4" />
                <span className="font-medium">{routeData.vehicleMileage.toLocaleString()} mi</span>
              </div>
            </div>
          </div>
        </div>

        {/* Package Progress with Commercial */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-700">Packages</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{routeData.packageCount}</p>
              {routeData.commercialPackages > 0 && (
                <p className="text-sm text-gray-500">{routeData.commercialPackages} commercial</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}