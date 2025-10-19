/**
 * Image Tracing - Convert Bitmap to Vector (SVG)
 * Uses imagetracerjs for pure JavaScript tracing in the browser
 */

// @ts-ignore - imagetracerjs doesn't have TypeScript definitions
import ImageTracerModule from 'imagetracerjs';

export interface TracingOptions {
  /**
   * Color quantization - fewer colors = simpler paths
   * Default: 2 (black and white)
   */
  numberofcolors?: number;

  /**
   * Line threshold for path simplification
   * Higher = simpler paths, lower = more detail
   * Default: 1
   */
  ltres?: number;

  /**
   * Quadratic spline threshold
   * Higher = simpler curves, lower = more detail
   * Default: 1
   */
  qtres?: number;

  /**
   * Minimum path length to keep (in pixels)
   * Paths shorter than this are removed
   * Default: 8
   */
  pathomit?: number;

  /**
   * Corner threshold
   * Lower = sharper corners, higher = rounder
   * Default: 60
   */
  rightangleenhance?: number;
}

export class ImageTracer {
  /**
   * Trace ImageData to SVG string
   */
  static async trace(
    imageData: ImageData,
    options: TracingOptions = {}
  ): Promise<string> {
    // HIGH QUALITY settings - maximize curve smoothness
    const opts = {
      // Core quality settings
      numberofcolors: 2,        // Black and white only

      // Curve quality - MOST IMPORTANT for smoothness
      ltres: 0.01,              // Very LOW = more detail, smoother lines
      qtres: 0.01,              // Very LOW = more control points, smoother curves

      // Path optimization
      pathomit: 1,              // Keep more paths for detail

      // Curve type preference
      rightangleenhance: 0,     // No sharp corners

      // Color and sampling
      colorsampling: 0,         // Precise color sampling (0 = best quality)
      mincolorratio: 0,         // Keep all colors
      colorquantcycles: 3,      // More color quantization cycles

      // Layering
      layering: 0,              // Sequential layering (better for fonts)

      // Stroke settings
      strokewidth: 0,           // No strokes

      // Blur and smoothing - let the algorithm handle it
      blurradius: 0,            // No blur - work with clean edges
      blurdelta: 0,             // No blur delta

      // Other quality settings
      scale: 1,                 // No scaling
      roundcoords: 0,           // Don't round - keep precision
      lcpr: 0,                  // Line control point radius - 0 for smoothest
      qcpr: 0,                  // Quad control point radius - 0 for smoothest

      ...options,
    };

    try {
      // ImageTracerModule is already an instance (module.exports = new ImageTracer())
      // So we call the method directly on the imported module
      const svgString = ImageTracerModule.imagedataToSVG(imageData, opts);

      return svgString;
    } catch (error) {
      console.error('Image tracing failed:', error);
      throw new Error(`Failed to trace image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract SVG path data from full SVG string
   * Returns only the path 'd' attribute value
   *
   * For font generation, we want the CHARACTER shapes (dark/ink parts),
   * not the background or interior holes (which should be counter-paths)
   */
  static extractPathData(svgString: string): string {
    // Parse SVG to extract path data
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    const paths = doc.querySelectorAll('path');

    if (paths.length === 0) {
      throw new Error('No paths found in SVG');
    }

    // imagetracerjs with 2 colors creates paths for BOTH colors
    // We need to identify which color represents the character (ink) vs background (paper)
    // Strategy: Get all filled paths and find the darkest color

    const pathsWithColors: Array<{path: string, color: string, brightness: number}> = [];

    paths.forEach(path => {
      const d = path.getAttribute('d');
      const fill = path.getAttribute('fill');

      // Only include paths that have fill (not just stroke)
      if (d && fill && fill !== 'none' && fill !== 'transparent') {
        // Calculate brightness of the fill color
        const brightness = this.getColorBrightness(fill);
        pathsWithColors.push({ path: d, color: fill, brightness });
      }
    });

    if (pathsWithColors.length === 0) {
      // If no filled paths found, take all paths as fallback
      console.warn('No filled paths found, using all paths');
      const allPaths: string[] = [];
      paths.forEach(path => {
        const d = path.getAttribute('d');
        if (d) allPaths.push(d);
      });
      return allPaths.join(' ');
    }

    // Group paths by similar brightness (allow small variance for anti-aliasing)
    const colorGroups = new Map<number, string[]>();
    pathsWithColors.forEach(({path, brightness}) => {
      // Round brightness to nearest 50 to group similar colors
      const groupKey = Math.round(brightness / 50) * 50;
      if (!colorGroups.has(groupKey)) {
        colorGroups.set(groupKey, []);
      }
      colorGroups.get(groupKey)!.push(path);
    });

    // Find the darkest color group (lowest brightness = darkest)
    const sortedGroups = Array.from(colorGroups.entries()).sort((a, b) => a[0] - b[0]);
    const darkestGroup = sortedGroups[0];

    console.log(`Found ${pathsWithColors.length} filled paths in ${colorGroups.size} color groups`);
    console.log(`Using darkest color group (brightness: ${darkestGroup[0]}) with ${darkestGroup[1].length} paths`);

    return darkestGroup[1].join(' ');
  }

  /**
   * Calculate brightness of a color (0 = black, 255 = white)
   * Supports rgb(), rgba(), hex, and named colors
   */
  private static getColorBrightness(color: string): number {
    // Handle RGB/RGBA format: rgb(r,g,b) or rgba(r,g,b,a)
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      // Use perceived brightness formula
      return (r * 0.299 + g * 0.587 + b * 0.114);
    }

    // Handle hex format: #RGB or #RRGGBB
    const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      let hex = hexMatch[1];
      // Expand shorthand hex
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (r * 0.299 + g * 0.587 + b * 0.114);
    }

    // Handle named colors (common ones)
    const namedColors: Record<string, number> = {
      'black': 0,
      'white': 255,
      'gray': 128,
      'grey': 128,
      'silver': 192,
      'red': 76, // Approximate perceived brightness
      'blue': 29,
      'green': 150,
    };

    const lowercaseColor = color.toLowerCase();
    if (lowercaseColor in namedColors) {
      return namedColors[lowercaseColor];
    }

    // Default to medium brightness if we can't parse
    console.warn(`Could not parse color: ${color}, assuming medium brightness`);
    return 128;
  }

  /**
   * Smooth SVG path data to reduce jagged edges while preserving shape
   * Uses path simplification and curve optimization
   */
  static smoothPathData(pathData: string, tolerance: number = 2): string {
    // Parse the path into commands
    const commands = this.parseSVGPathToCommands(pathData);

    if (commands.length === 0) return pathData;

    // Simplify path by removing redundant points
    const simplified = this.simplifyPath(commands, tolerance);

    // Convert back to path string
    return this.commandsToPathString(simplified);
  }

  /**
   * Parse SVG path string into command objects
   */
  private static parseSVGPathToCommands(pathData: string): Array<{type: string, values: number[]}> {
    const commands: Array<{type: string, values: number[]}> = [];
    const regex = /([MLHVCSQTAZ])\s*([^MLHVCSQTAZ]*)/gi;
    let match;

    while ((match = regex.exec(pathData)) !== null) {
      const type = match[1];
      const valueStr = match[2].trim();
      const values = valueStr ? valueStr.split(/[\s,]+/).map(Number).filter(n => !isNaN(n)) : [];
      commands.push({ type, values });
    }

    return commands;
  }

  /**
   * Simplify path by removing points that don't contribute to the shape
   * Uses Ramer-Douglas-Peucker algorithm concept
   */
  private static simplifyPath(
    commands: Array<{type: string, values: number[]}>,
    tolerance: number
  ): Array<{type: string, values: number[]}> {
    if (commands.length <= 2) return commands;

    // Extract points from commands
    const points: Array<{x: number, y: number, cmd: any}> = [];
    let currentX = 0, currentY = 0;

    commands.forEach(cmd => {
      switch(cmd.type.toUpperCase()) {
        case 'M':
          currentX = cmd.values[0];
          currentY = cmd.values[1];
          points.push({x: currentX, y: currentY, cmd});
          break;
        case 'L':
          currentX = cmd.values[0];
          currentY = cmd.values[1];
          points.push({x: currentX, y: currentY, cmd});
          break;
        case 'C':
          // For curves, only keep the end point
          currentX = cmd.values[4];
          currentY = cmd.values[5];
          points.push({x: currentX, y: currentY, cmd});
          break;
        case 'Z':
          points.push({x: points[0].x, y: points[0].y, cmd});
          break;
      }
    });

    // Apply Douglas-Peucker simplification
    const simplified = this.douglasPeucker(points, tolerance);

    // Rebuild commands from simplified points
    return simplified.map(p => p.cmd);
  }

  /**
   * Douglas-Peucker line simplification algorithm
   */
  private static douglasPeucker(
    points: Array<{x: number, y: number, cmd: any}>,
    tolerance: number
  ): Array<{x: number, y: number, cmd: any}> {
    if (points.length <= 2) return points;

    // Find point with maximum distance from line
    let maxDist = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.perpendicularDistance(points[i], start, end);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    // If max distance is greater than tolerance, recursively simplify
    if (maxDist > tolerance) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const right = this.douglasPeucker(points.slice(maxIndex), tolerance);
      return left.slice(0, -1).concat(right);
    } else {
      return [start, end];
    }
  }

  /**
   * Calculate perpendicular distance from point to line
   */
  private static perpendicularDistance(
    point: {x: number, y: number},
    lineStart: {x: number, y: number},
    lineEnd: {x: number, y: number}
  ): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    if (dx === 0 && dy === 0) {
      return Math.sqrt(
        Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
      );
    }

    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
    const clampedT = Math.max(0, Math.min(1, t));
    const projX = lineStart.x + clampedT * dx;
    const projY = lineStart.y + clampedT * dy;

    return Math.sqrt(
      Math.pow(point.x - projX, 2) + Math.pow(point.y - projY, 2)
    );
  }

  /**
   * Convert commands back to path string
   */
  private static commandsToPathString(commands: Array<{type: string, values: number[]}>): string {
    return commands.map(cmd => {
      return cmd.type + ' ' + cmd.values.join(' ');
    }).join(' ');
  }

  /**
   * Get SVG bounding box from path data
   */
  static getPathBounds(pathData: string): {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    width: number;
    height: number;
  } {
    // Create temporary SVG to calculate bounds
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    path.setAttribute('d', pathData);
    svg.appendChild(path);
    document.body.appendChild(svg);

    try {
      const bbox = path.getBBox();

      return {
        xMin: bbox.x,
        yMin: bbox.y,
        xMax: bbox.x + bbox.width,
        yMax: bbox.y + bbox.height,
        width: bbox.width,
        height: bbox.height,
      };
    } finally {
      document.body.removeChild(svg);
    }
  }

  /**
   * Trace with automatic quality adjustment
   * Tries higher quality first, falls back to lower quality if too complex
   */
  static async traceAdaptive(imageData: ImageData): Promise<string> {
    // Try high quality first
    try {
      return await this.trace(imageData, {
        ltres: 0.3,
        qtres: 0.3,
        pathomit: 2,
      });
    } catch (error) {
      console.warn('High quality tracing failed, trying medium quality...');
    }

    // Try medium quality
    try {
      return await this.trace(imageData, {
        ltres: 0.5,
        qtres: 0.5,
        pathomit: 4,
      });
    } catch (error) {
      console.warn('Medium quality tracing failed, trying low quality...');
    }

    // Fall back to low quality
    return await this.trace(imageData, {
      ltres: 1.0,
      qtres: 1.0,
      pathomit: 8,
    });
  }
}

/**
 * Simplified function for quick tracing
 */
export async function traceImage(imageData: ImageData): Promise<string> {
  return ImageTracer.trace(imageData);
}

/**
 * Trace and extract path data in one step
 */
export async function traceToPathData(imageData: ImageData): Promise<string> {
  const svgString = await ImageTracer.trace(imageData);
  const pathData = ImageTracer.extractPathData(svgString);

  // Return the high-quality traced path directly
  // With ltres=0.01 and qtres=0.01, we get maximum curve smoothness
  return pathData;
}
