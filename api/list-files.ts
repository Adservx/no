import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

interface FileInfo {
  id: string;
  semester: string;
  subject: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_url: string;
}

function parseFilePath(key: string): { semester: string; subject: string; fileName: string } | null {
  const parts = key.split('/');
  if (parts.length >= 3) {
    return {
      semester: parts[0],
      subject: parts[1],
      fileName: parts[parts.length - 1],
    };
  }
  return null;
}

export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const files: FileInfo[] = [];
    let continuationToken: string | undefined;

    // Excluded prefixes (user uploads, not course materials)
    const excludedPrefixes = ['avatars/', 'manikant_files/'];

    do {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (!obj.Key || obj.Size === undefined) continue;
          
          // Skip excluded prefixes
          if (excludedPrefixes.some(prefix => obj.Key!.startsWith(prefix))) continue;

          const parsed = parseFilePath(obj.Key);
          if (!parsed) continue;

          files.push({
            id: obj.Key, // Use key as ID
            semester: parsed.semester,
            subject: parsed.subject,
            file_name: parsed.fileName,
            file_path: obj.Key,
            file_size: obj.Size,
            file_url: `${R2_PUBLIC_URL}/${obj.Key}`,
          });
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // Sort by semester, subject, filename
    files.sort((a, b) => {
      if (a.semester !== b.semester) return a.semester.localeCompare(b.semester);
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      return a.file_name.localeCompare(b.file_name);
    });

    return res.status(200).json({ data: files, error: null });
  } catch (error) {
    console.error('Error listing R2 files:', error);
    return res.status(500).json({ 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to list files' 
    });
  }
}
