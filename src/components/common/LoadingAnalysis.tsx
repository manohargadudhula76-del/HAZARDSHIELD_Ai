import React, { useEffect, useState } from 'react';
import { Cpu, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface LoadingAnalysisProps {
  onComplete?: () => void;
  title?: string;
  steps?: string[];
}

const defaultSteps = [
  'Analyzing Hazard & Meteorological Data',
  'Evaluating Population & Spatial Exposure',
  'Assessing Infrastructure Resilience Score',
  'Calculating carrying capacity thresholds',
  'Generating AI Relocation & Mitigation Insights'
];

export const LoadingAnalysis: React.FC<LoadingAnalysisProps> = ({
  onComplete,
  title = 'AI Risk Engine Processing',
  steps = defaultSteps
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const stepDuration = 350;
    const timer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          if (onComplete) setTimeout(onComplete, 300);
          return prev;
        }
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [steps, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-blue-500/30 bg-white dark:bg-[#151B2B] shadow-2xl backdrop-blur-md max-w-lg mx-auto my-8 text-center">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30">
          <Cpu className="h-10 w-10 animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
        <span>{title}</span>
        <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400 animate-spin" />
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Synthesizing spatial models and risk indicators...</p>

      <div className="w-full space-y-3 text-left bg-slate-50 dark:bg-[#1B2435] p-4 rounded-xl border border-slate-200 dark:border-[#263246]">
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={idx} className="flex items-center gap-3 text-xs md:text-sm">
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
              )}
              <span
                className={`transition-colors duration-200 ${
                  isDone
                    ? 'text-slate-700 dark:text-slate-300 font-medium'
                    : isCurrent
                    ? 'text-blue-600 dark:text-blue-300 font-bold'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
