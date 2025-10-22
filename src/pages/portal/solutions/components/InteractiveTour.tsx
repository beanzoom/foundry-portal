import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  X, ChevronRight, ChevronLeft, Sparkles,
  Target, CheckCircle, Info, Skip,
  PlayCircle, User, Building2, Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveTourProps {
  onComplete: () => void;
  userJourney?: string | null;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
  icon: React.ElementType;
}

const TOUR_STEPS: Record<string, TourStep[]> = {
  default: [
    {
      id: 'welcome',
      title: 'Welcome to FleetDRMS Solutions',
      description: 'Let me show you how our platform can transform your fleet operations. This tour takes just 5 minutes.',
      icon: Sparkles,
    },
    {
      id: 'navigation',
      title: 'Smart Navigation',
      description: 'Use the top navigation to switch between Explore, Guided Tour, and Live Demo modes.',
      target: '.view-mode-selector',
      position: 'bottom',
      icon: Navigation
    },
    {
      id: 'features',
      title: 'Explore Features',
      description: 'Click on any feature card to dive deep into its capabilities with interactive demos.',
      target: '.feature-card',
      position: 'top',
      icon: Target
    },
    {
      id: 'progress',
      title: 'Track Your Progress',
      description: 'See how much you\'ve explored in the progress bar. Complete all features to unlock special content!',
      target: '.progress-indicator',
      position: 'bottom',
      icon: CheckCircle
    },
    {
      id: 'roi',
      title: 'Calculate Your ROI',
      description: 'Use our ROI calculator to see exactly how much you could save with FleetDRMS.',
      action: 'Open ROI Calculator',
      icon: Building2
    }
  ],
  owner: [
    {
      id: 'owner-welcome',
      title: 'DSP Owner Dashboard',
      description: 'As an owner, you need complete visibility and control. Let me show you the command center.',
      icon: Building2
    },
    {
      id: 'owner-analytics',
      title: 'Business Intelligence',
      description: 'See real-time metrics, trends, and predictive analytics to make data-driven decisions.',
      target: '#intelligence',
      position: 'right',
      icon: Target
    },
    {
      id: 'owner-roi',
      title: 'Cost Savings Opportunities',
      description: 'Identify areas where you can reduce costs and improve efficiency immediately.',
      action: 'View Savings Report',
      icon: CheckCircle
    }
  ],
  manager: [
    {
      id: 'manager-welcome',
      title: 'Operations Manager Tools',
      description: 'Optimize your daily operations with powerful management features.',
      icon: User
    },
    {
      id: 'manager-fleet',
      title: 'Fleet Management',
      description: 'Monitor and control your entire fleet from a single dashboard.',
      target: '#fleet-ops',
      position: 'right',
      icon: Target
    },
    {
      id: 'manager-routing',
      title: 'Route Optimization',
      description: 'Create efficient routes and manage wave planning with ease.',
      target: '#routing',
      position: 'right',
      icon: Navigation
    }
  ]
};

export function InteractiveTour({ onComplete, userJourney }: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const steps = TOUR_STEPS[userJourney || 'default'] || TOUR_STEPS.default;
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Highlight target element
  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('tour-highlight');
        return () => {
          element.classList.remove('tour-highlight');
        };
      }
    }
  }, [step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <PlayCircle className="w-6 h-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] pointer-events-none"
    >
      {/* Overlay for highlighting */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto" onClick={handleSkip} />

      {/* Tour Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          "absolute pointer-events-auto",
          "bottom-8 left-1/2 transform -translate-x-1/2",
          "max-w-md w-full px-4"
        )}
      >
        <Card className="shadow-2xl border-2 border-blue-500">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <step.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">Interactive Tour</div>
                  <div className="text-xs opacity-90">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(true)}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Progress value={progress} className="h-1 mt-3 bg-white/30" />
          </div>

          <CardContent className="pt-6 pb-4">
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-gray-600 mb-6">{step.description}</p>

            {step.action && (
              <Button variant="outline" className="w-full mb-4">
                {step.action}
              </Button>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-gray-500"
              >
                Skip tour
              </Button>

              <Button
                onClick={handleNext}
                className="gap-1 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Spotlight effect for highlighted elements */}
      {step.target && (
        <div className="tour-spotlight pointer-events-none" />
      )}
    </motion.div>
  );
}

// Add CSS for tour highlight effect
const style = document.createElement('style');
style.textContent = `
  .tour-highlight {
    position: relative;
    z-index: 101;
    animation: pulse-border 2s infinite;
  }

  @keyframes pulse-border {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }

  .tour-spotlight {
    position: fixed;
    inset: 0;
    background: radial-gradient(
      circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
      transparent 150px,
      rgba(0, 0, 0, 0.3) 250px
    );
  }
`;
document.head.appendChild(style);