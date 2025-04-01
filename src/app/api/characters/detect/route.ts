import { NextRequest, NextResponse } from 'next/server';
import { detectCharactersInImage } from '@/services/characterDetectionService';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get temporary storage path
function getTempStoragePath(): string {
  return path.join(process.cwd(), 'font-storage', 'temp');
}

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }
    
    // Create a unique directory for this detection session
    const sessionId = uuidv4();
    const outputDir = path.join(getTempStoragePath(), sessionId);
    
    // Detect characters
    const detectedCharacters = await detectCharactersInImage(imageUrl, outputDir);
    
    return NextResponse.json({
      success: true,
      sessionId,
      detectedCharacters
    });
  } catch (error) {
    console.error('Error detecting characters:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Character detection failed' },
      { status: 500 }
    );
  }
} 