'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useFont } from '@/context/FontContext';
import { Loader2, Trash2, Plus, Wand2, Save, Grid3x3, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface DetectedCharacter {
  id: string;
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sourceImageId: string;
  croppedImageUrl?: string;
}

interface Point {
  x: number;
  y: number;
}

const CharacterMappingOverview: React.FC = () => {
  const {
    sourceImages,
    characterMappings,
    addCharacterMapping,
    removeCharacterMapping,
    updateCharacterMapping
  } = useFont();

  const selectedImages = sourceImages.filter(img => img.selected);

  // View state
  const [viewMode, setViewMode] = useState<'canvas' | 'grid'>('canvas');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Detection state
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedChars, setDetectedChars] = useState<DetectedCharacter[]>([]);

  // Canvas editor state
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [isDrawingNew, setIsDrawingNew] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [editCharValue, setEditCharValue] = useState('');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState<number | null>(null);
  const [hoveredMappingId, setHoveredMappingId] = useState<string | null>(null);

  // Floating toolbar state
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Initialize with first selected image
  useEffect(() => {
    if (!selectedImageId && selectedImages.length > 0) {
      setSelectedImageId(selectedImages[0].id);
    }
  }, [selectedImageId, selectedImages]);

  // Convert existing characterMappings to detectedChars format for grid view
  useEffect(() => {
    if (characterMappings.length > 0 && detectedChars.length === 0) {
      const converted: DetectedCharacter[] = characterMappings.map(mapping => ({
        id: mapping.id,
        char: mapping.char,
        x: mapping.x1,
        y: mapping.y1,
        width: mapping.x2 - mapping.x1,
        height: mapping.y2 - mapping.y1,
        sourceImageId: mapping.sourceImageId
      }));
      setDetectedChars(converted);
    }
  }, [characterMappings, detectedChars.length]);

  const detectCharacters = useCallback(async () => {
    if (selectedImages.length === 0) {
      toast.error('No images selected. Please select images first.');
      return;
    }

    setIsDetecting(true);
    const allDetected: DetectedCharacter[] = [];

    try {
      toast.info(`Detecting characters in ${selectedImages.length} image(s)...`);

      for (const image of selectedImages) {
        try {
          const response = await fetch('/api/characters/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrl: image.url,
              imageId: image.id
            }),
          });

          if (!response.ok) continue;

          const data = await response.json();

          if (data.detectedCharacters && data.detectedCharacters.length > 0) {
            const charPriority = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?:;()[]{}"\'/\\@#$%&*+-=<>_';
            const existingChars = new Set(allDetected.map(d => d.char));

            data.detectedCharacters.forEach((detected: any, index: number) => {
              let assignedChar = charPriority[allDetected.length % charPriority.length];
              for (let i = 0; i < charPriority.length; i++) {
                if (!existingChars.has(charPriority[i])) {
                  assignedChar = charPriority[i];
                  existingChars.add(assignedChar);
                  break;
                }
              }

              const detectedChar: DetectedCharacter = {
                id: `${image.id}_char_${index}`,
                char: assignedChar,
                x: detected.x,
                y: detected.y,
                width: detected.width,
                height: detected.height,
                sourceImageId: image.id,
                croppedImageUrl: detected.croppedImageUrl
              };

              allDetected.push(detectedChar);

              addCharacterMapping({
                sourceImageId: image.id,
                char: assignedChar,
                x1: detected.x,
                y1: detected.y,
                x2: detected.x + detected.width,
                y2: detected.y + detected.height,
                originalImageWidth: image.width,
                originalImageHeight: image.height,
                isPolygon: false
              });
            });
          }
        } catch (error) {
          console.warn(`Error processing image ${image.id}:`, error);
        }
      }

      if (allDetected.length > 0) {
        setDetectedChars(allDetected);
        toast.success(`✅ Detected ${allDetected.length} characters!`);
      } else {
        toast.error('No characters detected. Try manual mapping.');
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Detection failed. Please try manual mapping.');
    } finally {
      setIsDetecting(false);
    }
  }, [selectedImages, addCharacterMapping]);

  const handleRedetect = () => {
    characterMappings.forEach(m => removeCharacterMapping(m.id));
    setDetectedChars([]);
    setSelectedMappingId(null);
    detectCharacters();
  };

  // Get all mappings for current image
  const getCurrentImageMappings = useCallback(() => {
    if (!selectedImageId) return [];
    return characterMappings.filter(m => m.sourceImageId === selectedImageId);
  }, [selectedImageId, characterMappings]);

  // Get selected mapping details
  const getSelectedMapping = useCallback(() => {
    if (!selectedMappingId) return null;
    return characterMappings.find(m => m.id === selectedMappingId);
  }, [selectedMappingId, characterMappings]);

  // Check if a point is inside a polygon
  const isPointInPolygon = (point: Point, polygonPts: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = polygonPts.length - 1; i < polygonPts.length; j = i++) {
      const xi = polygonPts[i].x, yi = polygonPts[i].y;
      const xj = polygonPts[j].x, yj = polygonPts[j].y;

      const intersect = ((yi > point.y) !== (yj > point.y))
        && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Check if a point is inside a rectangle mapping
  const isPointInMapping = (point: Point, mapping: any): boolean => {
    if (mapping.polygonPoints && mapping.polygonPoints.length > 0) {
      return isPointInPolygon(point, mapping.polygonPoints);
    }
    // Rectangle bounds
    return point.x >= mapping.x1 && point.x <= mapping.x2 &&
           point.y >= mapping.y1 && point.y <= mapping.y2;
  };

  // Find which mapping was clicked
  const findClickedMapping = (point: Point): string | null => {
    const mappings = getCurrentImageMappings();
    // Check in reverse order (top-to-bottom in z-index)
    for (let i = mappings.length - 1; i >= 0; i--) {
      if (isPointInMapping(point, mappings[i])) {
        return mappings[i].id;
      }
    }
    return null;
  };

  // Calculate floating toolbar position
  const updateFloatingToolbarPosition = useCallback((mapping: any) => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;

    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Calculate center of mapping in canvas coordinates
    const centerX = (mapping.x1 + mapping.x2) / 2;
    const centerY = mapping.y2; // Position below the mapping

    // Convert to screen coordinates
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;

    const screenX = centerX * scaleX;
    const screenY = centerY * scaleY + 10; // 10px padding below

    // Position relative to container
    setFloatingToolbarPosition({
      x: screenX,
      y: screenY,
    });
  }, []);

  // Select a mapping for editing
  const selectMapping = (mappingId: string) => {
    const mapping = characterMappings.find(m => m.id === mappingId);
    if (!mapping) return;

    console.log('📝 Selecting mapping:', {
      char: mapping.char,
      hasPolygonPoints: !!mapping.polygonPoints,
      polygonPointsCount: mapping.polygonPoints?.length || 0,
    });

    setSelectedMappingId(mappingId);
    setEditCharValue(mapping.char);
    setIsDrawingNew(false);

    // Load existing polygon points or create from rectangle
    if (mapping.polygonPoints && mapping.polygonPoints.length > 0) {
      setPolygonPoints(mapping.polygonPoints);
    } else {
      // Convert rectangle to 4-point polygon
      setPolygonPoints([
        { x: mapping.x1, y: mapping.y1 },
        { x: mapping.x2, y: mapping.y1 },
        { x: mapping.x2, y: mapping.y2 },
        { x: mapping.x1, y: mapping.y2 },
      ]);
    }

    // Update floating toolbar position
    updateFloatingToolbarPosition(mapping);
  };

  // Start adding new character
  const startAddNewCharacter = () => {
    setIsDrawingNew(true);
    setSelectedMappingId(null);
    setPolygonPoints([]);
    setEditCharValue('');
    setFloatingToolbarPosition(null);
    toast.info('Draw a box around the new character');
  };

  // Delete selected mapping
  const deleteSelectedMapping = () => {
    if (!selectedMappingId) return;

    const mapping = getSelectedMapping();
    if (mapping) {
      removeCharacterMapping(selectedMappingId);
      setDetectedChars(prev => prev.filter(d => d.id !== selectedMappingId));
      toast.success(`Deleted "${mapping.char}"`);
      setSelectedMappingId(null);
      setPolygonPoints([]);
      setEditCharValue('');
      setFloatingToolbarPosition(null);
    }
  };

  // Save changes to selected mapping or create new
  const saveChanges = () => {
    if (polygonPoints.length < 3 || !editCharValue || !selectedImageId) {
      toast.error('Please draw a region and enter a character');
      return;
    }

    const currentImage = sourceImages.find(i => i.id === selectedImageId);
    if (!currentImage) return;

    // Calculate bounding box from polygon
    const xs = polygonPoints.map(p => p.x);
    const ys = polygonPoints.map(p => p.y);
    const x1 = Math.min(...xs);
    const y1 = Math.min(...ys);
    const x2 = Math.max(...xs);
    const y2 = Math.max(...ys);

    console.log('💾 Saving:', {
      char: editCharValue,
      polygonPoints: polygonPoints.length,
      boundingBox: { x1, y1, x2, y2 },
    });

    if (isDrawingNew) {
      // Add new mapping
      const newId = `${selectedImageId}_char_${Date.now()}`;
      addCharacterMapping({
        sourceImageId: selectedImageId,
        char: editCharValue,
        x1,
        y1,
        x2,
        y2,
        originalImageWidth: currentImage.width,
        originalImageHeight: currentImage.height,
        isPolygon: polygonPoints.length > 4,
        polygonPoints: polygonPoints,
      });

      setDetectedChars(prev => [
        ...prev,
        {
          id: newId,
          char: editCharValue,
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
          sourceImageId: selectedImageId,
        },
      ]);

      toast.success(`Added character "${editCharValue}"`);
      setIsDrawingNew(false);
      setPolygonPoints([]);
      setEditCharValue('');
    } else if (selectedMappingId) {
      // Update existing mapping
      updateCharacterMapping(selectedMappingId, {
        char: editCharValue,
        x1,
        y1,
        x2,
        y2,
        polygonPoints: polygonPoints,
        isPolygon: polygonPoints.length > 4,
      });

      setDetectedChars(prev =>
        prev.map(d =>
          d.id === selectedMappingId
            ? {
                ...d,
                char: editCharValue,
                x: x1,
                y: y1,
                width: x2 - x1,
                height: y2 - y1,
              }
            : d
        )
      );

      toast.success(`Updated character "${editCharValue}"`);
    }
  };

  // Canvas drawing functions
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;

    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    const mappings = getCurrentImageMappings();

    // Draw all mappings
    mappings.forEach(mapping => {
      const isSelected = selectedMappingId === mapping.id;
      const isHovered = hoveredMappingId === mapping.id;

      // Skip drawing selected mapping's bounding box if we're editing its polygon
      if (isSelected && polygonPoints.length > 0) return;

      // Draw mapping as rectangle or polygon
      if (mapping.polygonPoints && mapping.polygonPoints.length > 0) {
        ctx.strokeStyle = isSelected ? 'rgba(255, 0, 0, 0.9)' : isHovered ? 'rgba(255, 255, 0, 0.7)' : 'rgba(0, 200, 0, 0.6)';
        ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, 0.15)' : isHovered ? 'rgba(255, 255, 0, 0.1)' : 'rgba(0, 200, 0, 0.1)';
        ctx.lineWidth = isSelected ? 3 : 2;

        ctx.beginPath();
        ctx.moveTo(mapping.polygonPoints[0].x, mapping.polygonPoints[0].y);
        for (let i = 1; i < mapping.polygonPoints.length; i++) {
          ctx.lineTo(mapping.polygonPoints[i].x, mapping.polygonPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
      } else {
        ctx.strokeStyle = isSelected ? 'rgba(255, 0, 0, 0.9)' : isHovered ? 'rgba(255, 255, 0, 0.7)' : 'rgba(0, 200, 0, 0.6)';
        ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, 0.15)' : isHovered ? 'rgba(255, 255, 0, 0.1)' : 'rgba(0, 200, 0, 0.1)';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(mapping.x1, mapping.y1, mapping.x2 - mapping.x1, mapping.y2 - mapping.y1);
        ctx.fillRect(mapping.x1, mapping.y1, mapping.x2 - mapping.x1, mapping.y2 - mapping.y1);
      }

      // Draw character label
      const centerX = (mapping.x1 + mapping.x2) / 2;
      const centerY = (mapping.y1 + mapping.y2) / 2;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(mapping.char, centerX, centerY);
      ctx.fillText(mapping.char, centerX, centerY);
    });

    // Draw current polygon being edited
    if (polygonPoints.length > 0 && (selectedMappingId || isDrawingNew)) {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.fill();

      // Draw edges with hover effect
      for (let i = 0; i < polygonPoints.length; i++) {
        const p1 = polygonPoints[i];
        const p2 = polygonPoints[(i + 1) % polygonPoints.length];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (hoveredEdgeIndex === i) {
          ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
          ctx.lineWidth = 5;
        } else {
          ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
          ctx.lineWidth = 3;
        }
        ctx.stroke();
      }

      // Draw polygon points
      polygonPoints.forEach((point, index) => {
        const isHovered = hoveredPointIndex === index;
        const isDragged = draggedPointIndex === index;

        ctx.fillStyle = isDragged ? 'rgba(255, 255, 0, 1)' : isHovered ? 'rgba(255, 255, 0, 0.8)' : 'white';
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;

        const pointSize = isHovered || isDragged ? 10 : 8;
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      });
    }

    // Draw selection rectangle while drawing
    if (isDrawing && startPoint && endPoint) {
      const x = Math.min(startPoint.x, endPoint.x);
      const y = Math.min(startPoint.y, endPoint.y);
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);

      ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = 'rgba(0, 100, 255, 0.2)';
      ctx.fillRect(x, y, width, height);
      ctx.setLineDash([]);
    }
  }, [selectedImageId, getCurrentImageMappings, selectedMappingId, hoveredMappingId, polygonPoints, isDrawingNew, isDrawing, startPoint, endPoint, hoveredPointIndex, draggedPointIndex, hoveredEdgeIndex]);

  // Load image when selectedImageId changes
  useEffect(() => {
    if (viewMode === 'canvas' && selectedImageId && canvasRef.current) {
      const currentImage = sourceImages.find(i => i.id === selectedImageId);
      if (!currentImage) return;

      const canvas = canvasRef.current;
      const img = new Image();

      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        imageRef.current = img;
        redrawCanvas();
      };

      img.crossOrigin = 'anonymous';
      img.src = currentImage.url;
    }
  }, [viewMode, selectedImageId, sourceImages, redrawCanvas]);

  // Keyboard handler
  useEffect(() => {
    if (viewMode !== 'canvas') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key to remove hovered point
      if ((e.key === 'Delete' || e.key === 'Backspace') && hoveredPointIndex !== null && polygonPoints.length > 3) {
        e.preventDefault();
        const newPoints = polygonPoints.filter((_, i) => i !== hoveredPointIndex);
        setPolygonPoints(newPoints);
        setHoveredPointIndex(null);
        toast.success(`Point deleted! ${newPoints.length} points remaining`);
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedMappingId(null);
        setIsDrawingNew(false);
        setPolygonPoints([]);
        setEditCharValue('');
        setFloatingToolbarPosition(null);
        toast.info('Selection cleared');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, hoveredPointIndex, polygonPoints]);

  // Redraw when state changes
  useEffect(() => {
    if (viewMode === 'canvas') {
      redrawCanvas();
    }
  }, [viewMode, redrawCanvas]);

  // Update floating toolbar position when mapping changes
  useEffect(() => {
    if (selectedMappingId && polygonPoints.length > 0) {
      const mapping = getSelectedMapping();
      if (mapping) {
        // Use polygon points to calculate position if available
        const ys = polygonPoints.map(p => p.y);
        const maxY = Math.max(...ys);
        const xs = polygonPoints.map(p => p.x);
        const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;

        updateFloatingToolbarPosition({
          ...mapping,
          x1: centerX - 50,
          x2: centerX + 50,
          y2: maxY
        });
      }
    } else if (selectedMappingId) {
      const mapping = getSelectedMapping();
      if (mapping) {
        updateFloatingToolbarPosition(mapping);
      }
    }
  }, [selectedMappingId, polygonPoints, getSelectedMapping, updateFloatingToolbarPosition]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getHoveredPoint = (x: number, y: number): number | null => {
    for (let i = 0; i < polygonPoints.length; i++) {
      const point = polygonPoints[i];
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (distance <= 12) return i;
    }
    return null;
  };

  const getHoveredEdge = (x: number, y: number): number | null => {
    if (polygonPoints.length < 2) return null;

    const tolerance = 10;
    for (let i = 0; i < polygonPoints.length; i++) {
      const p1 = polygonPoints[i];
      const p2 = polygonPoints[(i + 1) % polygonPoints.length];

      const A = x - p1.x;
      const B = y - p1.y;
      const C = p2.x - p1.x;
      const D = p2.y - p1.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;

      if (lenSq === 0) continue;

      const param = dot / lenSq;

      let xx, yy;
      if (param < 0) {
        xx = p1.x;
        yy = p1.y;
      } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
      } else {
        xx = p1.x + param * C;
        yy = p1.y + param * D;
      }

      const distance = Math.sqrt((x - xx) ** 2 + (y - yy) ** 2);
      if (distance <= tolerance) return i;
    }
    return null;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // If editing a polygon, check for point/edge interaction
    if (polygonPoints.length > 0 && (selectedMappingId || isDrawingNew)) {
      const pointIndex = getHoveredPoint(coords.x, coords.y);
      if (pointIndex !== null) {
        setDraggedPointIndex(pointIndex);
        return;
      }

      const edgeIndex = getHoveredEdge(coords.x, coords.y);
      if (edgeIndex !== null) {
        const newPoints = [...polygonPoints];
        newPoints.splice(edgeIndex + 1, 0, coords);
        setPolygonPoints(newPoints);
        setDraggedPointIndex(edgeIndex + 1);
        toast.success('Point added! Drag to adjust');
        return;
      }
    }

    // If drawing new character, start rectangle
    if (isDrawingNew) {
      setIsDrawing(true);
      setStartPoint(coords);
      setEndPoint(coords);
      return;
    }

    // Otherwise, check if clicking on a mapping to select it
    const clickedMappingId = findClickedMapping(coords);
    if (clickedMappingId) {
      if (clickedMappingId === selectedMappingId) {
        // Clicking on already selected mapping - do nothing or deselect
        return;
      }
      selectMapping(clickedMappingId);
    } else {
      // Clicked on empty space - deselect
      setSelectedMappingId(null);
      setPolygonPoints([]);
      setEditCharValue('');
      setFloatingToolbarPosition(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Dragging a point
    if (draggedPointIndex !== null) {
      const newPoints = [...polygonPoints];
      newPoints[draggedPointIndex] = coords;
      setPolygonPoints(newPoints);
      return;
    }

    // Drawing rectangle
    if (isDrawing) {
      setEndPoint(coords);
      return;
    }

    // Update hover states for points/edges when editing
    if (polygonPoints.length > 0 && (selectedMappingId || isDrawingNew)) {
      const pointIndex = getHoveredPoint(coords.x, coords.y);
      setHoveredPointIndex(pointIndex);

      if (pointIndex === null) {
        const edgeIndex = getHoveredEdge(coords.x, coords.y);
        setHoveredEdgeIndex(edgeIndex);
      } else {
        setHoveredEdgeIndex(null);
      }
    } else {
      // Check which mapping is being hovered
      const hoveredId = findClickedMapping(coords);
      setHoveredMappingId(hoveredId);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    // Finish dragging point
    if (draggedPointIndex !== null) {
      setDraggedPointIndex(null);
      return;
    }

    // Finish drawing rectangle
    if (isDrawing && startPoint) {
      setIsDrawing(false);
      const x1 = Math.min(startPoint.x, coords.x);
      const y1 = Math.min(startPoint.y, coords.y);
      const x2 = Math.max(startPoint.x, coords.x);
      const y2 = Math.max(startPoint.y, coords.y);

      if (Math.abs(x2 - x1) > 10 && Math.abs(y2 - y1) > 10) {
        setPolygonPoints([
          { x: x1, y: y1 },
          { x: x2, y: y1 },
          { x: x2, y: y2 },
          { x: x1, y: y2 },
        ]);
        toast.success('Rectangle created! Click edges to add points, drag to adjust');
      }
      setStartPoint(null);
      setEndPoint(null);
    }
  };

  // Grid View
  if (viewMode === 'grid') {
    return (
      <div className="space-y-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Character Mappings - Grid View</h2>
              <p className="text-sm text-gray-600 mt-1">
                {detectedChars.length} character(s) mapped
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => setViewMode('canvas')}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Canvas View
              </Button>
            </div>
          </div>

          {detectedChars.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {detectedChars.map(char => {
                const sourceImage = sourceImages.find(img => img.id === char.sourceImageId);
                return (
                  <div
                    key={char.id}
                    className="border-2 border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-all bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedImageId(char.sourceImageId);
                      selectMapping(char.id);
                      setViewMode('canvas');
                    }}
                  >
                    <div className="bg-white border rounded mb-3 p-3 h-32 flex items-center justify-center">
                      {char.croppedImageUrl ? (
                        <img
                          src={char.croppedImageUrl}
                          alt={`Character ${char.char}`}
                          className="max-h-28 max-w-full object-contain"
                        />
                      ) : sourceImage ? (
                        <div
                          className="relative w-full h-full bg-center bg-no-repeat bg-contain"
                          style={{
                            backgroundImage: `url(${sourceImage.url})`,
                            backgroundPosition: `${-char.x}px ${-char.y}px`,
                            backgroundSize: `${sourceImage.width}px ${sourceImage.height}px`
                          }}
                        />
                      ) : (
                        <div className="text-4xl font-bold text-gray-400">{char.char}</div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-gray-800 text-center">{char.char}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Canvas View (Default)
  if (selectedImages.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg text-center">
        <p className="font-medium">No images selected</p>
        <p className="text-sm mt-2">Please go back and select at least one image to continue.</p>
      </div>
    );
  }

  const currentImageMappings = getCurrentImageMappings();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            {/* Image Selector */}
            {selectedImages.length > 1 && (
              <select
                value={selectedImageId || ''}
                onChange={(e) => {
                  setSelectedImageId(e.target.value);
                  setSelectedMappingId(null);
                  setPolygonPoints([]);
                  setEditCharValue('');
                  setIsDrawingNew(false);
                }}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                {selectedImages.map(img => (
                  <option key={img.id} value={img.id}>
                    Image {selectedImages.indexOf(img) + 1}
                  </option>
                ))}
              </select>
            )}

            {/* Character Input */}
            {(selectedMappingId || isDrawingNew) && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Character:</label>
                <input
                  type="text"
                  value={editCharValue}
                  onChange={(e) => setEditCharValue(e.target.value.slice(0, 1))}
                  placeholder="?"
                  maxLength={1}
                  className="w-16 px-3 py-2 border rounded-lg text-center text-xl font-bold"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Detection */}
            {currentImageMappings.length === 0 && !isDetecting && (
              <Button
                variant="default"
                size="sm"
                onClick={detectCharacters}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Auto-Detect
              </Button>
            )}

            {currentImageMappings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedetect}
                disabled={isDetecting}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Re-detect
              </Button>
            )}

            {/* Add New */}
            <Button
              variant="default"
              size="sm"
              onClick={startAddNewCharacter}
              disabled={isDrawingNew}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>

            {/* Delete */}
            {selectedMappingId && (
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedMapping}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}

            {/* Save */}
            {(selectedMappingId || isDrawingNew) && polygonPoints.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={saveChanges}
                disabled={!editCharValue}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}

            {/* Grid View Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4 mr-2" />
              Grid View
            </Button>
          </div>
        </div>

        {/* Status Message */}
        <div className="mt-3 text-sm text-gray-600">
          {isDetecting ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Detecting characters...</span>
            </div>
          ) : isDrawingNew ? (
            <span>🎨 Draw a box around the new character</span>
          ) : selectedMappingId ? (
            <span>✏️ Editing: Click edges to add points, drag to adjust, hover+Delete to remove</span>
          ) : currentImageMappings.length > 0 ? (
            <span>📍 {currentImageMappings.length} character(s) mapped. Click any to edit, or Add New</span>
          ) : (
            <span>👆 Click "Auto-Detect" to start, or "Add New" to manually add characters</span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-white border rounded-lg p-4">
        <div
          ref={canvasContainerRef}
          className="border rounded-lg overflow-hidden bg-gray-100 relative"
        >
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          />

          {/* Floating Toolbar */}
          {selectedMappingId && floatingToolbarPosition && (
            <div
              className="absolute z-50 flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-2xl border border-gray-700"
              style={{
                left: `${floatingToolbarPosition.x}px`,
                top: `${floatingToolbarPosition.y}px`,
                transform: 'translate(-50%, 0)',
              }}
            >
              {/* Character Input */}
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-gray-300">Char:</label>
                <input
                  type="text"
                  value={editCharValue}
                  onChange={(e) => setEditCharValue(e.target.value.slice(0, 1))}
                  placeholder="?"
                  maxLength={1}
                  className="w-12 px-2 py-1 border border-gray-600 rounded bg-gray-800 text-white text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Save Button */}
              <Button
                variant="default"
                size="sm"
                onClick={saveChanges}
                disabled={!editCharValue || polygonPoints.length < 3}
                className="bg-blue-600 hover:bg-blue-700 text-white h-8"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>

              {/* Delete Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelectedMapping}
                className="bg-red-600 hover:bg-red-700 text-white h-8"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 How it works:</strong> All mapped characters shown on the image.
          Click any character to select and edit it. Green = unselected, Red = selected.
          Use "Add New" to map additional characters. ESC to deselect.
        </p>
      </div>
    </div>
  );
};

export default CharacterMappingOverview;
