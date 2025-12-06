import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { supabase } from './supabase';
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
  // If a custom public URL is configured, use it; otherwise fall back to the default Cloudflare R2 public endpoint.
  if (R2_PUBLIC_URL) {
    return `${R2_PUBLIC_URL}/${key}`;
  }
  // Construct a public URL using the account ID and bucket name.
  // This follows the pattern: https://<account-id>.r2.cloudflarestorage.com/<bucket>/<key>
  if (R2_ACCOUNT_ID && R2_BUCKET_NAME) {
    return `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;
  }
  // If we cannot construct a URL, throw an informative error.
  throw new Error('R2 public URL not configured and cannot be derived from environment variables.');
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
    // If R2 is not configured, fallback to Supabase storage (public bucket 'avatars')
    if (!isR2Configured()) {
      const { data, error } = await supabase.storage.from('avatars').upload(key, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      // Get public URL from Supabase storage
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(key);
      if (!urlData?.publicUrl) {
        return { success: false, error: 'Failed to get public URL' };
      }
      return { success: true, url: urlData.publicUrl };
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
      // Fallback to Supabase storage
      const { error } = await supabase.storage.from('avatars').remove([key]);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
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
