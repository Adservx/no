import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

interface FileInfo {
  id: string;
  semester: string;
  subject: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_url: string;
  description?: string;
  tags?: string[];
  created_at?: string;
}

// Normalize semester names to consistent format
function normalizeSemester(rawSemester: string): string {
  const lower = rawSemester.toLowerCase().trim();

  // Map various formats to standard "First Semester", "Second Semester", etc.
  const semesterMap: Record<string, string> = {
    // First semester variations
    '1st semester': 'First Semester',
    '1st_semester': 'First Semester',
    'first semester': 'First Semester',
    'first-semester': 'First Semester',
    'first_semester': 'First Semester',
    'semester 1': 'First Semester',
    'semester-1': 'First Semester',
    'semester_1': 'First Semester',
    'sem 1': 'First Semester',
    'sem1': 'First Semester',
    '1': 'First Semester',

    // Second semester variations
    '2nd semester': 'Second Semester',
    '2nd_semester': 'Second Semester',
    'second semester': 'Second Semester',
    'second-semester': 'Second Semester',
    'second_semester': 'Second Semester',
    'semester 2': 'Second Semester',
    'semester-2': 'Second Semester',
    'semester_2': 'Second Semester',
    'sem 2': 'Second Semester',
    'sem2': 'Second Semester',
    '2': 'Second Semester',

    // Third semester variations
    '3rd semester': 'Third Semester',
    '3rd_semester': 'Third Semester',
    'third semester': 'Third Semester',
    'third-semester': 'Third Semester',
    'third_semester': 'Third Semester',
    'semester 3': 'Third Semester',
    'semester-3': 'Third Semester',
    'semester_3': 'Third Semester',
    'sem 3': 'Third Semester',
    'sem3': 'Third Semester',
    '3': 'Third Semester',

    // Fourth semester variations
    '4th semester': 'Fourth Semester',
    '4th_semester': 'Fourth Semester',
    'fourth semester': 'Fourth Semester',
    'fourth-semester': 'Fourth Semester',
    'fourth_semester': 'Fourth Semester',
    'semester 4': 'Fourth Semester',
    'semester-4': 'Fourth Semester',
    'semester_4': 'Fourth Semester',
    'sem 4': 'Fourth Semester',
    'sem4': 'Fourth Semester',
    '4': 'Fourth Semester',

    // Fifth semester variations
    '5th semester': 'Fifth Semester',
    '5th_semester': 'Fifth Semester',
    'fifth semester': 'Fifth Semester',
    'fifth-semester': 'Fifth Semester',
    'fifth_semester': 'Fifth Semester',
    'semester 5': 'Fifth Semester',
    'semester-5': 'Fifth Semester',
    'semester_5': 'Fifth Semester',
    'sem 5': 'Fifth Semester',
    'sem5': 'Fifth Semester',
    '5': 'Fifth Semester',

    // Sixth semester variations
    '6th semester': 'Sixth Semester',
    '6th_semester': 'Sixth Semester',
    'sixth semester': 'Sixth Semester',
    'sixth-semester': 'Sixth Semester',
    'sixth_semester': 'Sixth Semester',
    'semester 6': 'Sixth Semester',
    'semester-6': 'Sixth Semester',
    'semester_6': 'Sixth Semester',
    'sem 6': 'Sixth Semester',
    'sem6': 'Sixth Semester',
    '6': 'Sixth Semester',
  };

  const normalized = semesterMap[lower];

  if (!normalized) {
    // Log unrecognized semester names for debugging
    console.log(`[DEBUG] Unrecognized semester folder name: "${rawSemester}" (lowercase: "${lower}")`);
  }

  return normalized || rawSemester;
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
  
  // Add caching headers - cache for 5 minutes on CDN, 1 minute in browser
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600, max-age=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read environment variables
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
  const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL;

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Check if we should use Supabase metadata (preferred) or fall back to R2 listing
  const useSupabase = SUPABASE_URL && SUPABASE_SERVICE_KEY;

  // Check query param for forcing R2 scan (for sync purposes)
  const forceR2Scan = req.query?.source === 'r2';

  // Try Supabase first (faster, includes metadata)
  if (useSupabase && !forceR2Scan) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Fetch only needed fields for faster response
      const { data: files, error } = await supabase
        .from('file_metadata')
        .select('id, file_name, file_path, file_size, file_url, semester, subject, description, tags, created_at')
        .order('semester', { ascending: true })
        .order('subject', { ascending: true })
        .order('file_name', { ascending: true });

      if (error) {
        console.error('Supabase fetch error:', error);
        // Fall through to R2 listing
      } else if (files && files.length > 0) {
        // Sort by semester order
        const semesterOrder = ['First Semester', 'Second Semester', 'Third Semester', 'Fourth Semester', 'Fifth Semester', 'Sixth Semester'];

        files.sort((a: any, b: any) => {
          const aOrder = semesterOrder.indexOf(a.semester);
          const bOrder = semesterOrder.indexOf(b.semester);
          if (aOrder !== bOrder) return aOrder - bOrder;
          if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
          return a.file_name.localeCompare(b.file_name);
        });

        // Transform to expected format
        const formattedFiles: FileInfo[] = files.map((f: any) => ({
          id: f.id,
          semester: f.semester,
          subject: f.subject,
          file_name: f.file_name,
          file_path: f.file_path,
          file_size: f.file_size,
          file_url: f.file_url,
          description: f.description,
          tags: f.tags,
          created_at: f.created_at,
        }));

        return res.status(200).json({
          data: formattedFiles,
          error: null,
          source: 'supabase'
        });
      }
      // If no files in Supabase, fall through to R2
    } catch (err) {
      console.error('Supabase connection error:', err);
      // Fall through to R2 listing
    }
  }

  // Fallback: Read from R2 directly
  // Validate required environment variables
  const missingVars: string[] = [];
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

  // Create S3 client after validation
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });

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

    return res.status(200).json({
      data: files,
      error: null,
      source: 'r2'
    });
  } catch (error) {
    console.error('Error listing R2 files:', error);
    return res.status(500).json({
      data: null,
      error: error instanceof Error ? error.message : 'Failed to list files'
    });
  }
}
