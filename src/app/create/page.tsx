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
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Create Your Character Sheets</h2>
                  <p className="text-sm text-muted-foreground">
                    Generate with AI or upload your own images to start creating your font.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateSelector(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Templates
                </Button>
              </div>
            </div>
            <div className="p-6">
              <UnifiedFontGenerator />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold mb-1">Review & Edit Character Mappings</h2>
              <p className="text-sm text-muted-foreground">
                Review the automatically detected characters and make manual adjustments if needed.
              </p>
            </div>
            <div className="p-6">
              <CharacterMappingOverview />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold mb-1">Align & Adjust Characters</h2>
              <p className="text-sm text-muted-foreground">
                Fine-tune positioning, spacing, and kerning for your font characters.
              </p>
            </div>
            <div className="p-6">
              <CharacterAlignment />
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold mb-1">Font Information</h2>
              <p className="text-sm text-muted-foreground">
                Add metadata to your font such as name, author, and description.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="font-name" className="block text-sm font-medium mb-2">Font Name</label>
                  <input
                    id="font-name"
                    type="text"
                    value={metadata.name}
                    onChange={(e) => updateMetadata({ ...metadata, name: e.target.value })}
                    placeholder="My Awesome Font"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="font-author" className="block text-sm font-medium mb-2">Author</label>
                  <input
                    id="font-author"
                    type="text"
                    value={metadata.author || ''}
                    onChange={(e) => updateMetadata({ ...metadata, author: e.target.value })}
                    placeholder="Your Name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="font-description" className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    id="font-description"
                    value={metadata.description || ''}
                    onChange={(e) => updateMetadata({ ...metadata, description: e.target.value })}
                    placeholder="Add a description for your font"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </>
        );
      case 5:
        return (
          <>
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold mb-1">Generate Font</h2>
              <p className="text-sm text-muted-foreground">
                Generate and download your font file.
              </p>
            </div>
            <div className="p-6">
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
      <div className="sticky top-[73px] z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="w-full px-8 py-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold">Create Your Font</h2>
              <span className="text-xs text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <span className="text-xs font-medium">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>

          {/* Step Pills */}
          <div className="flex items-center gap-2 mb-4">
            {steps.map((step, index) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isUpcoming = step.id > currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                    disabled={isUpcoming}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-medium whitespace-nowrap ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-accent text-accent-foreground hover:bg-accent/80'
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-semibold">
                        {step.id}
                      </span>
                    )}
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-px mx-2 bg-border">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Animated Progress Bar */}
          <div className="h-0.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <main className="w-full">
        <div className="w-full px-8 py-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-card rounded-lg border border-border"
          >
            {renderStepContent()}
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>

            {currentStep < totalSteps && (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
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
