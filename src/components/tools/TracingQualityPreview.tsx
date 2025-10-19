'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ImageProcessor } from '@/lib/image/processor';
import { PotraceTracer } from '@/lib/image/potraceTracer';
import { Loader2, Sparkles, Gauge, Scissors, CurlyBraces, Droplets, ZoomIn, X } from 'lucide-react';
import { useFont } from '@/context/FontContext';

interface TracingQualityPreviewProps {
  imageData: ImageData; // Legacy - kept for backward compatibility but not used
  onConfirm: (settings: TracingSettings) => void;
  onCancel: () => void;
}

export interface TracingSettings {
  usePotrace: boolean;
  upscaleAmount: number;
  ltres: number;
  qtres: number;
  blurRadius: number;
  smoothing: number;
  turdsize?: number;
  alphamax?: number;
  opttolerance?: number;
}

interface CharacterPreview {
  char: string;
  imageData: ImageData;
  svgString: string | null;
  isTracing: boolean;
}

export default function TracingQualityPreview({
  onConfirm,
  onCancel,
}: TracingQualityPreviewProps) {
  const { characterMappings, sourceImages } = useFont();
  const [characterPreviews, setCharacterPreviews] = useState<CharacterPreview[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [zoomedCharacter, setZoomedCharacter] = useState<CharacterPreview | null>(null);
  const traceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified settings for amateur users
  const [settings, setSettings] = useState<TracingSettings>({
    usePotrace: true, // Always use potrace - best quality
    upscaleAmount: 2,
    ltres: 0.01,
    qtres: 0.01,
    blurRadius: 0,
    smoothing: 2,
    turdsize: 9,
    alphamax: 1.2,
    opttolerance: 0.55,
  });

  // Initialize character previews
  useEffect(() => {
    const initializePreviews = async () => {
      setIsInitializing(true);
      const previews: CharacterPreview[] = [];

      // Load first 4 characters for preview (or all if less)
      const mappingsToShow = characterMappings.slice(0, 4);

      for (const mapping of mappingsToShow) {
        try {
          const sourceImg = sourceImages.find(img => img.id === mapping.sourceImageId);
          if (!sourceImg) continue;

          const img = await ImageProcessor.loadImage(sourceImg.url);
          const imageData = ImageProcessor.extractCharacter(img, {
            x1: mapping.x1,
            y1: mapping.y1,
            x2: mapping.x2,
            y2: mapping.y2,
          });

          previews.push({
            char: mapping.char,
            imageData,
            svgString: null,
            isTracing: false,
          });
        } catch (error) {
          console.error(`Failed to load character "${mapping.char}":`, error);
        }
      }

      setCharacterPreviews(previews);
      setIsInitializing(false);
    };

    initializePreviews();
  }, [characterMappings, sourceImages]);

  // Trace all characters whenever settings change OR when previews are first loaded
  // Uses debouncing to prevent flickering during slider adjustments
  useEffect(() => {
    if (characterPreviews.length === 0 || isInitializing) return;

    // Clear any existing timeout
    if (traceTimeoutRef.current) {
      clearTimeout(traceTimeoutRef.current);
    }

    // Debounce: wait 300ms after last change before tracing
    traceTimeoutRef.current = setTimeout(() => {
      const traceAllCharacters = async () => {
        // Mark all as tracing
        setCharacterPreviews(prev =>
          prev.map(p => ({ ...p, isTracing: true }))
        );

        // Trace each character
        for (let i = 0; i < characterPreviews.length; i++) {
          try {
            const preview = characterPreviews[i];
            let processed = preview.imageData;

            // Apply preprocessing
            if (settings.upscaleAmount > 1) {
              processed = ImageProcessor.upscale(processed, settings.upscaleAmount);
            }

            if (settings.smoothing > 0) {
              processed = ImageProcessor.smooth(processed, settings.smoothing);
            }

            processed = ImageProcessor.autoThreshold(processed);
            processed = ImageProcessor.trim(processed);

            // Trace with potrace
            const svg = await PotraceTracer.trace(processed, {
              turdsize: settings.turdsize,
              alphamax: settings.alphamax,
              opttolerance: settings.opttolerance,
            });

            // Update this specific character
            setCharacterPreviews(prev =>
              prev.map((p, idx) =>
                idx === i ? { ...p, svgString: svg, isTracing: false } : p
              )
            );
          } catch (error) {
            console.error(`Failed to trace character "${characterPreviews[i].char}":`, error);
            setCharacterPreviews(prev =>
              prev.map((p, idx) =>
                idx === i ? { ...p, isTracing: false } : p
              )
            );
          }
        }
      };

      traceAllCharacters();
    }, 300); // 300ms debounce delay

    // Cleanup timeout on unmount
    return () => {
      if (traceTimeoutRef.current) {
        clearTimeout(traceTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, characterPreviews.length, isInitializing]);

  // Quality presets
  const presets = [
    {
      name: 'Clean & Sharp',
      icon: Sparkles,
      description: 'Best for crisp handwriting',
      settings: {
        upscaleAmount: 2,
        smoothing: 1,
        turdsize: 12,
        alphamax: 0.8,
        opttolerance: 0.4,
      },
    },
    {
      name: 'Balanced',
      icon: Gauge,
      description: 'Good for most fonts',
      settings: {
        upscaleAmount: 2,
        smoothing: 2,
        turdsize: 9,
        alphamax: 1.2,
        opttolerance: 0.55,
      },
    },
    {
      name: 'Smooth & Curvy',
      icon: CurlyBraces,
      description: 'Rounder, flowing shapes',
      settings: {
        upscaleAmount: 3,
        smoothing: 3,
        turdsize: 6,
        alphamax: 1.334,
        opttolerance: 0.7,
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-5xl w-full my-8 flex flex-col max-h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-2xl font-bold mb-2">Preview & Adjust Quality</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            See how your settings affect characters. Choose a preset or fine-tune manually.
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {isInitializing ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">Loading characters...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Character Preview - Takes up 2 columns */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 h-full">
                  <h3 className="font-semibold mb-4">Character Preview</h3>

                  {/* Character grid - 2 per row */}
                  <div className="grid grid-cols-2 gap-6">
                    {characterPreviews.map((preview, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="text-sm text-gray-600 dark:text-gray-300 font-mono font-semibold">
                          '{preview.char}'
                        </div>
                        <div className="relative w-full aspect-square bg-white dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center group">
                          {preview.isTracing ? (
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                          ) : preview.svgString ? (
                            <>
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{
                                  transform: 'scale(0.8)',
                                  transformOrigin: 'center'
                                }}
                                dangerouslySetInnerHTML={{ __html: preview.svgString }}
                              />
                              {/* Zoom button */}
                              <button
                                onClick={() => setZoomedCharacter(preview)}
                                className="absolute top-2 right-2 p-2 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-700"
                                title="Zoom to see details"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <div className="text-sm text-gray-400">Failed</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {characterMappings.length > 4 && (
                    <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
                      Showing preview of first 4 characters. Settings will apply to all {characterMappings.length} characters when you save.
                    </p>
                  )}
                </div>
              </div>

              {/* Settings Panel - Takes up 1 column */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Presets */}
                <div>
                  <h3 className="font-semibold mb-3">Quick Presets</h3>
                  <div className="space-y-2">
                    {presets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            ...preset.settings,
                          })
                        }
                        className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
                      >
                        <div className="flex items-start gap-2">
                          <preset.icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium text-sm">{preset.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {preset.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Adjustments */}
                <div>
                  <h3 className="font-semibold mb-3">Fine-Tune</h3>
                  <div className="space-y-4">
                    {/* Detail Level (Upscale) */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Detail Level: {settings.upscaleAmount.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={settings.upscaleAmount}
                        onChange={(e) =>
                          setSettings({ ...settings, upscaleAmount: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher = more detail (1.0x - 5.0x)
                      </p>
                    </div>

                    {/* Smoothness (Pre-smoothing) */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Droplets className="w-4 h-4 text-blue-600" />
                        Smoothness: {settings.smoothing.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.5"
                        value={settings.smoothing}
                        onChange={(e) =>
                          setSettings({ ...settings, smoothing: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher = smoother edges (0.0 - 5.0)
                      </p>
                    </div>

                    {/* Noise Reduction (Turdsize) */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Scissors className="w-4 h-4 text-blue-600" />
                        Noise Reduction: {settings.turdsize}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={settings.turdsize || 9}
                        onChange={(e) =>
                          setSettings({ ...settings, turdsize: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher = cleaner output (1 - 30)
                      </p>
                    </div>

                    {/* Corner Sharpness (Alphamax) */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <CurlyBraces className="w-4 h-4 text-blue-600" />
                        Corner Style: {settings.alphamax?.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={settings.alphamax || 1.2}
                        onChange={(e) =>
                          setSettings({ ...settings, alphamax: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Lower = sharp corners, Higher = round (0.5 - 1.5)
                      </p>
                    </div>

                    {/* Path Simplification (Opttolerance) */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <Gauge className="w-4 h-4 text-blue-600" />
                        Simplification: {settings.opttolerance?.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.2"
                        step="0.05"
                        value={settings.opttolerance || 0.55}
                        onChange={(e) =>
                          setSettings({ ...settings, opttolerance: Number(e.target.value) })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Lower = more precise, Higher = simpler (0.1 - 1.2)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center flex-shrink-0">
          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => onConfirm(settings)}
              disabled={isInitializing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save & Use These Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedCharacter && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  Character: <span className="font-mono text-blue-600">'{zoomedCharacter.char}'</span>
                </h3>
                <button
                  onClick={() => setZoomedCharacter(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 flex items-center justify-center min-h-[500px]">
                {zoomedCharacter.svgString ? (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: zoomedCharacter.svgString }}
                  />
                ) : (
                  <div className="text-gray-400">No preview available</div>
                )}
              </div>

              <div className="mt-6 text-center">
                <Button
                  onClick={() => setZoomedCharacter(null)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
