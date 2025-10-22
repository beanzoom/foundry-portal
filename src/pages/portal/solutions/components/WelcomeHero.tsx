import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play, Sparkles, TrendingUp, Clock, DollarSign,
  Users, Truck, Shield, Award, ArrowRight,
  Zap, Target, Rocket, ChevronDown, Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeHeroProps {
  onStartTour: () => void;
  onExplore: () => void;
  onCalculateROI: () => void;
}

export function WelcomeHero({ onStartTour, onExplore, onCalculateROI }: WelcomeHeroProps) {
  const controls = useAnimation();
  const [currentStat, setCurrentStat] = useState(0);

  const stats = [
    { label: 'Real-Time Maintenance Tracking', value: '', icon: Truck },
    { label: 'Automated Wave Planning', value: '', icon: Clock },
    { label: 'Interactive Driver Portal', value: '', icon: Users },
    { label: 'Comprehensive Management Cockpit', value: '', icon: Target }
  ];

  // Rotate through stats
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Floating animation
  useEffect(() => {
    controls.start({
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    });
  }, [controls]);

  return (
    <div className="relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 opacity-50" />
        <motion.div
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
          className="absolute inset-0"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0,0,0,0.03)" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E")',
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        <div className="text-center space-y-6">
          {/* Animated Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <Sparkles className="w-4 h-4 mr-2" />
              Experience the Future of Fleet Management
            </Badge>
          </motion.div>

          {/* Main Heading with Gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl lg:text-6xl font-bold"
          >
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Transform Your DSP Business
            </span>
            <br />
            <span className="text-gray-900">With FleetDRMS</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Discover how FleetDRMS can help DSPs scale operations, reduce costs,
            and deliver excellence with our comprehensive fleet management platform.
            We are out to change the DSP industry with YOUR help.
          </motion.p>

          {/* Animated Stats Ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center py-6"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 min-w-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStat}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-4"
                >
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg text-white">
                    {React.createElement(stats[currentStat].icon, { className: "w-6 h-6" })}
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-gray-900">
                      {stats[currentStat].label}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>


        </div>

      </div>
    </div>
  );
}

const AnimatePresence = ({ children, mode }: any) => {
  return <>{children}</>;
};