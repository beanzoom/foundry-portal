import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  MapPin, Truck, Users, Clock, Package, BarChart3,
  CheckCircle, AlertCircle, RefreshCw, Layers,
  ArrowRight, Zap, Target, Calendar, Settings,
  AlertTriangle, Bell, ArrowUpDown, UserCheck,
  Timer, TrendingUp, Upload, FileSpreadsheet,
  MessageSquare, ChevronDown, Filter, X, Info,
  RotateCcw, Award, History, Sparkles, HelpCircle
} from 'lucide-react';

// Enhanced Types
interface Driver {
  id: string;
  name: string;
  vehicleTypes: string[]; // Qualifications
  daysSinceStandby: number; // Key for rotation fairness
  lastStandbyDate?: string;
  dep: string; // Driver Experience Preference (e.g., "RWPVT")
  assignedPool?: string; // For Pool Planning
  assignedRoute?: string; // For Wave Planning
  lastRoute?: {
    routeCode: string;
    wave: number;
    pad: number;
    vehicleType: string;
    vehicle: string;
  };
  rating: number;
}

interface Route {
  id: string;
  routeCode: string;
  serviceType: 'EDV' | 'PRIME' | 'XL' | 'STANDARD';
  wave: number;
  padNumber: number;
  padTime: string;
  packages: number;
  commercialPackages: number;
  vehicle?: string;
  driver?: string;
  status: 'complete' | 'warning' | 'incomplete';
}

interface Vehicle {
  id: string;
  name: string;
  type: 'EDV' | 'PRIME' | 'XL' | 'STANDARD';
  mileage: number;
  status: 'active' | 'maintenance' | 'grounded';
  assignedRoute?: string;
}

interface PoolRequest {
  EDV: number;
  PRIME: number;
  STANDARD: number;
  XL: number;
}

// Generate 60 drivers with realistic data
const generateDrivers = (): Driver[] => {
  const firstNames = [
    'John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa', 'James', 'Maria', 'Robert', 'Jennifer',
    'William', 'Patricia', 'Richard', 'Linda', 'Joseph', 'Barbara', 'Thomas', 'Elizabeth', 'Charles', 'Susan',
    'Christopher', 'Jessica', 'Daniel', 'Margaret', 'Matthew', 'Dorothy', 'Anthony', 'Ashley', 'Donald', 'Karen',
    'Mark', 'Nancy', 'Paul', 'Betty', 'Steven', 'Helen', 'Andrew', 'Sandra', 'Kenneth', 'Donna',
    'Joshua', 'Carol', 'Kevin', 'Ruth', 'Brian', 'Sharon', 'George', 'Michelle', 'Edward', 'Laura',
    'Ronald', 'Kimberly', 'Timothy', 'Deborah', 'Jason', 'Amy', 'Jeffrey', 'Angela', 'Ryan', 'Emma'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Lopez',
    'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White',
    'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright',
    'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Hill', 'Campbell', 'Mitchell', 'Roberts', 'Carter',
    'Phillips', 'Evans', 'Turner', 'Torres', 'Parker', 'Collins', 'Edwards', 'Stewart', 'Flores', 'Morris',
    'Nguyen', 'Murphy', 'Rivera', 'Cook', 'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed', 'Bailey'
  ];

  const depPatterns = ['RWPVT', 'WRPVT', 'RPWVT', 'VTWRP', 'TWRVP', 'PVRWT'];

  const drivers: Driver[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < 60; i++) {
    let fullName: string;

    // Ensure unique names - use index-based selection if needed
    if (i < firstNames.length) {
      fullName = `${firstNames[i]} ${lastNames[i]}`;
    } else {
      // Generate a unique combination for remaining drivers
      do {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        fullName = `${firstName} ${lastName}`;
      } while (usedNames.has(fullName));
    }

    usedNames.add(fullName);

    // Distribute vehicle qualifications realistically - most drivers can drive most vehicle types
    let vehicleTypes: string[] = [];
    if (i < 30) {
      // 50% of drivers are qualified for all vehicle types (most versatile)
      vehicleTypes = ['EDV', 'PRIME', 'STANDARD', 'XL'];
    } else if (i < 45) {
      // 25% of drivers qualified for 3 types (rotate which 3)
      const combinations = [
        ['EDV', 'PRIME', 'STANDARD'],
        ['EDV', 'PRIME', 'XL'],
        ['EDV', 'STANDARD', 'XL'],
        ['PRIME', 'STANDARD', 'XL']
      ];
      vehicleTypes = combinations[i % 4];
    } else if (i < 55) {
      // 16.7% of drivers qualified for 2 types (rotate which 2)
      const combinations = [
        ['EDV', 'PRIME'],
        ['EDV', 'STANDARD'],
        ['EDV', 'XL'],
        ['PRIME', 'STANDARD'],
        ['PRIME', 'XL'],
        ['STANDARD', 'XL']
      ];
      vehicleTypes = combinations[i % 6];
    } else {
      // Only 8.3% of drivers are single-qualified (rare cases)
      const types = ['EDV', 'PRIME', 'STANDARD', 'XL'];
      vehicleTypes = [types[i % 4]];
    }

    // Create realistic standby distribution (0-14 days)
    const daysSinceStandby = Math.floor(Math.random() * 15);

    drivers.push({
      id: `D${i + 1}`,
      name: fullName,
      vehicleTypes,
      daysSinceStandby,
      lastStandbyDate: daysSinceStandby > 0 ?
        new Date(Date.now() - daysSinceStandby * 24 * 60 * 60 * 1000).toLocaleDateString() :
        'Never',
      dep: depPatterns[Math.floor(Math.random() * depPatterns.length)],
      rating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
      lastRoute: Math.random() > 0.3 ? {
        routeCode: `CX${Math.floor(Math.random() * 50) + 1}`,
        wave: Math.floor(Math.random() * 2) + 1,
        pad: Math.floor(Math.random() * 5) + 1,
        vehicleType: vehicleTypes[0],
        vehicle: `${vehicleTypes[0]}-${Math.floor(Math.random() * 20) + 1}`
      } : undefined
    });
  }

  return drivers.sort((a, b) => b.daysSinceStandby - a.daysSinceStandby);
};

