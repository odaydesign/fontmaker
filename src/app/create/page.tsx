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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card/50 backdrop-blur-sm">
        <div className="sticky top-20 p-6">
          <h2 className="text-lg font-semibold mb-6">Create Your Font</h2>

          <nav className="space-y-1">
            {steps.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              const isUpcoming = step.id > currentStep;

              return (
                <button
                  key={step.id}
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={isUpcoming}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                    isCurrent
                      ? 'bg-accent text-accent-foreground shadow-notion-sm'
                      : isCompleted
                      ? 'hover:bg-muted text-foreground'
                      : 'text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    isCurrent
                      ? 'bg-accent-foreground/10'
                      : isCompleted
                      ? 'bg-accent/20'
                      : 'bg-muted'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <span className={`text-sm font-semibold ${isCurrent ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                        {step.id}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isCurrent ? 'text-accent-foreground' : ''}`}>
                      {step.title}
                    </p>
                    <p className={`text-xs truncate ${
                      isCurrent ? 'text-accent-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                  {isCurrent && (
                    <ChevronRight className="w-4 h-4 text-accent-foreground flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Progress Bar */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progress</span>
              <span className="text-xs font-semibold text-foreground">
                {Math.round((currentStep / totalSteps) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-accent/80"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-xl border border-border shadow-notion-md"
          >
            {renderStepContent()}
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
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
