// Mock data for Driver Center wireframe
export interface WavePlanningData {
  waveId: string;
  waveNumber: number;
  padNumber: string;
  padTime: string;
  stagingLocation: string;
  routeId: string;
  vehicleId: string;
  vehicleName: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleMileage: number;
  driverId: string;
  driverName: string;
  packageCount: number;
  commercialPackages: number;
  estimatedDuration: number; // in minutes
  stops: RouteStop[];
  expectations: {
    firstStop: string;
    lastStop: string;
    totalStops: number;
    stopsPerHour: number;
  };
}

export interface RouteStop {
  id: string;
  address: string;
  packages: number;
  estimatedTime: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  notes?: string;
}

export interface NetradyneEvent {
  id: string;
  type: 'speeding' | 'distraction' | 'following' | 'seatbelt' | 'drowsiness' | 
         'weaving' | 'railroadCrossing' | 'collisionWarning' | 'noTruckSign' | 
         'cameraObstruction' | 'dangerousBacking' | 'unsecuredPackages' | 
         'smoking' | 'highGForce' | 'lowImpactCollision';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  location: string;
  speed?: number;
  duration?: number; // in seconds
  details?: string;
}

export interface MaintenanceRecord {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  reportedDate: string;
  reportedBy: string;
  severity: 'low' | 'medium' | 'high';
}

// Sample wave planning data
export const currentWaveData: WavePlanningData = {
  waveId: 'W-2024-0628-01',
  waveNumber: 1,
  padNumber: '2',
  padTime: '10:30 AM',
  stagingLocation: 'STG.U.5',
  routeId: 'CX22',
  vehicleId: 'EDV-12',
  vehicleName: 'EDV 12',
  vehicleMake: 'Rivian',
  vehicleModel: 'EDV',
  vehicleMileage: 24531,
  driverId: 'D-12345',
  driverName: 'John Driver',
  packageCount: 165,
  commercialPackages: 8,
  estimatedDuration: 480, // 8 hours
  expectations: {
    firstStop: '10:48 AM',
    lastStop: '6:18 PM',
    totalStops: 152,
    stopsPerHour: 20.25
  },
  stops: [
    {
      id: 'S-001',
      address: '123 Main St, Anytown, ST 12345',
      packages: 5,
      estimatedTime: '10:45 AM',
      status: 'completed'
    },
    {
      id: 'S-002',
      address: '456 Oak Ave, Anytown, ST 12345',
      packages: 3,
      estimatedTime: '11:00 AM',
      status: 'completed'
    },
    {
      id: 'S-003',
      address: '789 Pine Rd, Anytown, ST 12345',
      packages: 8,
      estimatedTime: '11:20 AM',
      status: 'in-progress'
    },
    {
      id: 'S-004',
      address: '321 Elm St, Anytown, ST 12345',
      packages: 2,
      estimatedTime: '11:35 AM',
      status: 'pending'
    },
    {
      id: 'S-005',
      address: '567 Maple Dr, Anytown, ST 12345',
      packages: 4,
      estimatedTime: '11:50 AM',
      status: 'pending'
    },
    {
      id: 'S-006',
      address: '890 Cedar Ln, Anytown, ST 12345',
      packages: 6,
      estimatedTime: '12:10 PM',
      status: 'pending'
    },
    {
      id: 'S-007',
      address: '234 Birch Way, Anytown, ST 12345',
      packages: 3,
      estimatedTime: '12:25 PM',
      status: 'pending'
    },
    {
      id: 'S-008',
      address: '678 Willow Ct, Anytown, ST 12345',
      packages: 7,
      estimatedTime: '12:45 PM',
      status: 'pending'
    },
    {
      id: 'S-009',
      address: '901 Spruce Ave, Anytown, ST 12345',
      packages: 5,
      estimatedTime: '1:00 PM',
      status: 'pending'
    },
    {
      id: 'S-010',
      address: '345 Ash St, Anytown, ST 12345',
      packages: 4,
      estimatedTime: '1:15 PM',
      status: 'pending'
    }
    // Total stops would be 35-40 for a full route
  ]
};

