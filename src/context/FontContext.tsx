'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SourceImage {
  id: string;
  url: string;
  isAiGenerated: boolean;
  aiPrompt?: string;
  selected: boolean;
  width?: number;
  height?: number;
  origin?: 'ai' | 'upload';
  promptId?: string;
  createdAt?: string;
}

export interface CharacterMapping {
  id: string;
  sourceImageId: string;
  char: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  originalImageWidth?: number;
  originalImageHeight?: number;
  isPolygon?: boolean;
  polygonPoints?: { x: number; y: number }[];
}

export interface FontAdjustments {
  letterSpacing: number;
  baselineOffset: number;
  charWidth: number;
  kerningPairs: Record<string, number>;
  charPositions: Record<string, { x: number; y: number }>;
}

export interface FontMetadata {
  name: string;
  description?: string;
  author?: string;
  isPublic: boolean;
  tags?: string[];
}

export interface PromptHistoryEntry {
  id: string;
  prompt: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'error';
  imageIds: string[];
  error?: string;
}

export interface FontState {
  sourceImages: SourceImage[];
  characterMappings: CharacterMapping[];
  metadata: FontMetadata;
  currentStep: 'image-upload' | 'character-mapping' | 'metadata' | 'download';
  fontAdjustments: FontAdjustments;
  unmappedChars: Set<string>;
  promptHistory: PromptHistoryEntry[];
  approvedReferenceImage: string | null;
}

interface FontContextType extends FontState {
  addSourceImage: (image: Omit<SourceImage, 'id'>) => SourceImage;
  removeSourceImage: (id: string) => void;
  toggleImageSelection: (id: string, selected?: boolean) => void;
  generateAiImages: (prompt: string, options?: { count?: number }) => Promise<SourceImage[]>;
  generateWithReference: (prompt: string, options?: { count?: number }) => Promise<SourceImage[]>;
  setApprovedReferenceImage: (imageUrl: string | null) => void;
  addCharacterMapping: (mapping: Omit<CharacterMapping, 'id'>) => void;
  updateCharacterMapping: (id: string, mapping: Partial<CharacterMapping>) => void;
  removeCharacterMapping: (id: string) => void;
  updateMetadata: (data: Partial<FontMetadata>) => void;
  setCurrentStep: (step: FontState['currentStep']) => void;
  updateFontAdjustments: (adjustments: Partial<FontAdjustments>) => void;
  setKerningPair: (pair: string, value: number) => void;
  removeKerningPair: (pair: string) => void;
  setCharPosition: (char: string, x: number, y: number) => void;
  resetFontData: () => void;
  setUnmappedChars: (chars: Set<string>) => void;
}

const initialState: FontState = {
  sourceImages: [],
  characterMappings: [],
  metadata: {
    name: '',
    description: '',
    author: '',
    isPublic: false,
    tags: [],
  },
  currentStep: 'image-upload',
  fontAdjustments: {
    letterSpacing: 0,
    baselineOffset: 0,
    charWidth: 100,
    kerningPairs: {},
    charPositions: {},
  },
  unmappedChars: new Set<string>(),
  promptHistory: [],
  approvedReferenceImage: null,
};

const FontContext = createContext<FontContextType | null>(null);

interface FontProviderProps {
  children: ReactNode;
}

