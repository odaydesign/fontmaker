'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useFont } from '@/context/FontContext';
import { Trash2, Upload, Wand2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DetectedCharacter {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  contour?: {x: number, y: number}[];
  sourceImageId?: string;
  originalId?: string;
}

const ImageUploadWithAutoDetection: React.FC = () => {
  const { 
    addSourceImage, 
    generateAiImage, 
    sourceImages, 
    removeSourceImage,
    addCharacterMapping,
    characterMappings
  } = useFont();
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState<Record<string, 'pending' | 'processing' | 'completed' | 'error'>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect characters when new images are added
  useEffect(() => {
    const newImages = sourceImages.filter(img => 
      img.selected && 
      !detectionProgress[img.id] && 
      detectionProgress[img.id] !== 'completed'
    );
    
    if (newImages.length > 0) {
      detectCharactersInImages(newImages);
    }
  }, [sourceImages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await readFileAsDataURL(file);
        
        // Get image dimensions before adding
        const dimensions = await getImageDimensions(url);
        
        addSourceImage({
          url,
          isAiGenerated: false,
          selected: true,
          width: dimensions.width,
          height: dimensions.height,
        });
      }
      
      toast.success(`Uploaded ${files.length} image(s). Character detection will start automatically.`);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const detectCharactersInImages = async (images: typeof sourceImages) => {
    setIsDetecting(true);
    
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
            imageId: image.id 
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to detect characters in image`);
        }
        
        const data = await response.json();
        
        if (data.detectedCharacters && data.detectedCharacters.length > 0) {
          // Auto-map characters with intelligent assignment
          const mappings = autoMapCharacters(data.detectedCharacters, image.id);
          
          // Add mappings to context
          mappings.forEach(mapping => {
            addCharacterMapping(mapping);
          });
          
          setDetectionProgress(prev => ({ ...prev, [image.id]: 'completed' }));
          toast.success(`Detected and mapped ${mappings.length} characters in image`);
        } else {
          setDetectionProgress(prev => ({ ...prev, [image.id]: 'completed' }));
          toast.info('No characters detected in this image');
        }
      } catch (error) {
        console.error('Error detecting characters:', error);
        setDetectionProgress(prev => ({ ...prev, [image.id]: 'error' }));
        toast.error(`Failed to detect characters in image`);
      }
    }
    
    setIsDetecting(false);
  };

  const autoMapCharacters = (detectedChars: any[], imageId: string) => {
    // Get existing mapped characters to avoid duplicates
    const existingChars = new Set(characterMappings.map(m => m.char));
    
    // Priority order for character assignment
    const charPriority = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      '.', ',', '!', '?', ':', ';', '(', ')', '[', ']', '{', '}', '"', "'", '@', '#', '$', '%', '&', '*', '+', '-', '=', '/', '\\', '|', '<', '>', '_'
    ];
    
    const mappings: Omit<any, 'id'>[] = [];
    let charIndex = 0;
    
    for (const detectedChar of detectedChars) {
      // Find next available character
      while (charIndex < charPriority.length && existingChars.has(charPriority[charIndex])) {
        charIndex++;
      }
      
      if (charIndex < charPriority.length) {
        const char = charPriority[charIndex];
        existingChars.add(char);
        
        mappings.push({
          sourceImageId: imageId,
          char,
          x1: detectedChar.x,
          y1: detectedChar.y,
          x2: detectedChar.x + detectedChar.width,
          y2: detectedChar.y + detectedChar.height,
          isPolygon: detectedChar.contour ? true : false,
          polygonPoints: detectedChar.contour
        });
        
        charIndex++;
      }
    }
    
    return mappings;
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as data URL'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };
  
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

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      await generateAiImage(aiPrompt);
      setAiPrompt('');
      toast.success('AI image generated. Character detection will start automatically.');
    } catch (error) {
      console.error('Error generating AI image:', error);
      toast.error('Failed to generate AI image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getImageStatus = (imageId: string) => {
    return detectionProgress[imageId] || 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Characters detected';
      case 'processing':
        return 'Detecting characters...';
      case 'error':
        return 'Detection failed';
      default:
        return 'Pending detection';
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Upload */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Images</h3>
        <p className="text-gray-600 mb-4">
          Upload images of your handwriting or drawings. Characters will be detected and mapped automatically.
        </p>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            onClick={handleUploadClick}
            disabled={isUploading || isDetecting}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Choose Images'}
          </Button>
        </div>
      </div>

      {/* AI Generation */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate with AI</h3>
        <p className="text-gray-600 mb-4">
          Describe the style of font you want, and our AI will generate a source image.
        </p>
        <div className="space-y-4">
          <div className="mb-4 w-full">
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-1">
              Describe your font style
            </label>
            <Input
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., 'Bold handwritten letters with flourishes'"
              className="w-full"
            />
          </div>
          <Button
            onClick={handleAiGenerate}
            disabled={!aiPrompt.trim() || isGenerating || isDetecting}
            className="w-full"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate with AI'}
          </Button>
        </div>
      </div>

      {/* Uploaded Images with Status */}
      {sourceImages.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourceImages.map((image) => {
              const status = getImageStatus(image.id);
              const imageMappings = characterMappings.filter(m => m.sourceImageId === image.id);
              
              return (
                <div key={image.id} className="relative border rounded-lg overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt="Uploaded"
                      className="w-full h-full object-contain bg-gray-50"
                    />
                    {/* Character count overlay */}
                    {imageMappings.length > 0 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        {imageMappings.length} chars
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {image.isAiGenerated ? 'AI Generated' : 'Uploaded'}
                      </span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(status)}
                        <span className="text-xs text-gray-500">
                          {getStatusText(status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {image.width} × {image.height}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeSourceImage(image.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Detection Status Summary */}
          {isDetecting && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-700">
                  Detecting characters in {Object.values(detectionProgress).filter(s => s === 'processing').length} image(s)...
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploadWithAutoDetection;