// Sample Netradyne events
export const recentNetradyneEvents: NetradyneEvent[] = [
  {
    id: 'NE-001',
    type: 'speeding',
    severity: 'medium',
    timestamp: '2024-06-28T09:15:00',
    location: 'Highway 101 N',
    speed: 72,
    details: 'Speed limit 65, driving 72 mph'
  },
  {
    id: 'NE-002',
    type: 'highGForce',
    severity: 'low',
    timestamp: '2024-06-27T14:30:00',
    location: 'Main St & 5th Ave',
    details: 'Hard braking event detected'
  },
  {
    id: 'NE-003',
    type: 'following',
    severity: 'medium',
    timestamp: '2024-06-27T11:45:00',
    location: 'Interstate 280',
    duration: 45,
    details: 'Following distance too close for 45 seconds'
  },
  {
    id: 'NE-004',
    type: 'distraction',
    severity: 'high',
    timestamp: '2024-06-26T16:20:00',
    location: 'Oak Street',
    duration: 12,
    details: 'Driver distraction detected - looking away from road'
  },
  {
    id: 'NE-005',
    type: 'collisionWarning',
    severity: 'high',
    timestamp: '2024-06-25T10:30:00',
    location: 'Pine Ave & 3rd St',
    details: 'Near miss at intersection - rolling stop'
  },
  {
    id: 'NE-006',
    type: 'speeding',
    severity: 'low',
    timestamp: '2024-06-25T08:45:00',
    location: 'Route 85',
    speed: 68,
    details: 'Speed limit 65, driving 68 mph'
  },
  {
    id: 'NE-007',
    type: 'seatbelt',
    severity: 'critical',
    timestamp: '2024-06-24T15:10:00',
    location: 'Downtown District',
    details: 'Seatbelt unbuckled while driving'
  },
  {
    id: 'NE-008',
    type: 'weaving',
    severity: 'medium',
    timestamp: '2024-06-24T13:25:00',
    location: 'Highway 280 S',
    duration: 30,
    details: 'Lane weaving detected for 30 seconds'
  }
];

// Sample maintenance records
export const maintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'MR-001',
    title: 'Windshield Crack',
    description: 'Small crack on driver side windshield, about 6 inches long',
    status: 'pending',
    reportedDate: '2024-06-26',
    reportedBy: 'John Driver',
    severity: 'medium'
  },
  {
    id: 'MR-002',
    title: 'Check Engine Light',
    description: 'Check engine light came on during morning route',
    status: 'in-progress',
    reportedDate: '2024-06-25',
    reportedBy: 'John Driver',
    severity: 'high'
  }
];

// Historical route data for analytics
export const historicalRoutes = [
  {
    date: '2024-06-27',
    routeId: 'R-2024-0627-001',
    packages: 152,
    stops: 48,
    duration: 465, // minutes
    onTimeDelivery: 98.5,
    safetyScore: 4.8
  },
  {
    date: '2024-06-26',
    routeId: 'R-2024-0626-001',
    packages: 139,
    stops: 44,
    duration: 445,
    onTimeDelivery: 97.8,
    safetyScore: 4.9
  },
  {
    date: '2024-06-25',
    routeId: 'R-2024-0625-001',
    packages: 161,
    stops: 52,
    duration: 490,
    onTimeDelivery: 96.2,
    safetyScore: 4.7
  }
];

// Driver performance metrics
export const driverMetrics = {
  weeklyAverage: {
    packagesDelivered: 745,
    stopsCompleted: 238,
    safetyScore: 4.8,
    onTimeDelivery: 97.5,
    fuelEfficiency: 8.2 // MPG
  },
  monthlyTrend: {
    safetyScoreTrend: 'improving',
    deliveryTimeTrend: 'stable',
    customerRatingTrend: 'improving'
  },
  achievements: [
    { id: 'A1', title: 'Safe Driver', description: '30 days without incidents' },
    { id: 'A2', title: 'Speed Demon', description: '100% on-time delivery this week' },
    { id: 'A3', title: 'Customer Hero', description: '5-star rating streak' }
  ]
};