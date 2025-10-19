'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useFont } from '@/context/FontContext';
import { Loader2, Sparkles, Lightbulb, CheckCircle, Trash2 } from 'lucide-react';
import {
  buildSimplifiedPrompt,
  validateStyleInput,
  STYLE_EXAMPLES,
  CHARACTER_TYPE_OPTIONS,
  CharacterType,
} from '@/lib/promptTemplates';
import { characterTemplates, getTemplateById } from '@/lib/characterTemplates';

const MAX_SUGGESTIONS = 4;

const SimplifiedImageGenerator: React.FC = () => {
  const { generateAiImages, sourceImages, toggleImageSelection, removeSourceImage } = useFont();

  // User inputs
  const [styleDescription, setStyleDescription] = useState('');
  const [characterType, setCharacterType] = useState<CharacterType>('mixed');
  const [selectedLanguageTemplateId, setSelectedLanguageTemplateId] = useState<string>('');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // Get language templates for dropdown
  const languageTemplates = characterTemplates.filter(t => t.category === 'language');

  // Filter AI-generated images
  const aiImages = useMemo(
    () => sourceImages.filter(image => image.origin === 'ai'),
    [sourceImages]
  );

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate input
    const validation = validateStyleInput(styleDescription);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setIsGenerating(true);

    try {
      // Get characters from language template if selected
      let characters: string | undefined;
      if (selectedLanguageTemplateId) {
        const template = getTemplateById(selectedLanguageTemplateId);
        if (template) {
          characters = template.characters;
        }
      }

      // Build the professional prompt using our template
      const professionalPrompt = buildSimplifiedPrompt(
        styleDescription.trim(),
        characterType,
        characters
      );

      console.log('Generated prompt:', professionalPrompt);

      // Generate images using the professional prompt
      const images = await generateAiImages(professionalPrompt, { count: MAX_SUGGESTIONS });

      toast.success(`Generated ${images.length} character sheet${images.length === 1 ? '' : 's'}!`);

      // Keep the form filled for easy refinement
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate images.';
      toast.error(message);
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setStyleDescription(example);
    setShowExamples(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-100 p-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">Generate Character Sheets</h2>
              <p className="mt-1 text-sm text-gray-600">
                Describe the style you want, select character types, and let AI generate professional
                font reference sheets for you.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6 p-6">
          {/* Style Description */}
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

          {/* Character Type Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">Character type</label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CHARACTER_TYPE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCharacterType(option.value)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    characterType === option.value
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="mt-1 text-xs text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Language/Accent Selector (Optional) */}
          <div className="space-y-3">
            <label htmlFor="language-template" className="block text-sm font-medium text-gray-900">
              Additional characters (optional)
            </label>
            <select
              id="language-template"
              value={selectedLanguageTemplateId}
              onChange={e => setSelectedLanguageTemplateId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">None - Standard characters only</option>
              {languageTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.icon} {template.name} - {template.description}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Select a language to include accented or special characters in addition to the base
              character set.
            </p>
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between border-t pt-6">
            <p className="text-xs text-gray-500">
              Will generate up to {MAX_SUGGESTIONS} variations
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
                  Generate Sheets
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Info Panel */}
      <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Lightbulb className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1 text-sm text-indigo-900">
            <p className="font-medium">How it works:</p>
            <ul className="mt-2 space-y-1 text-indigo-800">
              <li>1. Describe the style you want (e.g., "Halloween spooky" or "elegant script")</li>
              <li>2. Choose which characters to generate (uppercase, lowercase, numbers, or all)</li>
              <li>3. Optionally add language-specific characters</li>
              <li>4. We&apos;ll create professional character sheets optimized for font creation</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Generated Images Gallery */}
      {aiImages.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Generated Character Sheets</h3>
                <p className="text-sm text-gray-600">
                  Select the character sheets you want to use for your font. Click on an image to
                  select/deselect it.
                </p>
              </div>
              <span className="text-sm text-gray-500">{aiImages.length} generated</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {aiImages.map(image => (
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
                      alt={image.aiPrompt || 'Generated character sheet'}
                      className="h-full w-full object-contain"
                    />
                    {image.selected && (
                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-1 text-xs font-medium text-white">
                        <CheckCircle className="h-3 w-3" />
                        Selected
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t p-3">
                    <div className="flex-1 text-xs text-gray-500 truncate">
                      {image.aiPrompt || 'AI Generated'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                      onClick={() => removeSourceImage(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedImageGenerator;
