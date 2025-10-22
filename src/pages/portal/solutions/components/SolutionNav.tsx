import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SolutionNavProps {
  progress: number;
  visitedFeatures: number;
  totalFeatures: number;
}

export function SolutionNav({
  progress,
  visitedFeatures,
  totalFeatures
}: SolutionNavProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/portal')}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="h-8 w-px bg-gray-200" />

            <div>
              <h1 className="font-semibold text-lg text-gray-900">Solutions Showcase</h1>
            </div>
          </div>

          {/* Right Section - Progress */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Explored: <span className="font-semibold text-gray-900">{visitedFeatures}/{totalFeatures}</span>
            </div>
            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
            {progress === 100 && (
              <Badge className="bg-green-500 text-white">
                <Star className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}