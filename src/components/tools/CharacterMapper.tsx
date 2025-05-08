'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useFont } from '@/context/FontContext';
import { ChevronLeft, ChevronRight, Wand2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { toast } from "sonner";
import AutoCharacterMapper from './AutoCharacterMapper';
import { CharacterMapping } from '@/context/FontContext';

interface Point {
  x: number;
  y: number;
}

enum ResizeHandle {
  None,
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
  Left,
  Right,
  Top,
  Bottom,
  Move
}

interface MappingState {
  [char: string]: {
    rect: { x1: number; y1: number; x2: number; y2: number };
    imageId: string;
  };
}

interface SourceImage {
  id: string;
  url: string;
}

interface ImageData {
  id: string;
  url: string;
  width: number;
  height: number;
}

const calculateBoundingBox = (points: {x: number, y: number}[]) => {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  points.forEach(point => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });
  
  return { minX, minY, maxX, maxY };
};

const CharacterMapper: React.FC = () => {
  const { 
    sourceImages, 
    characterMappings, 
    addCharacterMapping, 
    removeCharacterMapping, 
    updateCharacterMapping,
    unmappedChars,
    setUnmappedChars
  } = useFont();
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

  const [isPolygonMode, setIsPolygonMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<{x: number, y: number}[]>([]);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [isAddingPoints, setIsAddingPoints] = useState(false);
  
  const [showAutoDetection, setShowAutoDetection] = useState(false);

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

  const availableChars = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  
  const mappedChars = new Set(characterMappings.map(m => m.char.toUpperCase()));

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % sourceImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + sourceImages.length) % sourceImages.length);
  };

  useEffect(() => {
    if (sourceImages.length > 0) {
      setCurrentImageId(sourceImages[currentImageIndex].id);
    }
  }, [currentImageIndex, sourceImages]);

  const selectedImage = sourceImages.find(img => img.id === currentImageId);
  
  const imageMappings = characterMappings.filter(
    mapping => mapping.sourceImageId === currentImageId
  );

  useEffect(() => {
    const selectedImages = sourceImages.filter(img => img.selected);
    if (selectedImages.length > 0 && !currentImageId) {
      setCurrentImageId(selectedImages[0].id);
    }
  }, [sourceImages, currentImageId]);

  const drawSelectionRect = useCallback((ctx: CanvasRenderingContext2D, scaleX: number, scaleY: number) => {
    // Draw the current selection rectangle using scaled coordinates
    const x = Math.min(startPoint.x, endPoint.x) * scaleX;
    const y = Math.min(startPoint.y, endPoint.y) * scaleY;
    const width = Math.abs(endPoint.x - startPoint.x) * scaleX;
    const height = Math.abs(endPoint.y - startPoint.y) * scaleY;
    
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
    
    // Add coordinates for debugging alignment issues
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y - 20, 150, 20);
    ctx.fillStyle = 'white';
    ctx.font = '10px sans-serif';
    ctx.fillText(`Orig: ${Math.round(startPoint.x)},${Math.round(startPoint.y)} - ${Math.round(endPoint.x)},${Math.round(endPoint.y)}`, x + 5, y - 5);
  }, [startPoint, endPoint]);
  
  const drawSelectedMapping = useCallback((
    ctx: CanvasRenderingContext2D, 
    mapping: CharacterMapping, 
    scaleX: number, 
    scaleY: number
  ) => {
    // Draw the selected mapping with resize handles
    const x = mapping.x1 * scaleX;
    const y = mapping.y1 * scaleY;
    const width = (mapping.x2 - mapping.x1) * scaleX;
    const height = (mapping.y2 - mapping.y1) * scaleY;
    
    // Draw with a thicker blue border
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Draw resize handles at the corners and midpoints
    const handleSize = 10;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
    
    // Corner handles
    ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    
    // Middle handles
    ctx.fillRect(x + width/2 - handleSize/2, y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x + width/2 - handleSize/2, y + height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(x - handleSize/2, y + height/2 - handleSize/2, handleSize, handleSize);
    
    // Draw character label
    ctx.fillStyle = 'rgba(79, 70, 229, 0.8)';
    ctx.fillRect(x, y - 20, 30, 20);
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.fillText(mapping.char, x + 10, y - 5);
    
    // Show coordinates for debugging
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x + 35, y - 20, 120, 20);
    ctx.fillStyle = 'white';
    ctx.font = '10px sans-serif';
    ctx.fillText(`${Math.round(mapping.x1)},${Math.round(mapping.y1)} - ${Math.round(mapping.x2)},${Math.round(mapping.y2)}`, x + 40, y - 5);
  }, []);
  
  const drawPolygon = useCallback((
    ctx: CanvasRenderingContext2D,
    points: {x: number, y: number}[],
    scaleX: number,
    scaleY: number,
    isSelected: boolean = false
  ) => {
    if (points.length < 2) return;
    
    const scaledPoints = points.map(p => ({
      x: p.x * scaleX,
      y: p.y * scaleY
    }));
    
    ctx.beginPath();
    ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
    for (let i = 1; i < scaledPoints.length; i++) {
      ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
    }
    if (scaledPoints.length >= 3) {
      ctx.closePath();
    }
    
    if (isSelected) {
      ctx.strokeStyle = 'rgba(62, 116, 245, 0.8)';
      ctx.fillStyle = 'rgba(62, 116, 245, 0.2)';
    } else {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    }
    
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (scaledPoints.length >= 3) {
      ctx.fill();
    }
    
    // Draw points
    const pointRadius = 5;
    scaledPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
      
      if (index === selectedPointIndex) {
        ctx.fillStyle = 'rgba(245, 66, 66, 0.9)';
      } else {
        ctx.fillStyle = isSelected ? 'rgba(62, 116, 245, 0.9)' : 'rgba(16, 185, 129, 0.9)';
      }
      
      ctx.fill();
    });
    
    // Draw point numbers
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    scaledPoints.forEach((point, index) => {
      ctx.fillText(String(index + 1), point.x, point.y);
    });
  }, [selectedPointIndex]);

  const drawCurrentPolygon = useCallback((
    ctx: CanvasRenderingContext2D,
    scaleX: number,
    scaleY: number
  ) => {
    if (isPolygonMode && polygonPoints.length > 0) {
      drawPolygon(ctx, polygonPoints, scaleX, scaleY, true);
    }
  }, [isPolygonMode, polygonPoints, drawPolygon]);

  const drawExistingMappings = useCallback((
    ctx: CanvasRenderingContext2D, 
    scaleX: number,
    scaleY: number
  ) => {
    if (!selectedImage) return;
    
    // Draw all character mappings for the current image (except selected one)
    characterMappings
      .filter((mapping: CharacterMapping) => mapping.sourceImageId === selectedImage.id && mapping.id !== selectedMapping)
      .forEach((mapping: CharacterMapping) => {
        if (mapping.isPolygon && mapping.polygonPoints) {
          // Draw polygon-based mappings
          drawPolygon(ctx, mapping.polygonPoints, scaleX, scaleY);
          
          if (mapping.char && mapping.polygonPoints.length > 0) {
            const firstPoint = mapping.polygonPoints[0];
            ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.font = '12px sans-serif';
            ctx.fillText(mapping.char, firstPoint.x * scaleX + 2, firstPoint.y * scaleY - 5);
          }
        } else {
          // Draw rectangle-based mappings
          const x = mapping.x1 * scaleX;
          const y = mapping.y1 * scaleY;
          const width = (mapping.x2 - mapping.x1) * scaleX;
          const height = (mapping.y2 - mapping.y1) * scaleY;
          
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.lineWidth = 1.5;
          
          ctx.strokeRect(x, y, width, height);
          
          if (mapping.char) {
            // Draw character label
            ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.fillRect(x, y - 20, 25, 20);
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.fillText(mapping.char, x + 8, y - 5);
          }
        }
      });
  }, [characterMappings, selectedImage, selectedMapping, drawPolygon]);

  // Main canvas redraw function
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx || !imageRef.current) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    
    // Get scale factors for mappings
    const imgWidth = selectedImage?.width || imageRef.current.naturalWidth;
    const imgHeight = selectedImage?.height || imageRef.current.naturalHeight;
    const scaleX = canvas.width / imgWidth;
    const scaleY = canvas.height / imgHeight;
    
    // Draw all mappings
    if (selectedImage) {
      characterMappings
        .filter(mapping => mapping.sourceImageId === selectedImage.id)
        .forEach(mapping => {
          const isSelected = mapping.id === selectedMapping;
          
          if (mapping.isPolygon && mapping.polygonPoints) {
            // Draw polygon mapping
            const scaledPoints = mapping.polygonPoints.map(p => ({
              x: p.x * scaleX,
              y: p.y * scaleY
            }));
            
            if (scaledPoints.length < 3) return;
            
            // Draw polygon
            ctx.beginPath();
            ctx.moveTo(scaledPoints[0].x, scaledPoints[0].y);
            for (let i = 1; i < scaledPoints.length; i++) {
              ctx.lineTo(scaledPoints[i].x, scaledPoints[i].y);
            }
            ctx.closePath();
            
            ctx.strokeStyle = isSelected ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 200, 0, 0.7)';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.stroke();
            
            ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 200, 0, 0.2)';
            ctx.fill();
            
            // Draw character label at first point
            const firstPoint = scaledPoints[0];
            ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 200, 0, 0.8)';
            ctx.fillRect(firstPoint.x - 10, firstPoint.y - 25, 30, 20);
            ctx.fillStyle = 'white';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(mapping.char, firstPoint.x + 5, firstPoint.y - 10);
          } else {
            // Draw rectangle mapping
            const x = mapping.x1 * scaleX;
            const y = mapping.y1 * scaleY;
            const width = (mapping.x2 - mapping.x1) * scaleX;
            const height = (mapping.y2 - mapping.y1) * scaleY;
            
            ctx.strokeStyle = isSelected ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 200, 0, 0.7)';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(x, y, width, height);
            
            // Draw character label
            ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 200, 0, 0.8)';
            ctx.fillRect(x, y - 25, 30, 20);
            ctx.fillStyle = 'white';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(mapping.char, x + 15, y - 10);
          }
        });
    }
    
    // Draw current selection rectangle (if drawing)
    if (isDrawing) {
      const x = Math.min(startPoint.x, endPoint.x);
      const y = Math.min(startPoint.y, endPoint.y);
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);
      
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }
    
    // Draw current polygon (in polygon mode)
    if (isPolygonMode && polygonPoints.length > 0) {
      // Draw connecting lines between points
      if (polygonPoints.length > 1) {
        ctx.beginPath();
        ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
        
        for (let i = 1; i < polygonPoints.length; i++) {
          ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
        }
        
        // Close the polygon if 3+ points
        if (polygonPoints.length >= 3) {
          ctx.closePath();
        }
        
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Fill polygon if it has 3+ points
        if (polygonPoints.length >= 3) {
          ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
          ctx.fill();
        }
      }
      
      // Draw each point
      const pointSize = 8;
      polygonPoints.forEach((point, index) => {
        ctx.fillStyle = index === selectedPointIndex ? 'yellow' : 'red';
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw point numbers
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(index + 1), point.x, point.y);
      });
      
      // Add helpful instruction overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 400, 30);
      ctx.fillStyle = 'white';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      if (isAddingPoints) {
        ctx.fillText(`Click to add points (${polygonPoints.length} so far). Need at least 3.`, 20, 25);
      } else {
        ctx.fillText('Click points to select/move them. Press "Add Points" to continue.', 20, 25);
      }
    }
  };

  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    if (selectedImage && canvasRef.current && imageContainerRef.current) {
      const canvas = canvasRef.current;
      const container = imageContainerRef.current;
      let isMounted = true;

      setImageLoading(true);
      const img = new window.Image();
      img.onload = () => {
        if (!isMounted || !container || !selectedImage) return;

        // Use the full container width for the image display
        const containerWidth = container.clientWidth;
        const originalWidth = selectedImage.width || img.naturalWidth;
        const originalHeight = selectedImage.height || img.naturalHeight;

        // Maintain aspect ratio but use full size
        const aspectRatio = originalWidth > 0 && originalHeight > 0 ? originalWidth / originalHeight : 1;
        
        // Allow the image to display at its natural size without forced scaling
        let drawWidth = originalWidth;
        let drawHeight = originalHeight;
        
        // Only scale down if larger than container
        if (drawWidth > containerWidth) {
          drawWidth = containerWidth;
          drawHeight = drawWidth / aspectRatio;
        }
        
        if (!Number.isFinite(drawWidth) || !Number.isFinite(drawHeight) || drawWidth <= 0 || drawHeight <= 0) {
            console.error('Invalid calculated canvas dimensions', { drawWidth, drawHeight, aspectRatio });
            drawWidth = containerWidth > 0 ? containerWidth : 300;
            drawHeight = drawWidth / aspectRatio;
        }

        canvas.width = drawWidth;
        canvas.height = drawHeight;
        
        // Calculate scale factors based on the original image and canvas size
        const scaleX = drawWidth / originalWidth;
        const scaleY = drawHeight / originalHeight;
        
        if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) {
             console.error('Invalid scale factors', { scaleX, scaleY, originalWidth, originalHeight });
             setScaleFactors({ x: 1, y: 1 });
        } else {
             console.log("Set scale factors:", scaleX, scaleY);
             setScaleFactors({ x: scaleX, y: scaleY });
        }
        
        imageRef.current = img;
        setImageLoading(false);
        
        // Use setTimeout to ensure state updates are complete before redraw
        setTimeout(() => {
          if (isMounted) {
            redrawCanvas();
          }
        }, 50);
      };

      img.onerror = () => {
        console.error("Failed to load image:", selectedImage.url);
        if (isMounted) {
            imageRef.current = null;
            setImageLoading(false);
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
  }, [selectedImage, characterMappings, selectedMapping, drawPolygon]);

  // Add useEffect to handle redrawing when needed
  useEffect(() => {
    if (canvasRef.current && imageRef.current) {
      redrawCanvas();
    }
  }, [
    isDrawing, 
    isResizing,
    selectedMapping, 
    isPolygonMode,
    startPoint, 
    endPoint,
    polygonPoints,
    scaleFactors,
    redrawCanvas
  ]);

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

  // Check if a point is inside a mapping using canvas coordinates
  const checkExistingMapping = (x: number, y: number): string | null => {
    if (!selectedImage || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const imgWidth = selectedImage.width || (imageRef.current?.naturalWidth || 0);
    const imgHeight = selectedImage.height || (imageRef.current?.naturalHeight || 0);
    
    // Scale factors to convert between stored and canvas coordinates
    const scaleX = canvas.width / imgWidth;
    const scaleY = canvas.height / imgHeight;
    
    for (const mapping of characterMappings.filter(m => m.sourceImageId === selectedImage.id)) {
      if (mapping.isPolygon && mapping.polygonPoints) {
        // Convert polygon points to canvas coordinates
        const scaledPoints = mapping.polygonPoints.map(p => ({
          x: p.x * scaleX,
          y: p.y * scaleY
        }));
        
        if (isPointInPolygon(x, y, scaledPoints)) {
          return mapping.id;
        }
      } else {
        // Rectangle check
        const rectX = mapping.x1 * scaleX;
        const rectY = mapping.y1 * scaleY;
        const rectW = (mapping.x2 - mapping.x1) * scaleX;
        const rectH = (mapping.y2 - mapping.y1) * scaleY;
        
        if (x >= rectX && x <= rectX + rectW && y >= rectY && y <= rectY + rectH) {
          return mapping.id;
        }
      }
    }
    
    return null;
  };

  // Check if a point is inside a polygon
  const isPointInPolygon = (x: number, y: number, polygon: {x: number, y: number}[]): boolean => {
    if (polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      
      const intersect = ((yi > y) !== (yj > y)) && 
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  // Completely reimplemented coordinate mapping functions
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    
    // Get precise mouse coordinates relative to canvas element
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to canvas coordinate space accounting for any scaling
    // This is critical when the canvas display size differs from canvas internal dimensions
    const canvasX = mouseX * (canvas.width / rect.width);
    const canvasY = mouseY * (canvas.height / rect.height);
    
    console.log(`Mouse click - screen: ${e.clientX},${e.clientY} canvas: ${canvasX},${canvasY}`);
    return { x: canvasX, y: canvasY };
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedImage || !canvasRef.current) return;
    
    // Get the raw canvas coordinates where the user clicked
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to internal canvas coordinates
    const canvasX = x * (canvas.width / rect.width);
    const canvasY = y * (canvas.height / rect.height);
    
    console.log(`Click at (${canvasX}, ${canvasY})`);
    
    // Handle polygon mode
    if (isPolygonMode) {
      if (isAddingPoints) {
        // Add point to the polygon
        setPolygonPoints(prev => [...prev, { x: canvasX, y: canvasY }]);
        redrawCanvas();
      } else if (selectedPointIndex !== null) {
        setSelectedPointIndex(null);
      } else {
        // Check if clicked on an existing polygon point (for moving)
        for (let i = 0; i < polygonPoints.length; i++) {
          const point = polygonPoints[i];
          const distance = Math.sqrt(
            Math.pow(point.x - canvasX, 2) + 
            Math.pow(point.y - canvasY, 2)
          );
          
          if (distance < 15) { // Larger hit area for easier selection
            setSelectedPointIndex(i);
            break;
          }
        }
      }
      return;
    }
    
    // Handle regular rectangle mode
    const point = { x: canvasX, y: canvasY };
    
    // Check if clicked on existing mapping
    const mappingId = checkExistingMapping(point.x, point.y);
    if (mappingId) {
      setSelectedMapping(mappingId);
      
      // Check if it's a polygon mapping and load those points
      const mapping = characterMappings.find(m => m.id === mappingId);
      if (mapping?.isPolygon && mapping.polygonPoints && mapping.polygonPoints.length > 0) {
        // Get scale factors to convert stored points to canvas coordinates
        const imgWidth = selectedImage.width || (imageRef.current?.naturalWidth || 0);
        const imgHeight = selectedImage.height || (imageRef.current?.naturalHeight || 0);
        const scaleX = canvas.width / imgWidth;
        const scaleY = canvas.height / imgHeight;
        
        // Convert normalized points to canvas coordinates
        const canvasPoints = mapping.polygonPoints.map(p => ({
          x: p.x * scaleX,
          y: p.y * scaleY
        }));
        
        setPolygonPoints(canvasPoints);
        setIsPolygonMode(true);
        setIsAddingPoints(false);
      }
    } else if (selectedMapping) {
      setSelectedMapping(null);
    } else if (selectedChar) {
      // Start drawing a selection rectangle
      setStartPoint(point);
      setEndPoint(point);
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    // Get the raw canvas coordinates
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert to internal canvas coordinates
    const canvasX = x * (canvas.width / rect.width);
    const canvasY = y * (canvas.height / rect.height);
    
    const point = { x: canvasX, y: canvasY };
    
    // Handle polygon mode - moving points
    if (isPolygonMode && selectedPointIndex !== null) {
      const newPoints = [...polygonPoints];
      newPoints[selectedPointIndex] = point;
      setPolygonPoints(newPoints);
      redrawCanvas();
      return;
    }
    
    // Handle rectangle drawing
    if (isDrawing) {
      setEndPoint(point);
      redrawCanvas();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // For polygon mode, just release selected point
    if (isPolygonMode) {
      setSelectedPointIndex(null);
      return;
    }
    
    // For rectangle mode, finish drawing
    if (!isDrawing || !canvasRef.current || !selectedChar || !currentImageId) {
      setIsDrawing(false);
      return;
    }
    
    setIsDrawing(false);
    
    // Only create mapping if rectangle is big enough
    if (Math.abs(startPoint.x - endPoint.x) > 5 && Math.abs(startPoint.y - endPoint.y) > 5) {
      const canvas = canvasRef.current;
      const imgWidth = selectedImage?.width || (imageRef.current?.naturalWidth || 0);
      const imgHeight = selectedImage?.height || (imageRef.current?.naturalHeight || 0);
      
      // Convert canvas coordinates to normalized image coordinates
      const normX1 = Math.min(startPoint.x, endPoint.x) / canvas.width * imgWidth;
      const normY1 = Math.min(startPoint.y, endPoint.y) / canvas.height * imgHeight;
      const normX2 = Math.max(startPoint.x, endPoint.x) / canvas.width * imgWidth;
      const normY2 = Math.max(startPoint.y, endPoint.y) / canvas.height * imgHeight;
      
      addCharacterMapping({
        sourceImageId: currentImageId,
        char: selectedChar,
        x1: normX1,
        y1: normY1,
        x2: normX2,
        y2: normY2,
        originalImageWidth: imgWidth,
        originalImageHeight: imgHeight
      });
      
      toast.success(`Mapped character '${selectedChar}'`);
      selectNextUnmappedChar();
    }
    
    redrawCanvas();
  };

  // Save polygon mapping
  const savePolygon = () => {
    if (polygonPoints.length < 3 || !selectedChar || !currentImageId || !canvasRef.current) {
      toast.error("Need at least 3 points and a selected character to create a polygon mapping");
      return;
    }
    
    const canvas = canvasRef.current;
    const imgWidth = selectedImage?.width || (imageRef.current?.naturalWidth || 0);
    const imgHeight = selectedImage?.height || (imageRef.current?.naturalHeight || 0);
    
    // Convert canvas points to normalized coordinates for storage
    const normalizedPoints = polygonPoints.map(p => ({
      x: p.x / canvas.width * imgWidth,
      y: p.y / canvas.height * imgHeight
    }));
    
    // Calculate bounding box
    const { minX, minY, maxX, maxY } = calculateBoundingBox(normalizedPoints);
    
    // Create the mapping
    addCharacterMapping({
      sourceImageId: currentImageId,
      char: selectedChar,
      x1: minX,
      y1: minY,
      x2: maxX,
      y2: maxY,
      originalImageWidth: imgWidth,
      originalImageHeight: imgHeight,
      isPolygon: true,
      polygonPoints: normalizedPoints
    });
    
    toast.success(`Mapped character '${selectedChar}' with polygon`);
    
    // Reset state
    const nextChar = selectNextUnmappedChar();
    if (nextChar) {
      setPolygonPoints([]);
    } else {
      setIsPolygonMode(false);
      setPolygonPoints([]);
      setIsAddingPoints(false);
    }
  };

  // Handle character selection
  const handleCharSelect = (char: string) => {
    if (selectedChar === char) {
      setSelectedChar(null);
    } else {
      setSelectedChar(char);
      setSelectedMapping(null);
      redrawCanvas();
      
      toast(`Selected character: ${char}`, {
        position: "top-center",
        duration: 2000,
      });
    }
  };

  // Select next unmapped character
  const selectNextUnmappedChar = () => {
    if (unmappedChars.size > 0) {
      const nextChar = Array.from(unmappedChars)[0];
      setSelectedChar(nextChar);
      return nextChar;
    }
    return null;
  };

  // Handle character deletion
  const handleCharDelete = (mappingId: string) => {
    removeCharacterMapping(mappingId);
    if (selectedMapping === mappingId) {
      setSelectedMapping(null);
    }
    redrawCanvas();
  };

  // Toggle polygon mode
  const togglePolygonMode = () => {
    // If switching from polygon to rectangle mode
    if (isPolygonMode) {
      if (polygonPoints.length > 0 && selectedChar) {
        if (confirm("You have unsaved polygon points. Save them before switching modes?")) {
          savePolygon();
        } else {
          setPolygonPoints([]);
        }
      }
      setIsPolygonMode(false);
      setIsAddingPoints(false);
    } else {
      // Switching from rectangle to polygon mode
      setIsPolygonMode(true);
      setIsAddingPoints(true);
      setPolygonPoints([]);
      if (selectedMapping) {
        setSelectedMapping(null);
      }
    }
    // Force a redraw after mode change
    setTimeout(redrawCanvas, 50);
  };

  // Auto detection handler
  const toggleAutoDetection = () => {
    setShowAutoDetection(!showAutoDetection);
  };
  
  const handleAutoMappedCharacters = (mappings: Record<string, any>) => {
    Object.entries(mappings).forEach(([char, mapping]) => {
      const newMapping: Omit<CharacterMapping, 'id'> = {
        sourceImageId: currentImageId || '',
        char,
        x1: mapping.x,
        y1: mapping.y,
        x2: mapping.x + mapping.width,
        y2: mapping.y + mapping.height,
        isPolygon: mapping.contour ? true : false,
        polygonPoints: mapping.contour
      };
      
      addCharacterMapping(newMapping);
    });
    
    setShowAutoDetection(false);
    
    toast.success(`Added ${Object.keys(mappings).length} character mappings`);
  };

  if (sourceImages.length === 0 || !sourceImages.some(img => img.selected)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded mb-6">
        <p>Please select at least one image from the previous step before mapping characters.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Character Mapping</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={prevImage} disabled={sourceImages.length <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Image {sourceImages.length > 0 ? currentImageIndex + 1 : 0} of {sourceImages.length}
          </span>
          <Button variant="outline" size="sm" onClick={nextImage} disabled={sourceImages.length <= 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAutoDetection}
            className={showAutoDetection ? "bg-blue-100" : ""}
            title="Toggle automatic character detection"
          >
            <Wand2 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Auto Detect</span>
          </Button>
        </div>
      </div>

      {showAutoDetection && selectedImage && (
        <AutoCharacterMapper 
          imageUrl={selectedImage.url} 
          onCharactersMapped={handleAutoMappedCharacters}
          onCancel={() => setShowAutoDetection(false)}
        />
      )}
      
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
                                  const mappingForChar = characterMappings.find((m: CharacterMapping) => m.char === char);
                                  const isMapped = !!mappingForChar;
                                  const isCharMappedInCurrentImage = !!characterMappings.find((m: CharacterMapping) => m.char === char && m.sourceImageId === currentImageId);
                                  const isSelected = selectedChar === char;

                                  let buttonClasses = "h-12 w-12 font-medium text-lg flex items-center justify-center"; 

                                  if (isSelected) {
                                      buttonClasses += " bg-blue-500 border-blue-600 text-white font-bold shadow-md scale-110 z-10";
                                  } else if (isMapped) {
                                      if (isCharMappedInCurrentImage) {
                                          buttonClasses += " border-green-500 border-2 bg-green-50 text-green-800 hover:bg-red-100 hover:border-red-500 hover:text-red-700";
                                      } else {
                                          buttonClasses += " border-blue-500 border-2 bg-blue-50 text-blue-800";
                                      }
                                  } else {
                                      buttonClasses += " bg-white border-gray-300 text-gray-900";
                                  }

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
                                                    if (isSelected) {
                                                        setSelectedChar(null);
                                                    }
                                                    const mappingToRemove = characterMappings.find((m: CharacterMapping) => m.char === char && m.sourceImageId === currentImageId);
                                                    if (mappingToRemove) {
                                                      removeCharacterMapping(mappingToRemove.id);
                                                      if (selectedMapping === mappingToRemove.id) {
                                                          setSelectedMapping(null);
                                                      }
                                                    }
                                                } else if (isMapped && !isCharMappedInCurrentImage) {
                                                    if (mappingForChar) {
                                                      const mappedImageIndex = sourceImages.findIndex(img => img.id === mappingForChar.sourceImageId);
                                                      const imageNumber = mappedImageIndex >= 0 ? mappedImageIndex + 1 : '?';
                                                      
                                                      toast.warning(`Character '${char}' is already mapped in Image ${imageNumber}`, {
                                                        description: "Switch to that image to modify it.",
                                                        duration: 4000,
                                                        id: `char-${char}-mapped`,
                                                      });
                                                    }
                                                } else {
                                                    handleCharSelect(char);
                                                }
                                            }}
                                            disabled={(isMapped && !isCharMappedInCurrentImage) || 
                                                     (isCharMappedInCurrentImage && selectedChar !== null && selectedChar !== char)}
                                            className={buttonClasses}
                                            title={tooltipContent}
                                        >
                                            <span className="text-2xl">{char}</span>
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
                <div className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm border border-gray-200 flex gap-2">
                  <Button
                    size="sm"
                    variant={isPolygonMode ? "primary" : "outline"}
                    onClick={togglePolygonMode}
                    className="flex items-center gap-1"
                    title={isPolygonMode ? "Switch to rectangle mode" : "Switch to polygon mode"}
                  >
                    {isPolygonMode ? "Polygon Mode" : "Rectangle Mode"}
                  </Button>
                  
                  {isPolygonMode && (
                    <>
                      <Button
                        size="sm"
                        variant={isAddingPoints ? "primary" : "outline"}
                        onClick={() => setIsAddingPoints(!isAddingPoints)}
                        title={isAddingPoints ? "Stop adding points" : "Add points"}
                      >
                        {isAddingPoints ? "Stop Adding" : "Add Points"}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (polygonPoints.length > 0 && confirm("Clear all polygon points?")) {
                            setPolygonPoints([]);
                          }
                        }}
                        disabled={polygonPoints.length === 0}
                        title="Clear all polygon points"
                      >
                        Clear
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={savePolygon}
                        disabled={polygonPoints.length < 3 || !selectedChar}
                        title="Save polygon mapping"
                      >
                        Save
                      </Button>
                    </>
                  )}
                </div>
                
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    if (isDrawing) {
                      setIsDrawing(false);
                      redrawCanvas();
                    }
                  }}
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

      <div className="mt-4 text-sm text-gray-500 mb-2">
        <p>
          {showAutoDetection ? 
            "Using automatic detection mode. The system will try to detect individual characters in your image." : 
            isPolygonMode ? 
              "Click to add points to your polygon. Click the first point to close the shape." : 
              "Select a character, then drag on the image to map it. Click an existing mapping to edit or delete it."
          }
        </p>
      </div>
    </div>
  );
};

export default CharacterMapper; 