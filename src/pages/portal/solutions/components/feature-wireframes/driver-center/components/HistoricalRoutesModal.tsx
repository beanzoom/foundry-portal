import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, TrendingUp, TrendingDown, Package, Clock, Award, BarChart3, Calendar } from 'lucide-react';

interface HistoricalRoutesModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: any[];
  driverMetrics: any;
}

export function HistoricalRoutesModal({ isOpen, onClose, routes, driverMetrics }: HistoricalRoutesModalProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('week');

  if (!isOpen) return null;

  // Calculate totals and averages
  const totalPackages = routes.reduce((sum, route) => sum + route.packages, 0);
  const totalStops = routes.reduce((sum, route) => sum + route.stops, 0);
  const avgOnTimeDelivery = (routes.reduce((sum, route) => sum + route.onTimeDelivery, 0) / routes.length).toFixed(1);
  const avgSafetyScore = (routes.reduce((sum, route) => sum + route.safetyScore, 0) / routes.length).toFixed(1);

  // Mock data for charts
  const weeklyData = [
    { day: 'Mon', packages: 152, onTime: 98 },
    { day: 'Tue', packages: 139, onTime: 97 },
    { day: 'Wed', packages: 161, onTime: 96 },
    { day: 'Thu', packages: 147, onTime: 99 },
    { day: 'Fri', packages: 158, onTime: 98 }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-w-md mx-auto max-h-[90vh] animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Route Analytics</h2>
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
        <div className="overflow-y-auto p-4 space-y-4">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {['week', 'month', 'quarter'].map((range) => (
              <Button
                key={range}
                variant={selectedTimeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange(range)}
                className="flex-1 capitalize"
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Performance Overview */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{totalPackages}</p>
                  <p className="text-xs text-muted-foreground">Total Packages</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{totalStops}</p>
                  <p className="text-xs text-muted-foreground">Total Stops</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{avgOnTimeDelivery}%</p>
                  <p className="text-xs text-muted-foreground">Avg On-Time</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{avgSafetyScore}</p>
                  <p className="text-xs text-muted-foreground">Avg Safety Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Performance Chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Weekly Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyData.map((day) => (
                  <div key={day.day} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{day.day}</span>
                      <span className="text-muted-foreground">{day.packages} packages</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Progress value={day.packages / 200 * 100} className="h-2 flex-1" />
                      <Badge variant="outline" className="text-xs">
                        {day.onTime}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg Daily Packages</span>
                </div>
                <span className="font-bold">{Math.round(totalPackages / routes.length)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg Route Duration</span>
                </div>
                <span className="font-bold">7.8 hrs</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Efficiency Trend</span>
                </div>
                <Badge className="bg-green-100 text-green-800">+5%</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Routes Detail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Routes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {routes.slice(0, 5).map((route) => (
                <div key={route.routeId} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-sm">{route.routeId}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(route.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50">
                      {route.onTimeDelivery}% OTP
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Packages</p>
                      <p className="font-medium">{route.packages}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stops</p>
                      <p className="font-medium">{route.stops}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Safety</p>
                      <p className="font-medium">{route.safetyScore}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-600" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🏆</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Perfect Week</p>
                    <p className="text-xs text-muted-foreground">100% on-time delivery</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">⚡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Speed Demon</p>
                    <p className="text-xs text-muted-foreground">Fastest route completion</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}