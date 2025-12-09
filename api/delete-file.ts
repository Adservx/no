import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }

    // Delete from R2
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: filePath,
    });

    await s3Client.send(command);
    console.log(`Deleted file from R2: ${filePath}`);

    // Delete metadata from Supabase
    const { error: deleteMetadataError } = await supabase
      .from('file_metadata')
      .delete()
      .eq('file_path', filePath);

    if (deleteMetadataError) {
      console.error('Error deleting metadata:', deleteMetadataError);
      // File was deleted from R2, metadata deletion failed
      return res.status(200).json({
        success: true,
        warning: 'File deleted from R2 but metadata deletion failed: ' + deleteMetadataError.message,
        error: null
      });
    }

    console.log(`Deleted metadata from Supabase for: ${filePath}`);

    return res.status(200).json({ success: true, error: null });
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    });
  }
}