// Generate routes with proper wave and pad structure
const generateRoutes = (): Route[] => {
  const routes: Route[] = [];
  const serviceTypes: ('EDV' | 'PRIME' | 'XL' | 'STANDARD')[] = ['EDV', 'PRIME', 'XL', 'STANDARD'];

  let routeIndex = 0;
  let currentPad = 1;
  let currentWave = 1;
  let routesInCurrentPad = 0;

  // Create routes with realistic pad distribution (8-12 routes per pad)
  while (routeIndex < 50) {
    // Determine number of routes for this pad (8-12)
    const routesForThisPad = Math.floor(Math.random() * 5) + 8; // 8 to 12 routes

    for (let j = 0; j < routesForThisPad && routeIndex < 50; j++) {
      // Distribute service types somewhat evenly
      const serviceType = routeIndex < 15 ? 'EDV' :
                         routeIndex < 25 ? 'PRIME' :
                         routeIndex < 40 ? 'STANDARD' : 'XL';

      // Calculate pad time based on wave
      const padBaseTime = currentWave === 1 ? 9 : 11; // Wave 1 at 9AM, Wave 2 at 11AM
      const padMinutes = (currentPad % 3) * 15; // Stagger pad times within wave

      routes.push({
        id: `R${routeIndex + 1}`,
        routeCode: `CX${routeIndex + 1}`,
        serviceType,
        wave: currentWave,
        padNumber: currentPad,
        padTime: `${padBaseTime}:${padMinutes.toString().padStart(2, '0')} AM`,
        packages: 150 + Math.floor(Math.random() * 100),
        commercialPackages: Math.floor(Math.random() * 30),
        status: 'incomplete'
      });

      routeIndex++;
      routesInCurrentPad++;
    }

    // Move to next pad
    currentPad++;
    routesInCurrentPad = 0;

    // Check if we should move to next wave (max 3 pads per wave)
    if (currentPad > 3 && routeIndex < 50) {
      currentWave++;
      currentPad = 1;
    }
  }

  return routes;
};

// Generate vehicles
const generateVehicles = (): Vehicle[] => {
  const vehicles: Vehicle[] = [];
  const types: ('EDV' | 'PRIME' | 'XL' | 'STANDARD')[] = ['EDV', 'PRIME', 'XL', 'STANDARD'];
  const distribution = { EDV: 20, PRIME: 12, XL: 12, STANDARD: 20 };

  let id = 1;
  Object.entries(distribution).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      vehicles.push({
        id: `V${id}`,
        name: `${type}-${i + 1}`,
        type: type as 'EDV' | 'PRIME' | 'XL' | 'STANDARD',
        mileage: Math.floor(Math.random() * 50000) + 10000,
        status: Math.random() > 0.1 ? 'active' : 'maintenance'
      });
      id++;
    }
  });

  return vehicles;
};

// Calculate DEP score for driver-route matching
const calculateDEPScore = (driver: Driver, route: Route): number => {
  if (!driver.lastRoute) return 0;

  let score = 0;
  const depOrder = driver.dep.split('');

  depOrder.forEach((pref, index) => {
    const weight = 5 - index; // Higher weight for earlier preferences

    switch (pref) {
      case 'R': // Route familiarity
        if (driver.lastRoute.routeCode === route.routeCode) score += weight * 2;
        break;
      case 'W': // Wave preference
        if (driver.lastRoute.wave === route.wave) score += weight;
        break;
      case 'P': // Pad familiarity
        if (driver.lastRoute.pad === route.padNumber) score += weight;
        break;
      case 'V': // Vehicle preference (specific vehicle)
        // This would match specific vehicle if assigned
        break;
      case 'T': // Vehicle Type experience
        if (driver.lastRoute.vehicleType === route.serviceType) score += weight;
        break;
    }
  });

  return score;
};

