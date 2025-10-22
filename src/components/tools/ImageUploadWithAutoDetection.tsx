'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Textarea from '@/components/ui/textarea';
import { useFont, SourceImage } from '@/context/FontContext';
import {
  AlertCircle,
  CheckCircle,
  History,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

type DetectionStatus = 'pending' | 'processing' | 'completed' | 'error';

interface DetectedCharacter {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  contour?: Array<{ x: number; y: number }>;
}

const MAX_SUGGESTIONS = 4;

const ImageUploadWithAutoDetection: React.FC = () => {
  const {
    sourceImages,
    characterMappings,
    addCharacterMapping,
    generateAiImages,
    addSourceImage,
    removeSourceImage,
    toggleImageSelection,
    promptHistory,
  } = useFont();

  const [mode, setMode] = useState<'prompt' | 'upload'>('prompt');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState<Record<string, DetectionStatus>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCount = useMemo(
    () => sourceImages.filter(image => image.selected).length,
    [sourceImages]
  );

  const aiImages = useMemo(
    () => sourceImages.filter(image => image.origin === 'ai'),
    [sourceImages]
  );

  const uploadedImages = useMemo(() => {
    const filtered = sourceImages.filter(image => image.origin !== 'ai');
    console.log('🔵 Uploaded images count:', filtered.length, 'Total images:', sourceImages.length);
    return filtered;
  }, [sourceImages]);

  useEffect(() => {
    setDetectionProgress(prev => {
      const next: Record<string, DetectionStatus> = { ...prev };
      let changed = false;

      sourceImages.forEach(image => {
        if (!next[image.id]) {
          next[image.id] = 'pending';
          changed = true;
        }
      });

      Object.keys(next).forEach(imageId => {
        if (!sourceImages.some(image => image.id === imageId)) {
          delete next[imageId];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [sourceImages]);

  const autoMapCharacters = useCallback(
    (detectedChars: DetectedCharacter[], imageId: string) => {
      const existingChars = new Set(characterMappings.map(mapping => mapping.char));

      const charPriority = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z',
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '.',
        ',',
        '!',
        '?',
        ':',
        ';',
        '(',
        ')',
        '[',
        ']',
        '{',
        '}',
        '"',
        "'",
        '@',
        '#',
        '$',
        '%',
        '&',
        '*',
        '+',
        '-',
        '=',
        '/',
        '\\',
        '|',
        '<',
        '>',
        '_',
      ];

      const mappings: Omit<DetectedCharacter, 'id'>[] = [];
      let charIndex = 0;

      for (const detectedChar of detectedChars) {
        while (charIndex < charPriority.length && existingChars.has(charPriority[charIndex])) {
          charIndex += 1;
        }

        if (charIndex < charPriority.length) {
          const char = charPriority[charIndex];
          existingChars.add(char);

          mappings.push({
            x: detectedChar.x,
            y: detectedChar.y,
            width: detectedChar.width,
            height: detectedChar.height,
            contour: detectedChar.contour,
          });

          addCharacterMapping({
            sourceImageId: imageId,
            char,
            x1: detectedChar.x,
            y1: detectedChar.y,
            x2: detectedChar.x + detectedChar.width,
            y2: detectedChar.y + detectedChar.height,
            isPolygon: Array.isArray(detectedChar.contour),
            polygonPoints: detectedChar.contour,
          });

          charIndex += 1;
        }
      }

      return mappings.length;
    },
    [addCharacterMapping, characterMappings]
  );

  const detectCharactersInImages = useCallback(
    async (images: SourceImage[]) => {
      for (const image of images) {
        setDetectionProgress(prev => ({ ...prev, [image.id]: 'processing' }));

        try {
          const response = await fetch('/api/characters/detect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: image.url,
              imageId: image.id,
            }),
          });

          if (!response.ok) {
            throw new Error('Detection request failed');
          }

          const data = (await response.json()) as {
            detectedCharacters?: DetectedCharacter[];
          };

          if (!data.detectedCharacters || data.detectedCharacters.length === 0) {
            setDetectionProgress(prev => ({ ...prev, [image.id]: 'completed' }));
            toast.info('No characters detected in the selected image.');
            continue;
          }

          const mappedCount = autoMapCharacters(data.detectedCharacters, image.id);
          setDetectionProgress(prev => ({ ...prev, [image.id]: 'completed' }));
          toast.success(`Detected and mapped ${mappedCount} characters.`);
        } catch (error) {
          console.error('Error detecting characters:', error);
          setDetectionProgress(prev => ({ ...prev, [image.id]: 'error' }));
          toast.error('Failed to detect characters for this image.');
        }
      }
    },
    [autoMapCharacters]
  );

  useEffect(() => {
    const readyForDetection = sourceImages.filter(
      image =>
        image.selected &&
        detectionProgress[image.id] !== 'completed' &&
        detectionProgress[image.id] !== 'processing'
    );

    if (readyForDetection.length > 0) {
      void detectCharactersInImages(readyForDetection);
    }
  }, [sourceImages, detectionProgress, detectCharactersInImages]);

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

  const handlePromptSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedPrompt = aiPrompt.trim();
    if (!trimmedPrompt) return;

    setIsGenerating(true);
    try {
      const images = await generateAiImages(trimmedPrompt, { count: MAX_SUGGESTIONS });
      setAiPrompt('');
      toast.success(`Generated ${images.length} suggestion${images.length === 1 ? '' : 's'}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate images.';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadClick = () => {
    console.log('🟢 Upload button clicked!');
    console.log('🟢 File input ref:', fileInputRef.current);
    if (fileInputRef.current) {
      console.log('🟢 Triggering file input click');
      fileInputRef.current.click();
    } else {
      console.error('❌ File input ref is null!');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🟢 handleFileChange called!');
    const files = event.target.files;
    console.log('🟢 Files from input:', files);

    if (!files || files.length === 0) {
      console.log('⚠️ No files selected');
      return;
    }

    console.log('🔵 Upload started, files:', files.length);
    setIsUploading(true);

    try {
      const uploads: SourceImage[] = [];

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        console.log('🔵 Processing file:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');

        const url = await readFileAsDataURL(file);
        console.log('🔵 Data URL created, length:', url.length, 'Preview:', url.substring(0, 100));

        let dimensions: { width?: number; height?: number } = {};

        try {
          const { width, height } = await getImageDimensions(url);
          dimensions = { width, height };
          console.log('🔵 Image dimensions:', width, 'x', height);
        } catch (error) {
          console.warn('⚠️ Could not get dimensions:', error);
          // Best effort; allow missing dimensions.
        }

        const image = addSourceImage({
          url,
          isAiGenerated: false,
          origin: 'upload',
          selected: false,
          ...dimensions,
        });

        console.log('🔵 Image added to state:', image.id);
        uploads.push(image);
      }

      console.log('✅ Upload complete, total images:', uploads.length);
      toast.success(`Uploaded ${uploads.length} image${uploads.length === 1 ? '' : 's'}.`);
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      toast.error('Failed to upload one or more files.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleToggleSelection = (image: SourceImage, nextState?: boolean) => {
    const newSelected = typeof nextState === 'boolean' ? nextState : !image.selected;
    toggleImageSelection(image.id, newSelected);

    if (newSelected && detectionProgress[image.id] === 'pending') {
      toast.info('Character detection will run for this image.');
    }
  };

  const renderStatus = (status: DetectionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            Characters detected
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Detecting…
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="h-3 w-3" />
            Detection failed
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">Select to detect characters</span>;
    }
  };

  const renderImageCard = (image: SourceImage) => {
    const status = detectionProgress[image.id] ?? 'pending';

    return (
      <div
        key={image.id}
        className={`flex flex-col overflow-hidden rounded-lg border transition-shadow ${
          image.selected ? 'border-indigo-500 shadow-sm' : 'border-gray-200'
        }`}
      >
        <div className="relative aspect-square bg-gray-50">
          <img
            src={image.url}
            alt={image.aiPrompt || 'Source image'}
            className="h-full w-full object-contain"
          />
          {image.selected && (
            <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-1 text-xs font-medium text-white">
              <CheckCircle className="h-3 w-3" />
              Selected
            </div>
          )}
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {image.origin === 'ai' ? 'AI suggestion' : 'Uploaded image'}
              </p>
              <p className="text-xs text-gray-500">
                {image.origin === 'ai'
                  ? `"${image.aiPrompt ?? 'AI Prompt'}"`
                  : `${image.width ?? '?'} × ${image.height ?? '?'} px`}
              </p>
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
          <div className="flex items-center justify-between">
            {renderStatus(status)}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={image.selected ? 'default' : 'outline'}
                onClick={() => handleToggleSelection(image)}
              >
                {image.selected ? 'Deselect' : 'Select'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* DEBUG PANEL FOR IMAGE STATE */}
      <div className="fixed bottom-4 left-4 z-[9999] bg-blue-100 border-2 border-blue-500 p-4 rounded-lg shadow-lg max-w-sm text-xs">
        <div className="font-bold text-blue-800 mb-2">IMAGE DEBUG:</div>
        <div className="space-y-1 text-black">
          <div>Total Images: <span className="font-mono font-bold">{sourceImages.length}</span></div>
          <div>Uploaded Images: <span className="font-mono font-bold">{uploadedImages.length}</span></div>
          <div>AI Images: <span className="font-mono font-bold">{aiImages.length}</span></div>
          <div>Selected: <span className="font-mono font-bold">{selectedCount}</span></div>
          <div>Is Uploading: <span className="font-mono font-bold">{isUploading ? 'YES' : 'NO'}</span></div>
        </div>
      </div>

    <div className="space-y-8">
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Design workspace</h2>
            <p className="text-sm text-gray-600">
              Prompt OpenAI or upload your own reference sheets. Select the images you want to
              transform into a font.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
            <CheckCircle className="h-4 w-4 text-indigo-600" />
            <span>{selectedCount} selected</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-b px-6 py-4">
          <Button
            type="button"
            variant={mode === 'prompt' ? 'default' : 'outline'}
            onClick={() => setMode('prompt')}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Prompt with AI
          </Button>
          <Button
            type="button"
            variant={mode === 'upload' ? 'default' : 'outline'}
            onClick={() => setMode('upload')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload images
          </Button>
        </div>
        <div className="p-6">
          {mode === 'prompt' ? (
            <form onSubmit={handlePromptSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700">
                    Describe the font sheet you need
                  </label>
                  <span className="text-xs text-gray-500">
                    Up to {MAX_SUGGESTIONS} suggestions per prompt
                  </span>
                </div>
                <Textarea
                  id="ai-prompt"
                  value={aiPrompt}
                  onChange={event => setAiPrompt(event.target.value)}
                  placeholder="E.g. Bold brush lettering alphabet with ornate swashes"
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="submit" disabled={!aiPrompt.trim() || isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate suggestions
                    </>
                  )}
                </Button>
                {promptHistory.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <History className="h-3 w-3" />
                    {promptHistory
                      .slice(-3)
                      .reverse()
                      .map(entry => (
                        <span
                          key={entry.id}
                          className="rounded-full bg-gray-100 px-3 py-1 text-gray-600"
                        >
                          {entry.prompt}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Upload scans or photos of your lettering. Choose clear, high-contrast images so the
                character detector can do its job.
              </p>
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
                className="flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Choose images
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {promptHistory.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold text-gray-900">Prompt history</h3>
            <p className="text-sm text-gray-600">
              Reuse prompts or review how each set of suggestions performed.
            </p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {promptHistory
              .slice()
              .reverse()
              .map(entry => (
                <div
                  key={entry.id}
                  className="flex flex-col justify-between rounded-lg border p-4"
                >
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">{entry.prompt}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span
                      className={`font-medium ${
                        entry.status === 'completed'
                          ? 'text-green-600'
                          : entry.status === 'error'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {entry.status === 'completed' && `${entry.imageIds.length} suggestions`}
                      {entry.status === 'pending' && 'In progress'}
                      {entry.status === 'error' && (entry.error ?? 'Failed')}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAiPrompt(entry.prompt);
                        setMode('prompt');
                      }}
                    >
                      Reuse prompt
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">AI suggestions</h3>
            <span className="text-sm text-gray-500">{aiImages.length} generated</span>
          </div>
          {aiImages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
              Use the prompt builder above to generate new font sheet ideas with OpenAI.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {aiImages.map(renderImageCard)}
            </div>
          )}
        </section>
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Uploaded images</h3>
            <span className="text-sm text-gray-500">{uploadedImages.length} uploaded</span>
          </div>
          {uploadedImages.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
              Upload scans or photos to use your own reference material.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {uploadedImages.map(renderImageCard)}
            </div>
          )}
        </section>
      </div>
    </div>
    </>
  );
};

export default ImageUploadWithAutoDetection;
