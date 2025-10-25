'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import UnifiedFontGenerator from '@/components/tools/UnifiedFontGenerator';
import CharacterMappingOverview from '@/components/tools/CharacterMappingOverview';
import CharacterAlignment from '@/components/tools/CharacterAlignment';
import FontDownloader from '@/components/tools/FontDownloader';
import OnboardingTutorial from '@/components/tools/OnboardingTutorial';
import CharacterTemplateSelector from '@/components/tools/CharacterTemplateSelector';
import { useFont } from '@/context/FontContext';
import { Sparkles, Check, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreatePage() {
  const { sourceImages, characterMappings, metadata, updateMetadata } = useFont();
  const selectedImagesCount = sourceImages.filter(image => image.selected).length;
  const [currentStep, setCurrentStep] = useState(1);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const totalSteps = 5;
  
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Check if the current step is valid and user can proceed
  const canProceed = () => {
    switch (currentStep) {
      case 1: // Image upload
        return selectedImagesCount > 0;
      case 2: // Character mapping
        return characterMappings.length > 0;
      case 3: // Character alignment
        return true; // Always allow proceeding from alignment
      case 4: // Metadata/info
        return metadata.name.trim() !== '' && metadata.author?.trim() !== '';
      default:
        return true;
    }
  };
  
  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="p-8 border-b border-border">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Create Your Character Sheets</h2>
                  <p className="text-sm text-muted-foreground">
                    Generate with AI or upload your own images to start creating your font.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateSelector(true)}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Templates
                </Button>
              </div>
            </div>
            <div className="p-8">
              <UnifiedFontGenerator />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="p-8 border-b border-border">
              <h2 className="text-2xl font-semibold mb-2">Review & Edit Character Mappings</h2>
              <p className="text-sm text-muted-foreground">
                Review the automatically detected characters and make manual adjustments if needed.
              </p>
            </div>
            <div className="p-8">
              <CharacterMappingOverview />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="p-8 border-b border-border">
              <h2 className="text-2xl font-semibold mb-2">Align & Adjust Characters</h2>
              <p className="text-sm text-muted-foreground">
                Fine-tune positioning, spacing, and kerning for your font characters.
              </p>
            </div>
            <div className="p-8">
              <CharacterAlignment />
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="p-8 border-b border-border">
              <h2 className="text-2xl font-semibold mb-2">Font Information</h2>
              <p className="text-sm text-muted-foreground">
                Add metadata to your font such as name, author, and description.
              </p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="font-name" className="block text-sm font-medium mb-2 text-foreground">Font Name</label>
                  <input
                    id="font-name"
                    type="text"
                    value={metadata.name}
                    onChange={(e) => updateMetadata({ ...metadata, name: e.target.value })}
                    placeholder="My Awesome Font"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="font-author" className="block text-sm font-medium mb-2 text-foreground">Author</label>
                  <input
                    id="font-author"
                    type="text"
                    value={metadata.author || ''}
                    onChange={(e) => updateMetadata({ ...metadata, author: e.target.value })}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="font-description" className="block text-sm font-medium mb-2 text-foreground">Description</label>
                  <textarea
                    id="font-description"
                    value={metadata.description || ''}
                    onChange={(e) => updateMetadata({ ...metadata, description: e.target.value })}
                    placeholder="Add a description for your font"
                    className="w-full h-32 px-4 py-3 border border-input rounded-lg bg-background focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </>
        );
      case 5:
        return (
          <>
            <div className="p-8 border-b border-border">
              <h2 className="text-2xl font-semibold mb-2">Generate Font</h2>
              <p className="text-sm text-muted-foreground">
                Generate and download your font file.
              </p>
            </div>
            <div className="p-8">
              <FontDownloader />
            </div>
          </>
        );
      default:
        return null;
    }
  };
  
  const steps = [
    { id: 1, title: 'Upload', description: 'Create character sheets' },
    { id: 2, title: 'Map', description: 'Assign characters' },
    { id: 3, title: 'Align', description: 'Fine-tune positioning' },
    { id: 4, title: 'Info', description: 'Font metadata' },
    { id: 5, title: 'Generate', description: 'Download font' },
  ];

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Top Progress Bar */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="w-full px-8 py-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-foreground">Create Your Font</h2>
              <span className="text-xs text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>

          {/* Step Pills */}
          <div className="flex items-center gap-2 mb-3">
            {steps.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isUpcoming = step.id > currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                    disabled={isUpcoming}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-medium whitespace-nowrap ${
                      isCurrent
                        ? 'bg-accent text-accent-foreground shadow-notion-sm'
                        : isCompleted
                        ? 'bg-accent/10 text-accent hover:bg-accent/20'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-xs">
                        {step.id}
                      </span>
                    )}
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 bg-border">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-accent' : 'bg-transparent'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Animated Progress Bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent via-accent/90 to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <main className="w-full">
        <div className="w-full px-8 py-8">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-card rounded-xl border border-border shadow-notion-md"
          >
            {renderStepContent()}
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between mt-6 max-w-7xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              size="lg"
            >
              Back
            </Button>

            {currentStep < totalSteps && (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                size="lg"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Onboarding Tutorial */}
      <OnboardingTutorial />

      {/* Character Template Selector */}
      {showTemplateSelector && (
        <CharacterTemplateSelector
          onSelectTemplate={(characters) => {
            // Copy to clipboard
            navigator.clipboard.writeText(characters);
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  );
} 
