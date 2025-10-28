import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

// Initialize R2 client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Generate public URL for a file in R2
export const getR2FileUrl = (key: string): string => {
  if (!R2_PUBLIC_URL) {
    throw new Error('R2 public URL not configured. Please enable R2.dev subdomain in Cloudflare dashboard.');
  }
  return `${R2_PUBLIC_URL}/${key}`;
};

// Get file from R2 (for private files, but assuming public for now)
export const getR2File = async (key: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    return response.Body;
  } catch (error) {
    console.error('Error fetching file from R2:', error);
    throw error;
  }
};

// Utility to convert old local paths to R2 keys
export const convertPathToR2Key = (localPath: string): string => {
  // Remove leading /pdf-files/ if present (old format)
  // Or just remove leading / (new format)
  if (localPath.startsWith('/pdf-files/')) {
    return localPath.replace(/^\/pdf-files\//, '');
  }
  return localPath.replace(/^\//, '');
};


// Check if R2 is configured
export const isR2Configured = (): boolean => {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
};

// Upload file to R2
export const uploadToR2 = async (
  file: File,
  key: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; error?: string; url?: string }> => {
  try {
    if (!isR2Configured()) {
      return { success: false, error: 'R2 is not configured' };
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Simulate progress for user feedback
    if (onProgress) {
      onProgress(30);
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
    });

    if (onProgress) {
      onProgress(60);
    }

    await s3Client.send(command);

    if (onProgress) {
      onProgress(100);
    }

    const url = getR2FileUrl(key);
    return { success: true, url };
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
};

// Delete file from R2
export const deleteFromR2 = async (
  key: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!isR2Configured()) {
      return { success: false, error: 'R2 is not configured' };
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Delete failed' 
    };
  }
};
