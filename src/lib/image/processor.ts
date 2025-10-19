/**
 * Client-Side Image Processing
 * Uses Canvas API for all image manipulation in the browser
 */

export interface ImageBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class ImageProcessor {
  /**
   * Load image from URL or data URL
   */
  static async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Extract a character region from source image
   */
  static extractCharacter(
    sourceImage: HTMLImageElement,
    bounds: ImageBounds
  ): ImageData {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    const width = bounds.x2 - bounds.x1;
    const height = bounds.y2 - bounds.y1;

    canvas.width = width;
    canvas.height = height;

    // Draw cropped region
    ctx.drawImage(
      sourceImage,
      bounds.x1, bounds.y1, width, height,
      0, 0, width, height
    );

    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Apply threshold to convert image to black & white
   */
  static threshold(imageData: ImageData, threshold = 128): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    for (let i = 0; i < data.length; i += 4) {
      // Calculate grayscale value
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

      // Apply threshold
      const value = avg > threshold ? 255 : 0;

      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      // Alpha channel (i+3) remains unchanged
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Automatic threshold using Otsu's method
   * Finds optimal threshold that minimizes intra-class variance
   */
  static autoThreshold(imageData: ImageData): ImageData {
    const data = imageData.data;
    const histogram = new Array(256).fill(0);

    // Build histogram
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
      histogram[gray]++;
    }

    // Calculate total number of pixels
    const total = imageData.width * imageData.height;

    // Calculate sum of all grayscale values
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumBackground = 0;
    let weightBackground = 0;
    let maxVariance = 0;
    let optimalThreshold = 0;

    // Find optimal threshold
    for (let threshold = 0; threshold < 256; threshold++) {
      weightBackground += histogram[threshold];
      if (weightBackground === 0) continue;

      const weightForeground = total - weightBackground;
      if (weightForeground === 0) break;

      sumBackground += threshold * histogram[threshold];

      const meanBackground = sumBackground / weightBackground;
      const meanForeground = (sum - sumBackground) / weightForeground;

      // Calculate between-class variance
      const variance = weightBackground * weightForeground *
        Math.pow(meanBackground - meanForeground, 2);

      if (variance > maxVariance) {
        maxVariance = variance;
        optimalThreshold = threshold;
      }
    }

    // Apply the optimal threshold
    return this.threshold(imageData, optimalThreshold);
  }

  /**
   * Invert colors (useful for white-on-black text)
   */
  static invert(imageData: ImageData): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];       // R
      data[i + 1] = 255 - data[i + 1]; // G
      data[i + 2] = 255 - data[i + 2]; // B
      // Alpha channel (i+3) remains unchanged
    }

    return new ImageData(data, imageData.width, imageData.height);
  }

  /**
   * Remove whitespace/padding around character
   */
  static trim(imageData: ImageData, threshold = 240): ImageData {
    const { width, height, data } = imageData;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    // Find bounding box of non-white pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;

        if (avg < threshold) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // If no content found, return original
    if (maxX < minX || maxY < minY) {
      return imageData;
    }

    // Add small padding
    const padding = 2;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);

    const trimmedWidth = maxX - minX + 1;
    const trimmedHeight = maxY - minY + 1;

    // Create trimmed image
    const canvas = document.createElement('canvas');
    canvas.width = trimmedWidth;
    canvas.height = trimmedHeight;
    const ctx = canvas.getContext('2d')!;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(
      tempCanvas,
      minX, minY, trimmedWidth, trimmedHeight,
      0, 0, trimmedWidth, trimmedHeight
    );

    return ctx.getImageData(0, 0, trimmedWidth, trimmedHeight);
  }

  /**
   * Smooth/blur image to reduce jagged edges
   * Uses Gaussian blur for high-quality anti-aliasing
   */
  static smooth(imageData: ImageData, radius: number = 2): ImageData {
    const { width, height } = imageData;

    // Create a temporary canvas for the blur
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Put original image data
    ctx.putImageData(imageData, 0, 0);

    // Apply multiple passes of blur for stronger smoothing
    // CSS filter uses Gaussian blur which is much smoother
    const blurAmount = radius * 2; // Convert radius to blur pixels
    ctx.filter = `blur(${blurAmount}px)`;

    // Draw the image onto itself with blur
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0);

    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Apply aggressive smoothing with multiple blur passes
   * For extremely smooth results
   */
  static superSmooth(imageData: ImageData): ImageData {
    // Apply multiple blur passes for ultra-smooth results
    let result = imageData;

    // First pass: strong blur
    result = this.smooth(result, 3);

    // Second pass: medium blur
    result = this.smooth(result, 2);

    return result;
  }

  /**
   * Upscale image for better quality tracing
   * Larger images trace with smoother results
   */
  static upscale(imageData: ImageData, scale: number = 2): ImageData {
    const { width, height } = imageData;
    const newWidth = width * scale;
    const newHeight = height * scale;

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d')!;

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Put original image data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    // Draw upscaled
    ctx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, newWidth, newHeight);

    return ctx.getImageData(0, 0, newWidth, newHeight);
  }

  /**
   * Convert ImageData to data URL
   */
  static imageDataToDataURL(imageData: ImageData): string {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  /**
   * Get image dimensions without loading full image
   */
  static async getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    const img = await this.loadImage(url);
    return { width: img.width, height: img.height };
  }
}
