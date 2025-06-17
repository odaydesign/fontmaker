import { NextRequest, NextResponse } from 'next/server';
import { generateFontId } from '@/utils/helpers';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

interface FontGenerationRequest {
  characterMappings: any[];
  sourceImages: any[];
  metadata: {
    name: string;
    style?: string;
    weight?: string;
    author?: string;
  };
  format: string;
}

// Simple font generation using FontForge script with placeholder data
async function generateSimpleFont(request: FontGenerationRequest, fontId: string) {
  const { characterMappings, sourceImages, metadata, format = 'ttf' } = request;
  
  console.log('🔧 Creating font directories...');
  
  // Create storage directory
  const storageDir = path.join(process.cwd(), 'font-storage', fontId);
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  const outputDir = path.join(storageDir, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const charsDir = path.join(storageDir, 'chars');
  if (!fs.existsSync(charsDir)) {
    fs.mkdirSync(charsDir, { recursive: true });
  }
  
  console.log('📁 Directories created successfully');
  
  // For the v4 demo, create a simple test font with placeholder character images
  const fontName = metadata.name.replace(/\s+/g, '_').toLowerCase();
  const outputPath = path.join(outputDir, `${fontName}.${format}`);
  
  console.log('🎨 Creating placeholder character images...');
  
  // Create character data for A-Z
  const characters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  const characterData = characters.map((char, index) => {
    // For demo purposes, create a simple SVG for each character
    const charFilePath = path.join(charsDir, `char_${char.charCodeAt(0)}.svg`);
    
    // Create a simple SVG with the character shape
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect x="50" y="50" width="400" height="400" fill="black"/>
  <text x="250" y="300" font-family="Arial" font-size="300" text-anchor="middle" fill="white">${char}</text>
</svg>`;
    
    fs.writeFileSync(charFilePath, svgContent);
    
    return {
      char: char,
      unicode: char.charCodeAt(0),
      path: charFilePath,
      width: 500,
      height: 500
    };
  });
  
  const charDataPath = path.join(storageDir, 'characters.json');
  fs.writeFileSync(charDataPath, JSON.stringify(characterData, null, 2));
  
  console.log(`✅ Created ${characters.length} character files`);
  console.log('🚀 Starting FontForge process...');
  
  // Use FontForge to generate the font
  return new Promise<{ success: boolean; error?: string; fontPath?: string }>((resolve) => {
    const fontforgeProcess = spawn('fontforge', [
      '-script',
      path.join(process.cwd(), 'scripts', 'generate_font.py'),
      charDataPath,
      path.join(outputDir, fontName),
      metadata.name || 'GeneratedFont',
      format
    ]);
    
    let output = '';
    let error = '';
    
    fontforgeProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('FontForge stdout:', data.toString());
    });
    
    fontforgeProcess.stderr.on('data', (data) => {
      error += data.toString();
      console.log('FontForge stderr:', data.toString());
    });
    
    fontforgeProcess.on('close', (code) => {
      console.log(`FontForge process exited with code ${code}`);
      console.log('Output:', output);
      console.log('Error:', error);
      
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve({ success: true, fontPath: outputPath });
      } else {
        resolve({ 
          success: false, 
          error: `FontForge generation failed (code ${code}): ${error || output}` 
        });
      }
    });
    
    fontforgeProcess.on('error', (err) => {
      console.error('FontForge process error:', err);
      resolve({ success: false, error: `Process error: ${err.message}` });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Font generation request received');
    
    const body = await request.json();
    const { characterMappings, sourceImages, metadata, format = 'ttf' } = body;
    
    console.log('📋 Request data:', { 
      characterCount: characterMappings?.length, 
      imageCount: sourceImages?.length,
      metadata,
      format 
    });
    
    if (!metadata || !metadata.name) {
      return NextResponse.json(
        { error: 'Missing font name in metadata' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID for this font
    const fontId = generateFontId();
    console.log(`🆔 Generated font ID: ${fontId}`);
    
    // Generate the font
    console.log('⚙️ Starting font generation...');
    const result = await generateSimpleFont({ characterMappings, sourceImages, metadata, format }, fontId);
    
    if (!result.success) {
      console.error('❌ Font generation failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'Font generation failed' },
        { status: 500 }
      );
    }
    
    console.log('✅ Font generation successful!');
    
    return NextResponse.json({
      success: true,
      fontId,
      downloadUrl: `/api/fonts/download-direct/${fontId}?format=${format}`,
      metadata: {
        name: metadata.name,
        style: metadata.style || 'Regular',
        weight: metadata.weight || 'Normal',
        author: metadata.author || 'Unknown'
      },
      localPath: result.fontPath,
      message: 'Font generated successfully using FontForge!'
    });
  } catch (error) {
    console.error('💥 Error generating font:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 