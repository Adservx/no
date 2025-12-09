import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('Missing R2 environment variables');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Normalize semester names
function normalizeSemester(raw: string): string {
  const lower = raw.toLowerCase().trim().replace(/[-_]/g, ' ');
  const map: Record<string, string> = {
    '1st semester': 'First Semester', 'first semester': 'First Semester',
    '2nd semester': 'Second Semester', 'second semester': 'Second Semester',
    '3rd semester': 'Third Semester', 'third semester': 'Third Semester',
    '4th semester': 'Fourth Semester', 'fourth semester': 'Fourth Semester',
    '5th semester': 'Fifth Semester', 'fifth semester': 'Fifth Semester',
    '6th semester': 'Sixth Semester', 'sixth semester': 'Sixth Semester',
  };
  return map[lower] || raw;
}


interface R2File {
  key: string;
  size: number;
}

// List all files from R2
async function listR2Files(): Promise<R2File[]> {
  const files: R2File[] = [];
  let continuationToken: string | undefined;
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
        if (excludedPrefixes.some(p => obj.Key!.startsWith(p))) continue;
        files.push({ key: obj.Key, size: obj.Size });
      }
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return files;
}

// Parse file path
function parseFilePath(key: string): { semester: string; subject: string; fileName: string } | null {
  const parts = key.split('/');
  if (parts.length >= 3) {
    return {
      semester: normalizeSemester(parts[0]),
      subject: parts[1],
      fileName: parts[parts.length - 1],
    };
  } else if (parts.length === 2) {
    return {
      semester: normalizeSemester(parts[0]),
      subject: 'General',
      fileName: parts[1],
    };
  }
  return null;
}

async function main() {
  console.log('🚀 Migrating R2 files to file_metadata table...\n');

  // Get R2 files
  console.log('📂 Listing R2 files...');
  const r2Files = await listR2Files();
  console.log(`Found ${r2Files.length} files in R2\n`);

  // Get existing metadata
  const { data: existing } = await supabase.from('file_metadata').select('file_path');
  const existingPaths = new Set(existing?.map(f => f.file_path) || []);

  let added = 0, skipped = 0, failed = 0;

  for (const file of r2Files) {
    if (existingPaths.has(file.key)) {
      skipped++;
      continue;
    }

    const parsed = parseFilePath(file.key);
    if (!parsed) {
      console.log(`⚠️  Skipping invalid path: ${file.key}`);
      failed++;
      continue;
    }

    const fileUrl = `${R2_PUBLIC_URL}/${file.key}`;
    const { error } = await supabase.from('file_metadata').insert({
      file_name: parsed.fileName,
      file_path: file.key,
      file_size: file.size,
      file_url: fileUrl,
      semester: parsed.semester,
      subject: parsed.subject,
      content_type: 'application/pdf',
    });

    if (error) {
      console.log(`❌ Failed: ${file.key} - ${error.message}`);
      failed++;
    } else {
      console.log(`✅ Added: ${file.key}`);
      added++;
    }
  }

  console.log(`\n🎉 Migration complete!`);
  console.log(`   ✅ Added: ${added}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
}

main().catch(console.error);
