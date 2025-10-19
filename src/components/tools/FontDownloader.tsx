'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Save, Settings } from 'lucide-react';
import { useFont } from '@/context/FontContext';
import { toast } from 'sonner';

// Import our new browser-based modules
import { ImageProcessor } from '@/lib/image/processor';
import { ImageTracer, traceToPathData } from '@/lib/image/tracer';
import { PotraceTracer } from '@/lib/image/potraceTracer';
import { FontGenerator, GlyphData } from '@/lib/font/generator';
import { fontStorage } from '@/lib/storage/fontStorage';
import TracingQualityPreview, { TracingSettings } from './TracingQualityPreview';
import { FontPreview } from './FontPreview';
import { useTracingSettings } from '@/context/TracingSettingsContext';

interface FontFormat {
  value: string;
  label: string;
}

interface FontDownloaderProps {
  characterMappings?: any[];
  sourceImages?: any[];
  metadata?: {
    name: string;
    author?: string;
    description?: string;
  };
}

export default function FontDownloader({
  characterMappings: propCharacterMappings,
  sourceImages: propSourceImages,
  metadata: propMetadata,
}: FontDownloaderProps) {
  const {
    metadata: contextMetadata,
    characterMappings: contextCharacterMappings,
    sourceImages: contextSourceImages,
    fontAdjustments
  } = useFont();

  // Use props if provided, otherwise fall back to context
  const characterMappings = propCharacterMappings || contextCharacterMappings;
  const sourceImages = propSourceImages || contextSourceImages;
  const metadata = propMetadata || contextMetadata;

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ttf');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedFontData, setGeneratedFontData] = useState<ArrayBuffer | null>(null);
  const { settings: tracingSettings, setSettings: setTracingSettings } = useTracingSettings();

  const fontFormats: FontFormat[] = [
    { value: 'ttf', label: 'TrueType (.ttf)' },
    { value: 'otf', label: 'OpenType (.otf)' },
  ];

  const handleSelectFormat = (format: string) => {
    setSelectedFormat(format);
  };

  const hasRequiredFields = () => {
    return characterMappings && characterMappings.length > 0 &&
           sourceImages && sourceImages.length > 0 &&
           metadata && metadata.name;
  };

  /**
   * Open tracing quality preview
   */
  const handleOpenPreview = () => {
    if (!hasRequiredFields()) {
      toast.error('Please add characters first');
      return;
    }
    setShowPreview(true);
  };

  /**
   * Handle settings confirmation from preview
   */
  const handleSettingsConfirm = (settings: TracingSettings) => {
    setTracingSettings(settings);
    setShowPreview(false);
    toast.success('Tracing settings updated!');
  };

  /**
   * CLIENT-SIDE FONT GENERATION
   * All processing happens in the browser - no server needed!
   */
  const handleGenerateFont = async () => {
    if (!hasRequiredFields()) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress('Preparing...');

    try {
      // Step 1: Prepare glyph data from character mappings
      setGenerationProgress(`Processing ${characterMappings.length} characters...`);
      const glyphs: GlyphData[] = [];

      for (let i = 0; i < characterMappings.length; i++) {
        const mapping = characterMappings[i];

        try {
          setGenerationProgress(`Processing character ${i + 1}/${characterMappings.length}: "${mapping.char}"`);

          // Find source image
          const sourceImg = sourceImages.find(img => img.id === mapping.sourceImageId);
          if (!sourceImg) {
            console.warn(`Source image not found for character "${mapping.char}"`);
            continue;
          }

          // Load image
          const img = await ImageProcessor.loadImage(sourceImg.url);

          // Extract character region
          const imageData = ImageProcessor.extractCharacter(img, {
            x1: mapping.x1,
            y1: mapping.y1,
            x2: mapping.x2,
            y2: mapping.y2,
          });

          // Apply user-selected tracing settings
          let processed = imageData;

          // Step 1: Upscale
          if (tracingSettings.upscaleAmount > 1) {
            processed = ImageProcessor.upscale(processed, tracingSettings.upscaleAmount);
          }

          // Step 2: Pre-smoothing if enabled
          if (tracingSettings.smoothing > 0) {
            processed = ImageProcessor.smooth(processed, tracingSettings.smoothing);
          }

          // Step 3: Apply auto threshold for clean black/white
          const thresholded = ImageProcessor.autoThreshold(processed);

          // Trim whitespace
          const trimmed = ImageProcessor.trim(thresholded);

          // Trace to SVG path with selected method
          setGenerationProgress(`Tracing character "${mapping.char}" to vector...`);
          let svgPath: string;
          if (tracingSettings.usePotrace) {
            // Use professional potrace vectorization
            const svg = await PotraceTracer.trace(trimmed, {
              turdsize: tracingSettings.turdsize,
              alphamax: tracingSettings.alphamax,
              opttolerance: tracingSettings.opttolerance,
            });
            svgPath = PotraceTracer.extractPathData(svg);
          } else {
            // Use imagetracerjs
            const svg = await ImageTracer.trace(trimmed, {
              ltres: tracingSettings.ltres,
              qtres: tracingSettings.qtres,
              blurradius: tracingSettings.blurRadius,
            });
            svgPath = ImageTracer.extractPathData(svg);
          }

          // Add to glyphs
          glyphs.push({
            char: mapping.char,
            svgPath,
            imageWidth: trimmed.width,
            imageHeight: trimmed.height,
          });

        } catch (error) {
          console.error(`Failed to process character "${mapping.char}":`, error);
          toast.error(`Failed to process character "${mapping.char}"`);
        }
      }

      if (glyphs.length === 0) {
        throw new Error('No characters were successfully processed');
      }

      // Step 2: Generate font
      setGenerationProgress('Generating font file...');
      const fontBuffer = await FontGenerator.generateFont({
        glyphs,
        metadata: {
          name: metadata.name,
          author: metadata.author,
          description: metadata.description,
          isPublic: false,
        },
        adjustments: fontAdjustments,
      });

      // Step 3: Save to IndexedDB (optional)
      if (saveToLibrary) {
        setGenerationProgress('Saving to library...');
        await fontStorage.saveFont(
          fontBuffer,
          {
            name: metadata.name,
            author: metadata.author,
            description: metadata.description,
            isPublic: false,
          },
          selectedFormat
        );
        toast.success('Font saved to your library!');
      }

      // Step 4: Store font data for preview
      setGeneratedFontData(fontBuffer);

      // Step 5: Download
      setGenerationProgress('Downloading...');
      FontGenerator.downloadFont(fontBuffer, metadata.name, selectedFormat);

      toast.success('Font generated successfully!');
      setGenerationProgress('');

    } catch (error) {
      console.error('Error generating font:', error);
      toast.error(`Error generating font: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setGenerationProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Format Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="w-full sm:w-auto">
          <label htmlFor="format-select" className="block text-sm font-medium mb-1">
            Font Format
          </label>
          <select
            id="format-select"
            value={selectedFormat}
            onChange={(e) => handleSelectFormat(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isGenerating}
          >
            {fontFormats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>

        {/* Save to Library Option */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="save-library"
            checked={saveToLibrary}
            onChange={(e) => setSaveToLibrary(e.target.checked)}
            disabled={isGenerating}
            className="w-4 h-4"
          />
          <label htmlFor="save-library" className="text-sm">
            Save to library
          </label>
        </div>

        {/* Tracing Quality Button */}
        <Button
          onClick={handleOpenPreview}
          disabled={isGenerating || !hasRequiredFields()}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Tracing Quality
        </Button>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateFont}
          disabled={isGenerating || !hasRequiredFields()}
          className="min-w-36"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Font
            </>
          )}
        </Button>
      </div>

      {/* Progress Indicator */}
      {isGenerating && generationProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-700">{generationProgress}</p>
          </div>
        </div>
      )}

      {/* Font Adjustments Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
        <p className="font-medium mb-2">Font Settings:</p>
        <ul className="space-y-1 text-gray-700">
          <li>• Letter Spacing: {fontAdjustments.letterSpacing}</li>
          <li>• Character Width: {fontAdjustments.charWidth}%</li>
          <li>• Baseline Offset: {fontAdjustments.baselineOffset}</li>
          {Object.keys(fontAdjustments.kerningPairs).length > 0 && (
            <li>
              • Custom Kerning: {Object.keys(fontAdjustments.kerningPairs).length} pair
              {Object.keys(fontAdjustments.kerningPairs).length !== 1 ? 's' : ''}
            </li>
          )}
        </ul>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-md p-3">
        <p className="text-sm text-green-800">
          <strong>✨ 100% Browser-Based:</strong> Your font is generated entirely in your browser.
          No data is sent to any server. Everything stays private!
        </p>
      </div>

      {/* Requirements Warning */}
      {!hasRequiredFields() && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
          <p className="text-sm text-orange-700">
            <strong>⚠️ Missing Requirements:</strong> Please ensure you have:
          </p>
          <ul className="list-disc pl-5 mt-1 text-sm text-orange-700">
            {(!characterMappings || characterMappings.length === 0) && (
              <li>At least one character mapped</li>
            )}
            {(!sourceImages || sourceImages.length === 0) && (
              <li>At least one source image uploaded</li>
            )}
            {!metadata?.name && (
              <li>Font name entered</li>
            )}
          </ul>
        </div>
      )}

      {/* Tracing Quality Preview Modal */}
      {showPreview && (
        <TracingQualityPreview
          imageData={new ImageData(1, 1)} // Dummy data for backward compatibility
          onConfirm={handleSettingsConfirm}
          onCancel={() => setShowPreview(false)}
        />
      )}

      {/* Live Font Preview */}
      {generatedFontData && (
        <div className="mt-8 pt-8 border-t">
          <h3 className="text-lg font-semibold mb-4">Font Preview</h3>
          <FontPreview
            fontData={generatedFontData}
            fontFamily={metadata.name.replace(/\s+/g, '')}
          />
        </div>
      )}
    </div>
  );
}
