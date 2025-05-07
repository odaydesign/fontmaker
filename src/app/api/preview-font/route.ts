import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec);

// Create temp directory if it doesn't exist
const tempDir = path.join(process.cwd(), 'public', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    console.log('Font preview API called');
    const { adjustments } = await req.json();
    
    // Generate unique IDs for files
    const previewId = uuidv4();
    const adjustmentsFile = path.join(tempDir, `adjustments-${previewId}.json`);
    const outputFile = path.join(tempDir, `preview-${previewId}`);
    const fontName = 'HappeFontPreview';
    
    // Write adjustments to a temporary file
    fs.writeFileSync(adjustmentsFile, JSON.stringify(adjustments, null, 2));
    console.log(`Adjustments saved to ${adjustmentsFile}`);
    
    // Find the most recent charmap file from font-storage
    const fontStorageDir = path.join(process.cwd(), 'font-storage');
    let charmapFile = '';
    
    // Get font directories sorted by most recent first
    if (fs.existsSync(fontStorageDir)) {
      console.log(`Checking font storage directory: ${fontStorageDir}`);
      const fontDirs = fs.readdirSync(fontStorageDir)
        .filter(dir => dir.startsWith('font_'))
        .map(dir => ({
          dir,
          time: Number(dir.split('_')[1])
        }))
        .sort((a, b) => b.time - a.time); // Sort by newest first
      
      console.log(`Found ${fontDirs.length} font directories`);
      
      if (fontDirs.length > 0) {
        const newestDir = fontDirs[0].dir;
        const possibleCharmapFile = path.join(fontStorageDir, newestDir, 'charmap.json');
        
        if (fs.existsSync(possibleCharmapFile)) {
          charmapFile = possibleCharmapFile;
          console.log(`Using charmap file from newest font: ${charmapFile}`);
        }
      }
    } else {
      console.log(`Font storage directory not found: ${fontStorageDir}`);
    }
    
    // If no charmap found in font-storage, check temp-fonts
    if (!charmapFile) {
      const tempFontsDir = path.join(process.cwd(), 'temp-fonts');
      console.log(`Checking temp-fonts directory: ${tempFontsDir}`);
      
      if (fs.existsSync(tempFontsDir)) {
        const tempFontDirs = fs.readdirSync(tempFontsDir)
          .filter(dir => dir.startsWith('preview-'));
        
        console.log(`Found ${tempFontDirs.length} preview directories`);
        
        if (tempFontDirs.length > 0) {
          // Just use the first one we find
          const firstDir = tempFontDirs[0];
          const possibleCharmapFile = path.join(tempFontsDir, firstDir, 'charmap.json');
          
          if (fs.existsSync(possibleCharmapFile)) {
            charmapFile = possibleCharmapFile;
            console.log(`Using charmap file from temp fonts: ${charmapFile}`);
          }
        }
      } else {
        console.log(`Temp fonts directory not found: ${tempFontsDir}`);
      }
    }
    
    // If still no charmap found, return error
    if (!charmapFile) {
      console.error('No character map file found');
      return NextResponse.json(
        { error: 'No character map file found in font-storage or temp-fonts' },
        { status: 404 }
      );
    }
    
    // Check if FontForge is installed
    try {
      console.log('Checking if FontForge is installed...');
      await execPromise('which fontforge');
      console.log('FontForge is installed');
    } catch (error) {
      console.error('FontForge not found in PATH:', error);
      return NextResponse.json(
        { error: 'FontForge is not installed or not in PATH' },
        { status: 500 }
      );
    }
    
    // Run the font generation script
    console.log('Generating preview font...');
    const fontFormat = 'woff2'; // woff2 is more compact for web use
    
    // Check if the script exists
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_font.py');
    if (!fs.existsSync(scriptPath)) {
      console.error(`Font generation script not found: ${scriptPath}`);
      return NextResponse.json(
        { error: `Font generation script not found: ${scriptPath}` },
        { status: 500 }
      );
    }
    
    console.log(`Font generation script found: ${scriptPath}`);
    
    const cmd = `cd "${process.cwd()}" && fontforge -script ${scriptPath} "${charmapFile}" "${outputFile}" "${fontName}" ${fontFormat} "${adjustmentsFile}" 2>&1`;
    
    console.log(`Executing: ${cmd}`);
    let stdout, stderr;
    
    try {
      const result = await execPromise(cmd);
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error: any) {
      console.error('Font generation process error:', error);
      return NextResponse.json(
        { 
          error: 'Font generation process failed', 
          details: error.message,
          stdout: error.stdout,
          stderr: error.stderr
        },
        { status: 500 }
      );
    }
    
    console.log('Font generation output:', stdout);
    if (stderr) {
      console.error('Font generation errors:', stderr);
    }
    
    // Check if the font file was created
    const fontFile = `${outputFile}.${fontFormat}`;
    if (!fs.existsSync(fontFile)) {
      console.error(`Font file not created: ${fontFile}`);
      return NextResponse.json(
        { 
          error: 'Font generation failed - output file not created',
          stdout,
          stderr,
          fontFile
        },
        { status: 500 }
      );
    }
    
    console.log(`Font file created: ${fontFile} (${fs.statSync(fontFile).size} bytes)`);
    
    // Return the URL to the font file
    const fontUrl = `/temp/preview-${previewId}.${fontFormat}`;
    
    return NextResponse.json({
      success: true,
      fontUrl,
      message: 'Preview font generated successfully'
    });
    
  } catch (error: any) {
    console.error('Error generating preview font:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate preview font',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
} 