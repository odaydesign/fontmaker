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
import { Sparkles } from 'lucide-react';

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
            <div className="p-6 border-b">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">Create Your Character Sheets</h2>
                  <p className="text-sm text-gray-500">
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
                  Character Templates
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
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Review & Edit Character Mappings</h2>
              <p className="text-sm text-gray-500">
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
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Align & Adjust Characters</h2>
              <p className="text-sm text-gray-500">
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
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Font Information</h2>
              <p className="text-sm text-gray-500">
                Add metadata to your font such as name, author, and description.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="font-name" className="block text-sm font-medium mb-1">Font Name</label>
                  <input 
                    id="font-name" 
                    type="text"
                    value={metadata.name} 
                    onChange={(e) => updateMetadata({ ...metadata, name: e.target.value })}
                    placeholder="My Awesome Font"
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label htmlFor="font-author" className="block text-sm font-medium mb-1">Author</label>
                  <input 
                    id="font-author" 
                    type="text"
                    value={metadata.author || ''} 
                    onChange={(e) => updateMetadata({ ...metadata, author: e.target.value })}
                    placeholder="Your Name"
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label htmlFor="font-description" className="block text-sm font-medium mb-1">Description</label>
                  <textarea 
                    id="font-description" 
                    value={metadata.description || ''} 
                    onChange={(e) => updateMetadata({ ...metadata, description: e.target.value })}
                    placeholder="Add a description for your font"
                    className="w-full h-24 p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          </>
        );
      case 5:
        return (
          <>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Generate Font</h2>
              <p className="text-sm text-gray-500">
                Generate and download your font file.
              </p>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <FontDownloader />
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Create Your Font</h1>
        <div className="text-sm text-gray-500">
          Step {currentStep} of {totalSteps}
        </div>
      </div>
      
      <div className="mb-6 bg-white rounded-lg shadow-sm border">
        {renderStepContent()}
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handleBack} 
          disabled={currentStep === 1}
        >
          Back
        </Button>
        
        {currentStep < totalSteps ? (
          <Button 
            onClick={handleNext} 
            disabled={!canProceed()}
          >
            Next Step
          </Button>
        ) : (
          <div>{/* Empty div for flex spacing on the last step */}</div>
        )}
      </div>

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
