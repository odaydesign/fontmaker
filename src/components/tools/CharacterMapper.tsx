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

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      const img = new window.Image();
      
      img.onload = () => {
        const container = imageContainerRef.current;
        if (!container) return;
        
        const containerWidth = container.clientWidth;
        
        if (!selectedImage.width || !selectedImage.height) {
          sourceImages.forEach(image => {
            if (image.id === selectedImage.id) {
              image.width = img.naturalWidth;
              image.height = img.naturalHeight;
            }
          });
        }
        
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = containerWidth;
        let drawHeight = containerWidth / aspectRatio;
        
        canvas.width = drawWidth;
        canvas.height = drawHeight;
        
        const scaleX = drawWidth / (selectedImage.width || img.naturalWidth);
        const scaleY = drawHeight / (selectedImage.height || img.naturalHeight);
        setScaleFactors({ x: scaleX, y: scaleY });
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
        
        if (isDrawing || isResizing) {
          drawSelectionRect(ctx, scaleX, scaleY);
        }
        
        drawExistingMappings(ctx, scaleX, scaleY);
        
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
    
    scaledPoints.forEach((point, index) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      
      if (index === selectedPointIndex) {
        ctx.fillStyle = 'rgba(245, 66, 66, 0.9)';
      } else {
        ctx.fillStyle = isSelected ? 'rgba(62, 116, 245, 0.9)' : 'rgba(16, 185, 129, 0.9)';
      }
      
      ctx.fill();
    });
    
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
    
    characterMappings
      .filter((mapping: CharacterMapping) => mapping.sourceImageId === selectedImage.id && mapping.id !== selectedMapping)
      .forEach((mapping: CharacterMapping) => {
        if (mapping.isPolygon && mapping.polygonPoints) {
          drawPolygon(ctx, mapping.polygonPoints, scaleX, scaleY);
          
          if (mapping.char && mapping.polygonPoints.length > 0) {
            const firstPoint = mapping.polygonPoints[0];
            ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.font = '12px sans-serif';
            ctx.fillText(mapping.char, firstPoint.x * scaleX + 2, firstPoint.y * scaleY + 12);
          }
        } else {
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
        }
      });
  }, [characterMappings, selectedImage, selectedMapping, drawPolygon]);

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

    if (isPolygonMode) {
      drawCurrentPolygon(ctx, scaleX, scaleY);
    } else {
      if (selectedMapping) {
        const mapping = characterMappings.find(m => m.id === selectedMapping);
        if (mapping) {
          if (mapping.isPolygon && mapping.polygonPoints) {
            drawPolygon(ctx, mapping.polygonPoints, scaleX, scaleY, true);
            
            if (mapping.char && mapping.polygonPoints.length > 0) {
              const firstPoint = mapping.polygonPoints[0];
              ctx.fillStyle = 'rgba(62, 116, 245, 0.9)';
              ctx.font = '12px sans-serif';
              ctx.fillText(mapping.char, firstPoint.x * scaleX + 2, firstPoint.y * scaleY + 12);
            }
          } else {
            drawSelectedMapping(ctx, mapping, scaleX, scaleY);
          }
        }
      }

      if (isDrawing) {
        drawSelectionRect(ctx, scaleX, scaleY);
      }
    }
  }, [
    isDrawing, 
    selectedMapping, 
    characterMappings, 
    scaleFactors,
    drawExistingMappings, 
    drawSelectedMapping, 
    drawSelectionRect,
    isPolygonMode,
    drawCurrentPolygon,
    drawPolygon
  ]);

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
    const image = imageRef.current;

    if (!image || rect.width === 0 || rect.height === 0) {
      console.warn("Cannot calculate canvas point accurately: Image or canvas dimensions missing.");
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    const originalWidth = image.naturalWidth;
    const originalHeight = image.naturalHeight;
    
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const x = offsetX * (originalWidth / rect.width);
    const y = offsetY * (originalHeight / rect.height);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
        console.warn("Calculated canvas point is not finite.", { x, y, offsetX, offsetY, originalWidth, originalHeight, rectWidth: rect.width, rectHeight: rect.height });
        return { x: 0, y: 0 };
    }

    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedImage) return;
    
    const { x, y } = getCanvasPoint(e, canvas);
    
    if (isPolygonMode) {
      if (isAddingPoints) {
        setPolygonPoints([...polygonPoints, { x, y }]);
      } else {
        const pointIndex = polygonPoints.findIndex(point => 
          Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2)) < 10
        );
        
        if (pointIndex !== -1) {
          setSelectedPointIndex(pointIndex);
        } else {
          setSelectedPointIndex(null);
          
          const mappingId = checkExistingMapping(x, y);
          if (mappingId) {
            setSelectedMapping(mappingId);
            const mapping = characterMappings.find(m => m.id === mappingId);
            if (mapping?.isPolygon && mapping.polygonPoints) {
              setPolygonPoints(mapping.polygonPoints);
              setIsPolygonMode(true);
            }
          } else if (selectedMapping) {
            setSelectedMapping(null);
          } else if (!selectedChar) {
            setStartPoint({ x, y });
            setEndPoint({ x, y });
            setIsDrawing(true);
          }
        }
      }
      
      redrawCanvas();
      return;
    }
    
    if (selectedMapping) {
      const mapping = characterMappings.find(m => m.id === selectedMapping);
      if (mapping) {
        const rect = { 
          startX: mapping.x1, 
          startY: mapping.y1, 
          endX: mapping.x2, 
          endY: mapping.y2 
        };
        
        const handle = getResizeHandle(x, y, rect);
        
        if (handle !== ResizeHandle.None) {
          setActiveHandle(handle);
          setIsResizing(true);
          setLastMousePosition({ x, y });
          return;
        }
      }
    }
    
    const mappingId = checkExistingMapping(x, y);
    if (mappingId) {
      setSelectedMapping(mappingId);
    } else if (selectedMapping) {
      setSelectedMapping(null);
    } else if (selectedChar) {
      setStartPoint({ x, y });
      setEndPoint({ x, y });
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const point = getCanvasPoint(e, canvas);
    
    if (isPolygonMode) {
      if (selectedPointIndex !== null) {
        const newPoints = [...polygonPoints];
        newPoints[selectedPointIndex] = point;
        setPolygonPoints(newPoints);
        redrawCanvas();
      }
      return;
    }
    
    if (isDrawing) {
      setEndPoint(point);
      redrawCanvas();
    } else if (isResizing && selectedMapping) {
    }
  };

  const handleMouseUp = () => {
    if (isPolygonMode) {
      setSelectedPointIndex(null);
      redrawCanvas();
      return;
    }
    
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

  useEffect(() => {
    toast.info("Character mapper initialized", {
      description: "Click a mapped character to unmap it",
      duration: 3000,
    });
  }, []);

  const handleAutoMappedCharacters = (mappings: Record<string, any>) => {
    Object.entries(mappings).forEach(([char, mapping]) => {
      const newMapping: CharacterMapping = {
        id: `${Date.now()}_${char}`,
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
  
  const toggleAutoDetection = () => {
    setShowAutoDetection(!showAutoDetection);
  };
  
  useEffect(() => {
    setShowAutoDetection(false);
  }, [currentImageId]);

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
                    onClick={() => {
                      setIsPolygonMode(!isPolygonMode);
                      if (!isPolygonMode) {
                        if (selectedMapping) {
                          const mapping = characterMappings.find(m => m.id === selectedMapping);
                          if (mapping) {
                            const { x1, y1, x2, y2 } = mapping;
                            setPolygonPoints([
                              { x: x1, y: y1 },
                              { x: x2, y: y1 },
                              { x: x2, y: y2 },
                              { x: x1, y: y2 }
                            ]);
                          }
                        } else {
                          setPolygonPoints([]);
                        }
                        setIsAddingPoints(true);
                      } else {
                        setIsAddingPoints(false);
                      }
                    }}
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
                        onClick={() => {
                          if (polygonPoints.length > 2 && selectedChar && currentImageId) {
                            const boundingBox = calculateBoundingBox(polygonPoints);
                            const newMapping: CharacterMapping = {
                              id: `map_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                              sourceImageId: currentImageId,
                              char: selectedChar,
                              x1: boundingBox.minX,
                              y1: boundingBox.minY,
                              x2: boundingBox.maxX,
                              y2: boundingBox.maxY,
                              polygonPoints: [...polygonPoints],
                              isPolygon: true
                            };
                            addCharacterMapping(newMapping);
                            setSelectedMapping(newMapping.id);
                            setSelectedChar(null);
                            setPolygonPoints([]);
                            setIsAddingPoints(false);
                          } else {
                            toast.error("Need at least 3 points and a selected character to create a polygon mapping");
                          }
                        }}
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