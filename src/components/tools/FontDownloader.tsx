'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { useFont } from '@/context/FontContext';

interface FontFormat {
  value: string;
  label: string;
}

interface FontDownloaderProps {
  characterMappings?: any[];
  sourceImages?: any[];
  metadata?: {
    name: string;
    author: string;
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
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('ttf');
  const [notification, setNotification] = useState<{ type: string; message: string } | null>(null);
  
  const fontFormats: FontFormat[] = [
    { value: 'ttf', label: 'TrueType (.ttf)' },
    { value: 'otf', label: 'OpenType (.otf)' },
    { value: 'woff', label: 'Web Open Font Format (.woff)' },
    { value: 'woff2', label: 'WOFF2 (.woff2)' },
  ];

  const handleSelectFormat = (format: string) => {
    setSelectedFormat(format);
    setGeneratedUrl(null);
  };

  const hasRequiredFields = () => {
    return characterMappings && characterMappings.length > 0 &&
           sourceImages && sourceImages.length > 0 &&
           metadata && metadata.name && metadata.author;
  };

  const handleGenerateFont = async () => {
    setIsGenerating(true);
    
    try {
      // Get the current session for authentication
      const status = { isAuthenticated: false };
      try {
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        status.isAuthenticated = !!sessionData.user;
      } catch (authError) {
        console.warn('Could not fetch session status:', authError);
      }
      
      // Call our font generation API with Supabase
      const response = await fetch('/api/fonts/generate-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterMappings,
          sourceImages,
          metadata,
          format: selectedFormat,
          adjustments: fontAdjustments, // Include font adjustments
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Font generation failed');
      }
      
      setGeneratedUrl(data.downloadUrl);
      
      if (!data.isAuthenticated) {
        // If user is not logged in, show a note that this font won't be saved to their account
        setNotification({
          type: 'info',
          message: 'Log in to save this font to your account for future access.',
        });
      } else {
        setNotification({
          type: 'success',
          message: 'Font successfully generated and saved to your account.',
        });
      }
    } catch (error) {
      console.error('Error generating font:', error);
      setNotification({
        type: 'error',
        message: `Error generating font: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
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
          >
            {fontFormats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </div>
        
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
            'Generate Font'
          )}
        </Button>
        
        {generatedUrl && (
          <Button 
            variant="outline" 
            onClick={() => window.open(generatedUrl, '_blank')}
            className="min-w-36"
          >
            Download Font
          </Button>
        )}
      </div>

      {/* Add a note about adjustments */}
      <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm text-blue-700">
        <p><strong>Note:</strong> Your font will be generated with all the adjustments you've made:</p>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>Letter Spacing: {fontAdjustments.letterSpacing}</li>
          <li>Character Width: {fontAdjustments.charWidth}%</li>
          <li>Baseline Offset: {fontAdjustments.baselineOffset}</li>
          {Object.keys(fontAdjustments.kerningPairs).length > 0 && (
            <li>
              Custom Kerning Pairs: {Object.keys(fontAdjustments.kerningPairs).length} pair{Object.keys(fontAdjustments.kerningPairs).length !== 1 ? 's' : ''}
            </li>
          )}
        </ul>
      </div>
      
      {notification && (
        <div className={`p-4 rounded ${notification.type === 'error' ? 'bg-red-100 text-red-800' : notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
          {notification.message}
        </div>
      )}
      
      {!hasRequiredFields() && (
        <p className="text-sm text-orange-500">
          Font generation requires character mappings, source images, and metadata.
        </p>
      )}
    </div>
  );
} 