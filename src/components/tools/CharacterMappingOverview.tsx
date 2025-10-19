'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useFont } from '@/context/FontContext';
import { ChevronLeft, ChevronRight, Edit3, Check, X, RotateCcw, Type, Move, Trash2, Save, Plus, Square, Circle } from 'lucide-react';
import { toast } from 'sonner';

interface CharacterMappingOverviewProps {
  onEditMode?: (mappingId: string) => void;
}

interface Point {
  x: number;
  y: number;
}

const CharacterMappingOverview: React.FC<CharacterMappingOverviewProps> = ({ onEditMode }) => {
  const { 
    sourceImages, 
    characterMappings, 
    removeCharacterMapping,
    updateCharacterMapping,
    addCharacterMapping
  } = useFont();
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [newCharacter, setNewCharacter] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingMode, setEditingMode] = useState<'rectangle' | 'polygon'>('rectangle');
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [draggedNode, setDraggedNode] = useState<number | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [isAddingNodeToEdge, setIsAddingNodeToEdge] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedImages = sourceImages.filter(img => img.selected);
  const currentImage = selectedImages[currentImageIndex];
  const currentImageMappings = characterMappings.filter(m => m.sourceImageId === currentImage?.id);

  // Character sets for quick selection
  const characterSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '.,!?;:()[]{}"\'@#$%&*+-=<>/\\|_',
    common: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?'
  };

  const [activeCharacterSet, setActiveCharacterSet] = useState<'common' | 'uppercase' | 'lowercase' | 'numbers' | 'symbols'>('common');

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
    setSelectedMapping(null);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + selectedImages.length) % selectedImages.length);
    setSelectedMapping(null);
  };

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx || !imageRef.current || !currentImage) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image at actual size
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    
    // Draw all mappings
    currentImageMappings.forEach((mapping) => {
      const isSelected = selectedMapping === mapping.id;
      
      if (mapping.isPolygon && mapping.polygonPoints) {
        // Draw polygon mapping
        if (mapping.polygonPoints.length < 3) return;
        
        // Draw polygon
        ctx.beginPath();
        ctx.moveTo(mapping.polygonPoints[0].x, mapping.polygonPoints[0].y);
        for (let i = 1; i < mapping.polygonPoints.length; i++) {
          ctx.lineTo(mapping.polygonPoints[i].x, mapping.polygonPoints[i].y);
        }
        ctx.closePath();
        
        ctx.strokeStyle = isSelected ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 200, 0, 0.7)';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
        
        ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 200, 0, 0.2)';
        ctx.fill();
        
        // Draw polygon edges with hover effects
        if (isSelected) {
          for (let i = 0; i < mapping.polygonPoints.length; i++) {
            const p1 = mapping.polygonPoints[i];
            const p2 = mapping.polygonPoints[(i + 1) % mapping.polygonPoints.length];
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            // Highlight hovered edge
            if (hoveredEdge === i) {
              ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
              ctx.lineWidth = 4;
            } else {
              ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)';
              ctx.lineWidth = 2;
            }
            
            ctx.stroke();
          }
        }
        
        // Draw character label
        const centerX = mapping.polygonPoints.reduce((sum, p) => sum + p.x, 0) / mapping.polygonPoints.length;
        const centerY = mapping.polygonPoints.reduce((sum, p) => sum + p.y, 0) / mapping.polygonPoints.length;
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText(mapping.char, centerX, centerY);
        ctx.fillText(mapping.char, centerX, centerY);
        
        // Draw polygon nodes for selected character
        if (isSelected) {
          mapping.polygonPoints.forEach((point, index) => {
            const isHovered = hoveredNode === index;
            const isDragged = draggedNode === index;
            
            ctx.fillStyle = isDragged ? 'rgba(255, 0, 0, 0.8)' : isHovered ? 'rgba(255, 0, 0, 0.6)' : 'white';
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            
            const nodeSize = isHovered || isDragged ? 8 : 6;
            ctx.beginPath();
            ctx.arc(point.x, point.y, nodeSize, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Draw node number
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText((index + 1).toString(), point.x, point.y);
            ctx.fillText((index + 1).toString(), point.x, point.y);
          });
        }
      } else {
        // Draw rectangle mapping
        const x = mapping.x1;
        const y = mapping.y1;
        const width = mapping.x2 - mapping.x1;
        const height = mapping.y2 - mapping.y1;
        
        ctx.strokeStyle = isSelected ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 200, 0, 0.7)';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.strokeRect(x, y, width, height);
        
        ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 200, 0, 0.2)';
        ctx.fillRect(x, y, width, height);
        
        // Draw character label
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        ctx.strokeText(mapping.char, centerX, centerY);
        ctx.fillText(mapping.char, centerX, centerY);
        
        // Draw resize handles for selected rectangle
        if (isSelected) {
          const handleSize = 8;
          const handles = [
            { x: x - handleSize/2, y: y - handleSize/2, type: 'nw' },
            { x: x + width/2 - handleSize/2, y: y - handleSize/2, type: 'n' },
            { x: x + width - handleSize/2, y: y - handleSize/2, type: 'ne' },
            { x: x + width - handleSize/2, y: y + height/2 - handleSize/2, type: 'e' },
            { x: x + width - handleSize/2, y: y + height - handleSize/2, type: 'se' },
            { x: x + width/2 - handleSize/2, y: y + height - handleSize/2, type: 's' },
            { x: x - handleSize/2, y: y + height - handleSize/2, type: 'sw' },
            { x: x - handleSize/2, y: y + height/2 - handleSize/2, type: 'w' }
          ];
          
          handles.forEach(handle => {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
            ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
          });
        }
      }
    });
    
    // Draw current selection rectangle if drawing
    if (isDrawing && startPoint && endPoint) {
      const x = Math.min(startPoint.x, endPoint.x);
      const y = Math.min(startPoint.y, endPoint.y);
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);
      
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }
  }, [currentImage, currentImageMappings, selectedMapping, isDrawing, startPoint, endPoint, hoveredNode, draggedNode, hoveredEdge]);

  // Load image when current image changes
  useEffect(() => {
    if (currentImage && canvasRef.current && containerRef.current) {
      const canvas = canvasRef.current;
      const img = new Image();
      
      img.onload = () => {
        // Set canvas to actual image size
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        imageRef.current = img;
        redrawCanvas();
      };
      
      img.src = currentImage.url;
    }
  }, [currentImage, redrawCanvas]);

  // Redraw when mappings change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Add global mouse up listener to handle mouse leaving canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
      }
      if (isMoving) {
        setIsMoving(false);
      }
      if (isResizing) {
        setIsResizing(false);
        setResizeHandle(null);
      }
      if (draggedNode !== null) {
        setDraggedNode(null);
      }
    };

    const handleGlobalMouseLeave = () => {
      handleGlobalMouseUp();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Exit editing mode
        setSelectedMapping(null);
        setShowCharacterSelector(false);
        setHoveredNode(null);
        setHoveredEdge(null);
        setIsAddingNew(false);
        setNewCharacter('');
        setStartPoint(null);
        setEndPoint(null);
      }
    };

    // Add event listeners
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mouseleave', handleGlobalMouseLeave);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawing, isMoving, isResizing, draggedNode]);

  const getResizeHandle = (x: number, y: number, mapping: any) => {
    const handleSize = 8;
    const handles = [
      { x: mapping.x1 - handleSize/2, y: mapping.y1 - handleSize/2, type: 'nw' },
      { x: mapping.x1 + (mapping.x2 - mapping.x1)/2 - handleSize/2, y: mapping.y1 - handleSize/2, type: 'n' },
      { x: mapping.x2 - handleSize/2, y: mapping.y1 - handleSize/2, type: 'ne' },
      { x: mapping.x2 - handleSize/2, y: mapping.y1 + (mapping.y2 - mapping.y1)/2 - handleSize/2, type: 'e' },
      { x: mapping.x2 - handleSize/2, y: mapping.y2 - handleSize/2, type: 'se' },
      { x: mapping.x1 + (mapping.x2 - mapping.x1)/2 - handleSize/2, y: mapping.y2 - handleSize/2, type: 's' },
      { x: mapping.x1 - handleSize/2, y: mapping.y2 - handleSize/2, type: 'sw' },
      { x: mapping.x1 - handleSize/2, y: mapping.y1 + (mapping.y2 - mapping.y1)/2 - handleSize/2, type: 'w' }
    ];
    
    for (const handle of handles) {
      if (x >= handle.x && x <= handle.x + handleSize && y >= handle.y && y <= handle.y + handleSize) {
        return handle.type;
      }
    }
    return null;
  };

  const getPolygonNode = (x: number, y: number, mapping: any) => {
    if (!mapping.polygonPoints) return null;
    
    for (let i = 0; i < mapping.polygonPoints.length; i++) {
      const point = mapping.polygonPoints[i];
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (distance <= 8) {
        return i;
      }
    }
    return null;
  };

  const getPolygonEdge = (x: number, y: number, mapping: any) => {
    if (!mapping.polygonPoints || mapping.polygonPoints.length < 3) return null;
    
    const points = mapping.polygonPoints;
    const tolerance = 10; // Edge detection tolerance
    
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      
      // Calculate distance from point to line segment
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
      
      if (distance <= tolerance) {
        return i; // Return the edge index (between node i and i+1)
      }
    }
    return null;
  };

  const addNodeToEdge = (edgeIndex: number, x: number, y: number, mapping: any) => {
    if (!mapping.polygonPoints) return;
    
    const newPoints = [...mapping.polygonPoints];
    newPoints.splice(edgeIndex + 1, 0, { x, y });
    updateCharacterMapping(mapping.id, { polygonPoints: newPoints });
    toast.success('Added new node to polygon');
  };

  const deletePolygonNode = (nodeIndex: number, mapping: any) => {
    if (!mapping.polygonPoints || mapping.polygonPoints.length <= 3) {
      toast.error('Cannot delete node - polygon must have at least 3 nodes');
      return;
    }
    
    const newPoints = mapping.polygonPoints.filter((_: any, index: number) => index !== nodeIndex);
    updateCharacterMapping(mapping.id, { polygonPoints: newPoints });
    toast.success('Deleted node from polygon');
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentImage) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (isAddingNew) {
      // Finish adding new character
      if (startPoint && endPoint && newCharacter) {
        if (editingMode === 'rectangle') {
          const x1 = Math.min(startPoint.x, endPoint.x);
          const y1 = Math.min(startPoint.y, endPoint.y);
          const x2 = Math.max(startPoint.x, endPoint.x);
          const y2 = Math.max(startPoint.y, endPoint.y);
          
          addCharacterMapping({
            sourceImageId: currentImage.id,
            char: newCharacter,
            x1,
            y1,
            x2,
            y2,
            isPolygon: false
          });
        } else {
          // Convert rectangle to polygon
          const x1 = Math.min(startPoint.x, endPoint.x);
          const y1 = Math.min(startPoint.y, endPoint.y);
          const x2 = Math.max(startPoint.x, endPoint.x);
          const y2 = Math.max(startPoint.y, endPoint.y);
          
          addCharacterMapping({
            sourceImageId: currentImage.id,
            char: newCharacter,
            x1,
            y1,
            x2,
            y2,
            isPolygon: true,
            polygonPoints: [
              { x: x1, y: y1 },
              { x: x2, y: y1 },
              { x: x2, y: y2 },
              { x: x1, y: y2 }
            ]
          });
        }
        
        toast.success(`Added character '${newCharacter}'`);
        setIsAddingNew(false);
        setNewCharacter('');
        setStartPoint(null);
        setEndPoint(null);
        setShowCharacterSelector(false);
      }
    } else if (selectedMapping) {
      // Check for polygon edge interaction
      const mapping = currentImageMappings.find(m => m.id === selectedMapping);
      if (mapping && mapping.isPolygon && mapping.polygonPoints) {
        const edgeIndex = getPolygonEdge(x, y, mapping);
        if (edgeIndex !== null) {
          // Clicked on polygon edge - add new node
          addNodeToEdge(edgeIndex, x, y, mapping);
          return;
        }
      }
    } else {
      // Check if clicking on polygon node
      if (selectedMapping) {
        const mapping = currentImageMappings.find(m => m.id === selectedMapping);
        if (mapping && mapping.isPolygon && mapping.polygonPoints) {
          const nodeIndex = getPolygonNode(x, y, mapping);
          if (nodeIndex !== null) {
            setDraggedNode(nodeIndex);
            return;
          }
        }
        
        // Check if clicking on resize handle
        if (mapping && !mapping.isPolygon) {
          const handle = getResizeHandle(x, y, mapping);
          if (handle) {
            setResizeHandle(handle);
            setIsResizing(true);
            setStartPoint({ x, y });
            return;
          }
        }
      }
      
      // Find clicked mapping
      const clickedMapping = findClickedMapping(x, y);
      if (clickedMapping) {
        setSelectedMapping(clickedMapping.id);
        setShowCharacterSelector(true);
      } else {
        // Clicked outside - exit editing mode
        setSelectedMapping(null);
        setShowCharacterSelector(false);
        setHoveredNode(null);
        setHoveredEdge(null);
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentImage) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (isAddingNew) {
      setStartPoint({ x, y });
      setEndPoint({ x, y });
      setIsDrawing(true);
    } else if (selectedMapping) {
      const mapping = currentImageMappings.find(m => m.id === selectedMapping);
      if (mapping) {
        if (mapping.isPolygon && mapping.polygonPoints) {
          const nodeIndex = getPolygonNode(x, y, mapping);
          if (nodeIndex !== null) {
            setDraggedNode(nodeIndex);
            return;
          }
        } else {
          const handle = getResizeHandle(x, y, mapping);
          if (handle) {
            setResizeHandle(handle);
            setIsResizing(true);
            setStartPoint({ x, y });
            return;
          }
        }
        
        // Start moving selected mapping
        setIsMoving(true);
        setStartPoint({ x, y });
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (isDrawing && startPoint) {
      setEndPoint({ x, y });
    } else if (isMoving && selectedMapping && startPoint) {
      // Move the selected mapping
      const deltaX = x - startPoint.x;
      const deltaY = y - startPoint.y;
      
      const mapping = currentImageMappings.find(m => m.id === selectedMapping);
      if (mapping) {
        if (mapping.isPolygon && mapping.polygonPoints) {
          const newPoints = mapping.polygonPoints.map(point => ({
            x: point.x + deltaX,
            y: point.y + deltaY
          }));
          updateCharacterMapping(selectedMapping, { polygonPoints: newPoints });
        } else {
          updateCharacterMapping(selectedMapping, {
            x1: mapping.x1 + deltaX,
            y1: mapping.y1 + deltaY,
            x2: mapping.x2 + deltaX,
            y2: mapping.y2 + deltaY
          });
        }
      }
      
      setStartPoint({ x, y });
    } else if (isResizing && selectedMapping && startPoint && resizeHandle) {
      // Resize the selected mapping
      const deltaX = x - startPoint.x;
      const deltaY = y - startPoint.y;
      
      const mapping = currentImageMappings.find(m => m.id === selectedMapping);
      if (mapping && !mapping.isPolygon) {
        let newX1 = mapping.x1;
        let newY1 = mapping.y1;
        let newX2 = mapping.x2;
        let newY2 = mapping.y2;
        
        switch (resizeHandle) {
          case 'nw':
            newX1 = mapping.x1 + deltaX;
            newY1 = mapping.y1 + deltaY;
            break;
          case 'n':
            newY1 = mapping.y1 + deltaY;
            break;
          case 'ne':
            newX2 = mapping.x2 + deltaX;
            newY1 = mapping.y1 + deltaY;
            break;
          case 'e':
            newX2 = mapping.x2 + deltaX;
            break;
          case 'se':
            newX2 = mapping.x2 + deltaX;
            newY2 = mapping.y2 + deltaY;
            break;
          case 's':
            newY2 = mapping.y2 + deltaY;
            break;
          case 'sw':
            newX1 = mapping.x1 + deltaX;
            newY2 = mapping.y2 + deltaY;
            break;
          case 'w':
            newX1 = mapping.x1 + deltaX;
            break;
        }
        
        // Ensure minimum size
        if (Math.abs(newX2 - newX1) > 10 && Math.abs(newY2 - newY1) > 10) {
          updateCharacterMapping(selectedMapping, {
            x1: newX1,
            y1: newY1,
            x2: newX2,
            y2: newY2
          });
        }
      }
      
      setStartPoint({ x, y });
    } else if (draggedNode !== null && selectedMapping) {
      // Drag polygon node
      const mapping = currentImageMappings.find(m => m.id === selectedMapping);
      if (mapping && mapping.isPolygon && mapping.polygonPoints) {
        const newPoints = [...mapping.polygonPoints];
        newPoints[draggedNode] = { x, y };
        updateCharacterMapping(selectedMapping, { polygonPoints: newPoints });
      }
    } else if (selectedMapping) {
      // Check for hover effects
      const mapping = currentImageMappings.find(m => m.id === selectedMapping);
      if (mapping && mapping.isPolygon && mapping.polygonPoints) {
        const nodeIndex = getPolygonNode(x, y, mapping);
        const edgeIndex = getPolygonEdge(x, y, mapping);
        setHoveredNode(nodeIndex);
        setHoveredEdge(edgeIndex);
      } else {
        setHoveredNode(null);
        setHoveredEdge(null);
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDrawing) {
      setIsDrawing(false);
    } else if (isMoving) {
      setIsMoving(false);
    } else if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
    } else if (draggedNode !== null) {
      setDraggedNode(null);
    }
  };

  const findClickedMapping = (x: number, y: number) => {
    for (const mapping of currentImageMappings) {
      if (mapping.isPolygon && mapping.polygonPoints) {
        // Check if point is inside polygon
        if (isPointInPolygon(x, y, mapping.polygonPoints)) {
          return mapping;
        }
      } else {
        // Check if point is inside rectangle
        if (x >= mapping.x1 && x <= mapping.x2 && y >= mapping.y1 && y <= mapping.y2) {
          return mapping;
        }
      }
    }
    return null;
  };

  const isPointInPolygon = (x: number, y: number, points: Point[]) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      if (((points[i].y > y) !== (points[j].y > y)) &&
          (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  };

  const updateCharacter = (newChar: string) => {
    if (selectedMapping) {
      updateCharacterMapping(selectedMapping, { char: newChar });
      toast.success(`Updated character to '${newChar}'`);
      setShowCharacterSelector(false);
    }
  };

  const deleteMapping = (mappingId: string) => {
    removeCharacterMapping(mappingId);
    setSelectedMapping(null);
    setShowCharacterSelector(false);
    toast.success('Character mapping deleted');
  };

  const convertToPolygon = () => {
    if (selectedMapping) {
      const mapping = currentImageMappings.find(m => m.id === selectedMapping);
      if (mapping && !mapping.isPolygon) {
        updateCharacterMapping(selectedMapping, {
          isPolygon: true,
          polygonPoints: [
            { x: mapping.x1, y: mapping.y1 },
            { x: mapping.x2, y: mapping.y1 },
            { x: mapping.x2, y: mapping.y2 },
            { x: mapping.x1, y: mapping.y2 }
          ]
        });
        toast.success('Converted to polygon - you can now add more nodes');
      }
    }
  };

  const startAddingNew = () => {
    setIsAddingNew(true);
    setShowCharacterSelector(true);
  };

  const selectCharacterForNew = (char: string) => {
    setNewCharacter(char);
    setShowCharacterSelector(false);
  };

  const cancelAdding = () => {
    setIsAddingNew(false);
    setNewCharacter('');
    setStartPoint(null);
    setEndPoint(null);
    setShowCharacterSelector(false);
  };

  if (selectedImages.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded">
        <p>Please upload images first to see character mappings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Image Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevImage}
            disabled={selectedImages.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Image {currentImageIndex + 1} of {selectedImages.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={nextImage}
            disabled={selectedImages.length <= 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {currentImageMappings.length} character{currentImageMappings.length !== 1 ? 's' : ''} mapped
          </span>
          <Button
            size="sm"
            onClick={startAddingNew}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Character
          </Button>
        </div>
      </div>

      {/* Image Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {selectedImages.map((image, index) => {
          const imageMappings = characterMappings.filter(m => m.sourceImageId === image.id);
          const isActive = index === currentImageIndex;
          
          return (
            <button
              key={image.id}
              onClick={() => setCurrentImageIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                isActive ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'
              }`}
            >
              <img
                src={image.url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-contain bg-gray-50"
              />
              {imageMappings.length > 0 && (
                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                  {imageMappings.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Image Display with Actual Size */}
      <div ref={containerRef} className="bg-gray-50 rounded-lg p-4 overflow-auto">
        <div className="flex justify-center">
          <div className="relative inline-block">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onDoubleClick={(e) => {
                if (!canvasRef.current || !currentImage) return;
                
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                if (selectedMapping) {
                  const mapping = currentImageMappings.find(m => m.id === selectedMapping);
                  if (mapping && mapping.isPolygon && mapping.polygonPoints) {
                    const nodeIndex = getPolygonNode(x, y, mapping);
                    if (nodeIndex !== null) {
                      deletePolygonNode(nodeIndex, mapping);
                    }
                  }
                }
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={() => {
                if (isDrawing) {
                  setIsDrawing(false);
                }
                if (isMoving) {
                  setIsMoving(false);
                }
                if (isResizing) {
                  setIsResizing(false);
                  setResizeHandle(null);
                }
                if (draggedNode !== null) {
                  setDraggedNode(null);
                }
              }}
              className="border border-gray-300 rounded cursor-crosshair max-w-full h-auto"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            
            {/* Enhanced Mini Toolbar for Selected Character */}
            {selectedMapping && showCharacterSelector && (
              <div className="absolute top-2 left-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 max-w-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Type className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Edit Character</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMapping(null);
                        setShowCharacterSelector(false);
                        setHoveredNode(null);
                        setHoveredEdge(null);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Done
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCharacterSelector(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Character Set Tabs */}
                <div className="flex space-x-1 mb-3">
                  {Object.keys(characterSets).map((set) => (
                    <button
                      key={set}
                      onClick={() => setActiveCharacterSet(set as any)}
                      className={`px-2 py-1 text-xs rounded ${
                        activeCharacterSet === set
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {set.charAt(0).toUpperCase() + set.slice(1)}
                    </button>
                  ))}
                </div>
                
                {/* Character Grid */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Select character:</div>
                  <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                    {characterSets[activeCharacterSet].split('').map((char) => (
                      <button
                        key={char}
                        onClick={() => updateCharacter(char)}
                        className="w-6 h-6 text-xs border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Advanced Options */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">Advanced:</div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const mapping = currentImageMappings.find(m => m.id === selectedMapping);
                        if (mapping) {
                          const width = Math.round(mapping.x2 - mapping.x1);
                          const height = Math.round(mapping.y2 - mapping.y1);
                          toast.info(`Size: ${width}×${height}px`);
                        }
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <Move className="h-3 w-3 mr-1" />
                      Size
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={convertToPolygon}
                      className="h-6 px-2 text-xs"
                    >
                      <Circle className="h-3 w-3 mr-1" />
                      Polygon
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm('Delete this character mapping?')) {
                          deleteMapping(selectedMapping);
                        }
                      }}
                      className="h-6 px-2 text-xs text-red-600"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Enhanced Character Selector for New Character */}
            {isAddingNew && showCharacterSelector && (
              <div className="absolute top-2 left-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-10 max-w-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Add Character</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelAdding}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Editing Mode Selection */}
                <div className="flex space-x-2 mb-3">
                  <button
                    onClick={() => setEditingMode('rectangle')}
                    className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${
                      editingMode === 'rectangle'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Square className="h-3 w-3" />
                    <span>Rectangle</span>
                  </button>
                  <button
                    onClick={() => setEditingMode('polygon')}
                    className={`px-3 py-1 text-xs rounded flex items-center space-x-1 ${
                      editingMode === 'polygon'
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Circle className="h-3 w-3" />
                    <span>Polygon</span>
                  </button>
                </div>
                
                {/* Character Set Tabs */}
                <div className="flex space-x-1 mb-3">
                  {Object.keys(characterSets).map((set) => (
                    <button
                      key={set}
                      onClick={() => setActiveCharacterSet(set as any)}
                      className={`px-2 py-1 text-xs rounded ${
                        activeCharacterSet === set
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {set.charAt(0).toUpperCase() + set.slice(1)}
                    </button>
                  ))}
                </div>
                
                {/* Character Grid */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Choose character to add:</div>
                  <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto">
                    {characterSets[activeCharacterSet].split('').map((char) => (
                      <button
                        key={char}
                        onClick={() => selectCharacterForNew(char)}
                        className="w-6 h-6 text-xs border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center"
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {isAddingNew ? (
            <p>Click and drag to draw a bounding box for the character '{newCharacter}'</p>
          ) : (
            <div className="space-y-1">
              <p>Click on a character to edit it, or use "Add Character" to create new mappings</p>
              <p className="text-xs text-gray-500">
                <strong>Rectangle:</strong> Drag handles to resize • <strong>Polygon:</strong> Drag nodes to reshape • <strong>Add nodes:</strong> Click on polygon edges • <strong>Delete nodes:</strong> Double-click nodes
              </p>
              <p className="text-xs text-gray-400 mt-1">
                <strong>Exit editing:</strong> Click outside, press Escape, or use "Done" button
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Character Mappings List */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-medium mb-4">Mapped Characters</h3>
        {currentImageMappings.length === 0 ? (
          <p className="text-gray-500 text-sm">No characters mapped for this image.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {currentImageMappings.map((mapping) => (
              <div
                key={mapping.id}
                className={`p-3 border rounded-lg text-center transition-all cursor-pointer ${
                  selectedMapping === mapping.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedMapping(mapping.id);
                  setShowCharacterSelector(true);
                }}
              >
                <div className="text-2xl font-bold mb-1">{mapping.char}</div>
                <div className="text-xs text-gray-500 mb-2">
                  {mapping.isPolygon ? 'Polygon' : 'Rectangle'}
                </div>
                <div className="text-xs text-gray-400">
                  {mapping.isPolygon 
                    ? `${mapping.polygonPoints?.length || 0} nodes`
                    : `${Math.round(mapping.x2 - mapping.x1)}×${Math.round(mapping.y2 - mapping.y1)}`
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterMappingOverview;