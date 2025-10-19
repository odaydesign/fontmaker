'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Textarea from '@/components/ui/textarea';
import { useFont, SourceImage } from '@/context/FontContext';
import { Loader2, Sparkles, Upload, CheckCircle, Trash2, Lightbulb, ArrowRight, RefreshCw, ZoomIn, X } from 'lucide-react';
import { buildSimplifiedPrompt, STYLE_EXAMPLES, CharacterType } from '@/lib/promptTemplates';

type WorkflowStep = 'initial' | 'select-reference' | 'generate-additional';
type AdditionalCharacterSet = 'lowercase' | 'numbers' | 'special';

interface GenerationProgress {
  current: number;
  total: number;
  currentSet: string;
}

const MAX_INITIAL_SUGGESTIONS = 3; // Generate 3 for initial uppercase
const MAX_ADDITIONAL_SUGGESTIONS = 1; // Generate 1 for each additional character set

const ADDITIONAL_CHARACTER_SETS = [
  { id: 'lowercase' as AdditionalCharacterSet, label: 'Lowercase (a-z)', description: 'Generate lowercase letters' },
  { id: 'numbers' as AdditionalCharacterSet, label: 'Numbers (0-9)', description: 'Generate numerical digits' },
  { id: 'special' as AdditionalCharacterSet, label: 'Special Characters', description: 'Generate punctuation and symbols' },
];

