'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useFont } from '@/context/FontContext';

// Add resize handle enum for clarity
enum ResizeHandle {
  None = 'none',
  TopLeft = 'top-left',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomRight = 'bottom-right',
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
  Left = 'left',
  Move = 'move'
}

const CharacterMapper: React.FC = () => {
  const { sourceImages, characterMappings, addCharacterMapping, removeCharacterMapping, updateCharacterMapping } = useFont();
  const [selectedChar, setSelectedChar] = useState<string>('');
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(ResizeHandle.None);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [activeRect, setActiveRect] = useState<{ id?: string; startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);
  const [scaleFactors, setScaleFactors] = useState({ x: 1, y: 1 });
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });

  // Get selected image
  const selectedImage = sourceImages.find(img => img.id === currentImageId);
  
  // Get mappings for the current image
  const imageMappings = characterMappings.filter(
    mapping => mapping.sourceImageId === currentImageId
  );

  // Set first selected image as current when component mounts or when images change
  useEffect(() => {
    const selectedImages = sourceImages.filter(img => img.selected);
    if (selectedImages.length > 0 && !currentImageId) {
      setCurrentImageId(selectedImages[0].id);
    }
  }, [sourceImages, currentImageId]);

  // Draw mappings on canvas
  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Load the selected image
      const img = new window.Image();
      
      img.onload = () => {
        // Adjust canvas size to match the image aspect ratio but fit within its container
        const container = imageContainerRef.current;
        if (!container) return;
        
        const containerWidth = container.clientWidth;
        
        // Keep original image dimensions for accurate mapping
        if (!selectedImage.width || !selectedImage.height) {
          // If the image doesn't have dimensions stored, update the sourceImages state
          // (Note: This is a side effect, but it's important for proper mapping)
          sourceImages.forEach(image => {
            if (image.id === selectedImage.id) {
              image.width = img.naturalWidth;
              image.height = img.naturalHeight;
            }
          });
        }
        
        // Maintain aspect ratio while fitting in container
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = containerWidth;
        let drawHeight = containerWidth / aspectRatio;
        
        canvas.width = drawWidth;
        canvas.height = drawHeight;
        
        // Calculate and store scaling factors for later use
        const scaleX = drawWidth / (selectedImage.width || img.naturalWidth);
        const scaleY = drawHeight / (selectedImage.height || img.naturalHeight);
        setScaleFactors({ x: scaleX, y: scaleY });
        
        // Draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
        
        // Draw active rectangle if we're drawing or resizing
        if (isDrawing || isResizing) {
          drawSelectionRect(ctx);
        }
        
        // Redraw any existing rectangles
        drawExistingMappings(ctx, drawWidth, drawHeight);
        
        // Redraw the selected mapping with resize handles if one is selected
        if (selectedMapping) {
          const mapping = characterMappings.find(m => m.id === selectedMapping);
          if (mapping) {
            drawSelectedMapping(ctx, mapping, scaleX, scaleY);
          }
        }
      };
      
      img.src = selectedImage.url;
    }
  }, [selectedImage, sourceImages, characterMappings, isDrawing, isResizing, startPoint, endPoint, selectedMapping]);
  
  // Draw the current selection rectangle
  const drawSelectionRect = (ctx: CanvasRenderingContext2D) => {
    if (!isDrawing && !isResizing) return;
    
    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);
    
    // Draw rectangle
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Blue
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]); // Dashed line
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]); // Reset to solid line
  };
  
  // Draw a selected mapping with resize handles
  const drawSelectedMapping = (
    ctx: CanvasRenderingContext2D, 
    mapping: any, 
    scaleX: number, 
    scaleY: number
  ) => {
    const x = mapping.x1 * scaleX;
    const y = mapping.y1 * scaleY;
    const width = (mapping.x2 - mapping.x1) * scaleX;
    const height = (mapping.y2 - mapping.y1) * scaleY;
    
    // Draw highlighted rectangle
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'; // Blue
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Draw resize handles
    const handleSize = 10;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
    
    // Draw corner handles
    ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize); // Top-left
    ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize); // Top-right
    ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // Bottom-left
    ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // Bottom-right
    
    // Draw edge handles
    ctx.fillRect(x + width/2 - handleSize/2, y - handleSize/2, handleSize, handleSize); // Top
    ctx.fillRect(x + width - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize); // Right
    ctx.fillRect(x + width/2 - handleSize/2, y + height - handleSize/2, handleSize, handleSize); // Bottom
    ctx.fillRect(x - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize); // Left
    
    // Draw label
    ctx.fillStyle = 'rgba(79, 70, 229, 0.8)';
    ctx.fillRect(x, y - 20, 20, 20);
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(mapping.char, x + 5, y - 5);
  };
  
  // Helper to draw existing character mappings on the canvas
  const drawExistingMappings = (
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    if (!selectedImage) return;
    
    const originalWidth = selectedImage.width || 0;
    const originalHeight = selectedImage.height || 0;
    
    // Calculate scaling factors
    const scaleX = canvasWidth / originalWidth;
    const scaleY = canvasHeight / originalHeight;
    
    // Draw existing mappings for this image
    characterMappings
      .filter(mapping => mapping.sourceImageId === selectedImage.id && mapping.id !== selectedMapping)
      .forEach(mapping => {
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.8)';
        ctx.lineWidth = 2;
        
        // Scale coordinates to match canvas size
        const x = mapping.x1 * scaleX;
        const y = mapping.y1 * scaleY;
        const width = (mapping.x2 - mapping.x1) * scaleX;
        const height = (mapping.y2 - mapping.y1) * scaleY;
        
        ctx.strokeRect(x, y, width, height);
        
        // Draw label
        ctx.fillStyle = 'rgba(79, 70, 229, 0.8)';
        ctx.fillRect(x, y - 20, 20, 20);
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(mapping.char, x + 5, y - 5);
      });
  };

  // Handle image container resize
  useEffect(() => {
    if (!canvasRef.current || !imageContainerRef.current || !selectedImage) return;

    const resizeCanvas = () => {
      if (canvasRef.current && imageContainerRef.current) {
        canvasRef.current.width = imageContainerRef.current.offsetWidth;
        canvasRef.current.height = imageContainerRef.current.offsetHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [selectedImage]);

  // Determine which resize handle was clicked
  const getResizeHandle = (x: number, y: number, rect: { startX: number, startY: number, endX: number, endY: number }): ResizeHandle => {
    const handleSize = 10;
    const { startX, startY, endX, endY } = rect;
    
    // Check corners
    if (Math.abs(x - startX) <= handleSize && Math.abs(y - startY) <= handleSize) {
      return ResizeHandle.TopLeft;
    }
    if (Math.abs(x - endX) <= handleSize && Math.abs(y - startY) <= handleSize) {
      return ResizeHandle.TopRight;
    }
    if (Math.abs(x - startX) <= handleSize && Math.abs(y - endY) <= handleSize) {
      return ResizeHandle.BottomLeft;
    }
    if (Math.abs(x - endX) <= handleSize && Math.abs(y - endY) <= handleSize) {
      return ResizeHandle.BottomRight;
    }
    
    // Check edges
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    
    if (Math.abs(x - centerX) <= handleSize && Math.abs(y - startY) <= handleSize) {
      return ResizeHandle.Top;
    }
    if (Math.abs(x - endX) <= handleSize && Math.abs(y - centerY) <= handleSize) {
      return ResizeHandle.Right;
    }
    if (Math.abs(x - centerX) <= handleSize && Math.abs(y - endY) <= handleSize) {
      return ResizeHandle.Bottom;
    }
    if (Math.abs(x - startX) <= handleSize && Math.abs(y - centerY) <= handleSize) {
      return ResizeHandle.Left;
    }
    
    // Check if inside rectangle for moving
    if (x >= startX && x <= endX && y >= startY && y <= endY) {
      return ResizeHandle.Move;
    }
    
    return ResizeHandle.None;
  };

  // Check if we're clicking on an existing mapping
  const checkExistingMapping = (x: number, y: number) => {
    if (!selectedImage || !canvasRef.current) return null;
    
    const { x: scaleX, y: scaleY } = scaleFactors;
    
    for (const mapping of imageMappings) {
      const rect = {
        startX: mapping.x1 * scaleX,
        startY: mapping.y1 * scaleY,
        endX: mapping.x2 * scaleX,
        endY: mapping.y2 * scaleY
      };
      
      const handle = getResizeHandle(x, y, rect);
      if (handle !== ResizeHandle.None) {
        return { mapping, handle, rect };
      }
    }
    
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentImageId) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if we're clicking on an existing mapping
    const clickResult = checkExistingMapping(x, y);
    
    if (clickResult) {
      const { mapping, handle, rect } = clickResult;
      
      // Select this mapping
      setSelectedMapping(mapping.id);
      setActiveRect(rect);
      
      if (handle !== ResizeHandle.None) {
        // We're resizing or moving this mapping
        setIsResizing(true);
        setActiveHandle(handle);
        setStartPoint({ x: rect.startX, y: rect.startY });
        setEndPoint({ x: rect.endX, y: rect.endY });
        setLastMousePosition({ x, y });
      }
      
      return;
    }
    
    // We're drawing a new rectangle
    if (!selectedChar) {
      setError('Please select a character first');
      return;
    }
    
    // Deselect any selected mapping
    setSelectedMapping(null);
    setError(null);
    setIsDrawing(true);
    setStartPoint({ x, y });
    setEndPoint({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Set cursor style based on where we are
    if (!isDrawing && !isResizing) {
      const clickResult = checkExistingMapping(x, y);
      if (clickResult) {
        const { handle } = clickResult;
        
        switch (handle) {
          case ResizeHandle.TopLeft:
          case ResizeHandle.BottomRight:
            e.currentTarget.style.cursor = 'nwse-resize';
            break;
          case ResizeHandle.TopRight:
          case ResizeHandle.BottomLeft:
            e.currentTarget.style.cursor = 'nesw-resize';
            break;
          case ResizeHandle.Top:
          case ResizeHandle.Bottom:
            e.currentTarget.style.cursor = 'ns-resize';
            break;
          case ResizeHandle.Left:
          case ResizeHandle.Right:
            e.currentTarget.style.cursor = 'ew-resize';
            break;
          case ResizeHandle.Move:
            e.currentTarget.style.cursor = 'move';
            break;
          default:
            e.currentTarget.style.cursor = 'default';
        }
      } else {
        e.currentTarget.style.cursor = 'crosshair';
      }
    }
    
    if (isDrawing) {
      // We're drawing a new rectangle
      setEndPoint({ x, y });
    } else if (isResizing && activeRect) {
      // We're resizing or moving an existing rectangle
      const deltaX = x - lastMousePosition.x;
      const deltaY = y - lastMousePosition.y;
      
      let newStartX = startPoint.x;
      let newStartY = startPoint.y;
      let newEndX = endPoint.x;
      let newEndY = endPoint.y;
      
      switch (activeHandle) {
        case ResizeHandle.TopLeft:
          newStartX += deltaX;
          newStartY += deltaY;
          break;
        case ResizeHandle.TopRight:
          newEndX += deltaX;
          newStartY += deltaY;
          break;
        case ResizeHandle.BottomLeft:
          newStartX += deltaX;
          newEndY += deltaY;
          break;
        case ResizeHandle.BottomRight:
          newEndX += deltaX;
          newEndY += deltaY;
          break;
        case ResizeHandle.Top:
          newStartY += deltaY;
          break;
        case ResizeHandle.Right:
          newEndX += deltaX;
          break;
        case ResizeHandle.Bottom:
          newEndY += deltaY;
          break;
        case ResizeHandle.Left:
          newStartX += deltaX;
          break;
        case ResizeHandle.Move:
          newStartX += deltaX;
          newStartY += deltaY;
          newEndX += deltaX;
          newEndY += deltaY;
          break;
      }
      
      setStartPoint({ x: newStartX, y: newStartY });
      setEndPoint({ x: newEndX, y: newEndY });
      setLastMousePosition({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (!selectedImage) return;
    
    if (isDrawing) {
      finishDrawing();
    } else if (isResizing && selectedMapping) {
      finishResizing();
    }
    
    setIsDrawing(false);
    setIsResizing(false);
    setActiveHandle(ResizeHandle.None);
  };
  
  const finishDrawing = () => {
    if (!isDrawing || !selectedChar || !currentImageId || !selectedImage) return;
    
    // Normalize coordinates (ensure start < end)
    const x1 = Math.min(startPoint.x, endPoint.x);
    const y1 = Math.min(startPoint.y, endPoint.y);
    const x2 = Math.max(startPoint.x, endPoint.x);
    const y2 = Math.max(startPoint.y, endPoint.y);
    
    // Minimum size check
    if (x2 - x1 < 10 || y2 - y1 < 10) {
      setError('Selection area too small. Please make a larger selection.');
      return;
    }
    
    // Convert to original image coordinates
    const { x: scaleX, y: scaleY } = scaleFactors;
    const originalX1 = x1 / scaleX;
    const originalY1 = y1 / scaleY;
    const originalX2 = x2 / scaleX;
    const originalY2 = y2 / scaleY;
    
    // Add new character mapping
    addCharacterMapping({
      sourceImageId: currentImageId,
      char: selectedChar,
      x1: originalX1,
      y1: originalY1,
      x2: originalX2,
      y2: originalY2,
      originalImageWidth: selectedImage.width || 0,
      originalImageHeight: selectedImage.height || 0
    });
    
    // Clear selection
    setSelectedChar('');
    setActiveRect(null);
    setError('');
  };
  
  const finishResizing = () => {
    if (!isResizing || !selectedMapping || !selectedImage) return;
    
    // Normalize coordinates (ensure start < end)
    const x1 = Math.min(startPoint.x, endPoint.x);
    const y1 = Math.min(startPoint.y, endPoint.y);
    const x2 = Math.max(startPoint.x, endPoint.x);
    const y2 = Math.max(startPoint.y, endPoint.y);
    
    // Minimum size check
    if (x2 - x1 < 10 || y2 - y1 < 10) {
      setError('Selection area too small. Please make a larger selection.');
      // Don't update, keep original size
      return;
    }
    
    // Convert to original image coordinates
    const { x: scaleX, y: scaleY } = scaleFactors;
    const originalX1 = x1 / scaleX;
    const originalY1 = y1 / scaleY;
    const originalX2 = x2 / scaleX;
    const originalY2 = y2 / scaleY;
    
    // Update the mapping
    updateCharacterMapping(selectedMapping, {
      x1: originalX1,
      y1: originalY1,
      x2: originalX2,
      y2: originalY2
    });
    
    setActiveRect(null);
  };

  const handleCharDelete = (mappingId: string) => {
    removeCharacterMapping(mappingId);
    if (selectedMapping === mappingId) {
      setSelectedMapping(null);
    }
  };

  // Common characters for quick selection
  const commonChars = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '.', ',', '!', '?', '@', '#', '$', '%', '&', '*', '(', ')', '-', '+', '=', '/'
  ];

  if (sourceImages.length === 0 || !sourceImages.some(img => img.selected)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded mb-6">
        <p>Please select at least one image from the previous step before mapping characters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Image selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Image</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {sourceImages
            .filter(img => img.selected)
            .map(image => (
              <div
                key={image.id}
                onClick={() => setCurrentImageId(image.id)}
                className={`relative aspect-video cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                  currentImageId === image.id ? 'border-indigo-500 shadow-md' : 'border-gray-200'
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.aiPrompt || 'Uploaded image'}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
        </div>
      </div>

      {/* Character selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Character to Map</h3>
        <div className="mb-4">
          <Input
            label="Custom Character"
            value={selectedChar}
            onChange={e => setSelectedChar(e.target.value.charAt(0))}
            placeholder="Type a character"
            maxLength={1}
          />
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Common Characters</h4>
          <div className="grid grid-cols-10 md:grid-cols-16 gap-1">
            {commonChars.map(char => (
              <button
                key={char}
                onClick={() => setSelectedChar(char)}
                className={`h-10 w-10 rounded-md flex items-center justify-center text-sm font-medium ${
                  selectedChar === char
                    ? 'bg-indigo-100 border-2 border-indigo-500 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mapping canvas */}
      {selectedImage ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Draw and Adjust Character Boxes
          </h3>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <h4 className="text-md font-medium text-gray-700 mb-1">Instructions:</h4>
              <ol className="text-gray-600 text-sm space-y-1 list-decimal pl-5">
                <li>Select a character from above</li>
                <li>Draw a box around the character in the image</li>
                <li>To adjust a box, click on it to select</li>
                <li>Drag the handles to resize, or the center to move</li>
                <li>Click outside to confirm changes</li>
              </ol>
            </div>
            <div className="flex-1">
              <h4 className="text-md font-medium text-gray-700 mb-1">Tips:</h4>
              <ul className="text-gray-600 text-sm space-y-1 list-disc pl-5">
                <li>Select a character then click and drag to create a box</li>
                <li>Blue squares are resize handles</li>
                <li>Blue outline shows the currently selected box</li>
                <li>Press and hold to move the entire box</li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4">
              {error}
            </div>
          )}

          <div
            ref={imageContainerRef}
            className="relative w-full aspect-video max-h-[600px] mb-6 rounded overflow-hidden"
          >
            <Image
              src={selectedImage.url}
              alt={selectedImage.aiPrompt || 'Selected image'}
              fill
              className="object-contain"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Mapped characters */}
          {imageMappings.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">Mapped Characters</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {imageMappings.map(mapping => (
                  <div
                    key={mapping.id}
                    className={`bg-gray-50 border rounded p-2 flex items-center justify-between ${
                      selectedMapping === mapping.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedMapping(mapping.id)}
                  >
                    <span className="text-lg font-medium">{mapping.char}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCharDelete(mapping.id);
                      }}
                    >
                      <svg
                        className="h-4 w-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-8 rounded text-center">
          <p className="text-gray-500">Please select an image to start mapping characters.</p>
        </div>
      )}
    </div>
  );
};

export default CharacterMapper; 