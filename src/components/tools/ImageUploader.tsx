'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useFont } from '@/context/FontContext';

const ImageUploader: React.FC = () => {
  const { addSourceImage, generateAiImage } = useFont();
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
    } catch (error) {
      console.error('Error generating AI image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Manual Upload */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Images</h3>
        <p className="text-gray-600 mb-4">
          Upload images of your handwriting or drawings to use as the basis for your font.
        </p>
        
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          
          <Button 
            variant="primary" 
            onClick={handleUploadClick}
            isLoading={isUploading}
            disabled={isUploading}
          >
            Upload Images
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
          <Input
            label="Describe your font style"
            placeholder="e.g., Handwritten cursive with flowing curves, whimsical ligatures"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            fullWidth
          />
          
          <Button 
            variant="secondary" 
            onClick={handleAiGenerate}
            isLoading={isGenerating}
            disabled={isGenerating || !aiPrompt.trim()}
          >
            Generate with AI
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader; 