'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Step {
  title: string;
  description: string;
  icon: string;
}

const steps: Step[] = [
  {
    title: 'Upload Your Image',
    description: 'Start by uploading an image with characters. You can draw letters, use AI-generated art, or use any image with distinct characters.',
    icon: '📤'
  },
  {
    title: 'Auto-Detect Characters',
    description: 'Our AI will automatically detect and extract individual characters from your image. You can manually adjust or add more characters.',
    icon: '🔍'
  },
  {
    title: 'Map Characters',
    description: 'Assign keyboard characters to each detected shape. Simply click a shape and press the key you want to assign.',
    icon: '🔤'
  },
  {
    title: 'Adjust Quality',
    description: 'Fine-tune the vectorization quality with our advanced settings. Preview changes in real-time with multiple characters.',
    icon: '✨'
  },
  {
    title: 'Download Your Font',
    description: 'Generate and download your custom font in TTF or OTF format. Your font is ready to use in any design software!',
    icon: '💾'
  }
];

export default function OnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  useEffect(() => {
    // Check if user has seen the tutorial
    const seen = localStorage.getItem('happyfont_tutorial_seen');
    if (!seen) {
      setIsOpen(true);
    } else {
      setHasSeenTutorial(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('happyfont_tutorial_seen', 'true');
    setHasSeenTutorial(true);
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const showTutorial = () => {
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (!isOpen && hasSeenTutorial) {
    // Show help button for returning users
    return (
      <button
        onClick={showTutorial}
        className="fixed bottom-6 right-6 z-40 bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-all hover:scale-110"
        title="Show tutorial"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-3xl">
              👋
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome to HappyFont!</h2>
              <p className="text-indigo-100 text-sm">Let's create your first custom font</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  idx <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center text-5xl">
              {steps[currentStep].icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed max-w-md mx-auto">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-8 bg-indigo-600'
                    : idx < currentStep
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
                title={step.title}
              />
            ))}
          </div>

          {/* Key features */}
          {currentStep === 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    100% Browser-Based & Private
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    All processing happens in your browser. Your images and fonts never leave your device.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            <Button variant="primary" onClick={handleNext} className="gap-2">
              {currentStep === steps.length - 1 ? (
                <>
                  Get Started
                  <CheckCircle2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
