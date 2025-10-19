'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Textarea from '@/components/ui/textarea';
import { useFont } from '@/context/FontContext';
import { Check, Loader2, Sparkles, X } from 'lucide-react';

interface CharacterSet {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_CHARACTER_SETS: CharacterSet[] = [
  { id: 'uppercase', label: 'Uppercase (A-Z)', description: 'Generate uppercase letters', enabled: true },
  { id: 'lowercase', label: 'Lowercase (a-z)', description: 'Generate lowercase letters', enabled: false },
  { id: 'numbers', label: 'Numbers (0-9)', description: 'Generate numerical digits', enabled: false },
  { id: 'special', label: 'Special Characters', description: 'Generate punctuation and symbols', enabled: false },
];

export default function StyleReferenceGenerator() {
  const { generateAiImages, generateWithReference, setApprovedReferenceImage, approvedReferenceImage, sourceImages, toggleImageSelection } = useFont();

  const [step, setStep] = useState<'initial' | 'approval' | 'generate'>('initial');
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSampleImage, setGeneratedSampleImage] = useState<string | null>(null);
  const [characterSets, setCharacterSets] = useState<CharacterSet[]>(DEFAULT_CHARACTER_SETS);
  const [additionalPrompt, setAdditionalPrompt] = useState('');

  const handleGenerateInitialSample = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrompt = initialPrompt.trim();
    if (!trimmedPrompt) {
      toast.error('Please enter a prompt to generate a sample');
      return;
    }

    setIsGenerating(true);
    try {
      const images = await generateAiImages(trimmedPrompt, { count: 1 });
      if (images.length > 0) {
        setGeneratedSampleImage(images[0].url);
        setStep('approval');
        toast.success('Sample generated! Please review and approve the style.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate sample';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveStyle = () => {
    if (!generatedSampleImage) return;

    setApprovedReferenceImage(generatedSampleImage);
    setStep('generate');
    toast.success('Style approved! You can now generate additional character sets.');
  };

  const handleReject = () => {
    setGeneratedSampleImage(null);
    setStep('initial');
    toast.info('Sample rejected. Try a different prompt.');
  };

  const toggleCharacterSet = (id: string) => {
    setCharacterSets(prev =>
      prev.map(set =>
        set.id === id ? { ...set, enabled: !set.enabled } : set
      )
    );
  };

  const handleGenerateWithReference = async () => {
    const enabledSets = characterSets.filter(set => set.enabled);
    if (enabledSets.length === 0) {
      toast.error('Please select at least one character set to generate');
      return;
    }

    setIsGenerating(true);
    try {
      const setsDescription = enabledSets.map(set => set.label).join(', ');
      const prompt = additionalPrompt.trim() || `${initialPrompt} - ${setsDescription}`;

      const images = await generateWithReference(prompt, { count: 4 });
      toast.success(`Generated ${images.length} images with consistent style!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate with reference';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setStep('initial');
    setInitialPrompt('');
    setGeneratedSampleImage(null);
    setApprovedReferenceImage(null);
    setCharacterSets(DEFAULT_CHARACTER_SETS);
    setAdditionalPrompt('');
    toast.info('Workflow reset. Start fresh with a new style.');
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Initial Generation */}
      {step === 'initial' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Generate Reference Style
            </CardTitle>
            <CardDescription>
              Start by generating a sample of your desired font style. This will be used as a reference for consistent character generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateInitialSample} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Describe your desired font style
                </label>
                <Textarea
                  value={initialPrompt}
                  onChange={(e) => setInitialPrompt(e.target.value)}
                  placeholder="e.g., brush style uppercase letters A-Z on white background"
                  rows={3}
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                disabled={isGenerating || !initialPrompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Sample...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Sample Style
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Approval */}
      {step === 'approval' && generatedSampleImage && (
        <Card>
          <CardHeader>
            <CardTitle>Approve Reference Style</CardTitle>
            <CardDescription>
              Review the generated sample. If you like the style, approve it to use as reference for generating additional characters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
              <img
                src={generatedSampleImage}
                alt="Generated sample"
                className="max-w-full max-h-[400px] object-contain rounded"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleApproveStyle}
                className="flex-1"
                variant="default"
              >
                <Check className="w-4 h-4 mr-2" />
                Approve Style
              </Button>
              <Button
                onClick={handleReject}
                className="flex-1"
                variant="outline"
              >
                <X className="w-4 h-4 mr-2" />
                Try Different Style
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Generate with Reference */}
      {step === 'generate' && approvedReferenceImage && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Consistent Character Sets</CardTitle>
            <CardDescription>
              Select which character sets to generate using your approved style as reference.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reference preview */}
            <div>
              <p className="text-sm font-medium mb-2">Approved Reference Style:</p>
              <div className="bg-gray-50 rounded-lg p-2 inline-block">
                <img
                  src={approvedReferenceImage}
                  alt="Reference style"
                  className="h-20 object-contain rounded"
                />
              </div>
            </div>

            {/* Character set selection */}
            <div>
              <p className="text-sm font-medium mb-3">Select Character Sets:</p>
              <div className="space-y-2">
                {characterSets.map(set => (
                  <label
                    key={set.id}
                    className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={set.enabled}
                      onChange={() => toggleCharacterSet(set.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{set.label}</div>
                      <div className="text-xs text-gray-500">{set.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional additional prompt */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Instructions (Optional)
              </label>
              <Textarea
                value={additionalPrompt}
                onChange={(e) => setAdditionalPrompt(e.target.value)}
                placeholder="e.g., make them slightly bolder"
                rows={2}
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateWithReference}
                disabled={isGenerating || characterSets.filter(s => s.enabled).length === 0}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with Reference
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
              >
                Reset Workflow
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info card when reference is approved */}
      {approvedReferenceImage && step === 'generate' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <strong>Style Consistency Enabled:</strong> All new generations will maintain the visual style of your approved reference image, ensuring consistent typography across all character sets.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generated Images Gallery */}
      {sourceImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Images ({sourceImages.length})</CardTitle>
            <CardDescription>
              Review your generated images. Select the ones you want to use for character mapping.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sourceImages.map((image) => (
                <div
                  key={image.id}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    image.selected
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleImageSelection(image.id)}
                >
                  <img
                    src={image.url}
                    alt={`Generated ${image.id}`}
                    className="w-full h-48 object-cover"
                  />
                  {image.selected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  {image.aiPrompt && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate">
                      {image.aiPrompt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
