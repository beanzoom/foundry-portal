import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Truck, Package, Clock, AlertTriangle, Wrench, 
  BarChart3, MapPin, ChevronRight, Plus, Menu,
  Home, History, Settings, User, Bell, LogOut,
  TrendingUp, Award, Calendar, CheckCircle,
  GripVertical, Info
} from 'lucide-react';
import { RouteProgressCard } from './components/RouteProgressCard';
import { SafetyScoreWidget } from './components/SafetyScoreWidget';
import { ExpectationsCard } from './components/ExpectationsCard';
import { RouteDetailsModal } from './components/RouteDetailsModal';
import { NetradyneEventsModal } from './components/NetradyneEventsModal';
import { HistoricalRoutesModal } from './components/HistoricalRoutesModal';
import { SimpleMaintenanceModal } from './components/SimpleMaintenanceModal';
import { FinalizeRouteModal } from './components/FinalizeRouteModal';
import { 
  currentWaveData, 
  recentNetradyneEvents, 
  maintenanceRecords,
  historicalRoutes,
  driverMetrics 
} from './mockData';

export default function DriverCenterWireframe() {
  const [activeTab, setActiveTab] = useState('home');
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [showNetradyneEvents, setShowNetradyneEvents] = useState(false);
  const [showHistoricalRoutes, setShowHistoricalRoutes] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [showDEPDialog, setShowDEPDialog] = useState(false);
  const [deliveredCount, setDeliveredCount] = useState(43);
  
  // DEP state
  const [depOrder, setDepOrder] = useState(['R', 'W', 'P', 'V', 'T']);
  const depLabels = {
    'R': 'Route',
    'W': 'Wave',
    'P': 'Pad',
    'V': 'Vehicle',
    'T': 'Type'
  };

  const renderHomeScreen = () => (
    <div className="space-y-4">
      {/* Enhanced Route Progress Card */}
      <RouteProgressCard 
        routeData={currentWaveData}
        deliveredCount={deliveredCount}
      />

      {/* DEP Display */}
      <Card 
        className="cursor-pointer hover:shadow-sm transition-shadow"
        onClick={() => setShowDEPDialog(true)}
      >
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Settings className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Your DEP:</span>
              </div>
              <div className="flex items-center gap-1">
                {depOrder.map((item, index) => (
                  <span key={item} className="inline-flex items-center">
                    <span className={`text-sm font-medium ${
                      index === 0 ? 'text-purple-700' : 'text-gray-500'
                    }`}>
                      {item}
                    </span>
                    {index < depOrder.length - 1 && (
                      <span className="text-gray-300 mx-1">›</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </CardContent>
      </Card>

      {/* Expectations Card */}
      <ExpectationsCard expectations={currentWaveData.expectations} />

      {/* Finalize Route Button */}
      <Button 
        className="w-full h-14 text-lg font-semibold bg-purple-700 hover:bg-purple-800 text-white" 
        size="lg"
        onClick={() => setShowFinalizeModal(true)}
      >
        <CheckCircle className="h-5 w-5 mr-2" />
        Finalize Route
      </Button>

      {/* Quick Action - Report Issue */}
      <Button 
        variant="outline" 
        className="w-full h-16 flex items-center justify-center gap-2"
        onClick={() => setShowMaintenanceDialog(true)}
      >
        <Plus className="h-5 w-5" />
        <span>Report Vehicle Issue</span>
      </Button>

      {/* Safety Score Widget */}
      <div onClick={() => setShowNetradyneEvents(true)}>
        <SafetyScoreWidget 
          events={recentNetradyneEvents}
          weeklyScore={driverMetrics.weeklyAverage.safetyScore}
          trend="improving"
        />
      </div>
    </div>
  );

  const renderHistoryScreen = () => (
    <div className="space-y-4">
      <Tabs defaultValue="routes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="events">Safety Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="routes" className="space-y-3 mt-4">
          {/* Mock historical routes */}
          {historicalRoutes.map((route, idx) => (
            <Card key={idx} className="cursor-pointer" onClick={() => setShowHistoricalRoutes(true)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{route.routeId}</p>
                    <p className="text-sm text-muted-foreground">
                      {route.packages} packages • {(route.duration / 60).toFixed(1)} hours
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50">Completed</Badge>
                </div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-muted-foreground">
                    OTP: <span className="font-medium text-green-600">{route.onTimeDelivery}%</span>
                  </span>
                  <span className="text-muted-foreground">
                    Safety: <span className="font-medium text-purple-700">{route.safetyScore}</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" className="w-full" onClick={() => setShowHistoricalRoutes(true)}>
            View Detailed Analytics
            <BarChart3 className="h-4 w-4 ml-2" />
          </Button>
        </TabsContent>
        
        <TabsContent value="events" className="space-y-3 mt-4">
          {/* Mock safety events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Events</span>
                  <span className="font-bold">3</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Speeding</span>
                    <Badge variant="secondary">2</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Hard Braking</span>
                    <Badge variant="secondary">1</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderMaintenanceScreen = () => (
    <div className="space-y-4">
      <Button 
        className="w-full" 
        size="lg"
        onClick={() => setShowMaintenanceDialog(true)}
      >
        <Plus className="h-5 w-5 mr-2" />
        Report New Issue
      </Button>

      {/* Vehicle Info Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Truck className="h-6 w-6 text-purple-700" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{currentWaveData.vehicleName}</p>
              <p className="text-sm text-muted-foreground">
                {currentWaveData.vehicleMake} {currentWaveData.vehicleModel}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentWaveData.vehicleMileage.toLocaleString()} miles
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Maintenance Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {maintenanceRecords.filter(r => r.status !== 'resolved').map((record) => (
            <div key={record.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-sm">{record.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {record.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reported {new Date(record.reportedDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge 
                  variant="secondary" 
                  className={
                    record.status === 'pending' ? 'bg-yellow-50' : 
                    record.status === 'in-progress' ? 'bg-blue-50' : 
                    'bg-gray-50'
                  }
                >
                  {record.status}
                </Badge>
              </div>
            </div>
          ))}
          {maintenanceRecords.filter(r => r.status !== 'resolved').length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No active maintenance issues
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Oil Change</span>
              <span>15,432 miles</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Inspection</span>
              <span>30 days ago</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next Service Due</span>
              <span className="font-medium text-orange-600">18,000 miles</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaceScreen = () => (
    <div className="space-y-4">
      {/* PACE Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your PACE Status</CardTitle>
          <CardDescription>Performance and Conduct Excellence</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Level */}
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-2">
                <span className="text-2xl font-bold text-green-700">1</span>
              </div>
              <p className="text-sm text-muted-foreground">Current Level</p>
              <p className="text-xs text-green-600 mt-1">Great Standing</p>
            </div>

            {/* Points Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Points until next level</span>
                <span className="font-medium">3/10</span>
              </div>
              <Progress value={30} className="h-2" />
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <BarChart3 className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                <p className="text-xl font-bold">92</p>
                <p className="text-xs text-muted-foreground">Safety</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Award className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <p className="text-xl font-bold">88</p>
                <p className="text-xs text-muted-foreground">Quality</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                <p className="text-xl font-bold">95</p>
                <p className="text-xs text-muted-foreground">Efficiency</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Infractions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Infractions</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Hard Braking Event</p>
                <p className="text-xs text-muted-foreground">2 days ago • -2 points</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Late Arrival (15 min)</p>
                <p className="text-xs text-muted-foreground">1 week ago • -1 point</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Required Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Complete Safety Training Module
              </span>
              <Badge variant="destructive">Due Soon</Badge>
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Acknowledge Policy Update
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Trend</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Performance chart placeholder</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfileScreen = () => (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="h-8 w-8 text-purple-700" />
            </div>
            <div>
              <p className="font-semibold">John Driver</p>
              <p className="text-sm text-muted-foreground">Employee #12345</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-700">4.8</p>
              <p className="text-xs text-muted-foreground">Safety Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-700">98%</p>
              <p className="text-xs text-muted-foreground">On-Time Delivery</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-between"
            onClick={() => setShowPreferencesDialog(true)}
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Achievements
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col">
      {/* Mobile Status Bar Mock */}
      <div className="bg-black text-white text-xs p-1 flex justify-between items-center">
        <span>9:41 AM</span>
        <div className="flex gap-1">
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>
      
      {/* App Header */}
      <div className="bg-purple-700 text-white p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Driver Center</h1>
        <Button variant="ghost" size="icon" className="text-white hover:bg-purple-600">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="grid grid-cols-5 gap-1">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'history', icon: History, label: 'History' },
            { id: 'pace', icon: TrendingUp, label: 'PACE' },
            { id: 'maintenance', icon: Wrench, label: 'Maintenance' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 py-3 px-3 ${
                activeTab === id 
                  ? 'text-purple-700 border-b-2 border-purple-700' 
                  : 'text-gray-500'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'home' && renderHomeScreen()}
        {activeTab === 'history' && renderHistoryScreen()}
        {activeTab === 'pace' && renderPaceScreen()}
        {activeTab === 'maintenance' && renderMaintenanceScreen()}
        {activeTab === 'profile' && renderProfileScreen()}
      </div>
      
      {/* Modals */}
      {showMaintenanceDialog && (
        <SimpleMaintenanceModal 
          isOpen={showMaintenanceDialog}
          onClose={() => setShowMaintenanceDialog(false)}
        />
      )}
      
      {showRouteDetails && (
        <RouteDetailsModal
          isOpen={showRouteDetails}
          onClose={() => setShowRouteDetails(false)}
          routeData={currentWaveData}
          deliveredCount={deliveredCount}
        />
      )}
      
      {showNetradyneEvents && (
        <NetradyneEventsModal
          isOpen={showNetradyneEvents}
          onClose={() => setShowNetradyneEvents(false)}
          events={recentNetradyneEvents}
          driverMetrics={driverMetrics}
        />
      )}
      
      {showHistoricalRoutes && (
        <HistoricalRoutesModal
          isOpen={showHistoricalRoutes}
          onClose={() => setShowHistoricalRoutes(false)}
          routes={historicalRoutes}
          driverMetrics={driverMetrics}
        />
      )}
      
      {showFinalizeModal && (
        <FinalizeRouteModal
          isOpen={showFinalizeModal}
          onClose={() => setShowFinalizeModal(false)}
          currentMileage={currentWaveData.vehicleMileage}
          routeId={currentWaveData.routeId}
        />
      )}
      
      {/* Preferences Dialog */}
      <Dialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Preferences</DialogTitle>
            <DialogDescription>
              Customize your Driver Center experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => {
                setShowPreferencesDialog(false);
                setShowDEPDialog(true);
              }}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Driver Experience
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">New</Badge>
                <ChevronRight className="h-4 w-4" />
              </div>
            </Button>
            
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Settings
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Navigation Preferences
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Account Settings
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Driver Experience Preference (DEP) Dialog */}
      <Dialog open={showDEPDialog} onOpenChange={setShowDEPDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Driver Experience Preferences</DialogTitle>
            <DialogDescription>
              Help us match you with routes that fit your preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">How it works:</p>
                  <p className="text-xs">
                    Drag to reorder your preferences. We'll try to match you with routes 
                    based on your previous experience, starting with your top preference.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Current Order */}
            <div>
              <p className="text-sm font-medium mb-2">Your preference order:</p>
              <div className="space-y-2">
                {depOrder.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 p-3 bg-white border rounded-lg cursor-move hover:shadow-sm transition-shadow"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', index.toString());
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-purple-400');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-purple-400');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-purple-400');
                      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                      const toIndex = index;
                      
                      if (fromIndex !== toIndex) {
                        const newOrder = [...depOrder];
                        const [removed] = newOrder.splice(fromIndex, 1);
                        newOrder.splice(toIndex, 0, removed);
                        setDepOrder(newOrder);
                      }
                    }}
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-2 flex-1">
                      <span className={`font-bold text-lg ${index === 0 ? 'text-purple-700' : 'text-gray-600'}`}>
                        {item}
                      </span>
                      <span className="text-sm text-gray-600">= {depLabels[item]}</span>
                    </div>
                    <Badge variant={index === 0 ? 'default' : 'secondary'} className="text-xs">
                      {index === 0 ? 'Highest' : `#${index + 1}`}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Legend */}
            <div className="text-xs text-gray-600 space-y-1 pt-2 border-t">
              <p className="font-medium mb-1">Legend:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span><strong>R</strong> = Same Route</span>
                <span><strong>W</strong> = Same Wave/Time</span>
                <span><strong>P</strong> = Same Pad/Location</span>
                <span><strong>V</strong> = Same Vehicle</span>
                <span><strong>T</strong> = Same Vehicle Type</span>
              </div>
            </div>
            
            {/* Auto-save notice */}
            <div className="text-xs text-center text-gray-500 pt-2">
              <p>Changes are saved automatically</p>
            </div>
            
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}