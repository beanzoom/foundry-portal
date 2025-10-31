import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  X, Info,
  CheckCircle, Clock, DollarSign, TrendingUp,
  Maximize2, Minimize2, Eye, Download, Share2,
  Truck, Wrench, MapPin, Users, BarChart3,
  Zap, Target, Award, ArrowRight, Sparkles,
  MousePointer, Hand, Settings, Activity,
  Shield, Building2, Package, Rocket, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import demo components
import { FleetManagementDemoSlide } from './demos/FleetManagementDemoSlide';
import { MaintenanceDemoSlide } from './demos/MaintenanceDemoSlide';
import { DriverCenterSlide } from './demos/DriverCenterSlide';
import { OwnerDashboard } from './demos/OwnerDashboard';
import { WavePlanningShowcase } from './WavePlanningShowcase';

interface FeatureExplorerProps {
  featureId: string;
  onClose: () => void;
  onFeatureVisit: (id: string) => void;
}

// Feature configurations with demo components and interactive points
const FEATURE_CONFIGS: Record<string, any> = {
  'fleet-ops': {
    title: 'Fleet Operations Command Center',
    icon: Truck,
    color: 'blue',
    demoComponent: FleetManagementDemoSlide,
    sections: [
      {
        id: 'fleet-ops-tracking',
        name: 'Real-Time Tracking',
        description: 'Monitor every vehicle in your fleet with precision GPS tracking',
        benefits: ['Reduce idle time', 'Improve route compliance', 'Real-time alerts'],
        useCases: [
          {
            title: 'Morning Fleet Readiness Check',
            scenario: 'When you need to verify all vehicles are ready for dispatch',
            solution: 'View all vehicle statuses on one screen, see which drivers are checked in, and identify any vehicles with maintenance issues before routes begin.'
          },
          {
            title: 'Mid-Route Vehicle Breakdown',
            scenario: 'When a vehicle breaks down during deliveries',
            solution: 'Driver is able to create and add details and pictures to a Maintenance Request, allowing leadership and technicians to instantly understand and track the issue for quicker resolution.'
          },
          {
            title: 'End-of-Day Fleet Audit',
            scenario: 'When reviewing daily fleet performance',
            solution: 'Access complete vehicle histories, mileage reports, and operational status changes to identify patterns and optimization opportunities.'
          },
          {
            title: 'Multi-Location Fleet Management',
            scenario: 'When managing vehicles across multiple stations',
            solution: 'Filter and view vehicles by location, transfer vehicles between stations, and balance fleet capacity based on demand.'
          },
          {
            title: 'Compliance Documentation',
            scenario: 'When you need vehicle information for compliance or insurance',
            solution: 'Access complete vehicle records including registration, insurance, maintenance history, and operational data in one place.'
          }
        ],
        interactivePoints: [
          { x: 20, y: 30, label: 'Live vehicle status', description: 'See driver, location, and vehicle health' },
          { x: 60, y: 40, label: 'Route deviation alerts', description: 'Get notified of any route changes' },
          { x: 80, y: 60, label: 'Traffic integration', description: 'Real-time traffic data for better routing' }
        ]
      },
      {
        id: 'fleet-ops-dashboard',
        name: 'Fleet Dashboard',
        description: 'Comprehensive overview of your entire fleet at a glance',
        benefits: ['Complete visibility', 'One-click actions', 'Custom KPIs'],
        interactivePoints: [
          { x: 30, y: 25, label: 'Fleet cards', description: 'Quick status for every vehicle' },
          { x: 70, y: 45, label: 'Quick filters', description: 'Find vehicles instantly' },
          { x: 50, y: 70, label: 'Batch operations', description: 'Manage multiple vehicles at once' }
        ]
      }
    ],
    testimonial: {
      quote: "FleetDRMS gave us complete visibility we never had before. We reduced our operational costs by 40% in just 3 months.",
      author: "Sarah Johnson",
      role: "DSP Owner, 150+ vehicles"
    }
  },
  'maintenance': {
    title: 'Intelligent Maintenance Management',
    icon: Wrench,
    color: 'orange',
    demoComponent: MaintenanceDemoSlide,
    sections: [
      {
        id: 'maintenance-preventive',
        name: 'Preventive Maintenance',
        description: 'Stay ahead of breakdowns with smart maintenance scheduling',
        benefits: ['Less downtime', 'Extend vehicle life', 'Reduce repair costs'],
        useCases: [
          {
            title: 'Driver Pre-Trip Issue Report',
            scenario: 'When a driver reports a problem during pre-trip inspection',
            solution: 'Driver logs issue in app, maintenance team gets instant notification with severity rating, and vehicle is flagged for service or grounded if critical.'
          },
          {
            title: 'Scheduled Service Management',
            scenario: 'When multiple vehicles need oil changes or routine service',
            solution: 'View all upcoming maintenance in calendar view, batch similar services together, and schedule during off-peak hours to minimize impact.'
          },
          {
            title: 'Critical Issue Prioritization',
            scenario: 'When multiple maintenance issues need attention',
            solution: 'Issues are automatically ranked by severity, safety-critical problems rise to top, and you can see impact on fleet capacity for each repair.'
          },
          {
            title: 'Vendor Coordination',
            scenario: 'When working with external repair shops',
            solution: 'Track which vehicles are at which vendors, monitor repair timelines, and maintain complete service records regardless of who performs the work.'
          },
          {
            title: 'Maintenance Cost Tracking',
            scenario: 'When evaluating vehicle replacement decisions',
            solution: 'See total maintenance costs per vehicle, identify vehicles with recurring issues, and make data-driven decisions about repairs versus replacement.'
          }
        ],
        interactivePoints: [
          { x: 25, y: 35, label: 'Maintenance calendar', description: 'Visual schedule for all vehicles' },
          { x: 55, y: 50, label: 'Automated reminders', description: 'Never miss a service' },
          { x: 75, y: 65, label: 'Cost tracking', description: 'Monitor maintenance expenses' }
        ]
      }
    ]
  },
  'routing': {
    title: 'Advanced Route Optimization',
    icon: MapPin,
    color: 'purple',
    demoComponent: null, // Will use custom component
    sections: [
      {
        id: 'routing-wave',
        name: 'Wave Planning',
        description: 'Optimize delivery waves for maximum efficiency',
        benefits: ['25% more deliveries', 'Better driver utilization', 'Reduced overtime'],
        interactivePoints: [
          { x: 30, y: 40, label: 'Drag & drop planning', description: 'Intuitive route assignment' },
          { x: 60, y: 55, label: 'Load balancing', description: 'Evenly distribute packages' },
          { x: 80, y: 35, label: 'Time optimization', description: 'Meet all delivery windows' }
        ]
      }
    ]
  },
  'driver': {
    title: 'Driver Experience Platform',
    icon: Users,
    color: 'teal',
    demoComponent: DriverCenterSlide,
    sections: [
      {
        id: 'driver-portal',
        name: 'Driver Portal',
        description: 'Empower drivers with modern, easy-to-use tools',
        benefits: ['Better retention', 'Happier drivers', 'Self-service features'],
        useCases: [
          {
            title: 'Driver Self-Service Schedule Access',
            scenario: 'When drivers need to check their upcoming shifts',
            solution: 'Drivers log into their portal to see weekly schedules, request time off, swap shifts with other drivers, and receive automatic updates about changes.'
          },
          {
            title: 'Performance Scorecard Review',
            scenario: 'When drivers want to track their performance',
            solution: 'Drivers view their delivery metrics, safety scores, and customer feedback in real-time, with clear goals and achievements to work toward.'
          },
          {
            title: 'Vehicle Issue Reporting',
            scenario: 'When a driver needs to report a vehicle problem',
            solution: 'Submit detailed issue reports with photos directly from mobile device, track repair status, and get notifications when vehicle is ready.'
          },
          {
            title: 'New Driver Onboarding',
            scenario: 'When bringing new drivers onto your team',
            solution: 'New drivers complete training modules, submit documents, review policies, and track their onboarding progress all in one place.'
          },
          {
            title: 'Driver Recognition Program',
            scenario: 'When acknowledging top performers',
            solution: 'Automatically highlight top drivers based on performance metrics, display leaderboards, and track driver achievements and milestones.'
          }
        ],
        interactivePoints: [
          { x: 35, y: 30, label: 'Personal dashboard', description: 'Driver-specific information' },
          { x: 65, y: 50, label: 'Mobile app', description: 'Access anywhere, anytime' },
          { x: 50, y: 70, label: 'Performance tracking', description: 'Gamified achievements' }
        ]
      }
    ]
  },
  'intelligence': {
    title: 'Operations Intelligence Hub',
    icon: BarChart3,
    color: 'indigo',
    demoComponent: OwnerDashboard,
    sections: [
      {
        id: 'intelligence-analytics',
        name: 'Business Analytics',
        description: 'Data-driven insights to scale your business',
        benefits: ['Faster decisions', 'Predictive insights', 'Custom reports'],
        useCases: [
          {
            title: 'Daily Operations Review',
            scenario: 'When reviewing yesterday\'s performance',
            solution: 'Access pre-built dashboards showing delivery completion rates, driver performance, vehicle utilization, and areas needing attention.'
          },
          {
            title: 'Route Efficiency Analysis',
            scenario: 'When routes are taking longer than expected',
            solution: 'Analyze route patterns, identify bottlenecks, compare driver performance on similar routes, and optimize future route planning.'
          },
          {
            title: 'Fleet Expansion Planning',
            scenario: 'When deciding whether to add more vehicles',
            solution: 'Review utilization rates, peak capacity periods, maintenance costs per vehicle, and projected demand to make informed expansion decisions.'
          },
          {
            title: 'Driver Performance Management',
            scenario: 'When preparing for driver reviews or coaching',
            solution: 'Access comprehensive driver scorecards, compare performance across team, identify training needs, and track improvement over time.'
          },
          {
            title: 'Cost Analysis and Budgeting',
            scenario: 'When planning next quarter\'s budget',
            solution: 'Review detailed cost breakdowns by category, identify trends and anomalies, forecast future expenses based on historical data.'
          }
        ],
        interactivePoints: [
          { x: 40, y: 35, label: 'KPI dashboard', description: 'Track what matters most' },
          { x: 60, y: 60, label: 'Trend analysis', description: 'Spot patterns and opportunities' },
          { x: 75, y: 45, label: 'Automated reports', description: 'Get insights delivered' }
        ]
      }
    ]
  },
  'wave-planning': {
    title: 'Intelligent Wave Planning',
    icon: MapPin,
    color: 'purple',
    demoComponent: WavePlanningShowcase,
    sections: [
      {
        id: 'pool-planning',
        name: 'Phase 1: Pool Planning',
        description: 'Allocate your scheduled drivers to Amazon\'s requested vehicle pools with intelligent rotation and fairness algorithms',
        benefits: ['Fair standby rotation', 'Qualification matching', 'Real-time visibility'],
        useCases: [
          {
            title: 'Morning Driver Assignment',
            scenario: 'When Amazon provides daily vehicle requirements',
            solution: 'Import requirements, auto-assign drivers based on qualifications and standby history, adjust assignments as needed, and finalize pool allocations.'
          },
          {
            title: 'Last-Minute Driver Callouts',
            scenario: 'When drivers call out sick or have emergencies',
            solution: 'Quickly see available standby drivers, swap assignments while maintaining fairness, notify affected drivers of changes automatically.'
          },
          {
            title: 'Route-to-Driver Matching',
            scenario: 'When assigning specific routes to drivers',
            solution: 'Match drivers to routes they know well using DEP scoring, balance package counts across drivers, ensure vehicle type compatibility.'
          },
          {
            title: 'Multi-Wave Operations',
            scenario: 'When running multiple delivery waves per day',
            solution: 'Manage different start times, track which drivers are in which wave, coordinate vehicle handoffs between waves.'
          },
          {
            title: 'Training New Drivers',
            scenario: 'When integrating new drivers into operations',
            solution: 'Pair new drivers with experienced mentors, assign easier routes initially, track progress and gradually increase complexity.'
          }
        ],
        features: [
          {
            title: 'Smart Driver Allocation',
            description: 'Automatically assign drivers to vehicle pools based on their certifications and experience',
            icon: 'Users'
          },
          {
            title: 'SQE/PACE Rankings',
            description: 'Prioritize top performers using Amazon\'s SQE and PACE scoring systems',
            icon: 'TrendingUp'
          },
          {
            title: 'Fair Standby Rotation',
            description: 'No driver sits on standby twice before everyone has their turn - automated fairness',
            icon: 'Shield'
          },
          {
            title: 'Qualification Tracking',
            description: 'Visual badges show EDV, PRIME, STANDARD, and XL certifications at a glance',
            icon: 'Award'
          },
          {
            title: 'Days Since Standby',
            description: 'Track and visualize how long each driver has been on active routes',
            icon: 'Clock'
          },
          {
            title: 'Drag & Drop Interface',
            description: 'Intuitive manual overrides when you need to make specific assignments',
            icon: 'MousePointer'
          },
          {
            title: 'Real-Time Pool Metrics',
            description: 'See pool fill rates, standby counts, and availability instantly',
            icon: 'BarChart3'
          },
          {
            title: 'One-Click Auto-Assign',
            description: 'Let the system handle pool assignments with perfect fairness algorithms',
            icon: 'Zap'
          }
        ],
        interactivePoints: []
      },
      {
        id: 'wave-planning-assignment',
        name: 'Phase 2: Wave Planning',
        description: 'Transform pool allocations into actual route assignments using DEP scoring and advanced optimization',
        benefits: ['DEP optimization', '15% faster deliveries', 'Driver satisfaction'],
        useCases: [
          {
            title: 'DEP-Based Route Assignment',
            scenario: 'When finalizing route assignments from pool allocations',
            solution: 'Apply DEP scoring to match drivers with routes they know best, optimize based on route familiarity and driver preferences, ensure balanced package distribution.'
          },
          {
            title: 'Wave Optimization',
            scenario: 'When structuring multiple delivery waves',
            solution: 'Create efficient wave structures, balance load across waves, ensure pad assignments align with driver capabilities.'
          },
          {
            title: 'Performance Tracking',
            scenario: 'When evaluating assignment effectiveness',
            solution: 'Track DEP score improvements over time, measure delivery efficiency gains, identify optimization opportunities.'
          }
        ],
        features: [
          {
            title: 'DEP Scoring System',
            description: 'R-W-P-V-T scoring matches drivers to routes they know best for maximum efficiency',
            icon: 'Target'
          },
          {
            title: 'Route Familiarity (R)',
            description: 'Prioritize drivers who know specific neighborhoods and delivery locations',
            icon: 'MapPin'
          },
          {
            title: 'Wave Preference (W)',
            description: 'Match drivers to their preferred delivery waves and time windows',
            icon: 'Clock'
          },
          {
            title: 'Pad Knowledge (P)',
            description: 'Assign drivers familiar with specific launch pad procedures and locations',
            icon: 'Building2'
          },
          {
            title: 'Vehicle Preference (V)',
            description: 'Match drivers with vehicles they\'re most comfortable operating',
            icon: 'Truck'
          },
          {
            title: 'Type Experience (T)',
            description: 'Leverage driver experience with specific delivery types (residential, commercial, lockers)',
            icon: 'Package'
          },
          {
            title: 'Automated Wave Generation',
            description: 'Create optimized delivery waves in seconds, not hours',
            icon: 'Rocket'
          },
          {
            title: 'Load Balancing',
            description: 'Evenly distribute packages and stops across all active drivers',
            icon: 'Layers'
          },
          {
            title: 'Manager Override Controls',
            description: 'Full flexibility to manually adjust any assignment when needed',
            icon: 'Settings'
          },
          {
            title: 'Performance Analytics',
            description: 'Track DEP score improvements and delivery efficiency gains over time',
            icon: 'TrendingUp'
          },
          {
            title: 'Route Swap Detection',
            description: 'Identify and prevent unauthorized route swaps between drivers',
            icon: 'Shield'
          },
          {
            title: 'Multi-Wave Support',
            description: 'Handle complex multi-wave operations with different start times seamlessly',
            icon: 'Layers'
          }
        ],
        interactivePoints: []
      }
    ],
    testimonial: {
      quote: "Wave Planning reduced our route planning time from 3 hours to 15 minutes. The DEP scoring alone improved our delivery efficiency by 18%.",
      author: "Mike Chen",
      role: "Operations Manager, 200+ daily routes"
    }
  }
};

