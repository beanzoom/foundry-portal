import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, BarChart3, Target } from 'lucide-react';

interface ExpectationsCardProps {
  expectations: {
    firstStop: string;
    lastStop: string;
    totalStops: number;
    stopsPerHour: number;
  };
}

export function ExpectationsCard({ expectations }: ExpectationsCardProps) {
  return (
    <Card className="border-l-4 border-l-purple-600 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-gray-900">
          <Target className="h-4 w-4 text-purple-600" />
          Expectations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Clock className="h-3 w-3 text-purple-600" />
              <span>First Stop</span>
            </div>
            <p className="font-semibold text-gray-900">{expectations.firstStop}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <Clock className="h-3 w-3 text-purple-600" />
              <span>Last Stop</span>
            </div>
            <p className="font-semibold text-gray-900">{expectations.lastStop}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <MapPin className="h-3 w-3 text-purple-600" />
              <span>Stops</span>
            </div>
            <p className="font-semibold text-gray-900">{expectations.totalStops}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <BarChart3 className="h-3 w-3 text-purple-600" />
              <span>Stops/Hour</span>
            </div>
            <p className="font-semibold text-gray-900">{expectations.stopsPerHour.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}