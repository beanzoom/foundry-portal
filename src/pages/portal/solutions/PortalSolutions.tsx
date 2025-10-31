import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Truck, Wrench, Calendar, Users, BarChart3, Shield,
  ChevronRight, Play, Sparkles, Zap, CheckCircle,
  Clock, DollarSign, TrendingUp, Award, Layers,
  Navigation, Package, MapPin, Activity, Settings,
  Smartphone, Globe, Lock, ArrowRight, Star,
  PlusCircle, MinusCircle, Eye, BookOpen, Target,
  Rocket, Building2, UserCheck, AlertCircle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Import feature modules (we'll create these next)
import { WelcomeHero } from './components/WelcomeHero';
import { FeatureExplorer } from './components/FeatureExplorer';
import { InteractiveTour } from './components/InteractiveTour';
import { FeatureShowcase } from './components/FeatureShowcase';

// Feature categories with metadata
const FEATURE_CATEGORIES = [
  {
    id: 'fleet-ops',
    title: 'Fleet Operations',
    icon: Truck,
    color: 'blue',
    description: 'Real-time visibility and control over your entire fleet',
    features: ['Real-Time Tracking', 'Fleet Dashboard', 'Vehicle Health'],
    value: 'Minimize idle time significantly',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'maintenance',
    title: 'Maintenance & Compliance',
    icon: Wrench,
    color: 'orange',
    description: 'Proactive maintenance that prevents costly breakdowns',
    features: ['Preventive Maintenance', 'Work Orders', 'Compliance Tracking'],
    value: 'Reduce maintenance costs dramatically',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    id: 'wave-planning',
    title: 'Wave Planning',
    icon: MapPin,
    color: 'purple',
    description: 'Smart wave generation and route optimization',
    features: ['Automated Wave Creation', 'Route Optimization', 'Driver Assignment', 'Load Balancing'],
    value: 'Streamline planning workflows',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'driver',
    title: 'Driver Experience',
    icon: Users,
    color: 'teal',
    description: 'Empower drivers with modern tools they love',
    features: ['Driver Portal', 'Mobile App', 'Performance Tracking'],
    value: 'Enhance driver satisfaction and retention',
    gradient: 'from-teal-500 to-green-500'
  },
  {
    id: 'intelligence',
    title: 'Operations Intelligence',
    icon: BarChart3,
    color: 'indigo',
    description: 'Data-driven insights for smarter decisions',
    features: ['Command Center', 'Analytics', 'Real-Time Alerts'],
    value: 'Accelerate decision-making processes',
    gradient: 'from-indigo-500 to-purple-500'
  }
];

// User journey paths
const JOURNEY_PATHS = [
  {
    id: 'owner',
    title: "I'm a DSP Owner",
    icon: Building2,
    description: "See how to scale your business",
    highlights: ['Growth Strategies', 'Cost Savings', 'Performance Metrics']
  },
  {
    id: 'manager',
    title: "I'm an Operations Manager",
    icon: UserCheck,
    description: "Optimize daily operations",
    highlights: ['Efficiency Tools', 'Team Management', 'Performance Metrics']
  },
  {
    id: 'dispatcher',
    title: "I'm a Dispatcher",
    icon: Navigation,
    description: "Master route planning",
    highlights: ['Route Optimization', 'Real-Time Tracking', 'Driver Communication']
  }
];

export default function PortalSolutions() {
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [userJourney, setUserJourney] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [visitedFeatures, setVisitedFeatures] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hero' | 'explore'>('hero');

  // Parallax scroll effects
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  // Track feature exploration progress
  useEffect(() => {
    const totalFeatures = FEATURE_CATEGORIES.reduce((acc, cat) => acc + cat.features.length, 0);
    const exploredPercentage = (visitedFeatures.size / totalFeatures) * 100;
    setProgress(exploredPercentage);
  }, [visitedFeatures]);

  // Welcome message for first-time visitors
  useEffect(() => {
    const hasVisited = localStorage.getItem('solutions-visited');
    if (!hasVisited) {
      setShowTour(true);
      localStorage.setItem('solutions-visited', 'true');
    }
  }, []);

  const handleFeatureClick = (featureId: string) => {
    // Feature clicked: featureId
    setSelectedFeature(featureId);
    setVisitedFeatures(prev => new Set([...prev, featureId]));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section with Parallax */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10"
      >
        <WelcomeHero
          onStartTour={() => setShowTour(true)}
          onExplore={() => setViewMode('explore')}
          onCalculateROI={() => {}}
        />
      </motion.div>


      {/* Main Feature Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURE_CATEGORIES.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <Card
                className={cn(
                  "cursor-pointer h-full transition-all duration-300",
                  "hover:shadow-2xl border-2",
                  selectedFeature === category.id && "ring-2 ring-blue-500"
                )}
                onClick={() => handleFeatureClick(category.id)}
              >
                {/* Gradient Header */}
                <div className={cn(
                  "h-2 rounded-t-lg bg-gradient-to-r",
                  category.gradient
                )} />

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-lg bg-gradient-to-br",
                        category.gradient,
                        "text-white"
                      )}>
                        <category.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {category.features.length} Features
                        </Badge>
                      </div>
                    </div>
                    {visitedFeatures.has(category.id) && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-gray-600">{category.description}</p>

                  {/* Value Proposition */}
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">
                      {category.value}
                    </span>
                  </div>

                  {/* Feature List */}
                  <div className="space-y-2">
                    {category.features.map(feature => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="w-full group"
                    variant={selectedFeature === category.id ? "default" : "outline"}
                  >
                    Explore Features
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Interactive Feature Explorer */}
        <AnimatePresence>
          {selectedFeature && (
            <FeatureExplorer
              featureId={selectedFeature}
              onClose={() => setSelectedFeature(null)}
              onFeatureVisit={(id) => setVisitedFeatures(prev => new Set([...prev, id]))}
            />
          )}
        </AnimatePresence>

        {/* Guided Tour Overlay */}
        <AnimatePresence>
          {showTour && (
            <InteractiveTour
              onComplete={() => setShowTour(false)}
              userJourney={userJourney}
            />
          )}
        </AnimatePresence>

      </div>

      {/* Bottom CTA Section */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 mt-20"
      >
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Fleet Operations?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            We're building the platform that will revolutionize how DSPs scale their business
          </p>
        </div>
      </motion.div>
    </div>
  );
}