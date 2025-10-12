import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Convert ImageData to PBM (Portable Bitmap) format
 * PBM is a simple text-based format that potrace handles perfectly
 */
function imageToPBM(width: number, height: number, data: number[]): string {
  // PBM header (P1 = ASCII, P4 = binary)
  // We'll use P1 (ASCII) for simplicity
  let pbm = `P1\n${width} ${height}\n`;

  // Convert pixel data to 1-bit (0 = white, 1 = black)
  for (let i = 0; i < data.length; i += 4) {
    // Calculate grayscale
    const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
    // Threshold: below 128 = black (1), above = white (0)
    pbm += gray < 128 ? '1' : '0';

    // Add newline every 70 characters for readability
    if ((i / 4 + 1) % 70 === 0) {
      pbm += '\n';
    }
  }

  return pbm;
}

/**
 * Professional vectorization using potrace
 * Potrace is the industry-standard bitmap-to-vector converter used by FontForge
 */
export async function POST(request: NextRequest) {
  let inputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    // Get image data from request
    const { width, height, data, settings } = await request.json();

    if (!width || !height || !data) {
      return NextResponse.json(
        { error: 'Invalid image data provided' },
        { status: 400 }
      );
    }

    // Create temporary files
    const tempDir = os.tmpdir();
    const timestamp = Date.now();
    inputPath = path.join(tempDir, `potrace-input-${timestamp}.pbm`);
    outputPath = path.join(tempDir, `potrace-output-${timestamp}.svg`);

    // Convert ImageData to PBM format
    const pbmData = imageToPBM(width, height, data);
    await writeFile(inputPath, pbmData, 'utf-8');

    // Build potrace command with quality settings
    const turdsize = settings?.turdsize || 2; // Suppress speckles (higher = more aggressive)
    const alphamax = settings?.alphamax || 1.0; // Corner threshold (0-1.334, lower = sharper corners)
    const opttolerance = settings?.opttolerance || 0.2; // Curve optimization (0-infinity, lower = more accurate)
    const turnpolicy = settings?.turnpolicy || 'minority'; // black, white, left, right, minority, majority, random

    const potraceCmd = `potrace "${inputPath}" -s -o "${outputPath}" \
      --turdsize ${turdsize} \
      --alphamax ${alphamax} \
      --opttolerance ${opttolerance} \
      --turnpolicy ${turnpolicy}`;

    // Execute potrace
    await execAsync(potraceCmd);

    // Read SVG output
    const { readFile } = await import('fs/promises');
    const svgContent = await readFile(outputPath, 'utf-8');

    // Debug logging
    console.log('=== POTRACE OUTPUT ===');
    console.log('SVG length:', svgContent.length);
    console.log('First 500 chars:', svgContent.substring(0, 500));

    // Check if SVG contains path data
    const hasPath = svgContent.includes('<path');
    console.log('Contains path element:', hasPath);

    if (hasPath) {
      const pathMatch = svgContent.match(/<path[^>]*d="([^"]+)"/);
      if (pathMatch) {
        console.log('Path d attribute length:', pathMatch[1].length);
        console.log('Path d preview:', pathMatch[1].substring(0, 100));
      }
    }

    // Clean up temp files
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);

    return NextResponse.json({
      success: true,
      svg: svgContent,
    });
  } catch (error) {
    // Clean up temp files on error
    if (inputPath) await unlink(inputPath).catch(() => {});
    if (outputPath) await unlink(outputPath).catch(() => {});

    console.error('Potrace error:', error);
    return NextResponse.json(
      {
        error: 'Vectorization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