// Main Component
export function WavePlanningShowcase() {
  const [activePhase, setActivePhase] = useState<'pool' | 'wave'>('pool');
  const [drivers, setDrivers] = useState<Driver[]>(generateDrivers());
  const [routes, setRoutes] = useState<Route[]>(generateRoutes());
  const [vehicles, setVehicles] = useState<Vehicle[]>(generateVehicles());
  const [draggedItem, setDraggedItem] = useState<{ type: 'driver' | 'vehicle'; id: string } | null>(null);

  // Wave Planning state
  const [activeResourceTab, setActiveResourceTab] = useState<'drivers' | 'vehicles'>('drivers');

  // Pool Planning state
  const [poolRequests, setPoolRequests] = useState<PoolRequest>({
    EDV: 15,
    PRIME: 10,
    STANDARD: 15,
    XL: 10
  });
  const [poolAssignments, setPoolAssignments] = useState<{ [key: string]: string[] }>({
    EDV: [],
    PRIME: [],
    STANDARD: [],
    XL: []
  });

  // Info panel state
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Finalize dialog state
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false);
  const [sendRouteNotifications, setSendRouteNotifications] = useState(true);
  const [sendStandbyNotifications, setSendStandbyNotifications] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    description: string;
    details?: { label: string; value: string | number }[];
    icon?: 'success' | 'info' | 'warning';
  }>({
    title: '',
    description: '',
    details: []
  });

  // Show modal helper
  const showModal = (title: string, description: string, details?: { label: string; value: string | number }[], icon?: 'success' | 'info' | 'warning') => {
    setModalContent({ title, description, details, icon });
    setModalOpen(true);
  };

  // Calculate statistics
  const totalRequested = Object.values(poolRequests).reduce((sum, val) => sum + val, 0);
  const totalAssigned = Object.values(poolAssignments).reduce((sum, pool) => sum + pool.length, 0);
  const availableDriversCount = drivers.filter(d => !d.assignedPool).length;
  const standbyCount = 60 - totalAssigned;

  const routesWithDrivers = routes.filter(r => r.driver).length;
  const routesWithVehicles = routes.filter(r => r.vehicle).length;
  const routesComplete = routes.filter(r => r.driver && r.vehicle).length;

  // No longer auto-initialize pool assignments since Wave Planning is independent

  // Silent version of auto-assign for initialization
  const autoAssignPoolsSilently = () => {
    // Sort drivers by daysSinceStandby (descending - longest without standby first)
    const sortedDrivers = [...drivers].sort((a, b) => b.daysSinceStandby - a.daysSinceStandby);
    const newAssignments: { [key: string]: string[] } = {
      EDV: [],
      PRIME: [],
      STANDARD: [],
      XL: []
    };

    let assignedDriverIds = new Set<string>();

    // First pass: Try to assign drivers to pools based on qualifications
    Object.entries(poolRequests).forEach(([poolType, requestedCount]) => {
      let assigned = 0;

      for (const driver of sortedDrivers) {
        if (assigned >= requestedCount) break;
        if (assignedDriverIds.has(driver.id)) continue;

        if (driver.vehicleTypes.includes(poolType)) {
          newAssignments[poolType].push(driver.id);
          assignedDriverIds.add(driver.id);
          assigned++;
        }
      }
    });

    // Second pass: Fill any remaining slots with multi-qualified drivers
    Object.entries(poolRequests).forEach(([poolType, requestedCount]) => {
      const currentAssigned = newAssignments[poolType].length;

      if (currentAssigned < requestedCount) {
        const remaining = requestedCount - currentAssigned;

        // Find unassigned drivers who can do this vehicle type
        const availableDrivers = sortedDrivers.filter(d =>
          !assignedDriverIds.has(d.id) && d.vehicleTypes.includes(poolType)
        );

        for (let i = 0; i < Math.min(remaining, availableDrivers.length); i++) {
          newAssignments[poolType].push(availableDrivers[i].id);
          assignedDriverIds.add(availableDrivers[i].id);
        }
      }
    });

    setPoolAssignments(newAssignments);

    // Update drivers with pool assignments
    const updatedDrivers = drivers.map(d => ({
      ...d,
      assignedPool: Object.entries(newAssignments).find(([_, ids]) => ids.includes(d.id))?.[0]
    }));
    setDrivers(updatedDrivers);
  };

  // Pool Planning: Auto-assign using round-robin standby rotation
  const autoAssignPools = () => {
    // Sort drivers by daysSinceStandby (descending - longest without standby first)
    const sortedDrivers = [...drivers].sort((a, b) => b.daysSinceStandby - a.daysSinceStandby);
    const newAssignments: { [key: string]: string[] } = {
      EDV: [],
      PRIME: [],
      STANDARD: [],
      XL: []
    };

    let assignedDriverIds = new Set<string>();

    // Calculate available qualified drivers for each pool type to determine scarcity
    const poolScarcity = Object.entries(poolRequests).map(([poolType, requestedCount]) => {
      const qualifiedCount = sortedDrivers.filter(d => d.vehicleTypes.includes(poolType)).length;
      const ratio = qualifiedCount / requestedCount; // Lower ratio = more scarce
      return { poolType, requestedCount, qualifiedCount, ratio };
    }).sort((a, b) => a.ratio - b.ratio); // Process scarce pools first

    // First pass: Assign drivers to pools in order of scarcity
    poolScarcity.forEach(({ poolType, requestedCount }) => {
      let assigned = 0;

      for (const driver of sortedDrivers) {
        if (assigned >= requestedCount) break;
        if (assignedDriverIds.has(driver.id)) continue;

        if (driver.vehicleTypes.includes(poolType)) {
          newAssignments[poolType].push(driver.id);
          assignedDriverIds.add(driver.id);
          assigned++;
        }
      }
    });

    // Second pass: Fill any remaining slots with multi-qualified drivers
    poolScarcity.forEach(({ poolType, requestedCount }) => {
      const currentAssigned = newAssignments[poolType].length;

      if (currentAssigned < requestedCount) {
        const remaining = requestedCount - currentAssigned;

        // Find unassigned drivers who can do this vehicle type
        const availableDrivers = sortedDrivers.filter(d =>
          !assignedDriverIds.has(d.id) && d.vehicleTypes.includes(poolType)
        );

        for (let i = 0; i < Math.min(remaining, availableDrivers.length); i++) {
          newAssignments[poolType].push(availableDrivers[i].id);
          assignedDriverIds.add(availableDrivers[i].id);
        }
      }
    });

    setPoolAssignments(newAssignments);

    // Update drivers with pool assignments
    const updatedDrivers = drivers.map(d => ({
      ...d,
      assignedPool: Object.entries(newAssignments).find(([_, ids]) => ids.includes(d.id))?.[0]
    }));
    setDrivers(updatedDrivers);

    // Show results
    const totalAssigned = Object.values(newAssignments).reduce((sum, pool) => sum + pool.length, 0);
    const poolBreakdown = Object.entries(newAssignments).map(([pool, drivers]) => ({
      label: `${pool} Pool`,
      value: `${drivers.length}/${poolRequests[pool as keyof PoolRequest]}`
    }));

    showModal(
      'Pool Planning Complete',
      'Driver pools have been automatically assigned using fair rotation principles.',
      [
        { label: 'Total Drivers Assigned', value: totalAssigned },
        { label: 'Standby Drivers', value: 60 - totalAssigned },
        ...poolBreakdown
      ],
      'success'
    );
  };

  // Wave Planning: Auto-assign drivers with DEP scoring
  const autoAssignDriversWithDEP = () => {
    // Get all available drivers (not just those assigned to pools in Phase 1)
    const availableDrivers = drivers.filter(d => !d.assignedRoute);
    const unassignedRoutes = routes.filter(r => !r.driver);

    let updatedRoutes = [...routes];
    let updatedDrivers = [...drivers];
    let assignments = 0;
    const assignedDriverIds = new Set<string>();

    for (const route of unassignedRoutes) {
      // Find qualified drivers and score them
      const qualifiedDrivers = availableDrivers
        .filter(d => d.vehicleTypes.includes(route.serviceType) && !assignedDriverIds.has(d.id))
        .map(d => ({
          driver: d,
          depScore: calculateDEPScore(d, route),
          standbyScore: d.daysSinceStandby // Secondary scoring
        }))
        .sort((a, b) => {
          // Sort by DEP score first, then by standby days
          if (b.depScore !== a.depScore) return b.depScore - a.depScore;
          return b.standbyScore - a.standbyScore;
        });

      if (qualifiedDrivers.length > 0) {
        const bestMatch = qualifiedDrivers[0].driver;

        // Update route
        updatedRoutes = updatedRoutes.map(r =>
          r.id === route.id ? { ...r, driver: bestMatch.name, status: r.vehicle ? 'complete' : 'warning' } : r
        );

        // Update driver
        updatedDrivers = updatedDrivers.map(d =>
          d.id === bestMatch.id ? { ...d, assignedRoute: route.routeCode } : d
        );

        // Mark driver as assigned in our tracking set
        assignedDriverIds.add(bestMatch.id);
        assignments++;
      }
    }

    setRoutes(updatedRoutes);
    setDrivers(updatedDrivers);

    showModal(
      'Smart Driver Assignment Complete',
      'Drivers have been intelligently matched to routes using DEP scoring.',
      [
        { label: 'Drivers Assigned', value: assignments },
        { label: 'Drivers on Standby', value: 60 - assignments },
        { label: 'Matching Criteria', value: 'DEP + Standby Rotation' },
        { label: 'Routes Remaining', value: unassignedRoutes.length - assignments }
      ],
      'success'
    );
  };

  // Wave Planning: Auto-assign vehicles
  const autoAssignVehicles = () => {
    const availableVehicles = vehicles.filter(v => v.status === 'active' && !v.assignedRoute);
    const unassignedRoutes = routes.filter(r => !r.vehicle);

    let updatedRoutes = [...routes];
    let updatedVehicles = [...vehicles];
    let assignments = 0;

    for (const route of unassignedRoutes) {
      // Prefer type match, then any available
      const vehicle = availableVehicles.find(v => v.type === route.serviceType && !v.assignedRoute) ||
                      availableVehicles.find(v => !v.assignedRoute);

      if (vehicle) {
        updatedRoutes = updatedRoutes.map(r =>
          r.id === route.id ? { ...r, vehicle: vehicle.name, status: r.driver ? 'complete' : 'warning' } : r
        );

        updatedVehicles = updatedVehicles.map(v =>
          v.id === vehicle.id ? { ...v, assignedRoute: route.routeCode } : v
        );

        vehicle.assignedRoute = route.routeCode;
        assignments++;
      }
    }

    setVehicles(updatedVehicles);
    setRoutes(updatedRoutes);

    showModal(
      'Vehicle Assignment Complete',
      'Vehicles have been automatically assigned to routes with type matching priority.',
      [
        { label: 'Vehicles Assigned', value: assignments },
        { label: 'Routes Remaining', value: unassignedRoutes.length - assignments }
      ],
      'success'
    );
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: 'driver' | 'vehicle', id: string) => {
    setDraggedItem({ type, id });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePoolDrop = (e: React.DragEvent, poolType: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== 'driver') return;

    const driver = drivers.find(d => d.id === draggedItem.id);
    if (!driver || !driver.vehicleTypes.includes(poolType)) return;

    // Remove from other pools
    const newAssignments = { ...poolAssignments };
    Object.keys(newAssignments).forEach(pool => {
      newAssignments[pool] = newAssignments[pool].filter(id => id !== driver.id);
    });

    // Add to new pool if space available (at the beginning so it appears on top)
    if (newAssignments[poolType].length < poolRequests[poolType as keyof PoolRequest]) {
      newAssignments[poolType].unshift(driver.id); // Add to beginning instead of end
      setPoolAssignments(newAssignments);

      // Update driver
      setDrivers(prev => prev.map(d =>
        d.id === driver.id ? { ...d, assignedPool: poolType } : d
      ));

      // Scroll the pool container to top to show the newly added driver
      const poolContainer = document.getElementById(`pool-${poolType}`);
      if (poolContainer) {
        poolContainer.scrollTop = 0;
      }
    }

    setDraggedItem(null);
  };

  const handleRouteDrop = (e: React.DragEvent, routeId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    if (draggedItem.type === 'driver') {
      const driver = drivers.find(d => d.id === draggedItem.id);
      if (driver && driver.vehicleTypes.includes(route.serviceType)) {
        setRoutes(prev => prev.map(r =>
          r.id === routeId ? { ...r, driver: driver.name, status: r.vehicle ? 'complete' : 'warning' } : r
        ));
        setDrivers(prev => prev.map(d =>
          d.id === driver.id ? { ...d, assignedRoute: route.routeCode } : d
        ));
      }
    } else if (draggedItem.type === 'vehicle') {
      const vehicle = vehicles.find(v => v.id === draggedItem.id);
      if (vehicle && vehicle.status === 'active') {
        setRoutes(prev => prev.map(r =>
          r.id === routeId ? { ...r, vehicle: vehicle.name, status: r.driver ? 'complete' : 'warning' } : r
        ));
        setVehicles(prev => prev.map(v =>
          v.id === vehicle.id ? { ...v, assignedRoute: route.routeCode } : v
        ));
      }
    }

    setDraggedItem(null);
  };

  // Remove driver from route
  const removeDriverFromRoute = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route || !route.driver) return;

    // Find driver by name and unassign
    const driver = drivers.find(d => d.name === route.driver);
    if (driver) {
      setDrivers(prev => prev.map(d =>
        d.id === driver.id ? { ...d, assignedRoute: undefined } : d
      ));
    }

    // Update route status
    setRoutes(prev => prev.map(r =>
      r.id === routeId ? { ...r, driver: undefined, status: r.vehicle ? 'warning' : 'incomplete' } : r
    ));
  };

  // Remove vehicle from route
  const removeVehicleFromRoute = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route || !route.vehicle) return;

    // Find vehicle by name and unassign
    const vehicle = vehicles.find(v => v.name === route.vehicle);
    if (vehicle) {
      setVehicles(prev => prev.map(v =>
        v.id === vehicle.id ? { ...v, assignedRoute: undefined } : v
      ));
    }

    // Update route status
    setRoutes(prev => prev.map(r =>
      r.id === routeId ? { ...r, vehicle: undefined, status: r.driver ? 'warning' : 'incomplete' } : r
    ));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Wave Planning System</h2>
            <p className="text-gray-600">Smart driver rotation & route optimization</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInfoPanel(!showInfoPanel)}
          className="gap-2"
        >
          <Info className="w-4 h-4" />
          Learn More
        </Button>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfoPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Alert className="border-blue-200 bg-blue-50">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Understanding Wave Planning</AlertTitle>
              <AlertDescription className="space-y-4 text-blue-800">
                <div>
                  <h4 className="font-semibold mt-2">🎯 Pool Planning (Phase 1)</h4>
                  <p className="text-sm mt-1">
                    Amazon provides estimated route counts by vehicle type. Managers allocate their 60 scheduled drivers
                    to these pools, ensuring fair standby rotation. The system uses a round-robin approach: drivers who
                    haven't been on standby recently get priority for routes.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">🚚 Wave Planning (Phase 2)</h4>
                  <p className="text-sm mt-1">
                    Actual routes arrive and need specific driver/vehicle assignments. The DEP (Driver Experience Preference)
                    system matches drivers to routes they're familiar with: Route familiarity, Wave preference, Pad knowledge,
                    Vehicle preference, and Type experience. This improves delivery efficiency and driver satisfaction.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">⚖️ Standby Fairness</h4>
                  <p className="text-sm mt-1">
                    No driver should be on standby twice before others have their turn. The system tracks days since last
                    standby and automatically prioritizes drivers who've waited longest for route assignments.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase Selector */}
      <div className="flex gap-2">
        <Button
          variant={activePhase === 'pool' ? 'default' : 'outline'}
          onClick={() => setActivePhase('pool')}
          className="gap-2"
        >
          <Users className="w-4 h-4" />
          Phase 1: Pool Planning
        </Button>
        <Button
          variant={activePhase === 'wave' ? 'default' : 'outline'}
          onClick={() => setActivePhase('wave')}
          className="gap-2"
        >
          <Truck className="w-4 h-4" />
          Phase 2: Wave Planning
        </Button>
      </div>

      {/* Pool Planning Phase */}
      {activePhase === 'pool' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Amazon Request Section */}
          <Card>
            <CardHeader>
              <CardTitle>Amazon Driver Request</CardTitle>
              <CardDescription>
                Configure the estimated driver needs by vehicle type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {Object.entries(poolRequests).map(([type, count]) => (
                  <div key={type}>
                    <Label htmlFor={`pool-${type}`} className="text-sm font-medium">
                      {type} Pool
                    </Label>
                    <Input
                      id={`pool-${type}`}
                      type="number"
                      value={count}
                      onChange={(e) => setPoolRequests(prev => ({
                        ...prev,
                        [type]: parseInt(e.target.value) || 0
                      }))}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Total Requested:</span> {totalRequested} drivers
                </div>
                <div className="text-sm">
                  <span className="font-medium">Available:</span> 60 drivers
                </div>
                <div className="text-sm">
                  <span className="font-medium">Projected Standby:</span> {60 - totalRequested} drivers
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Pool Planning Interface */}
          <div className="grid grid-cols-3 gap-6">
            {/* Available Drivers */}
            <Card className="col-span-1 flex flex-col h-[700px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Available Drivers</CardTitle>
                  <Badge variant="outline">{availableDriversCount} drivers</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <Button
                  onClick={autoAssignPools}
                  className="w-full mb-4 gap-2"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Auto-Assign (Fair Rotation)
                </Button>

                <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                  {drivers
                    .filter(d => !d.assignedPool)
                    .map(driver => (
                      <div
                        key={driver.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'driver', driver.id)}
                        className="p-2 bg-white border rounded-lg cursor-move hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{driver.name}</p>
                            <div className="flex gap-1 mt-1">
                              {driver.vehicleTypes.map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <History className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {driver.daysSinceStandby}d
                              </span>
                            </div>
                            <div className="flex">
                              {[...Array(driver.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Pool Assignments */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Type Pools</CardTitle>
                <CardDescription>
                  Drag drivers to assign them to pools based on their qualifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(poolRequests).map(([poolType, requestCount]) => {
                    const assigned = poolAssignments[poolType] || [];
                    const assignedDrivers = drivers.filter(d => assigned.includes(d.id));

                    return (
                      <div key={poolType} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge className="text-sm font-semibold">
                            {poolType} Pool
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {assigned.length} / {requestCount}
                          </span>
                        </div>

                        <div
                          className="min-h-[200px] max-h-[300px] p-3 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-y-auto"
                          onDrop={(e) => handlePoolDrop(e, poolType)}
                          onDragOver={handleDragOver}
                          id={`pool-${poolType}`}
                        >
                          {assigned.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm mt-8">
                              Drop drivers here
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {assignedDrivers.map(driver => (
                                <div
                                  key={driver.id}
                                  className="p-2 bg-white rounded border flex items-center justify-between"
                                >
                                  <div>
                                    <p className="text-sm font-medium">{driver.name}</p>
                                    <p className="text-xs text-gray-500">
                                      Last standby: {driver.daysSinceStandby}d ago
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      const newAssignments = { ...poolAssignments };
                                      newAssignments[poolType] = newAssignments[poolType].filter(id => id !== driver.id);
                                      setPoolAssignments(newAssignments);
                                      setDrivers(prev => prev.map(d =>
                                        d.id === driver.id ? { ...d, assignedPool: undefined } : d
                                      ));
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Progress
                          value={(assigned.length / requestCount) * 100}
                          className="h-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Standby Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Standby Rotation Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Drivers on standby today (sorted by fairness - those who haven't been standby recently):
                </p>
                <div className="flex flex-wrap gap-2">
                  {drivers
                    .filter(d => !d.assignedPool)
                    .slice(0, 10)
                    .map(driver => (
                      <Badge key={driver.id} variant="outline">
                        {driver.name} ({driver.daysSinceStandby}d)
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Wave Planning Phase */}
      {activePhase === 'wave' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Routes Total</p>
                    <p className="text-2xl font-bold">{routes.length}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Drivers Assigned</p>
                    <p className="text-2xl font-bold">{routesWithDrivers}/{routes.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
                <Progress value={(routesWithDrivers / routes.length) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Vehicles Assigned</p>
                    <p className="text-2xl font-bold">{routesWithVehicles}/{routes.length}</p>
                  </div>
                  <Truck className="w-8 h-8 text-purple-500" />
                </div>
                <Progress value={(routesWithVehicles / routes.length) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Routes Complete</p>
                    <p className="text-2xl font-bold text-green-600">{routesComplete}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <Progress value={(routesComplete / routes.length) * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* DEP Information */}
          <Alert className="border-purple-200 bg-purple-50">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900">DEP Matching Active</AlertTitle>
            <AlertDescription className="text-purple-800">
              Driver Experience Preference (DEP) system is matching drivers to familiar routes based on:
              <span className="font-semibold"> R</span>oute •
              <span className="font-semibold"> W</span>ave •
              <span className="font-semibold"> P</span>ad •
              <span className="font-semibold"> V</span>ehicle •
              <span className="font-semibold"> T</span>ype
            </AlertDescription>
          </Alert>

          {/* Main Wave Planning Interface */}
          <div className="grid grid-cols-4 gap-4">
            {/* Routes Table */}
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Route Assignments</CardTitle>
                    <Button
                      onClick={() => setFinalizeDialogOpen(true)}
                      className="gap-2"
                      disabled={routesComplete === 0}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Finalize Wave Plan
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto max-h-[600px] relative">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-2">Wave</th>
                          <th className="text-left p-2">Pad</th>
                          <th className="text-left p-2">Route</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Time</th>
                          <th className="text-left p-2">Packages</th>
                          <th className={cn(
                            "text-left p-2 transition-colors",
                            activeResourceTab === 'vehicles' && "bg-blue-50 border-l-2 border-r-2 border-blue-300"
                          )}>Vehicle</th>
                          <th className={cn(
                            "text-left p-2 transition-colors",
                            activeResourceTab === 'drivers' && "bg-purple-50 border-l-2 border-r-2 border-purple-300"
                          )}>Driver</th>
                        </tr>
                      </thead>
                      <tbody>
                        {routes.map(route => (
                          <tr key={route.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <Badge variant="secondary">{route.wave}</Badge>
                            </td>
                            <td className="p-2">
                              <Badge variant="outline">P{route.padNumber}</Badge>
                            </td>
                            <td className="p-2">
                              <Badge variant="outline">{route.routeCode}</Badge>
                            </td>
                            <td className="p-2">{route.serviceType}</td>
                            <td className="p-2">{route.padTime}</td>
                            <td className="p-2">{route.packages}</td>
                            <td className={cn(
                              "p-2 transition-colors",
                              activeResourceTab === 'vehicles' && "bg-blue-50/30"
                            )}>
                              <div className="flex items-center gap-1">
                                <div
                                  className="flex-1 min-h-[30px] px-2 py-1 border-2 border-dashed border-gray-300 rounded flex items-center"
                                  onDrop={(e) => handleRouteDrop(e, route.id)}
                                  onDragOver={handleDragOver}
                                >
                                  {route.vehicle ? (
                                    <span className="text-xs flex-1">{route.vehicle}</span>
                                  ) : (
                                    <span className="text-gray-400 text-xs flex-1">Drop vehicle</span>
                                  )}
                                </div>
                                {route.vehicle && (
                                  <button
                                    onClick={() => removeVehicleFromRoute(route.id)}
                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                    title="Remove vehicle"
                                  >
                                    <X className="w-3 h-3 text-red-600" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className={cn(
                              "p-2 transition-colors",
                              activeResourceTab === 'drivers' && "bg-purple-50/30"
                            )}>
                              <div className="flex items-center gap-1">
                                <div
                                  className="flex-1 min-h-[30px] px-2 py-1 border-2 border-dashed border-gray-300 rounded flex items-center"
                                  onDrop={(e) => handleRouteDrop(e, route.id)}
                                  onDragOver={handleDragOver}
                                >
                                  {route.driver ? (
                                    <span className="text-xs flex-1">{route.driver}</span>
                                  ) : (
                                    <span className="text-gray-400 text-xs flex-1">Drop driver</span>
                                  )}
                                </div>
                                {route.driver && (
                                  <button
                                    onClick={() => removeDriverFromRoute(route.id)}
                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                    title="Remove driver"
                                  >
                                    <X className="w-3 h-3 text-red-600" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resources Panel with Tabs */}
            <div className="col-span-1">
              <Card className="h-[700px] flex flex-col">
                <CardHeader>
                  <CardTitle className="text-sm">Resources</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 p-4">
                  <Tabs
                    defaultValue="drivers"
                    className="h-full flex flex-col"
                    onValueChange={(value) => setActiveResourceTab(value as 'drivers' | 'vehicles')}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="drivers">Drivers</TabsTrigger>
                      <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
                    </TabsList>

                    <TabsContent value="drivers" className="flex-1 flex flex-col mt-4 h-[calc(100%-48px)]">
                      <Button
                        onClick={autoAssignDriversWithDEP}
                        className="w-full mb-4 gap-2"
                        variant="outline"
                      >
                        <Users className="w-4 h-4" />
                        Smart Assign Drivers
                      </Button>

                      <Alert className="mb-3 py-2 px-3">
                        <Info className="h-3 w-3" />
                        <AlertDescription className="text-xs leading-relaxed">
                          <strong>DEP Score:</strong> Driver Experience Preference ranking (0-15). Higher scores = better match based on driver's preference order:
                          <div className="mt-1 space-y-0.5 ml-2">
                            <div><strong>R</strong> - Route familiarity (same route code)</div>
                            <div><strong>W</strong> - Wave preference (same wave)</div>
                            <div><strong>P</strong> - Pad familiarity (same pad number)</div>
                            <div><strong>T</strong> - Vehicle Type experience (same type)</div>
                            <div><strong>V</strong> - Vehicle preference (specific vehicle)</div>
                          </div>
                          Each driver has a unique DEP order (e.g., "RWPVT" prioritizes Route first, then Wave, etc.)
                        </AlertDescription>
                      </Alert>

                      <div className="text-sm text-gray-600 mb-2">
                        Available Drivers ({drivers.filter(d => !d.assignedRoute).length} of 60)
                      </div>
                      <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
                        {drivers
                          .filter(d => !d.assignedRoute)
                          .map(driver => {
                            const depScore = routes[0] ? calculateDEPScore(driver, routes[0]) : 0;
                            return (
                              <div
                                key={driver.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'driver', driver.id)}
                                className="p-2 bg-white border rounded cursor-move hover:shadow-md"
                              >
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs font-medium">{driver.name}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        ⭐ {driver.rating}
                                      </Badge>
                                      {depScore > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                          DEP: {depScore}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {driver.vehicleTypes.map(type => (
                                      <Badge
                                        key={type}
                                        variant="outline"
                                        className={cn(
                                          "text-[10px] px-1 py-0",
                                          type === 'EDV' && "bg-green-50 text-green-700 border-green-300",
                                          type === 'PRIME' && "bg-blue-50 text-blue-700 border-blue-300",
                                          type === 'STANDARD' && "bg-gray-50 text-gray-700 border-gray-300",
                                          type === 'XL' && "bg-purple-50 text-purple-700 border-purple-300"
                                        )}
                                      >
                                        {type}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </TabsContent>

                    <TabsContent value="vehicles" className="flex-1 flex flex-col mt-4 h-[calc(100%-48px)]">
                      <Button
                        onClick={autoAssignVehicles}
                        className="w-full mb-4 gap-2"
                        variant="outline"
                      >
                        <Truck className="w-4 h-4" />
                        Auto-Assign Vehicles
                      </Button>
                      <div className="text-sm text-gray-600 mb-2">
                        Available Vehicles ({vehicles.filter(v => v.status === 'active' && !v.assignedRoute).length})
                      </div>
                      <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
                        {vehicles
                          .filter(v => v.status === 'active' && !v.assignedRoute)
                          .map(vehicle => (
                            <div
                              key={vehicle.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, 'vehicle', vehicle.id)}
                              className="p-2 bg-white border rounded cursor-move hover:shadow-md"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium">{vehicle.name}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {vehicle.type}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      )}

      {/* Finalize Wave Plan Dialog */}
      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Finalize Wave Plan
            </DialogTitle>
            <DialogDescription>
              Confirm your wave plan and notification settings before finalizing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Wave Plan Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Wave Plan Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Routes:</span>
                  <span className="font-medium">{routes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium text-green-600">{routesComplete}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Drivers:</span>
                  <span className="font-medium">{routesWithDrivers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Standby Drivers:</span>
                  <span className="font-medium">{60 - routesWithDrivers}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-semibold">Notification Settings</h4>

              {/* Route Detail Notifications */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="route-notifications"
                  checked={sendRouteNotifications}
                  onCheckedChange={(checked) => setSendRouteNotifications(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="route-notifications"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Route Detail Notifications
                  </label>
                  <p className="text-sm text-gray-600">
                    Send route assignments to {routesWithDrivers} drivers
                  </p>
                </div>
              </div>

              {/* Standby Notifications */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="standby-notifications"
                  checked={sendStandbyNotifications}
                  onCheckedChange={(checked) => setSendStandbyNotifications(checked as boolean)}
                  className="mt-0.5"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="standby-notifications"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Stand-By Notifications
                  </label>
                  <p className="text-sm text-gray-600">
                    Send standby status to {60 - routesWithDrivers} drivers
                  </p>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  In production, notifications will be sent via SMS and in-app messaging to all selected driver groups.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFinalizeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setFinalizeDialogOpen(false);
                showModal(
                  'Wave Plan Finalized',
                  'Your wave plan has been successfully finalized.',
                  [
                    { label: 'Routes Assigned', value: routesComplete },
                    { label: 'Route Notifications', value: sendRouteNotifications ? `Sent to ${routesWithDrivers} drivers` : 'Not sent' },
                    { label: 'Standby Notifications', value: sendStandbyNotifications ? `Sent to ${60 - routesWithDrivers} drivers` : 'Not sent' }
                  ],
                  'success'
                );
              }}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Finalize & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalContent.icon === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {modalContent.icon === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              {modalContent.icon === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
              {modalContent.title}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {modalContent.description}
            </DialogDescription>
          </DialogHeader>

          {modalContent.details && modalContent.details.length > 0 && (
            <div className="mt-4 space-y-2">
              {modalContent.details.map((detail, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm text-gray-600">{detail.label}:</span>
                  <span className="font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setModalOpen(false)} className="w-full">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Star icon since it's not in the imports
const Star = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);