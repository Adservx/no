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

// Normalize semester names to consistent format
function normalizeSemester(rawSemester: string): string {
  const lower = rawSemester.toLowerCase().trim();

  // Map various formats to standard "First Semester", "Second Semester", etc.
  const semesterMap: Record<string, string> = {
    '1st semester': 'First Semester',
    'first semester': 'First Semester',
    'first-semester': 'First Semester',
    '2nd semester': 'Second Semester',
    'second semester': 'Second Semester',
    'second-semester': 'Second Semester',
    '3rd semester': 'Third Semester',
    'third semester': 'Third Semester',
    'third-semester': 'Third Semester',
    '4th semester': 'Fourth Semester',
    'fourth semester': 'Fourth Semester',
    'fourth-semester': 'Fourth Semester',
    '5th semester': 'Fifth Semester',
    'fifth semester': 'Fifth Semester',
    'fifth-semester': 'Fifth Semester',
    '6th semester': 'Sixth Semester',
    'sixth semester': 'Sixth Semester',
    'sixth-semester': 'Sixth Semester',
  };

  return semesterMap[lower] || rawSemester;
}

function parseFilePath(key: string): { semester: string; subject: string; fileName: string } | null {
  const parts = key.split('/');
  // Need at least semester/subject/filename (3 parts)
  if (parts.length >= 3) {
    const rawSemester = parts[0];
    const normalized = normalizeSemester(rawSemester);
    return {
      semester: normalized,
      subject: parts[1],
      fileName: parts[parts.length - 1],
    };
  }
  // Handle 2-part paths (semester/filename) - put in "General" subject
  if (parts.length === 2) {
    return {
      semester: normalizeSemester(parts[0]),
      subject: 'General',
      fileName: parts[1],
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

  // Validate required environment variables
  const missingVars = [];
  if (!R2_ACCOUNT_ID) missingVars.push('R2_ACCOUNT_ID');
  if (!R2_ACCESS_KEY_ID) missingVars.push('R2_ACCESS_KEY_ID');
  if (!R2_SECRET_ACCESS_KEY) missingVars.push('R2_SECRET_ACCESS_KEY');
  if (!R2_BUCKET_NAME) missingVars.push('R2_BUCKET_NAME');

  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars.join(', '));
    return res.status(500).json({
      data: null,
      error: `Missing required environment variables: ${missingVars.join(', ')}. Please add these in Vercel Dashboard > Settings > Environment Variables.`
    });
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

    // Sort by semester (in order), subject, filename
    const semesterOrder = ['First Semester', 'Second Semester', 'Third Semester', 'Fourth Semester', 'Fifth Semester', 'Sixth Semester'];

    files.sort((a, b) => {
      const aOrder = semesterOrder.indexOf(a.semester);
      const bOrder = semesterOrder.indexOf(b.semester);
      if (aOrder !== bOrder) return aOrder - bOrder;
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
