'use client';

import { cn } from '@/lib/utils/cn';

interface OnboardingStepsProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingSteps({ currentStep, totalSteps }: OnboardingStepsProps) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isComplete = step < currentStep;
        return (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors',
              isComplete && 'bg-primary',
              isActive && 'bg-primary',
              !isActive && !isComplete && 'bg-muted',
            )}
          />
        );
      })}
    </div>
  );
}