const UnifiedFontGenerator: React.FC = () => {
  const {
    generateAiImages,
    sourceImages,
    toggleImageSelection,
    removeSourceImage,
    setApprovedReferenceImage,
    approvedReferenceImage,
    generateWithReference
  } = useFont();

  // Workflow state
  const [step, setStep] = useState<WorkflowStep>('initial');
  const [styleDescription, setStyleDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const [selectedReference, setSelectedReference] = useState<SourceImage | null>(null);
  const [selectedAdditionalSets, setSelectedAdditionalSets] = useState<AdditionalCharacterSet[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // File upload
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filter images
  const aiImages = useMemo(
    () => sourceImages.filter(image => image.origin === 'ai'),
    [sourceImages]
  );

  const uploadedImages = useMemo(
    () => sourceImages.filter(image => image.origin !== 'ai'),
    [sourceImages]
  );

  // Calculate total cost (gpt-image-1-mini high quality: $0.02 per image)
  const totalCost = useMemo(() => {
    const aiImageCount = aiImages.length;
    return (aiImageCount * 0.02).toFixed(2);
  }, [aiImages]);

  const handleGenerateUppercase = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!styleDescription.trim()) {
      toast.error('Please describe the font style you want');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 1, total: 1, currentSet: 'Uppercase (A-Z)' });

    try {
      // Always generate uppercase only for initial generation
      const professionalPrompt = buildSimplifiedPrompt(
        styleDescription.trim(),
        'uppercase'
      );

      console.log('Generated prompt:', professionalPrompt);

      const images = await generateAiImages(professionalPrompt, { count: MAX_INITIAL_SUGGESTIONS });

      toast.success(`Generated ${images.length} uppercase character sheet${images.length === 1 ? '' : 's'}!`);
      setStep('select-reference');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate images.';
      toast.error(message);
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const handleSelectReference = (image: SourceImage) => {
    setSelectedReference(image);
    setApprovedReferenceImage(image.url);
    toast.success('Reference style selected! Now you can generate additional character sets.');
    setStep('generate-additional');
  };

  const handleGenerateAdditional = async () => {
    if (selectedAdditionalSets.length === 0) {
      toast.error('Please select at least one character set to generate');
      return;
    }

    if (!selectedReference || !approvedReferenceImage) {
      toast.error('No reference style selected');
      return;
    }

    setIsGenerating(true);

    try {
      const total = selectedAdditionalSets.length;
      let generatedCount = 0;

      // Generate each character set separately
      for (let i = 0; i < selectedAdditionalSets.length; i++) {
        const setId = selectedAdditionalSets[i];
        const characterSet = ADDITIONAL_CHARACTER_SETS.find(s => s.id === setId);

        if (!characterSet) continue;

        // Update progress
        setGenerationProgress({
          current: i + 1,
          total,
          currentSet: characterSet.label
        });

        try {
          // Map character set ID to CharacterType
          let characterType: CharacterType;
          switch (setId) {
            case 'lowercase':
              characterType = 'lowercase';
              break;
            case 'numbers':
              characterType = 'numbers';
              break;
            case 'special':
              // For special characters, we'll use a custom prompt
              characterType = 'mixed'; // placeholder
              break;
            default:
              characterType = 'mixed';
          }

          // Build prompt for this specific character set
          const prompt = setId === 'special'
            ? `${styleDescription} - ${characterSet.label}` // Custom for special chars
            : buildSimplifiedPrompt(styleDescription.trim(), characterType);

          console.log(`Generating ${characterSet.label}:`, prompt);

          // Generate this character set (1 image per set)
          const images = await generateWithReference(prompt, { count: MAX_ADDITIONAL_SUGGESTIONS });

          generatedCount += images.length;

          toast.success(`Generated ${characterSet.label}!`);
        } catch (error) {
          console.error(`Error generating ${characterSet.label}:`, error);
          toast.error(`Failed to generate ${characterSet.label}`);
        }
      }

      toast.success(`Successfully generated ${generatedCount} character sheet${generatedCount === 1 ? '' : 's'}!`);
      setSelectedAdditionalSets([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate with reference';
      toast.error(message);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  const toggleAdditionalSet = (setId: AdditionalCharacterSet) => {
    setSelectedAdditionalSets(prev =>
      prev.includes(setId)
        ? prev.filter(id => id !== setId)
        : [...prev, setId]
    );
  };

  const handleExampleClick = (example: string) => {
    setStyleDescription(example);
    setShowExamples(false);
  };

  const handleReset = () => {
    setStep('initial');
    setStyleDescription('');
    setSelectedReference(null);
    setApprovedReferenceImage(null);
    setSelectedAdditionalSets([]);
    toast.info('Workflow reset. Start fresh with a new style.');
  };

  const handleRefreshImage = async (image: SourceImage, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering other click handlers

    if (!approvedReferenceImage) {
      toast.error('No reference style selected');
      return;
    }

    setIsGenerating(true);

    try {
      // Determine the character type based on the image's prompt or context
      // For now, we'll regenerate with the same prompt if available
      const prompt = image.aiPrompt || buildSimplifiedPrompt(styleDescription.trim(), 'uppercase');

      // Generate a single replacement image
      const images = await generateWithReference(prompt, { count: 1 });

      if (images.length > 0) {
        // Remove the old image
        removeSourceImage(image.id);
        toast.success('Image refreshed successfully!');
      }
    } catch (error) {
      console.error('Error refreshing image:', error);
      toast.error('Failed to refresh image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleZoomImage = (imageUrl: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering other click handlers
    setZoomedImage(imageUrl);
  };

  // File upload handlers
  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL.'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const getImageDimensions = (src: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error('Failed to load image dimensions.'));
      img.src = src;
    });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploads: SourceImage[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const url = await readFileAsDataURL(file);
        let dimensions: { width?: number; height?: number } = {};

        try {
          const { width, height } = await getImageDimensions(url);
          dimensions = { width, height };
        } catch {
          // Best effort; allow missing dimensions.
        }

        const image = sourceImages.find(img => img.url === url) || {
          id: `upload-${Date.now()}-${i}`,
          url,
          isAiGenerated: false,
          origin: 'upload' as const,
          selected: false,
          ...dimensions,
        };

        uploads.push(image);
      }

      toast.success(`Uploaded ${uploads.length} image${uploads.length === 1 ? '' : 's'}.`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload one or more files.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Initial Generation or Upload */}
      {step === 'initial' && (
        <>
          {/* AI Generation Section */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-indigo-100 p-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">Generate with AI</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Describe your font style and we&apos;ll generate uppercase characters for you to choose from.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleGenerateUppercase} className="space-y-6 p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="style-description" className="block text-sm font-medium text-gray-900">
                    Describe your font style
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowExamples(!showExamples)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                  >
                    <Lightbulb className="h-3 w-3" />
                    {showExamples ? 'Hide' : 'Show'} examples
                  </button>
                </div>

                <Textarea
                  id="style-description"
                  value={styleDescription}
                  onChange={e => setStyleDescription(e.target.value)}
                  placeholder="e.g., Halloween spooky, Christmas festive, elegant script, bold modern..."
                  rows={3}
                  className="w-full"
                />

                {showExamples && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="mb-2 text-xs font-medium text-gray-700">Click an example to use it:</p>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_EXAMPLES.map(example => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => handleExampleClick(example)}
                          className="rounded-full bg-white px-3 py-1.5 text-xs text-gray-700 shadow-sm transition-all hover:bg-indigo-50 hover:text-indigo-700 hover:shadow"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t pt-6">
                <p className="text-xs text-gray-500">
                  Will generate {MAX_INITIAL_SUGGESTIONS} uppercase character sheets
                </p>
                <Button
                  type="submit"
                  disabled={!styleDescription.trim() || isGenerating}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Uppercase
                    </>
                  )}
                </Button>
              </div>

              {/* Progress Indicator */}
              {isGenerating && generationProgress && (
                <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-indigo-900">
                        Generating {generationProgress.currentSet}...
                      </p>
                      <p className="mt-1 text-xs text-indigo-700">
                        Step {generationProgress.current} of {generationProgress.total}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-indigo-200">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Upload Section */}
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="border-b p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">Upload Images</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Have your own character designs? Upload scans or photos of your lettering.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading}
                variant="outline"
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Images
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1 text-sm text-indigo-900">
                <p className="font-medium">How it works:</p>
                <ol className="mt-2 space-y-1 text-indigo-800">
                  <li>1. Describe your style and generate uppercase characters</li>
                  <li>2. Select your favorite design as a reference</li>
                  <li>3. Generate additional character sets (lowercase, numbers, etc.) in the same style</li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Step 2: Select Reference */}
      {step === 'select-reference' && aiImages.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b p-6">
            <h3 className="text-xl font-semibold text-gray-900">Select Your Reference Style</h3>
            <p className="mt-1 text-sm text-gray-600">
              Choose the design you like best. This will be used as a reference for generating additional character sets.
            </p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {aiImages.map(image => (
                <div
                  key={image.id}
                  className="group cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 transition-all hover:border-indigo-400 hover:shadow-md"
                  onClick={() => handleSelectReference(image)}
                >
                  <div className="relative aspect-square bg-gray-50">
                    <img
                      src={image.url}
                      alt={image.aiPrompt || 'Generated uppercase'}
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/10">
                      <div className="translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                        <div className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                          Select This Style
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between border-t pt-6">
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Generate Additional Sets */}
      {step === 'generate-additional' && selectedReference && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b p-6">
            <h3 className="text-xl font-semibold text-gray-900">Generate Additional Character Sets</h3>
            <p className="mt-1 text-sm text-gray-600">
              Select which character sets to generate using your approved style as reference.
            </p>
          </div>
          <div className="space-y-6 p-6">
            {/* Reference Preview */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-900">Your Reference Style:</p>
              <div className="inline-block overflow-hidden rounded-lg border-2 border-indigo-500">
                <img
                  src={selectedReference.url}
                  alt="Reference style"
                  className="h-32 object-contain"
                />
              </div>
            </div>

            {/* Character Set Selection */}
            <div>
              <p className="mb-3 text-sm font-medium text-gray-900">Select Character Sets to Generate:</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {ADDITIONAL_CHARACTER_SETS.map(set => (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => toggleAdditionalSet(set.id)}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      selectedAdditionalSets.includes(set.id)
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                        selectedAdditionalSets.includes(set.id)
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedAdditionalSets.includes(set.id) && (
                          <CheckCircle className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="font-medium text-gray-900">{set.label}</div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{set.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t pt-6">
              <Button
                onClick={handleGenerateAdditional}
                disabled={isGenerating || selectedAdditionalSets.length === 0}
                className="flex-1"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Selected Sets
                  </>
                )}
              </Button>
              <Button onClick={handleReset} variant="outline">
                Start Over
              </Button>
            </div>

            {/* Progress Indicator */}
            {isGenerating && generationProgress && (
              <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-indigo-900">
                      Generating {generationProgress.currentSet}...
                    </p>
                    <p className="mt-1 text-xs text-indigo-700">
                      Character Set {generationProgress.current} of {generationProgress.total}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-indigo-200">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Images Gallery */}
      {(aiImages.length > 0 || uploadedImages.length > 0) && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Generated & Uploaded Images</h3>
                <p className="text-sm text-gray-600">
                  Select the character sheets you want to use for your font.
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{sourceImages.length} total</div>
                {aiImages.length > 0 && (
                  <div className="mt-1 text-sm font-semibold text-green-600">
                    Total cost: ${totalCost}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sourceImages.map(image => (
                <div
                  key={image.id}
                  className={`flex flex-col overflow-hidden rounded-lg border-2 transition-all ${
                    image.selected
                      ? 'border-indigo-500 shadow-md ring-2 ring-indigo-500 ring-offset-2'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="relative aspect-square cursor-pointer bg-gray-50"
                    onClick={() => toggleImageSelection(image.id)}
                  >
                    <img
                      src={image.url}
                      alt={image.aiPrompt || 'Character sheet'}
                      className="h-full w-full object-contain"
                    />
                    {image.selected && (
                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-1 text-xs font-medium text-white">
                        <CheckCircle className="h-3 w-3" />
                        Selected
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 border-t p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 truncate text-xs text-gray-500">
                        {image.origin === 'ai' ? (image.aiPrompt || 'AI Generated') : 'Uploaded'}
                      </div>
                      <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-indigo-600"
                        onClick={(e) => handleZoomImage(image.url, e)}
                        title="View full size"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      {image.origin === 'ai' && approvedReferenceImage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          onClick={(e) => handleRefreshImage(image, e)}
                          title="Regenerate this image"
                          disabled={isGenerating}
                        >
                          <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSourceImage(image.id);
                        }}
                        title="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      </div>
                    </div>
                    {image.origin === 'ai' && (
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-xs text-gray-400">Generation cost:</span>
                        <span className="text-xs font-semibold text-green-600">$0.02</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zoom Overlay Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -right-4 -top-4 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>
            <img
              src={zoomedImage}
              alt="Full size preview"
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedFontGenerator;
