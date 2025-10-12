/**
 * Browser-Based Font Generation using opentype.js
 * Replaces Python/FontForge with pure JavaScript implementation
 */

import opentype from 'opentype.js';
import { FontMetadata, FontAdjustments } from '@/context/FontContext';
import {
  TYPEFACE_METRICS,
  DEFAULT_KERNING_PAIRS,
  calculateSideBearings,
} from './metrics';

export interface GlyphData {
  char: string;
  svgPath: string;
  imageWidth: number;
  imageHeight: number;
  bounds?: {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
}

export interface FontGenerationConfig {
  glyphs: GlyphData[];
  metadata: FontMetadata;
  adjustments?: FontAdjustments;
}

export class FontGenerator {
  /**
   * Generate a font from character glyphs
   */
  static async generateFont(config: FontGenerationConfig): Promise<ArrayBuffer> {
    const { glyphs, metadata, adjustments } = config;

    // Build glyphs array first
    const fontGlyphs: opentype.Glyph[] = [];

    // Add notdef glyph (required - must be first at index 0)
    const notdefGlyph = new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: TYPEFACE_METRICS.defaultWidth,
      path: new opentype.Path(),
    });
    fontGlyphs.push(notdefGlyph);

    // Add space character
    const spaceGlyph = new opentype.Glyph({
      name: 'space',
      unicode: 32,
      advanceWidth: TYPEFACE_METRICS.wordSpacing,
      path: new opentype.Path(),
    });
    fontGlyphs.push(spaceGlyph);

    // Process each character glyph
    for (const glyphData of glyphs) {
      try {
        const glyph = this.createGlyph(glyphData, adjustments);
        fontGlyphs.push(glyph);
      } catch (error) {
        console.error(`Failed to create glyph for '${glyphData.char}':`, error);
      }
    }

    // Create font with metadata and glyphs array
    const font = new opentype.Font({
      familyName: metadata.name || 'Custom Font',
      styleName: 'Regular',
      unitsPerEm: TYPEFACE_METRICS.unitsPerEm,
      ascender: TYPEFACE_METRICS.ascender,
      descender: TYPEFACE_METRICS.descender,
      designer: metadata.author || 'Anonymous',
      description: metadata.description || '',
      glyphs: fontGlyphs, // Pass glyphs array to constructor
    });

    // Note: Kerning support would require GPOS table generation
    // which is complex and not yet implemented in this version
    // The spacing adjustments in createGlyph() provide basic character spacing