export function FeatureExplorer({ featureId, onClose, onFeatureVisit }: FeatureExplorerProps) {
  // FeatureExplorer rendering for: featureId
  const config = FEATURE_CONFIGS[featureId];
  // Config found: config ? 'yes' : 'no'
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInteractive, setShowInteractive] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Mark current section as visited
    if (config?.sections[currentSection]) {
      onFeatureVisit(config.sections[currentSection].id);
      setCompletedSections(prev => new Set([...prev, config.sections[currentSection].id]));
    }
  }, [currentSection, config]);

  // Auto-advance through sections
  useEffect(() => {
    if (isPlaying && config) {
      const timer = setTimeout(() => {
        if (currentSection < config.sections.length - 1) {
          setCurrentSection(currentSection + 1);
        } else {
          setIsPlaying(false);
        }
      }, 10000); // 10 seconds per section

      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentSection, config]);

  if (!config) return null;

  const section = config.sections[currentSection];
  const DemoComponent = config.demoComponent;
  const progress = ((completedSections.size / config.sections.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          "absolute bg-white rounded-xl shadow-2xl flex flex-col",
          isFullscreen ? "inset-4" : "inset-8 lg:inset-16"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <config.icon className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">{config.title}</h2>
                <p className="text-sm opacity-90">
                  Exploring: {section.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>

              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-1 bg-white/30" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Demo/Visual */}
          <div className="flex-1 relative bg-gray-50 overflow-y-auto">
            {DemoComponent ? (
              <div className="p-8 h-full overflow-y-auto relative z-10">
                <DemoComponent />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <config.icon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Interactive demo coming soon</p>
                </div>
              </div>
            )}

{/* Interactive Hotspots removed for cleaner presentation */}
          </div>

          {/* Right Panel - Information */}
          <div className="w-96 border-l bg-white p-6 overflow-hidden flex flex-col">
            <Tabs defaultValue="usecases" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="usecases">Use Cases</TabsTrigger>
                <TabsTrigger value="benefits">Benefits</TabsTrigger>
              </TabsList>

              <TabsContent value="usecases" className="flex-1 flex flex-col overflow-hidden mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{section.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{section.description}</p>
                  </div>

                  <div className="text-sm font-medium text-gray-500">Real-World Use Cases:</div>
                </div>
                {section.useCases && section.useCases.length > 0 ? (
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 mt-4">
                    {section.useCases.map((useCase: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group"
                      >
                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm text-blue-600">
                                {useCase.title}
                              </h4>
                              <div className="space-y-1">
                                <p className="text-xs text-gray-500">
                                  <span className="font-medium">Scenario:</span> {useCase.scenario}
                                </p>
                                <p className="text-xs text-gray-700">
                                  <span className="font-medium text-green-600">Solution:</span> {useCase.solution}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                      <span className="text-sm">Advanced features designed for DSP success</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Rocket className="w-5 h-5 text-purple-600" />
                      <span className="text-sm">Industry-leading automation capabilities</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Built with Amazon compliance in mind</span>
                    </div>
                  </div>
                )}

              </TabsContent>

              {/* Benefits Tab */}
              <TabsContent value="benefits" className="mt-0 space-y-4 h-full overflow-y-auto pr-2">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Key Benefits</h3>
                  <p className="text-gray-600 text-sm">Real results from DSP partners using this feature</p>
                </div>

                {section.benefits && section.benefits.map((benefit: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{benefit}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {/* Success Metrics */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Success Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">45%</div>
                      <div className="text-xs text-gray-600">Efficiency Gain</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">3hrs</div>
                      <div className="text-xs text-gray-600">Time Saved Daily</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}