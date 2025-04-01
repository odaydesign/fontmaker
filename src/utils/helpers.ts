import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

/**
 * Generates a unique ID for a font
 */
export function generateFontId(): string {
  return `font_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

/**
 * Ensures a directory exists; creates it if it doesn't
 */
export function ensureDirectoryExists(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

/**
 * Gets the storage path for fonts
 */
export function getFontStoragePath(): string {
  const storageDir = process.env.FONT_STORAGE_DIR || './font-storage';
  ensureDirectoryExists(storageDir);
  return storageDir;
}

/**
 * Converts a data URL to a buffer
 */
export function dataURLToBuffer(dataURL: string): Buffer {
  const matches = dataURL.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid data URL');
  }
  
  const base64Data = matches[2];
  return Buffer.from(base64Data, 'base64');
}

/**
 * Saves an image from a data URL to a file
 */
export async function saveImageFromDataURL(dataURL: string, filePath: string): Promise<void> {
  const buffer = dataURLToBuffer(dataURL);
  fs.writeFileSync(filePath, buffer);
}

/**
 * Creates a temporary directory and returns its path
 */
export function createTempDirectory(): string {
  const tempPath = path.join(getFontStoragePath(), 'temp', randomUUID());
  ensureDirectoryExists(tempPath);
  return tempPath;
} 