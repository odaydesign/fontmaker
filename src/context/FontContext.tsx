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
  currentStep: 'image-upload' | 'character-mapping' | 'font-testing' | 'metadata' | 'download';
  previewText: string;
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
  
  // Preview
  updatePreviewText: (text: string) => void;
  
  // Reset all data
  resetFontData: () => void;
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
  previewText: 'The quick brown fox jumps over the lazy dog',
};

// Create context
const FontContext = createContext<FontContextType | undefined>(undefined);

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
      id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
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
      // This is a mock implementation - replace with actual API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI generated image (in a real app, call OpenAI API)
      const mockImageUrl = `https://picsum.photos/800/600?random=${Math.random()}`;
      
      // Get image dimensions
      const dimensions = await getImageDimensions(mockImageUrl);
      
      addSourceImage({
        url: mockImageUrl,
        isAiGenerated: true,
        aiPrompt: prompt,
        selected: true,
        width: dimensions.width,
        height: dimensions.height,
      });
    } catch (error) {
      console.error('AI image generation failed', error);
      throw error;
    }
  };

  // Helper function to get image dimensions
  const getImageDimensions = (src: string): Promise<{width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
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

  // Preview function
  const updatePreviewText = (text: string) => {
    setFontState(prev => ({ ...prev, previewText: text }));
  };

  // Reset function
  const resetFontData = () => {
    setFontState(initialState);
  };

  const value = {
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
    updatePreviewText,
    resetFontData,
  };

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
};

// Custom hook to use font context
export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};

export default FontContext; 