/**
 * Professional vectorization using Potrace via server API
 * Potrace produces industry-standard quality vectors (same as FontForge)
 */

export interface PotraceSettings {
  turdsize?: number;      // Suppress speckles of this size (default: 2)
  alphamax?: number;      // Corner threshold (0-1.334, default: 1.0)
  opttolerance?: number;  // Curve optimization tolerance (default: 0.2)
  turnpolicy?: 'black' | 'white' | 'left' | 'right' | 'minority' | 'majority' | 'random';
}

export class PotraceTracer {
  /**
   * Trace ImageData to SVG using potrace (server-side)
   */
  static async trace(
    imageData: ImageData,
    settings: PotraceSettings = {}
  ): Promise<string> {
    // Send raw ImageData to server
    // Convert Uint8ClampedArray to regular array for JSON serialization
    const dataArray = Array.from(imageData.data);

    // Call server API
    const response = await fetch('/api/trace/potrace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        width: imageData.width,
        height: imageData.height,
        data: dataArray,
        settings,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Potrace tracing failed');
    }

    const result = await response.json();
    return result.svg;
  }

  /**
   * Extract SVG path data from potrace SVG output
   */
  static extractPathData(svgString: string): string {
    console.log('=== EXTRACTING PATH DATA ===');
    console.log('SVG string length:', svgString.length);
    console.log('SVG preview:', svgString.substring(0, 200));

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    // Check for parse errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      console.error('SVG parse error:', parserError.textContent);
      throw new Error('Failed to parse SVG');
    }

    // Potrace wraps paths in a <g> element with transforms
    // We need to look inside the <g> tag
    const paths = doc.querySelectorAll('path');
    console.log('Found paths:', paths.length);

    if (paths.length === 0) {
      throw new Error('No paths found in SVG');
    }

    // Get the viewBox to understand coordinate system
    const svg = doc.querySelector('svg');
    const viewBox = svg?.getAttribute('viewBox');
    console.log('ViewBox:', viewBox);

    // Get the transform from the <g> element
    const g = doc.querySelector('g');
    const transform = g?.getAttribute('transform');
    console.log('Group transform:', transform);

    // Potrace creates clean, single-path outputs
    // Combine all paths
    const pathDataArray: string[] = [];
    paths.forEach((path, index) => {
      const d = path.getAttribute('d');
      if (d) {
        console.log(`Path ${index} length:`, d.length);
        console.log(`Path ${index} preview:`, d.substring(0, 100));
        pathDataArray.push(d);
      }
    });

    const result = pathDataArray.join(' ');
    console.log('Total extracted path length:', result.length);
    console.log('Extracted path preview:', result.substring(0, 200));

    return result;
  }
}

/**
 * Convenience function to trace and extract path data
 */
export async function traceWithPotrace(
  imageData: ImageData,
  settings?: PotraceSettings
): Promise<string> {
  const svg = await PotraceTracer.trace(imageData, settings);
  return PotraceTracer.extractPathData(svg);
}
