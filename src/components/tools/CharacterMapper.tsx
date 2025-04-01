'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useFont } from '@/context/FontContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { toast } from "sonner";

interface Point {
  x: number;
  y: number;
}

interface MappingState {
  [key: string]: CharacterMapping;
}

enum ResizeHandle {
  None,
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
  Top,
  Right,
  Bottom,
  Left,
  Move
}

interface SourceImage {
  id: string;
  url: string;
}

// Define CharacterMapping interface directly in this file
interface CharacterMapping {
  id: string;
  sourceImageId: string;
  char: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const CharacterMapper: React.FC = () => {
  const { sourceImages, characterMappings, addCharacterMapping, removeCharacterMapping, updateCharacterMapping } = useFont();
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(ResizeHandle.None);
  const [startPoint, setStartPoint] = useState<Point>({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState<Point>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [activeRect, setActiveRect] = useState<{ id?: string; startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);
  const [scaleFactors, setScaleFactors] = useState({ x: 1, y: 1 });
  const [lastMousePosition, setLastMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<
    'uppercase' | 'lowercase' | 'numbers' | 'basicPunctuation' | 'commonSymbols' | 'accents' | 'currency' | 'math'
  >('uppercase');
  const [mappings, setMappings] = useState<MappingState>({});
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Define character sets
  const characterSets = {
    uppercase: Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)),  // A-Z
    lowercase: Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)),  // a-z
    numbers: Array.from({ length: 10 }, (_, i) => String(i)),  // 0-9
    basicPunctuation: ['.', ',', '!', '?', '"', "'", ':', ';', '(', ')', '[', ']', '{', '}'],
    commonSymbols: ['@', '#', '$', '%', '&', '*', '+', '-', '=', '/', '\\', '|', '<', '>', '_'],
    accents: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ä', 'ï', 'î', 'ì', 'ñ', 'ó', 'ò', 'ô', 'ö', 'ú', 'ù', 'û', 'ü'],
    currency: ['$', '€', '£', '¥', '¢', '₹'],
    math: ['±', '×', '÷', '≠', '≈', '≤', '≥', '∑', '∏', '√', '∞', 'π'],
  };

  // Labels for the tabs
  const tabLabels = {
    uppercase: 'A–Z',
    lowercase: 'a–z',
    numbers: '0–9',
    basicPunctuation: '.,!?',
    commonSymbols: '@#$',
    accents: 'éàñ',
    currency: '$€£',
    math: '×÷π'
  };

  // Get all available characters A-Z
  const availableChars = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  
  // Get mapped characters
  const mappedChars = new Set(characterMappings.map(m => m.char.toUpperCase()));

