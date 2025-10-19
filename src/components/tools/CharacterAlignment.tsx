'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFont } from '@/context/FontContext';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import {
  calculateFontMetrics,
  generateKerningPairs,
  type GlyphMetrics,
  type FontMetricsResult
} from '@/lib/font/professionalMetrics';

const CharacterAlignment: React.FC = () => {
  const { 
    characterMappings, 
    sourceImages,
    fontAdjustments,
    updateFontAdjustments,
    setCharPosition
  } = useFont();
  
  // State variables
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [sampleText, setSampleText] = useState("AaBbCcDdEe123");
  const [fontSize, setFontSize] = useState(48);
  const [showBaseline, setShowBaseline] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [charPositions, setCharPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [professionalMetrics, setProfessionalMetrics] = useState<FontMetricsResult | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  
  // Character sets
  const upperCaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerCaseChars = "abcdefghijklmnopqrstuvwxyz";
  const numbersChars = "0123456789";
  const symbolsChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
  
  // Canvas references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Unified character handling
  const allCharsRef = useRef<Record<string, {width: number, height: number, img?: HTMLImageElement}>>({});
  
  // Current drag operation
  const dragRef = useRef<{
    active: boolean,
    char: string,
    startY: number,
    originalY: number
  } | null>(null);
  
  // Initialize with current font adjustments
  useEffect(() => {
    if (fontAdjustments.charPositions) {
      setCharPositions(fontAdjustments.charPositions);
    }
  }, [fontAdjustments.charPositions]);
  
  // Load character images when mappings change
  useEffect(() => {
    if (!characterMappings.length || !sourceImages.length) return;
    
    // Create lookup for source images
    const sourceImageMap = new Map(sourceImages.map(img => [img.id, img]));
    
    // Process each character mapping
    characterMappings.forEach(mapping => {
      if (mapping.char.length !== 1) return;
      
      const sourceImage = sourceImageMap.get(mapping.sourceImageId);
      if (!sourceImage) return;
      
      // Calculate dimensions
      const width = mapping.x2 - mapping.x1;
      const height = mapping.y2 - mapping.y1;
      
      // Store reference info
      if (!allCharsRef.current[mapping.char]) {
        allCharsRef.current[mapping.char] = { width, height };
      }
      
      // Load image if we haven't already
      if (!allCharsRef.current[mapping.char].img) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Extract just the character portion
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw the character
          ctx.drawImage(
            img,
            mapping.x1, mapping.y1, width, height,
            0, 0, width, height
          );
          
          // Create new image from this canvas
          const charImg = new Image();
          charImg.onload = () => {
            allCharsRef.current[mapping.char].img = charImg;
            drawCanvas(); // Redraw when image loads
          };
          charImg.src = canvas.toDataURL('image/png');
        };
        img.src = sourceImage.url;
      }
    });
  }, [characterMappings, sourceImages]);
  
  // Draw the canvas with current character positions
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const baselineY = canvasHeight / 2;
    
    // Draw background grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
      ctx.lineWidth = 1;
      
      // Horizontal lines
      for (let y = 0; y < canvasHeight; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }
      
      // Vertical lines
      for (let x = 0; x < canvasWidth; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
    }
    
    // Draw baseline
    if (showBaseline) {
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, baselineY);
      ctx.lineTo(canvasWidth, baselineY);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = 'rgba(0, 150, 255, 0.9)';
      ctx.font = '14px sans-serif';
      ctx.fillText('Baseline', 10, baselineY - 10);
    }
    
    // Calculate total width for centering
    let totalWidth = 0;
    let charWidths: Record<string, number> = {};
    
    for (let i = 0; i < sampleText.length; i++) {
      const char = sampleText[i];
      const charData = allCharsRef.current[char];
      
      if (charData) {
        const scaledWidth = charData.width * (fontSize / 48);
        charWidths[char] = scaledWidth;
        totalWidth += scaledWidth + fontAdjustments.letterSpacing;
      }
    }
    
    // Start X position (centered)
    let xPos = (canvasWidth - totalWidth) / 2;
    
    // Draw sample text with character adjustments
    for (let i = 0; i < sampleText.length; i++) {
      const char = sampleText[i];
      const charData = allCharsRef.current[char];
      
      if (!charData) {
        xPos += 20; // Space for unknown characters
        continue;
      }
      
      // Get character position adjustment
      const posAdjustment = charPositions[char] || { x: 0, y: fontAdjustments.baselineOffset };
      
      // Calculate scaled dimensions
      const scale = fontSize / 48;
      const scaledWidth = charData.width * scale;
      const scaledHeight = charData.height * scale;
      
      // Calculate position
      const yPos = baselineY - scaledHeight + posAdjustment.y * scale;
      
      // Highlight selected characters
      const isSelected = char === selectedChar;
      
      // Draw character bounding box
      ctx.strokeStyle = isSelected 
        ? 'rgba(255, 100, 100, 0.8)' 
        : posAdjustment.y !== fontAdjustments.baselineOffset 
          ? 'rgba(0, 180, 0, 0.5)' 
          : 'rgba(200, 200, 200, 0.3)';
      
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(xPos, yPos, scaledWidth, scaledHeight);
      
      // Draw character
      if (charData.img) {
        ctx.drawImage(
          charData.img,
          xPos, yPos,
          scaledWidth, scaledHeight
        );
      } else {
        // Fallback to text
        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillText(char, xPos, baselineY);
      }
      
      // Draw position indicator for selected or custom positioned characters
      if (isSelected || posAdjustment.y !== fontAdjustments.baselineOffset) {
        // Draw indicator line to baseline
        ctx.strokeStyle = isSelected ? 'rgba(255, 100, 100, 0.5)' : 'rgba(0, 180, 0, 0.5)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(xPos + scaledWidth / 2, yPos + scaledHeight);
        ctx.lineTo(xPos + scaledWidth / 2, baselineY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Show position value
        ctx.fillStyle = isSelected ? 'rgba(255, 100, 100, 0.9)' : 'rgba(0, 180, 0, 0.9)';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${Math.round(posAdjustment.y)}px`, xPos + scaledWidth / 2 - 10, yPos - 4);
      }
      
      // Draw drag handle for selected character
      if (isSelected) {
        // Draw a little handle at the bottom center
        ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
        ctx.beginPath();
        ctx.arc(xPos + scaledWidth / 2, yPos + scaledHeight + 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw arrow
        ctx.beginPath();
        ctx.moveTo(xPos + scaledWidth / 2, yPos + scaledHeight + 5);
        ctx.lineTo(xPos + scaledWidth / 2, yPos + scaledHeight + 15);
        ctx.stroke();
        
        // Draw arrow heads
        ctx.beginPath();
        ctx.moveTo(xPos + scaledWidth / 2 - 4, yPos + scaledHeight + 8);
        ctx.lineTo(xPos + scaledWidth / 2, yPos + scaledHeight + 5);
        ctx.lineTo(xPos + scaledWidth / 2 + 4, yPos + scaledHeight + 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(xPos + scaledWidth / 2 - 4, yPos + scaledHeight + 12);
        ctx.lineTo(xPos + scaledWidth / 2, yPos + scaledHeight + 15);
        ctx.lineTo(xPos + scaledWidth / 2 + 4, yPos + scaledHeight + 12);
        ctx.stroke();
      }
      
      // Move to next character position
      xPos += scaledWidth + fontAdjustments.letterSpacing;
    }
    
    // Draw legend
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    
    const customPositionedCount = Object.keys(charPositions)
      .filter(c => charPositions[c].y !== fontAdjustments.baselineOffset).length;
    
    if (customPositionedCount > 0) {
      ctx.fillStyle = 'rgba(0, 180, 0, 0.8)';
      ctx.fillText(`${customPositionedCount} character(s) with custom position`, 20, canvasHeight - 20);
    }
  };
  
  // Resize canvas when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.clientWidth;
        canvasRef.current.height = 400;
        drawCanvas();
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Draw canvas when relevant state changes
  useEffect(() => {
    drawCanvas();
  }, [
    selectedChar, 
    sampleText, 
    fontSize, 
    showBaseline, 
    showGrid, 
    fontAdjustments.letterSpacing,
    fontAdjustments.baselineOffset,
    charPositions
  ]);
  
  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const baselineY = canvas.height / 2;
    
    // Calculate position for each character
    let xPos = (canvas.width - calculateTotalWidth()) / 2;
    
    for (let i = 0; i < sampleText.length; i++) {
      const char = sampleText[i];
      const charData = allCharsRef.current[char];
      
      if (!charData) {
        xPos += 20;
        continue;
      }
      
      // Get character position adjustment
      const posAdjustment = charPositions[char] || { x: 0, y: fontAdjustments.baselineOffset };
      
      // Calculate scaled dimensions
      const scale = fontSize / 48;
      const scaledWidth = charData.width * scale;
      const scaledHeight = charData.height * scale;
      
      // Calculate position
      const yPos = baselineY - scaledHeight + posAdjustment.y * scale;
      
      // Check if we clicked on this character
      if (
        mouseX >= xPos && mouseX <= xPos + scaledWidth &&
        mouseY >= yPos && mouseY <= yPos + scaledHeight
      ) {
        setSelectedChar(char);
        break;
      }
      
      // Check if we clicked on the character's drag handle
      if (char === selectedChar) {
        const handleX = xPos + scaledWidth / 2;
        const handleY = yPos + scaledHeight + 10;
        
        if (
          mouseX >= handleX - 10 && mouseX <= handleX + 10 &&
          mouseY >= handleY - 10 && mouseY <= handleY + 10
        ) {
          // Start dragging
          dragRef.current = {
            active: true,
            char,
            startY: mouseY,
            originalY: posAdjustment.y
          };
          break;
        }
      }
      
      // Move to next character position
      xPos += scaledWidth + fontAdjustments.letterSpacing;
    }
  };
  
  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current?.active) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.left;
    
    // Calculate movement
    const deltaY = mouseY - dragRef.current.startY;
    
    // Scale movement based on font size
    const scale = 48 / fontSize;
    const newY = dragRef.current.originalY + deltaY * scale;
    
    // Update position
    setCharPositions(prev => ({
      ...prev,
      [dragRef.current!.char]: { x: 0, y: newY }
    }));
  };
  
  // Handle mouse up
  const handleMouseUp = () => {
    if (dragRef.current?.active) {
      // Save the final position to font context
      const char = dragRef.current.char;
      const pos = charPositions[char];
      
      if (pos) {
        setCharPosition(char, pos.x, pos.y);
        toast.success(`Updated position for '${char}'`);
      }
      
      dragRef.current = null;
    }
  };
  
  // Helper to calculate total width of sample text
  const calculateTotalWidth = () => {
    let totalWidth = 0;
    
    for (let i = 0; i < sampleText.length; i++) {
      const char = sampleText[i];
      const charData = allCharsRef.current[char];
      
      if (charData) {
        const scale = fontSize / 48;
        totalWidth += charData.width * scale + fontAdjustments.letterSpacing;
      } else {
        totalWidth += 20; // Space for unknown characters
      }
    }
    
    return totalWidth;
  };
  
  // Apply global baseline adjustment
  const applyGlobalBaseline = (value: number) => {
    updateFontAdjustments({ baselineOffset: value });
  };
  
  // Apply global letter spacing
  const applyLetterSpacing = (value: number) => {
    updateFontAdjustments({ letterSpacing: value });
  };
  
  // Apply global baseline to all characters
  const alignAllToBaseline = () => {
    // Update all characters to use the global baseline
    const updatedPositions = Object.fromEntries(
      Object.entries(charPositions).map(([char, pos]) => [
        char, 
        { ...pos, y: fontAdjustments.baselineOffset }
      ])
    );
    
    setCharPositions(updatedPositions);
    updateFontAdjustments({ 
      charPositions: updatedPositions
    });
    
    toast.success('Aligned all characters to baseline');
  };
  
  // Reset all character positions
  const resetAllPositions = () => {
    setCharPositions({});
    updateFontAdjustments({ 
      charPositions: {} 
    });
    
    toast.success('Reset all character positions');
  };
  
  // Apply current baseline to selected character
  const alignSelectedToBaseline = () => {
    if (!selectedChar) return;
    
    // Update the selected character to use the global baseline
    const updatedPositions = {
      ...charPositions,
      [selectedChar]: { x: 0, y: fontAdjustments.baselineOffset }
    };
    
    setCharPositions(updatedPositions);
    updateFontAdjustments({ 
      charPositions: updatedPositions
    });
    
    toast.success(`Aligned '${selectedChar}' to baseline`);
  };
  
  // Calculate professional metrics based on current glyphs
  const calculateProfessionalMetrics = () => {
    // Convert character data to GlyphMetrics format
    const glyphs: GlyphMetrics[] = Object.entries(allCharsRef.current).map(([char, data]) => ({
      char,
      width: data.width,
      height: data.height,
      boundingBox: {
        xMin: 0,
        yMin: 0,
        xMax: data.width,
        yMax: data.height
      }
    }));

    if (glyphs.length === 0) {
      toast.error('No characters available to analyze');
      return null;
    }

    // Calculate metrics
    const metrics = calculateFontMetrics(glyphs);
    setProfessionalMetrics(metrics);

    return metrics;
  };

  // --- Automation: Apply Professional Standards ---
  const applyProfessionalStandards = () => {
    // Calculate metrics first
    const metrics = calculateProfessionalMetrics();

    if (!metrics) {
      toast.error('Unable to calculate professional metrics');
      return;
    }

    // 1. Apply professional baseline positioning
    const newCharPositions: Record<string, {x: number, y: number}> = {};

    // Calculate scale factor (from image pixels to font units)
    // Assume current height maps to cap height in font units
    const avgHeight = Object.values(allCharsRef.current)
      .reduce((sum, char) => sum + char.height, 0) / Object.keys(allCharsRef.current).length;
    const scale = metrics.capHeight / avgHeight;

    Object.entries(allCharsRef.current).forEach(([char, data]) => {
      // Baseline at y=0
      // Characters sit on baseline (bottom edge at y=0)
      // Adjust based on character type
      let baselineY = 0;

      // Uppercase letters align to cap height
      if (char >= 'A' && char <= 'Z') {
        baselineY = 0;
      }
      // Lowercase letters with ascenders (h, d, l, b, k, t, f)
      else if ('hdlbktf'.includes(char)) {
        baselineY = 0;
      }
      // Lowercase letters with descenders (g, p, q, y, j)
      else if ('gpqyj'.includes(char)) {
        // Position so descender extends below baseline
        baselineY = (metrics.descender / metrics.unitsPerEm) * data.height;
      }
      // Regular lowercase letters (x-height)
      else if (char >= 'a' && char <= 'z') {
        baselineY = 0;
      }
      // Numbers typically align with cap height or slightly smaller
      else if (char >= '0' && char <= '9') {
        baselineY = 0;
      }
      // Default
      else {
        baselineY = 0;
      }

      newCharPositions[char] = { x: 0, y: baselineY };
    });

    // 2. Generate professional kerning pairs
    const glyphs: GlyphMetrics[] = Object.entries(allCharsRef.current).map(([char, data]) => ({
      char,
      width: data.width,
      height: data.height,
      boundingBox: {
        xMin: 0,
        yMin: 0,
        xMax: data.width,
        yMax: data.height
      }
    }));

    const kerningPairs = generateKerningPairs(glyphs);
    const kerningMap: Record<string, number> = {};
    kerningPairs.forEach(pair => {
      kerningMap[pair.left + pair.right] = pair.adjustment;
    });

    // Apply all adjustments
    updateFontAdjustments({
      charPositions: newCharPositions,
      kerningPairs: kerningMap
    });
    setCharPositions(newCharPositions);

    toast.success(`Professional standards applied: ${Object.keys(newCharPositions).length} characters aligned, ${kerningPairs.length} kerning pairs added`);
  };
  
  // Component for character sets
  const CharacterSetSelector = ({ title, chars }: { title: string, chars: string }) => (
    <div className="mt-2">
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      <div className="flex flex-wrap gap-1">
        {chars.split('').map(char => {
          const isAvailable = char in allCharsRef.current;
          const isSelected = char === selectedChar;
          const hasCustomPosition = charPositions[char]?.y !== fontAdjustments.baselineOffset;
          
          return (
            <button
              key={char}
              className={`
                w-8 h-8 flex items-center justify-center rounded text-base
                ${isAvailable 
                  ? 'bg-white border hover:bg-gray-50' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                ${hasCustomPosition && !isSelected ? 'border-green-500 text-green-600' : ''}
              `}
              onClick={() => isAvailable && setSelectedChar(char)}
              disabled={!isAvailable}
            >
              {char}
            </button>
          );
        })}
      </div>
    </div>
  );
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium">Character Alignment</h3>
          <p className="text-sm text-gray-500">
            Adjust the vertical position of characters for proper baseline alignment.
          </p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={alignAllToBaseline}
          >
            Align All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAllPositions}
          >
            Reset All
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={applyProfessionalStandards}
          >
            Apply Professional Standards
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              calculateProfessionalMetrics();
              setShowMetrics(!showMetrics);
            }}
          >
            {showMetrics ? 'Hide' : 'Show'} Metrics
          </Button>
        </div>
      </div>
      
      <div className="bg-white border rounded-lg shadow-sm p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-[400px] border rounded cursor-pointer"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {showMetrics && professionalMetrics && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-semibold text-lg text-indigo-900">Professional Font Metrics</h4>
              <p className="text-sm text-indigo-700">Based on industry standards and glyph analysis</p>
            </div>
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              ✓ Calculated
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Units Per Em</div>
              <div className="text-2xl font-bold text-gray-900">{professionalMetrics.unitsPerEm}</div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Cap Height</div>
              <div className="text-2xl font-bold text-gray-900">{professionalMetrics.capHeight}</div>
              <div className="text-xs text-gray-500">{((professionalMetrics.capHeight / professionalMetrics.unitsPerEm) * 100).toFixed(0)}% of UPM</div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">X-Height</div>
              <div className="text-2xl font-bold text-gray-900">{professionalMetrics.xHeight}</div>
              <div className="text-xs text-gray-500">{((professionalMetrics.xHeight / professionalMetrics.capHeight) * 100).toFixed(0)}% of Cap</div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Ascender</div>
              <div className="text-2xl font-bold text-gray-900">{professionalMetrics.ascender}</div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Descender</div>
              <div className="text-2xl font-bold text-gray-900">{professionalMetrics.descender}</div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Line Gap</div>
              <div className="text-2xl font-bold text-gray-900">{professionalMetrics.lineGap}</div>
              <div className="text-xs text-gray-500">{((professionalMetrics.lineGap / professionalMetrics.unitsPerEm) * 100).toFixed(0)}% of UPM</div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Side Bearing</div>
              <div className="text-2xl font-bold text-gray-900">{professionalMetrics.defaultSideBearing}</div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-xs text-gray-500 mb-1">Overshoot</div>
              <div className="text-2xl font-bold text-gray-900">{professionalMetrics.overshoot}</div>
              <div className="text-xs text-gray-500">For round glyphs</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-indigo-100 rounded-lg">
            <div className="text-xs text-indigo-700 font-medium mb-1">Standards Applied:</div>
            <ul className="text-xs text-indigo-600 space-y-1">
              <li>• Tracy Method for optical spacing</li>
              <li>• Professional kerning pairs (80+ combinations)</li>
              <li>• Baseline alignment by character type</li>
              <li>• Optical overshoot for round characters (O, o, C, etc.)</li>
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Global Adjustments</h4>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600">Baseline Offset</label>
              <span className="text-sm font-medium">{fontAdjustments.baselineOffset}px</span>
            </div>
            <input 
              type="range" 
              min="-50" 
              max="50" 
              value={fontAdjustments.baselineOffset} 
              onChange={(e) => applyGlobalBaseline(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600">Letter Spacing</label>
              <span className="text-sm font-medium">{fontAdjustments.letterSpacing}px</span>
            </div>
            <input 
              type="range" 
              min="-10" 
              max="30" 
              value={fontAdjustments.letterSpacing} 
              onChange={(e) => applyLetterSpacing(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm text-gray-600">Preview Font Size</label>
              <span className="text-sm font-medium">{fontSize}px</span>
            </div>
            <input 
              type="range" 
              min="24" 
              max="96" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showBaseline}
                onChange={() => setShowBaseline(!showBaseline)}
                className="rounded"
              />
              <span className="text-sm">Show Baseline</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={() => setShowGrid(!showGrid)}
                className="rounded"
              />
              <span className="text-sm">Show Grid</span>
            </label>
          </div>
        </div>
        
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Selected Character</h4>
          
          {selectedChar ? (
            <>
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                <span className="text-6xl">{selectedChar}</span>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm text-gray-600">Vertical Position</label>
                  <span className="text-sm font-medium">
                    {(charPositions[selectedChar]?.y || fontAdjustments.baselineOffset)}px
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-50" 
                  max="50" 
                  value={charPositions[selectedChar]?.y || fontAdjustments.baselineOffset} 
                  onChange={(e) => {
                    const newY = Number(e.target.value);
                    setCharPositions(prev => ({
                      ...prev,
                      [selectedChar]: { x: 0, y: newY }
                    }));
                  }}
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={alignSelectedToBaseline}
                >
                  Align to Baseline
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Save the position permanently
                    const pos = charPositions[selectedChar];
                    if (pos) {
                      setCharPosition(selectedChar, pos.x, pos.y);
                      toast.success(`Saved position for '${selectedChar}'`);
                    }
                  }}
                >
                  Save Position
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 italic">
                Tip: You can also drag the handle below the character to adjust its position.
              </p>
            </>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              Select a character to adjust its position
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border rounded-lg">
        <div className="flex justify-between mb-2">
          <h4 className="font-medium">Preview Text</h4>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSampleText("The quick brown fox jumps over the lazy dog 1234567890")}
          >
            Pangram
          </Button>
        </div>
        <input
          type="text"
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter text to preview alignment..."
        />
      </div>
      
      <div className="p-4 border rounded-lg">
        <h4 className="font-medium mb-2">Character Sets</h4>
        
        <CharacterSetSelector title="Uppercase" chars={upperCaseChars} />
        <CharacterSetSelector title="Lowercase" chars={lowerCaseChars} />
        <CharacterSetSelector title="Numbers" chars={numbersChars} />
        <CharacterSetSelector title="Symbols" chars={symbolsChars} />
      </div>
    </div>
  );
};

export default CharacterAlignment; 