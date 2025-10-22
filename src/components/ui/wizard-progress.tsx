
import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: Set<number>;
  stepTitles: string[];
  onStepClick?: (step: number) => void;
  canGoToStep?: (step: number) => boolean;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  stepTitles,
  onStepClick,
  canGoToStep
}) => {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Step {currentStep + 1} of {totalSteps}</span>
        <span>{Math.round(progressPercentage)}% Complete</span>
      </div>
      
      <Progress value={progressPercentage} className="h-2" />
      
      <div className="flex items-center justify-between">
        {stepTitles.map((title, index) => {
          const isCompleted = completedSteps.has(index);
          const isCurrent = index === currentStep;
          const canNavigate = canGoToStep ? canGoToStep(index) : false;
          
          return (
            <div
              key={index}
              className="flex flex-col items-center space-y-2"
            >
              <button
                onClick={() => canNavigate && onStepClick?.(index)}
                disabled={!canNavigate}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  {
                    "bg-primary text-primary-foreground": isCurrent,
                    "bg-green-500 text-white": isCompleted,
                    "bg-muted text-muted-foreground": !isCurrent && !isCompleted,
                    "cursor-pointer hover:bg-primary/80": canNavigate && !isCurrent,
                    "cursor-not-allowed": !canNavigate
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </button>
              <span className={cn(
                "text-xs text-center max-w-16 leading-tight",
                {
                  "text-primary font-medium": isCurrent,
                  "text-green-600": isCompleted,
                  "text-muted-foreground": !isCurrent && !isCompleted
                }
              )}>
                {title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
