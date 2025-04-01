import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

// Bucket names
const FONTS_BUCKET = 'fonts';
const IMAGES_BUCKET = 'source-images';
const CHAR_IMAGES_BUCKET = 'character-images';

// Helper to convert data URL to file
export const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

// Upload a source image
export const uploadSourceImage = async (imageDataUrl: string, fontId: string): Promise<{ 
  success: boolean; 
  url?: string; 
  path?: string; 
  error?: string 
}> => {
  try {
    const imageId = uuidv4();
    const filename = `${imageId}.png`;
    const filepath = `${fontId}/${filename}`;
    
    // Convert data URL to file
    const file = dataURLtoFile(imageDataUrl, filename);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(filepath, file, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(IMAGES_BUCKET)
      .getPublicUrl(filepath);
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: filepath
    };
  } catch (error) {
    console.error('Error uploading source image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload image'
    };
  }
};

// Upload a character image
export const uploadCharacterImage = async (
  imageDataUrl: string, 
  fontId: string, 
  char: string
): Promise<{ 
  success: boolean; 
  url?: string; 
  path?: string; 
  error?: string 
}> => {
  try {
    const charCode = char.charCodeAt(0);
    const filename = `char_${charCode}.png`;
    const filepath = `${fontId}/${filename}`;
    
    // Convert data URL to file
    const file = dataURLtoFile(imageDataUrl, filename);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(CHAR_IMAGES_BUCKET)
      .upload(filepath, file, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(CHAR_IMAGES_BUCKET)
      .getPublicUrl(filepath);
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: filepath
    };
  } catch (error) {
    console.error('Error uploading character image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload character image'
    };
  }
};

// Upload a font file
export const uploadFontFile = async (
  fontFile: File | Blob, 
  fontId: string,
  format: string,
  fontName: string
): Promise<{ 
  success: boolean; 
  url?: string; 
  path?: string; 
  error?: string 
}> => {
  try {
    const sanitizedName = fontName.replace(/\s+/g, '_').toLowerCase();
    const filename = `${sanitizedName}.${format}`;
    const filepath = `${fontId}/${filename}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(FONTS_BUCKET)
      .upload(filepath, fontFile, {
        contentType: getContentType(format),
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(FONTS_BUCKET)
      .getPublicUrl(filepath);
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: filepath
    };
  } catch (error) {
    console.error('Error uploading font file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload font file'
    };
  }
};

// Get a download URL for a font file
export const getFontDownloadUrl = async (
  fontId: string,
  fontName: string,
  format: string
): Promise<{ 
  success: boolean; 
  url?: string; 
  error?: string 
}> => {
  try {
    const sanitizedName = fontName.replace(/\s+/g, '_').toLowerCase();
    const filename = `${sanitizedName}.${format}`;
    const filepath = `${fontId}/${filename}`;
    
    // Get signed URL (valid for a limited time)
    const { data, error } = await supabase.storage
      .from(FONTS_BUCKET)
      .createSignedUrl(filepath, 60 * 60); // 1 hour expiry
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      url: data.signedUrl
    };
  } catch (error) {
    console.error('Error getting font download URL:', error);
    
    // Fallback to public URL if signed URL fails
    try {
      const sanitizedName = fontName.replace(/\s+/g, '_').toLowerCase();
      const filename = `${sanitizedName}.${format}`;
      const filepath = `${fontId}/${filename}`;
      
      const { data } = supabase.storage
        .from(FONTS_BUCKET)
        .getPublicUrl(filepath);
      
      return {
        success: true,
        url: data.publicUrl
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: 'Failed to generate download URL for font'
      };
    }
  }
};

// Delete a font and all associated files
export const deleteFont = async (fontId: string): Promise<{ 
  success: boolean; 
  error?: string 
}> => {
  try {
    // Delete all files in all buckets for this font
    const buckets = [FONTS_BUCKET, IMAGES_BUCKET, CHAR_IMAGES_BUCKET];
    
    for (const bucket of buckets) {
      // List all files in the directory
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(fontId);
        
      if (error) {
        console.error(`Error listing files in ${bucket}/${fontId}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        // Delete all files
        const filesToDelete = data.map(file => `${fontId}/${file.name}`);
        
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove(filesToDelete);
          
        if (deleteError) {
          console.error(`Error deleting files from ${bucket}:`, deleteError);
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting font files:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete font files'
    };
  }
};

// Get content type based on file format
const getContentType = (format: string): string => {
  switch (format.toLowerCase()) {
    case 'ttf':
      return 'font/ttf';
    case 'otf':
      return 'font/otf';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    default:
      return 'application/octet-stream';
  }
}; 