export const FontProvider: React.FC<FontProviderProps> = ({ children }) => {
  const [fontState, setFontState] = useState<FontState>(initialState);

  const addSourceImage = (image: Omit<SourceImage, 'id'>) => {
    const newImage: SourceImage = {
      ...image,
      id: `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      selected: image.selected ?? false,
      createdAt: image.createdAt ?? new Date().toISOString(),
    };

    setFontState(prev => ({
      ...prev,
      sourceImages: [...prev.sourceImages, newImage],
    }));

    return newImage;
  };

  const removeSourceImage = (id: string) => {
    setFontState(prev => ({
      ...prev,
      sourceImages: prev.sourceImages.filter(img => img.id !== id),
      characterMappings: prev.characterMappings.filter(mapping => mapping.sourceImageId !== id),
      promptHistory: prev.promptHistory.map(entry => ({
        ...entry,
        imageIds: entry.imageIds.filter(imageId => imageId !== id),
      })),
    }));
  };

  const toggleImageSelection = (id: string, selected?: boolean) => {
    setFontState(prev => ({
      ...prev,
      sourceImages: prev.sourceImages.map(img =>
        img.id === id
          ? { ...img, selected: typeof selected === 'boolean' ? selected : !img.selected }
          : img
      ),
    }));
  };

  const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });
  };

  const fetchAsDataUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch generated image (status ${response.status})`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Unable to convert image to data URL'));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob'));
      reader.readAsDataURL(blob);
    });
  };

  const generateAiImages = async (
    prompt: string,
    options: { count?: number } = {}
  ): Promise<SourceImage[]> => {
    const promptId = `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const createdAt = new Date().toISOString();
    const count = Math.max(1, Math.min(options.count ?? 4, 6));

    setFontState(prev => ({
      ...prev,
      promptHistory: [
        ...prev.promptHistory,
        {
          id: promptId,
          prompt,
          createdAt,
          status: 'pending',
          imageIds: [],
        },
      ],
    }));

    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, count }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const body = await response.text();
        throw new Error(
          `Unexpected response from image generation endpoint (status ${response.status}): ${body.slice(
            0,
            120
          )}`
        );
      }

      const data = (await response.json()) as {
        images?: string[];
        urls?: string[];
        error?: string;
      };

      let imagePayloads: string[] = [];

      if (data.images && data.images.length > 0) {
        imagePayloads = data.images;
      } else if (data.urls && data.urls.length > 0) {
        imagePayloads = [];
        for (const url of data.urls) {
          try {
            const converted = await fetchAsDataUrl(url);
            imagePayloads.push(converted);
          } catch (fetchError) {
            console.warn('Failed to convert generated image URL to data URL', fetchError);
          }
        }
      }

      if (!response.ok || imagePayloads.length === 0) {
        throw new Error(data.error ?? 'No images returned from OpenAI.');
      }

      const images: SourceImage[] = [];

      for (const imageUrl of imagePayloads) {
        let dimensions: { width?: number; height?: number } = {};

        try {
          const { width, height } = await getImageDimensions(imageUrl);
          dimensions = { width, height };
        } catch (dimensionError) {
          console.warn('Unable to determine AI image dimensions', dimensionError);
        }

        const newImage = addSourceImage({
          url: imageUrl,
          isAiGenerated: true,
          aiPrompt: prompt,
          origin: 'ai',
          promptId,
          selected: false,
          ...dimensions,
        });

        images.push(newImage);
      }

      setFontState(prev => ({
        ...prev,
        promptHistory: prev.promptHistory.map(entry =>
          entry.id === promptId
            ? { ...entry, status: 'completed', imageIds: images.map(img => img.id) }
            : entry
        ),
      }));

      return images;
    } catch (error) {
      setFontState(prev => ({
        ...prev,
        promptHistory: prev.promptHistory.map(entry =>
          entry.id === promptId
            ? {
                ...entry,
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to generate images.',
              }
            : entry
        ),
      }));

      throw error instanceof Error ? error : new Error('Failed to generate images.');
    }
  };

  const addCharacterMapping = (mapping: Omit<CharacterMapping, 'id'>) => {
    const newMapping = {
      ...mapping,
      id: `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    setFontState(prev => ({
      ...prev,
      characterMappings: [...prev.characterMappings, newMapping],
    }));
  };

  const updateCharacterMapping = (id: string, mapping: Partial<CharacterMapping>) => {
    setFontState(prev => ({
      ...prev,
      characterMappings: prev.characterMappings.map(charMap =>
        charMap.id === id ? { ...charMap, ...mapping } : charMap
      ),
    }));
  };

  const removeCharacterMapping = (id: string) => {
    setFontState(prev => ({
      ...prev,
      characterMappings: prev.characterMappings.filter(mapping => mapping.id !== id),
    }));
  };

  const updateMetadata = (data: Partial<FontMetadata>) => {
    setFontState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...data },
    }));
  };

  const setCurrentStep = (step: FontState['currentStep']) => {
    setFontState(prev => ({ ...prev, currentStep: step }));
  };

  const updateFontAdjustments = (adjustments: Partial<FontAdjustments>) => {
    setFontState(prev => ({
      ...prev,
      fontAdjustments: { ...prev.fontAdjustments, ...adjustments },
    }));
  };

  const setKerningPair = (pair: string, value: number) => {
    setFontState(prev => ({
      ...prev,
      fontAdjustments: {
        ...prev.fontAdjustments,
        kerningPairs: {
          ...prev.fontAdjustments.kerningPairs,
          [pair]: value,
        },
      },
    }));
  };

  const removeKerningPair = (pair: string) => {
    setFontState(prev => {
      const newKerningPairs = { ...prev.fontAdjustments.kerningPairs };
      delete newKerningPairs[pair];
      return {
        ...prev,
        fontAdjustments: {
          ...prev.fontAdjustments,
          kerningPairs: newKerningPairs,
        },
      };
    });
  };

  const setCharPosition = (char: string, x: number, y: number) => {
    setFontState(prev => ({
      ...prev,
      fontAdjustments: {
        ...prev.fontAdjustments,
        charPositions: {
          ...prev.fontAdjustments.charPositions,
          [char]: { x, y },
        },
      },
    }));
  };

  const resetFontData = () => {
    setFontState(initialState);
  };

  const setUnmappedChars = (chars: Set<string>) => {
    setFontState(prev => ({
      ...prev,
      unmappedChars: chars,
    }));
  };

  const setApprovedReferenceImage = (imageUrl: string | null) => {
    setFontState(prev => ({
      ...prev,
      approvedReferenceImage: imageUrl,
    }));
  };

  const generateWithReference = async (
    prompt: string,
    options: { count?: number } = {}
  ): Promise<SourceImage[]> => {
    if (!fontState.approvedReferenceImage) {
      throw new Error('No reference image has been approved. Please approve a reference image first.');
    }

    const promptId = `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const createdAt = new Date().toISOString();
    const count = Math.max(1, Math.min(options.count ?? 4, 4));

    setFontState(prev => ({
      ...prev,
      promptHistory: [
        ...prev.promptHistory,
        {
          id: promptId,
          prompt,
          createdAt,
          status: 'pending',
          imageIds: [],
        },
      ],
    }));

    try {
      const response = await fetch('/api/images/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          referenceImage: fontState.approvedReferenceImage,
          count,
        }),
      });

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const body = await response.text();
        throw new Error(
          `Unexpected response from image edit endpoint (status ${response.status}): ${body.slice(
            0,
            120
          )}`
        );
      }

      const data = (await response.json()) as {
        images?: string[];
        urls?: string[];
        error?: string;
      };

      let imagePayloads: string[] = [];

      if (data.images && data.images.length > 0) {
        imagePayloads = data.images;
      } else if (data.urls && data.urls.length > 0) {
        imagePayloads = [];
        for (const url of data.urls) {
          try {
            const converted = await fetchAsDataUrl(url);
            imagePayloads.push(converted);
          } catch (fetchError) {
            console.warn('Failed to convert generated image URL to data URL', fetchError);
          }
        }
      }

      if (!response.ok || imagePayloads.length === 0) {
        throw new Error(data.error ?? 'No images returned from OpenAI.');
      }

      const images: SourceImage[] = [];

      for (const imageUrl of imagePayloads) {
        let dimensions: { width?: number; height?: number } = {};

        try {
          const { width, height } = await getImageDimensions(imageUrl);
          dimensions = { width, height };
        } catch (dimensionError) {
          console.warn('Unable to determine AI image dimensions', dimensionError);
        }

        const newImage = addSourceImage({
          url: imageUrl,
          isAiGenerated: true,
          aiPrompt: prompt,
          origin: 'ai',
          promptId,
          selected: false,
          ...dimensions,
        });

        images.push(newImage);
      }

      setFontState(prev => ({
        ...prev,
        promptHistory: prev.promptHistory.map(entry =>
          entry.id === promptId
            ? { ...entry, status: 'completed', imageIds: images.map(img => img.id) }
            : entry
        ),
      }));

      return images;
    } catch (error) {
      setFontState(prev => ({
        ...prev,
        promptHistory: prev.promptHistory.map(entry =>
          entry.id === promptId
            ? {
                ...entry,
                status: 'error',
                error: error instanceof Error ? error.message : 'Failed to generate images with reference.',
              }
            : entry
        ),
      }));

      throw error instanceof Error ? error : new Error('Failed to generate images with reference.');
    }
  };

  return (
    <FontContext.Provider
      value={{
        ...fontState,
        addSourceImage,
        removeSourceImage,
        toggleImageSelection,
        generateAiImages,
        generateWithReference,
        setApprovedReferenceImage,
        addCharacterMapping,
        updateCharacterMapping,
        removeCharacterMapping,
        updateMetadata,
        setCurrentStep,
        updateFontAdjustments,
        setKerningPair,
        removeKerningPair,
        setCharPosition,
        resetFontData,
        setUnmappedChars,
      }}
    >
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};

export default FontContext;
