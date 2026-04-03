import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);

    // Use service role key for admin operations
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify user is authenticated with their token
    const supabaseUser = createClient(SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all registered files from database
    const { data: registeredFiles, error: dbError } = await supabase
      .from('file_metadata')
      .select('file_path');

    if (dbError) {
      return res.status(500).json({ error: 'Failed to fetch registered files', details: dbError.message });
    }

    const registeredPaths = new Set(registeredFiles.map(f => f.file_path));

    // List all files in R2 bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: 'pdf-files/',
    });

    const r2Files = await s3Client.send(listCommand);
    const allR2Keys = r2Files.Contents?.map(obj => obj.Key!) || [];

    // Find unregistered files
    const unregisteredFiles = [];
    for (const key of allR2Keys) {
      const filePath = '/' + key;
      if (!registeredPaths.has(filePath)) {
        const size = r2Files.Contents?.find(obj => obj.Key === key)?.Size || 0;
        unregisteredFiles.push({ key, path: filePath, size });
      }
    }

    if (unregisteredFiles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No unregistered files found',
        deleted: 0,
        freedSpace: 0
      });
    }

    // Check if this is a dry run
    const dryRun = req.body?.dryRun === true;

    if (dryRun) {
      const totalSize = unregisteredFiles.reduce((sum, f) => sum + f.size, 0);
      return res.status(200).json({
        success: true,
        dryRun: true,
        unregisteredFiles: unregisteredFiles.map(f => ({
          path: f.path,
          size: f.size,
          sizeMB: (f.size / (1024 * 1024)).toFixed(2)
        })),
        count: unregisteredFiles.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      });
    }

    // Delete unregistered files from R2
    let deletedCount = 0;
    let deletedSize = 0;
    const errors = [];

    for (const file of unregisteredFiles) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: file.key,
        });
        await s3Client.send(deleteCommand);
        deletedCount++;
        deletedSize += file.size;
      } catch (error) {
        errors.push({
          file: file.path,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return res.status(200).json({
      success: true,
      deleted: deletedCount,
      freedSpace: deletedSize,
      freedSpaceMB: (deletedSize / (1024 * 1024)).toFixed(2),
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({
      error: 'Cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
