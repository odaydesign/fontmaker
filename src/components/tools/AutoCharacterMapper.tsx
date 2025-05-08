'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { DetectedCharacter } from '@/services/characterDetectionService';
import Image from 'next/image';

interface AutoCharacterMapperProps {
  imageUrl: string;
  onCharactersMapped: (mappings: Record<string, any>) => void;
  onCancel: () => void;
}

export default function AutoCharacterMapper({ 
  imageUrl, 
  onCharactersMapped,
  onCancel
}: AutoCharacterMapperProps) {
  const [detecting, setDetecting] = useState(false);
  const [characters, setCharacters] = useState<DetectedCharacter[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedChar, setSelectedChar] = useState<DetectedCharacter | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Character set for mapping (could be customizable)
  const availableChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  
  // Characters that have been assigned
  const [assignedChars, setAssignedChars] = useState<Record<string, boolean>>({});
  
  const detectCharacters = async () => {
    if (!imageUrl) return;
    
    setDetecting(true);
    setError(null);
    toast.info('Detecting characters in image...');
    
    try {
      const response = await fetch('/api/characters/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Character detection failed');
      }
      
      const data = await response.json();
      
      if (data.detectedCharacters && data.detectedCharacters.length > 0) {
        setCharacters(data.detectedCharacters);
        setSessionId(data.sessionId);
        toast.success(`${data.detectedCharacters.length} characters detected!`);
      } else {
        throw new Error('No characters detected. Try adjusting the image for better contrast or use manual mapping.');
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
            sourceImageId: imageUrl // Or the actual image ID
          };
        }
        return acc;
      }, {} as Record<string, any>);
    
    onCharactersMapped(mappings);
    toast.success('Character mappings saved!');
  };
  
  return (
    <div className="space-y-4 border rounded-md p-4 bg-gray-50 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Automatic Character Detection</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            onClick={detectCharacters} 
            disabled={detecting || !imageUrl}
          >
            {detecting ? 'Detecting...' : 'Detect Characters'}
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
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <span className="ml-2">Analyzing image...</span>
        </div>
      )}
      
      {characters.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-medium mb-2">Detected Characters ({characters.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
            {characters.map(char => (
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
              </div>
            ))}
          </div>
          
          {selectedChar && (
            <div className="mt-4 p-4 border rounded bg-white">
              <h4 className="text-md font-medium mb-2">Assign Character</h4>
              <div className="flex flex-wrap gap-1">
                {availableChars.split('').map(char => (
                  <button
                    key={char}
                    className={`w-8 h-8 flex items-center justify-center rounded ${
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
                
                // Get available characters (uppercase alphabet first)
                const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const availableLetters = alphabet.split('')
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