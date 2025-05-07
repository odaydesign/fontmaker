'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define types
export interface SourceImage {
  id: string;
  url: string;
  isAiGenerated: boolean;
  aiPrompt?: string;
  selected?: boolean;
  width?: number;
  height?: number;
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
  polygonPoints?: {x: number, y: number}[];
}

// Font adjustment interface
export interface FontAdjustments {
  letterSpacing: number; // Global letter spacing (-50 to 100)
  baselineOffset: number; // Vertical baseline adjustment (-50 to 50)
  charWidth: number; // Character width scaling (50 to 150)
  kerningPairs: Record<string, number>; // Custom spacing for specific character pairs
  charPositions: Record<string, {x: number, y: number}>; // Per-character positioning adjustments
}

export interface FontMetadata {
  name: string;
  description?: string;
  author?: string;
  isPublic: boolean;
  tags?: string[];
}

export interface FontState {
  sourceImages: SourceImage[];
  characterMappings: CharacterMapping[];
  metadata: FontMetadata;
  currentStep: 'image-upload' | 'character-mapping' | 'metadata' | 'download';
  fontAdjustments: FontAdjustments;
  unmappedChars: Set<string>;
}

interface FontContextType extends FontState {
  // Image management
  addSourceImage: (image: Omit<SourceImage, 'id'>) => void;
  removeSourceImage: (id: string) => void;
  toggleImageSelection: (id: string) => void;
  generateAiImage: (prompt: string) => Promise<void>;
  
  // Character mapping
  addCharacterMapping: (mapping: Omit<CharacterMapping, 'id'>) => void;
  updateCharacterMapping: (id: string, mapping: Partial<CharacterMapping>) => void;
  removeCharacterMapping: (id: string) => void;
  
  // Metadata
  updateMetadata: (data: Partial<FontMetadata>) => void;
  
  // Navigation
  setCurrentStep: (step: FontState['currentStep']) => void;
  
  // Font Adjustments
  updateFontAdjustments: (adjustments: Partial<FontAdjustments>) => void;
  setKerningPair: (pair: string, value: number) => void;
  removeKerningPair: (pair: string) => void;
  
  // Reset all data
  resetFontData: () => void;

  // Unmapped characters
  setUnmappedChars: (chars: Set<string>) => void;

  // New function to set per-character position adjustments
  setCharPosition: (char: string, x: number, y: number) => void;
}

// Initial state
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
};

// Create context
const FontContext = createContext<FontContextType | null>(null);

// Provider props
interface FontProviderProps {
  children: ReactNode;
}

// Create provider component
export const FontProvider: React.FC<FontProviderProps> = ({ children }) => {
  const [fontState, setFontState] = useState<FontState>(initialState);

  // Image management functions
  const addSourceImage = (image: Omit<SourceImage, 'id'>) => {
    const newImage = {
      ...image,
      id: `image_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      selected: true,
    };
    
    setFontState(prev => ({
      ...prev,
      sourceImages: [...prev.sourceImages, newImage],
    }));
  };

  const removeSourceImage = (id: string) => {
    setFontState(prev => ({
      ...prev,
      sourceImages: prev.sourceImages.filter(img => img.id !== id),
      // Also remove any character mappings that use this image
      characterMappings: prev.characterMappings.filter(
        mapping => mapping.sourceImageId !== id
      ),
    }));
  };

  const toggleImageSelection = (id: string) => {
    setFontState(prev => ({
      ...prev,
      sourceImages: prev.sourceImages.map(img =>
        img.id === id ? { ...img, selected: !img.selected } : img
      ),
    }));
  };

  const generateAiImage = async (prompt: string) => {
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.imageUrl) {
        addSourceImage({
          url: data.imageUrl,
          isAiGenerated: true,
          aiPrompt: prompt,
        });
      } else {
        console.error('Failed to generate AI image:', data.error);
        // Handle error
      }
    } catch (error) {
      console.error('Error generating AI image:', error);
      // Handle error
    }
  };

  // Helper function to get image dimensions
  const getImageDimensions = (src: string): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = src;
    });
  };

  // Character mapping functions
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

  // Metadata functions
  const updateMetadata = (data: Partial<FontMetadata>) => {
    setFontState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...data },
    }));
  };

  // Navigation function
  const setCurrentStep = (step: FontState['currentStep']) => {
    setFontState(prev => ({ ...prev, currentStep: step }));
  };

  // Font Adjustment functions
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

  // Add a new function to set per-character position adjustments
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

  // Reset function
  const resetFontData = () => {
    setFontState(initialState);
  };

  const setUnmappedChars = (chars: Set<string>) => {
    setFontState(prev => ({
      ...prev,
      unmappedChars: chars,
    }));
  };

  return (
    <FontContext.Provider
      value={{
        ...fontState,
        addSourceImage,
        removeSourceImage,
        toggleImageSelection,
        generateAiImage,
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

// Hook for using the font context
export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};

export default FontContext; 