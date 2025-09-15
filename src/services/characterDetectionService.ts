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
    // Use adaptive thresholding for better character detection
    const thresholdedImageBuffer = await sharp(imageBuffer)
      .grayscale()
      .threshold(140) // Slightly higher threshold to catch lighter characters
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

// Enhanced character region detection that better handles numbers and special characters
// Uses connected component analysis and adaptive thresholds
function findCharacterRegions(
  imageBuffer: Buffer,
  width: number,
  height: number
): Array<{x: number, y: number, width: number, height: number}> {
  
  // First, apply morphological operations to clean up the image
  const cleanedBuffer = applyMorphologicalOperations(imageBuffer, width, height);
  
  // Use connected component analysis to find character regions
  const components = findConnectedComponents(cleanedBuffer, width, height);
  
  // Filter and merge components to get character regions
  const characterRegions = filterAndMergeComponents(components, width, height);
  
  return characterRegions;
}

// Apply morphological operations to clean up the image
function applyMorphologicalOperations(
  imageBuffer: Buffer,
  width: number,
  height: number
): Buffer {
  // Create a copy of the image buffer
  const result = Buffer.from(imageBuffer);
  
  // Apply erosion to remove noise
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIndex = y * width + x;
      const pixelValue = imageBuffer[pixelIndex];
      
      if (pixelValue < 128) { // Black pixel
        // Check if it's isolated (surrounded by white pixels)
        let isolated = true;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const neighborIndex = (y + dy) * width + (x + dx);
            if (imageBuffer[neighborIndex] < 128) {
              isolated = false;
              break;
            }
          }
          if (!isolated) break;
        }
        
        if (isolated) {
          result[pixelIndex] = 255; // Remove isolated pixel
        }
      }
    }
  }
  
  return result;
}

// Find connected components using flood fill algorithm
function findConnectedComponents(
  imageBuffer: Buffer,
  width: number,
  height: number
): Array<{x: number, y: number, width: number, height: number, pixels: number}> {
  const visited = new Array(width * height).fill(false);
  const components: Array<{x: number, y: number, width: number, height: number, pixels: number}> = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelIndex = y * width + x;
      
      if (!visited[pixelIndex] && imageBuffer[pixelIndex] < 128) {
        // Found a new component, flood fill it
        const component = floodFill(imageBuffer, width, height, x, y, visited);
        if (component.pixels > 0) {
          components.push(component);
        }
      }
    }
  }
  
  return components;
}

// Flood fill algorithm to find connected components
function floodFill(
  imageBuffer: Buffer,
  width: number,
  height: number,
  startX: number,
  startY: number,
  visited: boolean[]
): {x: number, y: number, width: number, height: number, pixels: number} {
  const stack = [{x: startX, y: startY}];
  let minX = startX, maxX = startX, minY = startY, maxY = startY;
  let pixelCount = 0;
  
  while (stack.length > 0) {
    const {x, y} = stack.pop()!;
    const pixelIndex = y * width + x;
    
    if (x < 0 || x >= width || y < 0 || y >= height || 
        visited[pixelIndex] || imageBuffer[pixelIndex] >= 128) {
      continue;
    }
    
    visited[pixelIndex] = true;
    pixelCount++;
    
    // Update bounding box
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    
    // Add neighbors to stack
    stack.push(
      {x: x + 1, y},
      {x: x - 1, y},
      {x, y: y + 1},
      {x, y: y - 1}
    );
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    pixels: pixelCount
  };
}

// Filter and merge components to get character regions
function filterAndMergeComponents(
  components: Array<{x: number, y: number, width: number, height: number, pixels: number}>,
  imageWidth: number,
  imageHeight: number
): Array<{x: number, y: number, width: number, height: number}> {
  
  // Filter components based on size and aspect ratio
  const filteredComponents = components.filter(comp => {
    const minSize = 5; // Reduced minimum size for small characters
    const maxSize = Math.max(imageWidth, imageHeight) * 0.6; // Increased max size
    const aspectRatio = comp.width / comp.height;
    
    // More lenient size constraints
    const sizeValid = comp.width >= minSize && comp.height >= minSize && 
                     comp.width <= maxSize && comp.height <= maxSize;
    
    // Allow wider aspect ratios for numbers and symbols
    const aspectValid = aspectRatio >= 0.1 && aspectRatio <= 10;
    
    // Require minimum pixel density (not too sparse)
    const density = comp.pixels / (comp.width * comp.height);
    const densityValid = density >= 0.1; // At least 10% of pixels should be black
    
    return sizeValid && aspectValid && densityValid;
  });
  
  // Sort components by position (top to bottom, left to right)
  filteredComponents.sort((a, b) => {
    if (Math.abs(a.y - b.y) < 10) { // Same line
      return a.x - b.x;
    }
    return a.y - b.y;
  });
  
  // Merge nearby components that might be parts of the same character
  const mergedComponents: Array<{x: number, y: number, width: number, height: number}> = [];
  
  for (const comp of filteredComponents) {
    let merged = false;
    
    for (let i = 0; i < mergedComponents.length; i++) {
      const existing = mergedComponents[i];
      
      // Check if components are close enough to merge
      const distance = Math.sqrt(
        Math.pow(comp.x - existing.x, 2) + Math.pow(comp.y - existing.y, 2)
      );
      
      const maxDistance = Math.max(comp.width, comp.height, existing.width, existing.height) * 0.5;
      
      if (distance < maxDistance) {
        // Merge components
        const newX = Math.min(comp.x, existing.x);
        const newY = Math.min(comp.y, existing.y);
        const newWidth = Math.max(comp.x + comp.width, existing.x + existing.width) - newX;
        const newHeight = Math.max(comp.y + comp.height, existing.y + existing.height) - newY;
        
        mergedComponents[i] = {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight
        };
        merged = true;
        break;
      }
    }
    
    if (!merged) {
      mergedComponents.push({
        x: comp.x,
        y: comp.y,
        width: comp.width,
        height: comp.height
      });
    }
  }
  
  return mergedComponents;
}

// This is a placeholder for future implementation with a proper CV library
// In a production app, you would integrate with OpenCV, Tesseract, or similar
export function setupCvEnvironment() {
  console.log('CV environment setup - placeholder for future implementation');
  // Future: Initialize CV library and environment here
} 