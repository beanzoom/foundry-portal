import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, Users, Package, AlertTriangle, TrendingUp, TrendingDown, 
  Calendar, Clock, Activity, BarChart3, Shield, Wrench,
  MapPin, DollarSign, CheckCircle, XCircle, AlertCircle,
  Timer, Gauge, Star, Route, UserCheck, Zap, Target
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart } from 'recharts';

export function OwnerDashboard() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // Real-time operational data
  const operationalData = {
    routesDispatched: 42,
    totalRoutes: 45,
    packagesAssigned: 4250,
    driversCheckedIn: 42,
    totalDrivers: 50,
    activeVehicles: 43,
    totalVehicles: 45,
    routeReadiness: 93.3,
    preRouteCompletion: 95.6
  };

  // Driver confirmation data
  const driverConfirmations = {
    confirmed: 42,
    declined: 3,
    noResponse: 5,
    total: 50,
    declineReasons: [
      { driver: 'James Wilson', reason: 'Excused', details: 'Family emergency' },
      { driver: 'Lisa Chen', reason: 'Unexcused', details: '' },
      { driver: 'Robert Taylor', reason: 'Excused', details: 'Medical appointment' }
    ]
  };

  // Wave and Pad breakdown
  const wavePadData = [
    { 
      wave: 1, 
      pads: [
        { pad: 1, inTime: '9:50 AM', outTime: '10:10 AM', routes: 5, packages: 350, vehicleTypes: { EDV: 3, PRIME: 2 } },
        { pad: 2, inTime: '9:55 AM', outTime: '10:15 AM', routes: 5, packages: 380, vehicleTypes: { EDV: 2, XL: 2, STANDARD: 1 } },
        { pad: 3, inTime: '10:00 AM', outTime: '10:20 AM', routes: 5, packages: 320, vehicleTypes: { PRIME: 3, STANDARD: 2 } }
      ]
    },
    { 
      wave: 2, 
      pads: [
        { pad: 1, inTime: '10:10 AM', outTime: '10:30 AM', routes: 5, packages: 360, vehicleTypes: { EDV: 4, PRIME: 1 } },
        { pad: 2, inTime: '10:15 AM', outTime: '10:35 AM', routes: 5, packages: 340, vehicleTypes: { XL: 3, STANDARD: 2 } },
        { pad: 3, inTime: '10:20 AM', outTime: '10:40 AM', routes: 5, packages: 330, vehicleTypes: { EDV: 2, PRIME: 2, XL: 1 } }
      ]
    },
    { 
      wave: 3, 
      pads: [
        { pad: 1, inTime: '10:30 AM', outTime: '10:50 AM', routes: 5, packages: 310, vehicleTypes: { STANDARD: 3, XL: 2 } },
        { pad: 2, inTime: '10:35 AM', outTime: '10:55 AM', routes: 5, packages: 290, vehicleTypes: { EDV: 3, PRIME: 2 } },
        { pad: 3, inTime: '10:40 AM', outTime: '11:00 AM', routes: 5, packages: 300, vehicleTypes: { XL: 2, STANDARD: 3 } }
      ]
    }
  ];

  // Wave package distribution
  const wavePackageData = [
    { wave: 'Wave 1', packages: 1050, routes: 15, avgPerRoute: 70 },
    { wave: 'Wave 2', packages: 1030, routes: 15, avgPerRoute: 69 },
    { wave: 'Wave 3', packages: 900, routes: 15, avgPerRoute: 60 }
  ];

  // Vehicle utilization by type
  const vehicleUtilization = [
    { type: 'EDV', total: 15, active: 14, utilization: 93.3 },
    { type: 'PRIME', total: 10, active: 9, utilization: 90 },
    { type: 'XL', total: 10, active: 10, utilization: 100 },
    { type: 'STANDARD', total: 10, active: 10, utilization: 100 }
  ];

  // Critical maintenance issues
  const maintenanceAlerts = [
    { vehicle: 'EDV-07', issue: 'Oil leak detected', severity: 5, impact: 'Route reassignment needed' },
    { vehicle: 'PRIME-03', issue: 'Brake pads 80% worn', severity: 4, impact: 'Schedule for tomorrow' },
    { vehicle: 'XL-09', issue: 'Check engine light', severity: 3, impact: 'Monitor performance' }
  ];

  // Driver readiness leaders
  const topDrivers = [
    { name: 'John Smith', rating: 5, checkInTime: '4:45 AM', vehicleInspection: '100%', daysOnTime: 28 },
    { name: 'Sarah Johnson', rating: 5, checkInTime: '4:48 AM', vehicleInspection: '100%', daysOnTime: 26 },
    { name: 'Mike Davis', rating: 4.8, checkInTime: '4:52 AM', vehicleInspection: '100%', daysOnTime: 25 }
  ];

  // Route completion by service type
  const routeCompletion = [
    { name: 'EDV', value: 15, color: '#3B82F6' },
    { name: 'PRIME', value: 9, color: '#8B5CF6' },
    { name: 'XL', value: 10, color: '#10B981' },
    { name: 'STANDARD', value: 8, color: '#F59E0B' }
  ];

  // Weekly operation trend
  const weeklyTrend = [
    { day: 'Mon', packagesAssigned: 4150, routeReadiness: 98.2, routesAssigned: 45 },
    { day: 'Tue', packagesAssigned: 4280, routeReadiness: 97.8, routesAssigned: 46 },
    { day: 'Wed', packagesAssigned: 4320, routeReadiness: 98.5, routesAssigned: 47 },
    { day: 'Thu', packagesAssigned: 4180, routeReadiness: 97.2, routesAssigned: 45 },
    { day: 'Fri', packagesAssigned: 4250, routeReadiness: 97.8, routesAssigned: 45 },
    { day: 'Sat', packagesAssigned: 3950, routeReadiness: 98.8, routesAssigned: 43 },
    { day: 'Sun', packagesAssigned: 0, routeReadiness: 0, routesAssigned: 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header with time controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Operations Command Center</h2>
          <p className="text-gray-600">Express Logistics DSP - Real-time Performance Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">Last updated: 2 seconds ago</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={timeRange === 'today' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('today')}
            >
              Today
            </Button>
            <Button 
              variant={timeRange === 'week' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              Week
            </Button>
            <Button 
              variant={timeRange === 'month' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Critical KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Route Readiness</p>
                <p className="text-3xl font-bold text-green-700">{operationalData.routeReadiness}%</p>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  All pre-checks complete
                </p>
              </div>
              <Target className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Routes Dispatched</p>
                <p className="text-3xl font-bold text-blue-700">
                  {operationalData.routesDispatched}/{operationalData.totalRoutes}
                </p>
                <Progress value={(operationalData.routesDispatched/operationalData.totalRoutes)*100} className="h-2 mt-2" />
              </div>
              <Route className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Packages Assigned</p>
                <p className="text-3xl font-bold text-purple-700">
                  {operationalData.packagesAssigned.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600">
                  Daily manifest from Amazon
                </p>
              </div>
              <Package className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fleet Utilization</p>
                <p className="text-3xl font-bold text-orange-700">
                  {Math.round((operationalData.activeVehicles/operationalData.totalVehicles)*100)}%
                </p>
                <p className="text-xs text-orange-600">
                  {operationalData.activeVehicles} of {operationalData.totalVehicles} vehicles
                </p>
              </div>
              <Truck className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-teal-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drivers Checked In</p>
                <p className="text-3xl font-bold text-teal-700">
                  {operationalData.driversCheckedIn}/{operationalData.totalDrivers}
                </p>
                <p className="text-xs text-teal-600">
                  {operationalData.totalDrivers - operationalData.driversCheckedIn} pending arrival
                </p>
              </div>
              <Users className="h-10 w-10 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="operations">Live Operations</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
          <TabsTrigger value="fleet">Fleet Health</TabsTrigger>
          <TabsTrigger value="drivers">Driver Insights</TabsTrigger>
          <TabsTrigger value="planning">Tomorrow's Plan</TabsTrigger>
        </TabsList>

        {/* Live Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Driver Confirmations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Driver Confirmations
                </CardTitle>
                <CardDescription>Response deadline: 8:00 AM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{driverConfirmations.confirmed}</p>
                      <p className="text-sm text-gray-600">Confirmed</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-700">{driverConfirmations.declined}</p>
                      <p className="text-sm text-gray-600">Declined</p>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-700">{driverConfirmations.noResponse}</p>
                    <p className="text-sm text-gray-600">No Response</p>
                  </div>
                  <Progress 
                    value={(driverConfirmations.confirmed / driverConfirmations.total) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 text-center">
                    {Math.round((driverConfirmations.confirmed / driverConfirmations.total) * 100)}% confirmation rate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Wave Package Distribution */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Wave Package Distribution
                </CardTitle>
                <CardDescription>Package volume and route allocation by wave</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={wavePackageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="wave" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="packages" fill="#3B82F6" name="Total Packages">
                      {wavePackageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#8B5CF6', '#10B981'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {wavePackageData.map((wave, index) => (
                    <div key={wave.wave} className="text-center">
                      <p className="text-sm font-medium">{wave.wave}</p>
                      <p className="text-xs text-gray-600">{wave.avgPerRoute} pkg/route</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Wave and Pad Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Wave & Pad Schedule
              </CardTitle>
              <CardDescription>Detailed timing and vehicle allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {wavePadData.map((wave) => (
                  <div key={wave.wave} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">Wave {wave.wave}</h4>
                    <div className="space-y-1">
                      {wave.pads.map((pad) => (
                        <div key={`${wave.wave}-${pad.pad}`} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Pad {pad.pad}</span>
                            <Badge variant="outline" className="text-xs">
                              {pad.inTime} - {pad.outTime}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{pad.packages} pkg</span>
                            <div className="flex gap-1">
                              {Object.entries(pad.vehicleTypes).map(([type, count]) => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {count} {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Declined Drivers Alert */}
          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-5 w-5" />
                Driver Declines - Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {driverConfirmations.declineReasons.map((decline, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium">{decline.driver}</p>
                      <p className="text-sm text-gray-600">
                        {decline.reason}
                        {decline.details && `: ${decline.details}`}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={decline.reason === 'Excused' ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}
                    >
                      {decline.reason}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Find replacement drivers from standby pool
              </p>
            </CardContent>
          </Card>

          {/* Vehicle Utilization Grid */}
          <div className="grid grid-cols-4 gap-4">
            {vehicleUtilization.map((vehicle) => (
              <Card key={vehicle.type}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{vehicle.type} Fleet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">{vehicle.active}/{vehicle.total}</span>
                      <Badge variant="outline">{vehicle.utilization}%</Badge>
                    </div>
                    <Progress value={vehicle.utilization} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Weekly Operation Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Operation Trends</CardTitle>
                <CardDescription>Package assignments and route readiness</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="packagesAssigned" fill="#3B82F6" name="Packages Assigned" />
                    <Line yAxisId="right" type="monotone" dataKey="routeReadiness" stroke="#10B981" name="Route Readiness %" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Route Completion by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Route Completion by Service Type</CardTitle>
                <CardDescription>Today's route distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={routeCompletion}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {routeCompletion.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Load Time</p>
                    <p className="text-2xl font-bold">22 min</p>
                    <p className="text-xs text-green-600">-2 min vs last week</p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Routes/Driver</p>
                    <p className="text-2xl font-bold">0.9</p>
                    <p className="text-xs text-green-600">Optimal coverage</p>
                  </div>
                  <Zap className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">First Departure</p>
                    <p className="text-2xl font-bold">6:52 AM</p>
                    <p className="text-xs text-gray-600">Wave 1 on time</p>
                  </div>
                  <Timer className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Route Efficiency</p>
                    <p className="text-2xl font-bold">94.2%</p>
                    <p className="text-xs text-green-600">Above target</p>
                  </div>
                  <Gauge className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fleet Health Tab */}
        <TabsContent value="fleet" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Maintenance Overview */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Fleet Maintenance Status</CardTitle>
                <CardDescription>Vehicle health and maintenance requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="space-y-2">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold">38</p>
                      <p className="text-sm text-gray-600">Operational</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-yellow-600" />
                      </div>
                      <p className="text-2xl font-bold">5</p>
                      <p className="text-sm text-gray-600">Needs Service</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                        <Wrench className="h-8 w-8 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold">2</p>
                      <p className="text-sm text-gray-600">In Maintenance</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="h-8 w-8 text-red-600" />
                      </div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-sm text-gray-600">Grounded</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">EDV-12</p>
                      <p className="text-sm text-gray-600">Oil change due</p>
                    </div>
                    <Badge variant="outline">Tomorrow</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">PRIME-05</p>
                      <p className="text-sm text-gray-600">Tire rotation</p>
                    </div>
                    <Badge variant="outline">In 3 days</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">XL-08</p>
                      <p className="text-sm text-gray-600">Brake inspection</p>
                    </div>
                    <Badge variant="outline">In 5 days</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Cost Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Cost Analysis</CardTitle>
              <CardDescription>Monthly maintenance spending by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Preventive</p>
                  <p className="text-xl font-bold">$12,450</p>
                  <p className="text-xs text-green-600">-8% vs last month</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Repairs</p>
                  <p className="text-xl font-bold">$8,320</p>
                  <p className="text-xs text-red-600">+12% vs last month</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Tires</p>
                  <p className="text-xl font-bold">$3,200</p>
                  <p className="text-xs text-gray-600">No change</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Parts</p>
                  <p className="text-xl font-bold">$5,670</p>
                  <p className="text-xs text-green-600">-3% vs last month</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 font-medium">Total MTD</p>
                  <p className="text-xl font-bold text-purple-600">$29,640</p>
                  <p className="text-xs text-gray-600">Budget: $35,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Driver Insights Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Today's Early Birds
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topDrivers.map((driver, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-gray-600">Arrived: {driver.checkInTime}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">{driver.vehicleInspection}</span>
                        </div>
                        <p className="text-xs text-gray-600">{driver.daysOnTime} days on-time</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Driver Confirmation Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Confirmation Trends</CardTitle>
                <CardDescription>7-day driver response patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confirmed</span>
                    <div className="flex items-center gap-2">
                      <Progress value={84} className="w-24 h-2" />
                      <span className="text-sm font-medium">294/350</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Declined - Excused</span>
                    <div className="flex items-center gap-2">
                      <Progress value={8} className="w-24 h-2" />
                      <span className="text-sm font-medium">28/350</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Declined - Unexcused</span>
                    <div className="flex items-center gap-2">
                      <Progress value={4} className="w-24 h-2" />
                      <span className="text-sm font-medium">14/350</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">No Response</span>
                    <div className="flex items-center gap-2">
                      <Progress value={4} className="w-24 h-2" />
                      <span className="text-sm font-medium">14/350</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-600">Avg response time: 2.3 hours</p>
                  <p className="text-xs text-gray-600">Most declines: Tuesday (8)</p>
                </div>
              </CardContent>
            </Card>

            {/* Pre-Route Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Pre-Route Compliance
                </CardTitle>
                <CardDescription>Vehicle inspection and safety checks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-600">98%</p>
                    <p className="text-sm text-gray-600">Inspection Completion</p>
                    <Badge className="mt-2 bg-green-100 text-green-700">Excellent</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-xl font-bold">42</p>
                      <p className="text-xs text-gray-600">Passed Inspection</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-orange-600">3</p>
                      <p className="text-xs text-gray-600">Minor Issues</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Driver Decline Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Decline Analysis</CardTitle>
              <CardDescription>30-day decline patterns and reasons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Excused Declines</p>
                  <p className="text-2xl font-bold text-green-700">67</p>
                  <p className="text-xs text-gray-600">Avg: 2.2/day</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Unexcused Declines</p>
                  <p className="text-2xl font-bold text-red-700">23</p>
                  <p className="text-xs text-gray-600">Avg: 0.8/day</p>
                </div>
              </div>
              <div className="space-y-2">
                <h5 className="text-sm font-medium">Top Excused Reasons:</h5>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Medical/Health</span>
                    <span className="font-medium">28 (42%)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Family Emergency</span>
                    <span className="font-medium">21 (31%)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Vehicle Issues</span>
                    <span className="font-medium">12 (18%)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Other</span>
                    <span className="font-medium">6 (9%)</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Drivers with 3+ declines:</span>
                  <Badge variant="destructive" className="text-xs">4 drivers</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tomorrow's Plan Tab */}
        <TabsContent value="planning" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Tomorrow's Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Tomorrow's Operation Plan</CardTitle>
                <CardDescription>December 29, 2024 - Projected metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Expected Routes</p>
                      <p className="text-2xl font-bold">48</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Package Volume</p>
                      <p className="text-2xl font-bold">4,580</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Drivers Scheduled</p>
                      <p className="text-2xl font-bold">48</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Vehicles Available</p>
                      <p className="text-2xl font-bold">48</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resource Readiness */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Readiness Status</CardTitle>
                <CardDescription>Preparation for tomorrow's operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Driver Pool Submitted</span>
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Vehicle Pre-Checks</span>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      <Clock className="h-3 w-3 mr-1" />
                      In Progress
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Route Import</span>
                    <Badge className="bg-gray-100 text-gray-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">DEP Assignments</span>
                    <Badge className="bg-gray-100 text-gray-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Ready at 8PM
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Items */}
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">Action Required Before Tomorrow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Vehicle EDV-07</h4>
                  <p className="text-sm text-gray-600 mb-3">Oil leak repair must be completed</p>
                  <Button size="sm" className="w-full">Check Status</Button>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">3 Drivers Unconfirmed</h4>
                  <p className="text-sm text-gray-600 mb-3">Awaiting schedule confirmation</p>
                  <Button size="sm" className="w-full">Send Reminders</Button>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2">Route Import</h4>
                  <p className="text-sm text-gray-600 mb-3">Amazon manifest ready at 7PM</p>
                  <Button size="sm" className="w-full">Set Alert</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}