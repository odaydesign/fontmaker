'use client';

import React, { useState, useEffect } from 'react';
import { useFont } from '@/context/FontContext';
import Input from '@/components/ui/Input';

const DEFAULT_PREVIEW_TEXT = 'The quick brown fox jumps over the lazy dog';
const PREVIEW_OPTIONS = [
  'The quick brown fox jumps over the lazy dog',
  'Pack my box with five dozen liquor jugs',
  'How vexingly quick daft zebras jump',
  'Sphinx of black quartz, judge my vow',
  'Amazingly few discotheques provide jukeboxes',
];

const FontTester: React.FC = () => {
  const { sourceImages, characterMappings, previewText, updatePreviewText } = useFont();
  const [customText, setCustomText] = useState('');
  const [fontSize, setFontSize] = useState(32);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [availableChars, setAvailableChars] = useState<string[]>([]);
  const [missingChars, setMissingChars] = useState<string[]>([]);

  // Extract all mapped characters
  useEffect(() => {
    if (characterMappings.length > 0) {
      const chars = characterMappings.map(mapping => mapping.char);
      setAvailableChars([...new Set(chars)]); // Remove duplicates
    } else {
      setAvailableChars([]);
    }
  }, [characterMappings]);

  // Identify missing characters in preview text
  useEffect(() => {
    const textToCheck = previewText || DEFAULT_PREVIEW_TEXT;
    const uniqueChars = [...new Set(textToCheck.split(''))];
    const missing = uniqueChars.filter(
      char => !availableChars.includes(char) && char !== ' ' && char !== '\n'
    );
    setMissingChars(missing);
  }, [previewText, availableChars]);

  // Handle preview text change
  const handlePreviewChange = (text: string) => {
    updatePreviewText(text);
    setCustomText('');
  };

  // Handle custom text input
  const handleCustomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomText(e.target.value);
  };

  // Apply custom text
  const applyCustomText = () => {
    if (customText.trim()) {
      updatePreviewText(customText);
    }
  };

  // Create mapping of characters to their image regions
  const renderPreviewChar = (char: string) => {
    if (char === ' ') return <span className="inline-block w-4" key={`space-${Math.random()}`}></span>;
    if (char === '\n') return <br key={`br-${Math.random()}`} />;

    // Find the mapping for this character
    const mapping = characterMappings.find(m => m.char === char);
    if (!mapping) {
      return (
        <span 
          key={`missing-${char}-${Math.random()}`}
          className="inline-block text-red-500"
          style={{ fontSize: `${fontSize}px` }}
        >
          {char}
        </span>
      );
    }

    // Find the source image
    const image = sourceImages.find(img => img.id === mapping.sourceImageId);
    if (!image) return null;

    // Calculate dimensions
    const width = mapping.x2 - mapping.x1;
    const height = mapping.y2 - mapping.y1;
    const aspectRatio = width / height;
    const charHeight = fontSize;
    const charWidth = charHeight * aspectRatio;

    return (
      <div 
        key={`char-${char}-${Math.random()}`}
        className="inline-block relative"
        style={{ 
          width: `${charWidth}px`, 
          height: `${charHeight}px`, 
          margin: '0 1px',
          verticalAlign: 'text-bottom',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <img 
            src={image.url}
            alt={char}
            style={{
              position: 'absolute',
              left: `${-mapping.x1}px`,
              top: `${-mapping.y1}px`,
              clipPath: `inset(${mapping.y1}px ${(image.width || 0) - mapping.x2}px ${(image.height || 0) - mapping.y2}px ${mapping.x1}px)`,
              transformOrigin: '0 0',
              width: `${image.width || 0}px`,
              height: `${image.height || 0}px`,
              transform: `scale(${charWidth / width}, ${charHeight / height})`,
              maxWidth: 'none',
            }}
          />
        </div>
      </div>
    );
  };

  if (characterMappings.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded mb-6">
        <p>Please map at least one character in the previous step before testing your font.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Character availability info */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Character Information</h3>
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            <span className="font-medium">{availableChars.length}</span> characters mapped
          </p>
          
          <div className="flex flex-wrap gap-1 border border-gray-200 rounded-md p-3 bg-gray-50">
            {availableChars.map(char => (
              <span 
                key={char}
                className="inline-block bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm"
              >
                {char}
              </span>
            ))}
            {availableChars.length === 0 && (
              <span className="text-gray-400 text-sm">No characters mapped yet</span>
            )}
          </div>
        </div>
        
        {missingChars.length > 0 && (
          <div className="mb-4">
            <p className="text-yellow-600 mb-2 font-medium">
              Missing characters in preview text:
            </p>
            <div className="flex flex-wrap gap-1 border border-yellow-200 rounded-md p-3 bg-yellow-50">
              {missingChars.map(char => (
                <span 
                  key={char}
                  className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Preview text controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preview Text</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Sample Text Options</h4>
            <div className="flex flex-wrap gap-2">
              {PREVIEW_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => handlePreviewChange(option)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    previewText === option
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent'
                  }`}
                >
                  {option.length > 30 ? option.substring(0, 30) + '...' : option}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3 items-end">
            <div className="flex-grow">
              <Input
                label="Custom Text"
                placeholder="Enter your own text to preview..."
                value={customText}
                onChange={handleCustomTextChange}
                fullWidth
              />
            </div>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              onClick={applyCustomText}
              disabled={!customText.trim()}
            >
              Apply
            </button>
          </div>
          
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size ({fontSize}px)
              </label>
              <input
                type="range"
                min="12"
                max="72"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Line Height ({lineHeight})
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Font preview */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Font Preview</h3>
        
        <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-md mb-4 text-sm text-indigo-700">
          <strong>Note:</strong> This preview shows the actual image regions you mapped. For a true font file, 
          these characters would be normalized, vectorized, and processed by a font generator. 
          You can improve this preview by:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Ensuring your character mappings are precise and tight around each character</li>
            <li>Using consistent baseline alignment when mapping characters</li>
            <li>Using clean, high-contrast source images</li>
          </ul>
        </div>
        
        <div 
          className="bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-48"
          style={{ lineHeight: lineHeight }}
        >
          {(previewText || DEFAULT_PREVIEW_TEXT)
            .split('')
            .map((char, index) => renderPreviewChar(char))}
        </div>
      </div>
    </div>
  );
};

export default FontTester; 