  // Navigation functions
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % sourceImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + sourceImages.length) % sourceImages.length);
  };

  // Update currentImageId when index changes
  useEffect(() => {
    if (sourceImages.length > 0) {
      setCurrentImageId(sourceImages[currentImageIndex].id);
    }
  }, [currentImageIndex, sourceImages]);

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
          drawSelectionRect(ctx, scaleX, scaleY);
        }
        
        // Redraw any existing rectangles
        drawExistingMappings(ctx, scaleX, scaleY);
        
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
  }, [selectedImage, sourceImages, characterMappings, isDrawing, isResizing, startPoint, endPoint, selectedMapping, scaleFactors]);
  
  // Draw the current selection rectangle
  const drawSelectionRect = useCallback((ctx: CanvasRenderingContext2D, scaleX: number, scaleY: number) => {
    const x = Math.min(startPoint.x, endPoint.x) * scaleX;
    const y = Math.min(startPoint.y, endPoint.y) * scaleY;
    const width = Math.abs(endPoint.x - startPoint.x) * scaleX;
    const height = Math.abs(endPoint.y - startPoint.y) * scaleY;
    
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
  }, [startPoint, endPoint]);
  
  // Draw a selected mapping with resize handles
  const drawSelectedMapping = useCallback((
    ctx: CanvasRenderingContext2D, 
    mapping: CharacterMapping, 
    scaleX: number, 
    scaleY: number
  ) => {
    const x = mapping.x1 * scaleX;
    const y = mapping.y1 * scaleY;
    const width = (mapping.x2 - mapping.x1) * scaleX;
    const height = (mapping.y2 - mapping.y1) * scaleY;
    
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    const handleSize = 10;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
    
    ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    
    ctx.fillRect(x + width/2 - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width/2 - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
    
    ctx.fillStyle = 'rgba(79, 70, 229, 0.8)';
    ctx.fillRect(x, y - 20, 20, 20);
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(mapping.char, x + 5, y - 5);
  }, []);
  
  // Helper to draw existing character mappings on the canvas
  const drawExistingMappings = useCallback((
    ctx: CanvasRenderingContext2D, 
    scaleX: number,
    scaleY: number
  ) => {
    if (!selectedImage) return;
    
    characterMappings
      .filter((mapping: CharacterMapping) => mapping.sourceImageId === selectedImage.id && mapping.id !== selectedMapping)
      .forEach((mapping: CharacterMapping) => {
        const x = mapping.x1 * scaleX;
        const y = mapping.y1 * scaleY;
        const width = (mapping.x2 - mapping.x1) * scaleX;
        const height = (mapping.y2 - mapping.y1) * scaleY;
        
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
        ctx.lineWidth = 1;
        
        ctx.strokeRect(x, y, width, height);
        
        if (mapping.char) {
            ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.font = '12px sans-serif';
            ctx.fillText(mapping.char, x + 2, y + 12);
        }
      });
  }, [characterMappings, selectedImage, selectedMapping]);

  // Main redraw function
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = imageRef.current;

    if (!canvas || !ctx) return;
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const scaleX = scaleFactors.x;
    const scaleY = scaleFactors.y;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (image) {
      ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText('Loading image...', canvasWidth / 2, canvasHeight / 2);
    }

    drawExistingMappings(ctx, scaleX, scaleY);

    if (selectedMapping) {
      const mapping = characterMappings.find(m => m.id === selectedMapping);
      if (mapping) {
        drawSelectedMapping(ctx, mapping, scaleX, scaleY);
      }
    }

    if (isDrawing) {
      drawSelectionRect(ctx, scaleX, scaleY);
    }
  }, [
    isDrawing, 
    selectedMapping, 
    characterMappings, 
    scaleFactors,
    drawExistingMappings, 
    drawSelectedMapping, 
    drawSelectionRect
  ]);

  // Effect for loading image and setting up canvas
  useEffect(() => {
    if (selectedImage && canvasRef.current && imageContainerRef.current) {
      const canvas = canvasRef.current;
      const container = imageContainerRef.current;
      let isMounted = true;

      const img = new window.Image();
      img.onload = () => {
        if (!isMounted || !container || !selectedImage) return;

        const containerWidth = container.clientWidth;
        const originalWidth = selectedImage.width || img.naturalWidth;
        const originalHeight = selectedImage.height || img.naturalHeight;

        if (!selectedImage.width || !selectedImage.height) {
           console.warn('Updating image dimensions on the fly - should be pre-populated');
        }

        const aspectRatio = originalWidth > 0 && originalHeight > 0 ? originalWidth / originalHeight : 1;
        let drawWidth = containerWidth;
        let drawHeight = containerWidth / aspectRatio;
        
        if (!Number.isFinite(drawWidth) || !Number.isFinite(drawHeight) || drawWidth <= 0 || drawHeight <= 0) {
            console.error('Invalid calculated canvas dimensions', { drawWidth, drawHeight, aspectRatio });
            drawWidth = containerWidth > 0 ? containerWidth : 300;
            drawHeight = drawWidth / aspectRatio;
        }

        canvas.width = drawWidth;
        canvas.height = drawHeight;
        
        const scaleX = originalWidth > 0 ? drawWidth / originalWidth : 1;
        const scaleY = originalHeight > 0 ? drawHeight / originalHeight : 1;
        
        if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) {
             console.error('Invalid scale factors', { scaleX, scaleY, originalWidth, originalHeight });
             setScaleFactors({ x: 1, y: 1 });
        } else {
             setScaleFactors({ x: scaleX, y: scaleY });
        }
        
        imageRef.current = img;
        redrawCanvas();
      };

      img.onerror = () => {
        console.error("Failed to load image:", selectedImage.url);
        if (isMounted) {
            imageRef.current = null;
            redrawCanvas();
        }
      };

      img.src = selectedImage.url;

      return () => {
        isMounted = false;
      };

    } else {
      imageRef.current = null;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [selectedImage, redrawCanvas]);

  // Determine which resize handle was clicked
  const getResizeHandle = (x: number, y: number, rect: { startX: number, startY: number, endX: number, endY: number }): ResizeHandle => {
    const handleSize = 10 / Math.min(scaleFactors.x, scaleFactors.y);
    const { startX, startY, endX, endY } = rect;
    
    if (Math.abs(x - startX) <= handleSize && Math.abs(y - startY) <= handleSize) return ResizeHandle.TopLeft;
    if (Math.abs(x - endX) <= handleSize && Math.abs(y - startY) <= handleSize) return ResizeHandle.TopRight;
    if (Math.abs(x - startX) <= handleSize && Math.abs(y - endY) <= handleSize) return ResizeHandle.BottomLeft;
    if (Math.abs(x - endX) <= handleSize && Math.abs(y - endY) <= handleSize) return ResizeHandle.BottomRight;
    
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    
    if (Math.abs(x - centerX) <= handleSize && Math.abs(y - startY) <= handleSize) return ResizeHandle.Top;
    if (Math.abs(x - endX) <= handleSize && Math.abs(y - centerY) <= handleSize) return ResizeHandle.Right;
    if (Math.abs(x - centerX) <= handleSize && Math.abs(y - endY) <= handleSize) return ResizeHandle.Bottom;
    if (Math.abs(x - startX) <= handleSize && Math.abs(y - centerY) <= handleSize) return ResizeHandle.Left;
    
    if (x >= startX && x <= endX && y >= startY && y <= endY) return ResizeHandle.Move;
    
    return ResizeHandle.None;
  };

  // Check if we're clicking on an existing mapping
  const checkExistingMapping = (x: number, y: number): string | null => {
    if (!selectedImage || !canvasRef.current) return null;
    
    const currentImageMappings = characterMappings.filter((m: CharacterMapping) => m.sourceImageId === selectedImage.id);

    for (const mapping of currentImageMappings) {
        const rect = { startX: mapping.x1, startY: mapping.y1, endX: mapping.x2, endY: mapping.y2 };
        if (x >= rect.startX && x <= rect.endX && y >= rect.startY && y <= rect.endY) {
            return mapping.id;
        }
    }
    
    return null;
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement): Point => {
    const rect = canvas.getBoundingClientRect();
    const image = imageRef.current; // Get the loaded image element

    if (!image || rect.width === 0 || rect.height === 0) {
      // If image isn't loaded or canvas has no dimensions, return raw offset (fallback)
      console.warn("Cannot calculate canvas point accurately: Image or canvas dimensions missing.");
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;
    
    const offsetX = e.clientX - rect.left; // Mouse offset relative to canvas element (screen pixels)
    const offsetY = e.clientY - rect.top;

    // Map screen pixel offset to original image coordinate offset
    const x = offsetX * (originalWidth / rect.width);
    const y = offsetY * (originalHeight / rect.height);

    // Ensure results are numbers
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        console.warn("Calculated canvas point is not finite.", { x, y, offsetX, offsetY, originalWidth, originalHeight, rectWidth: rect.width, rectHeight: rect.height });
        return { x: 0, y: 0 }; // Fallback point
    }

    return { x, y }; // Coordinates relative to original image
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !selectedImage) return;
    const canvas = canvasRef.current;
    const point = getCanvasPoint(e, canvas);
    setLastMousePosition(point);

    if (selectedMapping) {
      const mapping = characterMappings.find(m => m.id === selectedMapping);
      if (mapping) {
        const rect = { 
          startX: mapping.x1, startY: mapping.y1, 
          endX: mapping.x2, endY: mapping.y2 
        };
        const handle = getResizeHandle(point.x, point.y, rect);
        if (handle !== ResizeHandle.None) {
          setActiveHandle(handle);
          setIsResizing(true);
          setStartPoint(point);
          redrawCanvas();
          return;
        }
      }
    }

    const clickedMappingId = checkExistingMapping(point.x, point.y);
    if (clickedMappingId) {
      setSelectedMapping(clickedMappingId);
      setActiveHandle(ResizeHandle.Move);
      setIsDrawing(false);
      setIsResizing(false);
      setStartPoint(point);
      redrawCanvas();
      return;
    }

    if (selectedChar) { 
      setStartPoint(point);
      setEndPoint(point);
      setIsDrawing(true);
      setSelectedMapping(null);
      setActiveHandle(ResizeHandle.None);
      redrawCanvas();
    } else {
      setSelectedMapping(null);
      redrawCanvas(); 
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const point = getCanvasPoint(e, canvas);
    const dx = point.x - lastMousePosition.x;
    const dy = point.y - lastMousePosition.y;

    if (isDrawing) {
      setEndPoint(point);
      redrawCanvas();
    } else if (isResizing && selectedMapping && activeHandle !== ResizeHandle.None) {
        const mapping = characterMappings.find(m => m.id === selectedMapping);
        if (!mapping) return;
        
        let newMapping = { ...mapping };

        switch (activeHandle) {
          case ResizeHandle.Move:
            newMapping.x1 += dx;
            newMapping.y1 += dy;
            newMapping.x2 += dx;
            newMapping.y2 += dy;
            break;
          case ResizeHandle.TopLeft: newMapping.x1 += dx; newMapping.y1 += dy; break;
          case ResizeHandle.TopRight: newMapping.x2 += dx; newMapping.y1 += dy; break;
          case ResizeHandle.BottomLeft: newMapping.x1 += dx; newMapping.y2 += dy; break;
          case ResizeHandle.BottomRight: newMapping.x2 += dx; newMapping.y2 += dy; break;
          case ResizeHandle.Top: newMapping.y1 += dy; break;
          case ResizeHandle.Bottom: newMapping.y2 += dy; break;
          case ResizeHandle.Left: newMapping.x1 += dx; break;
          case ResizeHandle.Right: newMapping.x2 += dx; break;
        }

        const updatedX1 = Math.min(newMapping.x1, newMapping.x2);
        const updatedY1 = Math.min(newMapping.y1, newMapping.y2);
        const updatedX2 = Math.max(newMapping.x1, newMapping.x2);
        const updatedY2 = Math.max(newMapping.y1, newMapping.y2);
        
        newMapping = { ...newMapping, x1: updatedX1, y1: updatedY1, x2: updatedX2, y2: updatedY2 };

        updateCharacterMapping(selectedMapping, newMapping);
        redrawCanvas();
    }
    
    setLastMousePosition(point);
  };

  const handleMouseUp = () => {
    const wasDrawing = isDrawing;
    const wasResizing = isResizing;

    if (isDrawing) {
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      if (width > 5 && height > 5 && selectedChar && currentImageId) {
        const newMapping: CharacterMapping = {
          id: `map_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          sourceImageId: currentImageId,
          char: selectedChar,
          x1: Math.min(startPoint.x, endPoint.x),
          y1: Math.min(startPoint.y, endPoint.y),
          x2: Math.max(startPoint.x, endPoint.x),
          y2: Math.max(startPoint.y, endPoint.y),
        };
        addCharacterMapping(newMapping);
        setSelectedMapping(newMapping.id);
        setSelectedChar(null);
      } else if (selectedChar) {
          setSelectedChar(null);
      }
    }

    setIsDrawing(false);
    setIsResizing(false);
    setActiveHandle(ResizeHandle.None);

    if (wasDrawing || wasResizing) {
      redrawCanvas(); 
    }
  };

  const handleMouseLeave = () => {
      if (isDrawing || isResizing) {
          setIsDrawing(false);
          setIsResizing(false);
          setActiveHandle(ResizeHandle.None);
          redrawCanvas();
      }
  };

  const handleCharSelect = (char: string) => {
    setSelectedChar(char);
    setSelectedMapping(null);
    redrawCanvas();
    
    // Test toast - this should appear whenever a character is selected
    toast(`Selected character: ${char}`, {
      position: "top-center",
      duration: 2000,
    });
  };

  const handleCharDelete = (mappingId: string) => {
    removeCharacterMapping(mappingId);
    if (selectedMapping === mappingId) {
      setSelectedMapping(null);
    }
    redrawCanvas();
  };

  // Add a test toast when component mounts
  useEffect(() => {
    // Show a test toast on component mount to verify toast is working
    toast.info("Character mapper initialized", {
      description: "Click a mapped character to unmap it",
      duration: 3000,
    });
  }, []);

  if (sourceImages.length === 0 || !sourceImages.some(img => img.selected)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded mb-6">
        <p>Please select at least one image from the previous step before mapping characters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <h2 className="text-lg font-semibold">Map Characters</h2>
        
        <div className="flex gap-1 overflow-x-auto pb-2">
          {sourceImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                currentImageIndex === index ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'
              }`}
            >
              <img
                src={image.url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-contain bg-gray-50"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 text-center">
                {index + 1}
              </span>
            </button>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-4">
            <TabsList className="flex flex-wrap gap-1 bg-muted p-1 rounded-md h-auto">
                {Object.entries(characterSets).map(([key, chars]) => (
                    <TabsTrigger key={key} value={key} className="text-xs">
                        {tabLabels[key as keyof typeof tabLabels]}
                    </TabsTrigger>
                ))}
            </TabsList>

            {(Object.keys(characterSets) as Array<keyof typeof characterSets>).map((setName) => (
                <TabsContent key={setName} value={setName} className="mt-2">
                    <div className="space-y-2">
                        <div className="grid grid-cols-8 sm:grid-cols-13 gap-x-4 gap-y-4">
                            {characterSets[setName].map((char) => {
                                // Check if the character is mapped in ANY image (not just the current one)
                                const mappingForChar = characterMappings.find((m: CharacterMapping) => m.char === char);
                                const isMapped = !!mappingForChar;
                                const isCharMappedInCurrentImage = !!characterMappings.find((m: CharacterMapping) => m.char === char && m.sourceImageId === currentImageId);
                                const isSelected = selectedChar === char;

                                // Simplified button styling that ensures text is clearly visible
                                let buttonClasses = "h-12 w-12 font-medium text-lg"; 

                                if (isSelected) {
                                    buttonClasses += " bg-primary border-primary text-primary-foreground";
                                } else if (isMapped) {
                                    // Different color if mapped in current vs different image
                                    if (isCharMappedInCurrentImage) {
                                        buttonClasses += " border-green-500 border-2 bg-green-50 text-green-800 hover:bg-red-100 hover:border-red-500 hover:text-red-700";
                                    } else {
                                        buttonClasses += " border-blue-500 border-2 bg-blue-50 text-blue-800";
                                    }
                                } else {
                                    buttonClasses += " bg-white border-gray-300 text-gray-900";
                                }

                                // Tooltip content that shows where character is mapped
                                let tooltipContent = "";
                                if (isMapped && mappingForChar) {
                                    const mappedImageIndex = sourceImages.findIndex(img => img.id === mappingForChar.sourceImageId);
                                    const imageNumber = mappedImageIndex >= 0 ? mappedImageIndex + 1 : '?';
                                    tooltipContent = `Mapped in Image ${imageNumber}`;
                                    if (isCharMappedInCurrentImage) {
                                        tooltipContent += " (current image). Click to unmap";
                                    }
                                } else if (isSelected) {
                                    tooltipContent = `'${char}' selected`;
                                } else {
                                    tooltipContent = `Select ${char} to map`;
                                }

                                return (
                                    <div key={char} className="relative"> 
                                      <Button
                                          variant="outline"
                                          onClick={() => {
                                              if (isCharMappedInCurrentImage) {
                                                  // If mapped in current image, click removes mapping
                                                  if (isSelected) {
                                                      setSelectedChar(null);
                                                  }
                                                  // Find the mapping in current image
                                                  const mappingToRemove = characterMappings.find((m: CharacterMapping) => m.char === char && m.sourceImageId === currentImageId);
                                                  if (mappingToRemove) {
                                                    removeCharacterMapping(mappingToRemove.id);
                                                    // If the mapping being removed was selected on canvas, deselect it
                                                    if (selectedMapping === mappingToRemove.id) {
                                                        setSelectedMapping(null);
                                                    }
                                                  }
                                              } else if (isMapped && !isCharMappedInCurrentImage) {
                                                  // Character is mapped in a different image - use toast instead of our custom notification
                                                  if (mappingForChar) {
                                                    const mappedImageIndex = sourceImages.findIndex(img => img.id === mappingForChar.sourceImageId);
                                                    const imageNumber = mappedImageIndex >= 0 ? mappedImageIndex + 1 : '?';
                                                    
                                                    // Make toast more prominent with longer duration and additional styling
                                                    toast.warning(`Character '${char}' is already mapped in Image ${imageNumber}`, {
                                                      description: "Switch to that image to modify it.",
                                                      duration: 4000,
                                                      id: `char-${char}-mapped`,  // Unique ID prevents duplicate toasts
                                                    });
                                                  }
                                              } else {
                                                  // If not mapped anywhere, click selects character for mapping
                                                  handleCharSelect(char);
                                              }
                                          }}
                                          // Disable if:
                                          // - Character is already mapped in a different image (can't map twice)
                                          // - Or we have a different character selected and this one is mapped
                                          disabled={(isMapped && !isCharMappedInCurrentImage) || 
                                                   (isCharMappedInCurrentImage && selectedChar !== null && selectedChar !== char)}
                                          className={buttonClasses}
                                          title={tooltipContent}
                                      >
                                          {char}
                                      </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </TabsContent>
            ))}
        </Tabs>

        {selectedImage ? (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="relative w-full rounded overflow-hidden flex justify-center bg-gray-50" ref={imageContainerRef}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                className="max-w-full max-h-[600px] object-contain cursor-crosshair"
              />
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                {error}
              </div>
            )}

            {imageMappings.length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-medium text-gray-800 mb-2">Mapped Characters</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {imageMappings.map((mapping: CharacterMapping) => (
                    <div
                      key={mapping.id}
                      className={`bg-gray-50 border rounded p-2 flex items-center justify-between ${
                        selectedMapping === mapping.id
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedMapping(mapping.id)}
                    >
                      <span className="text-lg font-medium">{mapping.char}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCharDelete(mapping.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
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
                      </button>
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
    </div>
  );
};

export default CharacterMapper; 