    // Convert font to ArrayBuffer (TTF format)
    return font.toArrayBuffer();
  }

  /**
   * Create a single glyph from SVG path data
   */
  private static createGlyph(
    glyphData: GlyphData,
    adjustments?: FontAdjustments
  ): opentype.Glyph {
    const { char, svgPath, imageWidth, imageHeight } = glyphData;

    console.log(`Creating glyph for '${char}'`);
    console.log(`  Image size: ${imageWidth}x${imageHeight}`);
    console.log(`  SVG path length: ${svgPath.length}`);
    console.log(`  SVG path preview: ${svgPath.substring(0, 100)}...`);

    // Parse SVG path and convert to font coordinates
    const path = new opentype.Path();

    try {
      // Parse SVG path commands first to get bounds
      const pathCommands = this.parseSVGPathData(svgPath);
      console.log(`  Parsed ${pathCommands.length} path commands`);

      if (pathCommands.length === 0) {
        console.error(`  No path commands parsed for '${char}'!`);
      }

      // Find min/max coordinates in the original path to understand bounds
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      let currentX = 0;
      let currentY = 0;

      pathCommands.forEach(cmd => {
        switch (cmd.type) {
          case 'M':
            currentX = cmd.x;
            currentY = cmd.y;
            minX = Math.min(minX, currentX);
            maxX = Math.max(maxX, currentX);
            minY = Math.min(minY, currentY);
            maxY = Math.max(maxY, currentY);
            break;
          case 'm':
            currentX += cmd.x;
            currentY += cmd.y;
            minX = Math.min(minX, currentX);
            maxX = Math.max(maxX, currentX);
            minY = Math.min(minY, currentY);
            maxY = Math.max(maxY, currentY);
            break;
          case 'L':
            currentX = cmd.x;
            currentY = cmd.y;
            minX = Math.min(minX, currentX);
            maxX = Math.max(maxX, currentX);
            minY = Math.min(minY, currentY);
            maxY = Math.max(maxY, currentY);
            break;
          case 'l':
            currentX += cmd.x;
            currentY += cmd.y;
            minX = Math.min(minX, currentX);
            maxX = Math.max(maxX, currentX);
            minY = Math.min(minY, currentY);
            maxY = Math.max(maxY, currentY);
            break;
          case 'C':
            minX = Math.min(minX, cmd.x1, cmd.x2, cmd.x);
            maxX = Math.max(maxX, cmd.x1, cmd.x2, cmd.x);
            minY = Math.min(minY, cmd.y1, cmd.y2, cmd.y);
            maxY = Math.max(maxY, cmd.y1, cmd.y2, cmd.y);
            currentX = cmd.x;
            currentY = cmd.y;
            break;
          case 'c':
            const x1 = currentX + cmd.x1;
            const x2 = currentX + cmd.x2;
            const x = currentX + cmd.x;
            const y1 = currentY + cmd.y1;
            const y2 = currentY + cmd.y2;
            const y = currentY + cmd.y;
            minX = Math.min(minX, x1, x2, x);
            maxX = Math.max(maxX, x1, x2, x);
            minY = Math.min(minY, y1, y2, y);
            maxY = Math.max(maxY, y1, y2, y);
            currentX = x;
            currentY = y;
            break;
        }
      });

      const pathWidth = maxX - minX;
      const pathHeight = maxY - minY;
      console.log(`  Path bounds: X=[${minX}, ${maxX}] (width: ${pathWidth}), Y=[${minY}, ${maxY}] (height: ${pathHeight})`);

      // Scale factor: convert SVG coordinates to font units
      // We want the glyph to fit within cap height (700 units)
      const targetHeight = TYPEFACE_METRICS.capHeight;
      const scale = targetHeight / pathHeight;
      console.log(`  Scale factor: ${scale} (target height: ${targetHeight})`);

      // Reset current position for actual path drawing
      currentX = 0;
      currentY = 0;
      let startX = 0;
      let startY = 0;

      // Convert each SVG command to font coordinates
      // Potrace SVG has transform="scale(0.1, -0.1)" which already flips Y axis
      // Font coordinates: Y increases upward, baseline at y=0
      // We just need to scale and position at baseline (not flip again!)
      pathCommands.forEach(cmd => {
        switch (cmd.type) {
          case 'M': // absolute moveto
            currentX = (cmd.x - minX) * scale;
            currentY = (cmd.y - minY) * scale;
            startX = currentX;
            startY = currentY;
            path.moveTo(currentX, currentY);
            break;

          case 'm': // relative moveto
            currentX += cmd.x * scale;
            currentY += cmd.y * scale;
            startX = currentX;
            startY = currentY;
            path.moveTo(currentX, currentY);
            break;

          case 'L': // absolute lineto
            currentX = (cmd.x - minX) * scale;
            currentY = (cmd.y - minY) * scale;
            path.lineTo(currentX, currentY);
            break;

          case 'l': // relative lineto
            currentX += cmd.x * scale;
            currentY += cmd.y * scale;
            path.lineTo(currentX, currentY);
            break;

          case 'C': // absolute cubic bezier
            path.curveTo(
              (cmd.x1 - minX) * scale,
              (cmd.y1 - minY) * scale,
              (cmd.x2 - minX) * scale,
              (cmd.y2 - minY) * scale,
              (cmd.x - minX) * scale,
              (cmd.y - minY) * scale
            );
            currentX = (cmd.x - minX) * scale;
            currentY = (cmd.y - minY) * scale;
            break;

          case 'c': // relative cubic bezier
            path.curveTo(
              currentX + (cmd.x1 * scale),
              currentY + (cmd.y1 * scale),
              currentX + (cmd.x2 * scale),
              currentY + (cmd.y2 * scale),
              currentX + (cmd.x * scale),
              currentY + (cmd.y * scale)
            );
            currentX += cmd.x * scale;
            currentY += cmd.y * scale;
            break;

          case 'Z':
          case 'z':
            path.close();
            currentX = startX;
            currentY = startY;
            break;
        }
      });

      console.log(`  Final path has ${path.commands.length} commands`);

    } catch (error) {
      console.error(`Failed to parse SVG path for '${char}':`, error);
    }

    // Calculate advance width
    const bounds = path.getBoundingBox();
    const glyphWidth = bounds.x2 - bounds.x1;

    // Calculate side bearings
    const sideBearings = calculateSideBearings(char, glyphWidth);

    // Apply character-specific positioning adjustments
    let xOffset = 0;
    let yOffset = 0;

    if (adjustments?.charPositions?.[char]) {
      xOffset = adjustments.charPositions[char].x || 0;
      yOffset = adjustments.charPositions[char].y || 0;
    }

    // Apply global adjustments
    let advanceWidth = glyphWidth + sideBearings.left + sideBearings.right;

    if (adjustments) {
      // Letter spacing adjustment
      advanceWidth += (adjustments.letterSpacing || 0) * 20;

      // Character width adjustment
      const widthScale = (adjustments.charWidth || 100) / 100;
      advanceWidth *= widthScale;
    }

    // Create the glyph
    return new opentype.Glyph({
      name: char,
      unicode: char.charCodeAt(0),
      advanceWidth: Math.max(advanceWidth, 100), // Minimum width
      path: path,
      leftSideBearing: sideBearings.left + xOffset,
    });
  }

  /**
   * Parse SVG path data string into commands
   * Handles potrace format with lowercase relative commands
   */
  private static parseSVGPathData(pathData: string): Array<any> {
    const commands: Array<any> = [];

    // Match command letter followed by coordinates
    const regex = /([MmLlHhVvCcSsQqTtAaZz])([\s\d.,-]*)/g;
    let match;

    while ((match = regex.exec(pathData)) !== null) {
      const type = match[1];
      const coordsStr = match[2].trim();

      if (!coordsStr && type !== 'Z' && type !== 'z') {
        continue;
      }

      // Parse coordinates, handling negative numbers
      const coords = coordsStr
        .replace(/,/g, ' ')
        .replace(/-/g, ' -')
        .split(/\s+/)
        .filter(s => s.length > 0)
        .map(Number)
        .filter(n => !isNaN(n));

      // Parse based on command type
      switch (type) {
        case 'M':
        case 'm':
          // Moveto can have multiple coordinate pairs (implicit linetos)
          for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              commands.push({
                type: i === 0 ? type : (type === 'M' ? 'L' : 'l'),
                x: coords[i],
                y: coords[i + 1]
              });
            }
          }
          break;

        case 'L':
        case 'l':
          // Lineto can have multiple coordinate pairs
          for (let i = 0; i < coords.length; i += 2) {
            if (i + 1 < coords.length) {
              commands.push({ type, x: coords[i], y: coords[i + 1] });
            }
          }
          break;

        case 'C':
        case 'c':
          // Cubic bezier - 6 coordinates per curve
          for (let i = 0; i < coords.length; i += 6) {
            if (i + 5 < coords.length) {
              commands.push({
                type,
                x1: coords[i], y1: coords[i + 1],
                x2: coords[i + 2], y2: coords[i + 3],
                x: coords[i + 4], y: coords[i + 5]
              });
            }
          }
          break;

        case 'Z':
        case 'z':
          commands.push({ type: 'Z' });
          break;
      }
    }

    return commands;
  }

  /**
   * Apply kerning pairs to font
   */
  private static applyKerning(
    font: opentype.Font,
    kerningPairs: Record<string, number>
  ): void {
    // opentype.js doesn't have direct kerning support in the API
    // We need to manually create GPOS table

    // For now, we'll store kerning info for future GPOS table generation
    // This is a simplified version - full GPOS implementation is complex

    // Create basic kerning table
    Object.entries(kerningPairs).forEach(([pair, value]) => {
      if (pair.length === 2) {
        const [left, right] = pair.split('');
        const leftGlyph = font.charToGlyph(left);
        const rightGlyph = font.charToGlyph(right);

        if (leftGlyph && rightGlyph) {
          // Note: This is a simplified approach
          // Full GPOS kerning requires more complex table building
          console.log(`Kerning ${left}${right}: ${value}`);
        }
      }
    });
  }

  /**
   * Convert ArrayBuffer to Blob for download
   */
  static fontBufferToBlob(buffer: ArrayBuffer, format: string = 'ttf'): Blob {
    const mimeTypes: Record<string, string> = {
      ttf: 'font/ttf',
      otf: 'font/otf',
      woff: 'font/woff',
      woff2: 'font/woff2',
    };

    return new Blob([buffer], { type: mimeTypes[format] || 'font/ttf' });
  }

  /**
   * Trigger download of font file
   */
  static downloadFont(buffer: ArrayBuffer, fileName: string, format: string = 'ttf'): void {
    const blob = this.fontBufferToBlob(buffer, format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `${fileName}.${format}`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Simplified function for quick font generation
 */
export async function generateFont(config: FontGenerationConfig): Promise<ArrayBuffer> {
  return FontGenerator.generateFont(config);
}

/**
 * Generate and download font in one step
 */
export async function generateAndDownloadFont(
  config: FontGenerationConfig,
  format: string = 'ttf'
): Promise<void> {
  const buffer = await generateFont(config);
  const fileName = config.metadata.name || 'custom-font';
  FontGenerator.downloadFont(buffer, fileName, format);
}
