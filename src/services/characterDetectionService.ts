import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface DetectedCharacter {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  contour?: Array<{x: number, y: number}>;  // For polygon-based mapping
  croppedImageUrl: string;
  assignedChar?: string;
}

export async function detectCharactersInImage(
  imageUrl: string,
  outputDir: string
): Promise<DetectedCharacter[]> {
  try {
    // 1. Load and preprocess the image
    const imageBuffer = await loadImage(imageUrl);
    
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width = 800, height = 600 } = metadata;
    
    // 2. Threshold the image to black and white for easier processing
    const thresholdedImageBuffer = await sharp(imageBuffer)
      .grayscale()
      .threshold(128)
      .raw()
      .toBuffer();
    
    // Save a debug image to see the threshold result
    await sharp(thresholdedImageBuffer, {
      raw: {
        width: width,
        height: height,
        channels: 1
      }
    })
      .toColorspace('b-w')
      .toFile(path.join(outputDir, 'thresholded.png'));
    
    // 3. Find potential character regions using a more practical approach
    const regions = findCharacterRegions(thresholdedImageBuffer, width, height);
    
    // 4. Extract each region as a character
    const results: DetectedCharacter[] = [];
    
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      
      // Create a padded bounding box
      const padding = 2;
      const left = Math.max(0, region.x - padding);
      const top = Math.max(0, region.y - padding); 
      const extractWidth = Math.min(width - left, region.width + padding * 2);
      const extractHeight = Math.min(height - top, region.height + padding * 2);
      
      try {
        // Extract character image
        const charImage = await sharp(imageBuffer)
          .extract({ left, top, width: extractWidth, height: extractHeight })
          .toBuffer();
        
        // Save to file
        const fileName = `char_${i}.png`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, charImage);
        
        // Convert to data URL for frontend
        const base64 = charImage.toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;
        
        results.push({
          id: `char_${i}`,
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          croppedImageUrl: dataUrl
        });
      } catch (error) {
        console.error(`Error extracting character ${i}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in character detection:', error);
    throw error;
  }
}

// Load image from URL or data URL
async function loadImage(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('data:')) {
    // Handle data URL
    const base64Data = imageUrl.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  } else {
    // Handle regular URL - simplistic approach, improve with proper fetch for production
    try {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error fetching image:', error);
      throw error;
    }
  }
}

// A more practical implementation of character region detection
// This uses a simple histogram-based approach to find character regions
function findCharacterRegions(
  imageBuffer: Buffer,
  width: number,
  height: number
): Array<{x: number, y: number, width: number, height: number}> {
  // This implementation uses vertical projection histograms to find character boundaries
  // Much better than the grid approach, but still not as good as a full connected component analysis
  
  // Create horizontal histogram (count black pixels in each row)
  const horizontalHistogram = new Array(height).fill(0);
  // Create vertical histogram (count black pixels in each column)
  const verticalHistogram = new Array(width).fill(0);
  
  // Calculate histograms
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      const pixelValue = imageBuffer[pixelIndex];
      
      // If the pixel is black (0 in our thresholded image)
      if (pixelValue < 128) {
        horizontalHistogram[y]++;
        verticalHistogram[x]++;
      }
    }
  }
  
  // Find horizontal regions with content
  const horizontalRegions: {start: number, end: number}[] = [];
  let inRegion = false;
  let regionStart = 0;
  
  // Threshold for considering a row as having content
  const hThreshold = width * 0.01; // 1% of width
  
  for (let y = 0; y < height; y++) {
    if (!inRegion && horizontalHistogram[y] > hThreshold) {
      // Start of a region
      inRegion = true;
      regionStart = y;
    } else if (inRegion && horizontalHistogram[y] <= hThreshold) {
      // End of a region
      inRegion = false;
      horizontalRegions.push({ start: regionStart, end: y - 1 });
    }
  }
  
  // If we're still in a region at the end
  if (inRegion) {
    horizontalRegions.push({ start: regionStart, end: height - 1 });
  }
  
  // If we don't find any horizontal regions, return an empty array
  if (horizontalRegions.length === 0) {
    return [];
  }
  
  // Now find vertical regions within each horizontal region
  const characterRegions: Array<{x: number, y: number, width: number, height: number}> = [];
  
  for (const hRegion of horizontalRegions) {
    // Reset for each horizontal region
    inRegion = false;
    regionStart = 0;
    
    // Threshold for considering a column as having content
    const vThreshold = (hRegion.end - hRegion.start + 1) * 0.01; // 1% of height
    
    for (let x = 0; x < width; x++) {
      // Count black pixels in this column but only within the horizontal region
      let colSum = 0;
      for (let y = hRegion.start; y <= hRegion.end; y++) {
        const pixelIndex = y * width + x;
        const pixelValue = imageBuffer[pixelIndex];
        if (pixelValue < 128) {
          colSum++;
        }
      }
      
      if (!inRegion && colSum > vThreshold) {
        // Start of a region
        inRegion = true;
        regionStart = x;
      } else if (inRegion && colSum <= vThreshold) {
        // End of a region
        inRegion = false;
        const regionEnd = x - 1;
        
        // Calculate width and height
        const regionWidth = regionEnd - regionStart + 1;
        const regionHeight = hRegion.end - hRegion.start + 1;
        
        // Only include reasonably sized regions
        const minSize = 10;
        const maxSize = Math.max(width, height) * 0.5; // 50% of max dimension
        
        if (regionWidth >= minSize && regionHeight >= minSize && 
            regionWidth <= maxSize && regionHeight <= maxSize) {
          characterRegions.push({
            x: regionStart,
            y: hRegion.start,
            width: regionWidth,
            height: regionHeight
          });
        }
      }
    }
    
    // If we're still in a region at the end
    if (inRegion) {
      const regionEnd = width - 1;
      const regionWidth = regionEnd - regionStart + 1;
      const regionHeight = hRegion.end - hRegion.start + 1;
      
      // Only include reasonably sized regions
      const minSize = 10;
      const maxSize = Math.max(width, height) * 0.5; // 50% of max dimension
      
      if (regionWidth >= minSize && regionHeight >= minSize && 
          regionWidth <= maxSize && regionHeight <= maxSize) {
        characterRegions.push({
          x: regionStart,
          y: hRegion.start,
          width: regionWidth,
          height: regionHeight
        });
      }
    }
  }
  
  return characterRegions;
}

// This is a placeholder for future implementation with a proper CV library
// In a production app, you would integrate with OpenCV, Tesseract, or similar
export function setupCvEnvironment() {
  console.log('CV environment setup - placeholder for future implementation');
  // Future: Initialize CV library and environment here
} 