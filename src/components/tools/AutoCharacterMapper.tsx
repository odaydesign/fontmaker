'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { DetectedCharacter } from '@/services/characterDetectionService';
import Image from 'next/image';
import { useFont } from '@/context/FontContext';

interface AutoCharacterMapperProps {
  onCharactersMapped: (mappings: Record<string, any>) => void;
  onCancel: () => void;
}

export default function AutoCharacterMapper({ 
  onCharactersMapped,
  onCancel
}: AutoCharacterMapperProps) {
  const { sourceImages } = useFont();
  const [detecting, setDetecting] = useState(false);
  const [characters, setCharacters] = useState<DetectedCharacter[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<DetectedCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [processedImages, setProcessedImages] = useState<Set<string>>(new Set());
  
  // Character set for mapping (comprehensive character set)
  const availableChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:\'",./<>?€£¥¢₹±×÷≠≈≤≥∑∏√∞πéèêëàâäïîìñóòôöúùûü';
  
  // Characters that have been assigned
  const [assignedChars, setAssignedChars] = useState<Record<string, boolean>>({});
  
  // Get selected images
  const selectedImages = sourceImages.filter(img => img.selected);
  
  const detectCharacters = async () => {
    if (selectedImages.length === 0) {
      toast.error('No images selected. Please select at least one image first.');
      return;
    }
    
    setDetecting(true);
    setError(null);
    setCharacters([]);
    setProcessedImages(new Set());
    
    const allDetectedCharacters: DetectedCharacter[] = [];
    let totalDetected = 0;
    
    toast.info(`Detecting characters in ${selectedImages.length} image(s)...`);
    
    try {
      // Process each selected image
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        toast.info(`Processing image ${i + 1} of ${selectedImages.length}...`);
        
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
            const error = await response.json();
            console.warn(`Failed to detect characters in image ${i + 1}:`, error.error);
            continue; // Skip this image and continue with the next one
          }
          
          const data = await response.json();
          
          if (data.detectedCharacters && data.detectedCharacters.length > 0) {
            // Add imageId to each detected character for tracking
            const charactersWithImageId = data.detectedCharacters.map((char: DetectedCharacter, index: number) => ({
              ...char,
              id: `${image.id}_char_${index}`,
              sourceImageId: image.id,
              originalId: char.id
            }));
            
            allDetectedCharacters.push(...charactersWithImageId);
            totalDetected += data.detectedCharacters.length;
            setProcessedImages(prev => new Set([...prev, image.id]));
          }
        } catch (imageError) {
          console.warn(`Error processing image ${i + 1}:`, imageError);
          continue; // Continue with next image
        }
      }
      
      if (allDetectedCharacters.length > 0) {
        setCharacters(allDetectedCharacters);
        toast.success(`${totalDetected} characters detected across ${processedImages.size} image(s)!`);
      } else {
        throw new Error('No characters detected in any of the selected images. Try adjusting the images for better contrast or use manual mapping.');
      }
    } catch (error) {
      console.error('Error detecting characters:', error);
      setError(error instanceof Error ? error.message : 'Unknown detection error');
      toast.error(`Detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDetecting(false);
    }
  };
  
  const handleCharacterClick = (char: DetectedCharacter) => {
    setSelectedChar(char);
  };
  
  const assignCharacter = (detectedChar: DetectedCharacter, keyChar: string) => {
    // Update the character assignment
    const updatedChars = characters.map(c => 
      c.id === detectedChar.id ? { ...c, assignedChar: keyChar } : c
    );
    
    setCharacters(updatedChars);
    
    // Track assigned characters
    setAssignedChars({
      ...assignedChars,
      [keyChar]: true
    });
    
    setSelectedChar(null);
    toast.success(`Assigned "${keyChar}" to selected character`);
  };
  
  const handleKeySelect = (key: string) => {
    if (selectedChar) {
      assignCharacter(selectedChar, key);
    }
  };
  
  const saveMapping = () => {
    // Convert detected characters to the format expected by the application
    const mappings = characters
      .filter(char => char.assignedChar)
      .reduce((acc, char) => {
        if (char.assignedChar) {
          acc[char.assignedChar] = {
            x: char.x,
            y: char.y,
            width: char.width,
            height: char.height,
            contour: char.contour,
            sourceImageId: char.sourceImageId || 'unknown'
          };
        }
        return acc;
      }, {} as Record<string, any>);
    
    onCharactersMapped(mappings);
    toast.success(`Character mappings saved! ${Object.keys(mappings).length} characters mapped.`);
  };
  
  return (
    <div className="space-y-4 border rounded-md p-4 bg-gray-50 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Automatic Character Detection</h3>
          <p className="text-sm text-gray-600">
            {selectedImages.length} image(s) selected for processing
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={detectCharacters} 
            disabled={detecting || selectedImages.length === 0}
          >
            {detecting ? 'Detecting...' : `Detect Characters (${selectedImages.length})`}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
          <p className="font-medium">Detection Error</p>
          <p>{error}</p>
          <p className="mt-2 text-sm">
            Tips: 
            <ul className="list-disc pl-5 mt-1">
              <li>Make sure your image has good contrast between characters and background</li>
              <li>Characters should be clearly separated</li>
              <li>Try using manual mapping if automatic detection doesn't work well with your image</li>
            </ul>
          </p>
        </div>
      )}
      
      {detecting && (
        <div className="flex flex-col items-center py-4">
          <div className="flex items-center mb-2">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <span className="ml-2">Processing images...</span>
          </div>
          <div className="text-sm text-gray-600">
            Processed: {processedImages.size} of {selectedImages.length} images
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(processedImages.size / selectedImages.length) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {characters.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-medium mb-2">
            Detected Characters ({characters.length}) from {processedImages.size} image(s)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
            {characters.map(char => {
              const sourceImage = selectedImages.find(img => img.id === char.sourceImageId);
              return (
                <div 
                  key={char.id}
                  className={`border rounded p-2 cursor-pointer hover:border-blue-300 ${
                    selectedChar?.id === char.id ? 'bg-blue-100 border-blue-500' : 
                    char.assignedChar ? 'bg-green-50 border-green-500' : ''
                  }`}
                  onClick={() => handleCharacterClick(char)}
                >
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={char.croppedImageUrl} 
                      alt={`Character ${char.id}`}
                      className="h-16 object-contain"
                    />
                  </div>
                  {char.assignedChar && (
                    <div className="mt-2 text-center font-bold text-green-700">
                      {char.assignedChar}
                    </div>
                  )}
                  {sourceImage && (
                    <div className="mt-1 text-xs text-gray-500 text-center truncate">
                      {sourceImage.isAiGenerated ? 'AI' : 'Upload'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {selectedChar && (
            <div className="mt-4 p-4 border rounded bg-white">
              <h4 className="text-md font-medium mb-2">Assign Character</h4>
              <div className="space-y-3">
                {/* Uppercase Letters */}
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-1">Uppercase (A-Z)</h5>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map(char => (
                      <button
                        key={char}
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                          assignedChars[char] ? 'bg-gray-300 text-gray-600' : 'bg-white border hover:bg-blue-50'
                        }`}
                        onClick={() => handleKeySelect(char)}
                        disabled={assignedChars[char]}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Lowercase Letters */}
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-1">Lowercase (a-z)</h5>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map(char => (
                      <button
                        key={char}
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                          assignedChars[char] ? 'bg-gray-300 text-gray-600' : 'bg-white border hover:bg-blue-50'
                        }`}
                        onClick={() => handleKeySelect(char)}
                        disabled={assignedChars[char]}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Numbers */}
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-1">Numbers (0-9)</h5>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: 10 }, (_, i) => String(i)).map(char => (
                      <button
                        key={char}
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                          assignedChars[char] ? 'bg-gray-300 text-gray-600' : 'bg-white border hover:bg-blue-50'
                        }`}
                        onClick={() => handleKeySelect(char)}
                        disabled={assignedChars[char]}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Common Symbols */}
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-1">Common Symbols</h5>
                  <div className="flex flex-wrap gap-1">
                    {'!@#$%^&*()_+-=[]{}|;:\'",./<>?'.split('').map(char => (
                      <button
                        key={char}
                        className={`w-8 h-8 flex items-center justify-center rounded text-sm ${
                          assignedChars[char] ? 'bg-gray-300 text-gray-600' : 'bg-white border hover:bg-blue-50'
                        }`}
                        onClick={() => handleKeySelect(char)}
                        disabled={assignedChars[char]}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                // Get all unmapped characters
                const unmappedChars = characters.filter(char => !char.assignedChar);
                if (unmappedChars.length === 0) {
                  toast.info('All characters are already mapped');
                  return;
                }
                
                // Get available characters in priority order: uppercase, lowercase, numbers, symbols
                const priorityChars = [
                  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',  // Uppercase letters
                  'abcdefghijklmnopqrstuvwxyz',  // Lowercase letters
                  '0123456789',                  // Numbers
                  '!@#$%^&*()_+-=[]{}|;:\'",./<>?', // Common symbols
                  '€£¥¢₹±×÷≠≈≤≥∑∏√∞π',          // Extended symbols
                  'éèêëàâäïîìñóòôöúùûü'          // Accented characters
                ].join('');
                
                const availableLetters = priorityChars.split('')
                  .filter(letter => !assignedChars[letter]);
                
                // Map unmapped characters to available letters
                let assigned = 0;
                const updatedChars = [...characters];
                
                for (let i = 0; i < unmappedChars.length && i < availableLetters.length; i++) {
                  const charIndex = characters.findIndex(c => c.id === unmappedChars[i].id);
                  if (charIndex >= 0) {
                    updatedChars[charIndex] = {
                      ...updatedChars[charIndex],
                      assignedChar: availableLetters[i]
                    };
                    assigned++;
                  }
                }
                
                // Update state
                setCharacters(updatedChars);
                
                // Track assigned characters
                const newAssignedChars = { ...assignedChars };
                updatedChars.forEach(char => {
                  if (char.assignedChar) {
                    newAssignedChars[char.assignedChar] = true;
                  }
                });
                setAssignedChars(newAssignedChars);
                
                toast.success(`Auto-mapped ${assigned} characters`);
              }}
              className="mr-2"
            >
              Auto-Map Characters
            </Button>
            <Button onClick={saveMapping} disabled={!characters.some(c => c.assignedChar)}>
              Save Mappings
            </Button>
          </div>
        </div>
      )}
      
      <div className="text-sm text-gray-500 mt-2">
        <p>How it works:</p>
        <ol className="list-decimal pl-5">
          <li>Click "Detect Characters" to analyze the image</li>
          <li>Click on a detected character to select it</li>
          <li>Assign a keyboard character to it</li>
          <li>Click "Save Mappings" when done</li>
        </ol>
      </div>
    </div>
  );
} 