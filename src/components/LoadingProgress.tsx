'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, MapPin, Youtube, Globe, Sparkles, CheckCircle } from 'lucide-react';
import { GenerationProgress } from '@/types';

interface LoadingProgressProps {
  progress?: GenerationProgress;
}

// Steps will be translated dynamically

export default function LoadingProgress({ progress }: LoadingProgressProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Get translated steps
  const steps = [
    {
      id: 'analyzing',
      title: t('loading.steps.analyzing.title'),
      description: t('loading.steps.analyzing.description'),
      icon: MapPin,
    },
    {
      id: 'scraping',
      title: t('loading.steps.scraping.title'),
      description: t('loading.steps.scraping.description'),
      icon: Globe,
    },
    {
      id: 'youtube',
      title: t('loading.steps.youtube.title'),
      description: t('loading.steps.youtube.description'),
      icon: Youtube,
    },
    {
      id: 'generating',
      title: t('loading.steps.generating.title'),
      description: t('loading.steps.generating.description'),
      icon: Sparkles,
    },
  ];

  useEffect(() => {
    if (progress) {
      const stepIndex = steps.findIndex(step => step.id === progress.step);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
        
        // Mark previous steps as completed
        const newCompletedSteps = steps.slice(0, stepIndex).map(step => step.id);
        setCompletedSteps(newCompletedSteps);
      }
    } else {
      // Auto-advance through steps for demo purposes
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            setCompletedSteps(prevCompleted => [...prevCompleted, steps[prev].id]);
            return prev + 1;
          }
          return prev;
        });
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [progress]);

  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(steps[stepIndex].id)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('loading.title')}
        </h2>
        <p className="text-gray-600">
          {t('loading.subtitle')}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{t('loading.progress')}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center p-4 rounded-lg border-2 transition-all duration-300 ${
                status === 'completed'
                  ? 'border-green-200 bg-green-50'
                  : status === 'current'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${
                  status === 'completed'
                    ? 'bg-green-100 text-green-600'
                    : status === 'current'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {status === 'completed' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : status === 'current' ? (
                  <Icon className="w-5 h-5 animate-pulse" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    status === 'completed'
                      ? 'text-green-900'
                      : status === 'current'
                      ? 'text-blue-900'
                      : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-sm ${
                    status === 'completed'
                      ? 'text-green-600'
                      : status === 'current'
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.description}
                </p>
              </div>
              {status === 'current' && (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin ml-2" />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Progress Message */}
      {progress && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">{progress.message}</p>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>{t('loading.timeEstimate')}</p>
      </div>
    </div>
  );
}
