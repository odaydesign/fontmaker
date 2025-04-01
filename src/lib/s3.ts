import AWS from 'aws-sdk';
import { createReadStream } from 'fs';
import { randomUUID } from 'crypto';

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'happyfont-storage';

/**
 * Upload a file to S3
 */
export const uploadFile = async (
  filePath: string,
  folder = 'uploads',
  customKey?: string
): Promise<{ url: string; key: string }> => {
  // Generate a unique key if not provided
  const key = customKey || `${folder}/${randomUUID()}`;
  
  // Upload the file
  await s3.upload({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: createReadStream(filePath),
    ContentType: getContentType(filePath),
  }).promise();
  
  // Get the public URL
  const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  
  return { url, key };
};

/**
 * Upload a buffer to S3
 */
export const uploadBuffer = async (
  buffer: Buffer,
  contentType: string,
  folder = 'uploads',
  customKey?: string
): Promise<{ url: string; key: string }> => {
  // Generate a unique key if not provided
  const key = customKey || `${folder}/${randomUUID()}`;
  
  // Upload the buffer
  await s3.upload({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }).promise();
  
  // Get the public URL
  const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;
  
  return { url, key };
};

/**
 * Delete a file from S3
 */
export const deleteFile = async (key: string): Promise<void> => {
  await s3.deleteObject({
    Bucket: BUCKET_NAME,
    Key: key,
  }).promise();
};

/**
 * Get a signed URL for downloading a file
 */
export const getSignedUrl = async (
  key: string,
  expiresIn = 3600 // 1 hour in seconds
): Promise<string> => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };
  
  return s3.getSignedUrlPromise('getObject', params);
};

/**
 * Get the content type based on file extension
 */
const getContentType = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
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