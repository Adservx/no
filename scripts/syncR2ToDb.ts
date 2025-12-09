import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME;

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('Missing R2 environment variables');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Initialize R2 client
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface R2File {
  key: string;
  size: number;
  lastModified: Date;
}

// List all files from R2 bucket
async function listR2Files(): Promise<R2File[]> {
  const files: R2File[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && obj.Size !== undefined) {
          files.push({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified || new Date(),
          });
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return files;
}

// Parse file path to extract semester and subject
function parseFilePath(key: string): { semester: string; subject: string; fileName: string } | null {
  // Expected format: "1st semester/Subject Name/filename.pdf"
  const parts = key.split('/');
  
  if (parts.length >= 3) {
    return {
      semester: parts[0],
      subject: parts[1],
      fileName: parts[parts.length - 1],
    };
  } else if (parts.length === 2) {
    // Format: "semester/filename.pdf" - no subject
    return {
      semester: parts[0],
      subject: 'General',
      fileName: parts[1],
    };
  }
  
  return null;
}

// Sync R2 files to database
async function syncToDatabase(files: R2File[]) {
  console.log(`\n📊 Found ${files.length} files in R2 bucket\n`);

  // R2 public URL for generating file URLs
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL || `https://pub-${R2_ACCOUNT_ID}.r2.dev`;

  // Get existing files from database
  const { data: existingFiles, error: fetchError } = await supabase
    .from('file_metadata')
    .select('file_path');

  if (fetchError) {
    console.error('Error fetching existing files:', fetchError);
    return;
  }

  const existingPaths = new Set(existingFiles?.map(f => f.file_path) || []);

  // Filter new files
  const newFiles = files.filter(f => !existingPaths.has(f.key));
  
  console.log(`📁 Existing in DB: ${existingPaths.size}`);
  console.log(`✨ New files to add: ${newFiles.length}\n`);

  if (newFiles.length === 0) {
    console.log('✅ Database is already in sync with R2!');
    return;
  }

  // Insert new files
  let successCount = 0;
  let failCount = 0;

  for (const file of newFiles) {
    const parsed = parseFilePath(file.key);
    
    if (!parsed) {
      console.log(`⚠️  Skipping (invalid path): ${file.key}`);
      failCount++;
      continue;
    }

    const fileUrl = `${R2_PUBLIC_URL}/${file.key}`;
    const { error: insertError } = await supabase
      .from('file_metadata')
      .insert({
        semester: parsed.semester,
        subject: parsed.subject,
        file_name: parsed.fileName,
        file_path: file.key,
        file_url: fileUrl,
        file_size: file.size,
        content_type: 'application/pdf',
      });

    if (insertError) {
      console.log(`❌ Failed: ${file.key} - ${insertError.message}`);
      failCount++;
    } else {
      console.log(`✅ Added: ${file.key}`);
      successCount++;
    }
  }

  console.log(`\n🎉 Sync complete!`);
  console.log(`   ✅ Added: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
}

// Clean up database entries that don't exist in R2
async function cleanupOrphans(r2Files: R2File[]) {
  const r2Paths = new Set(r2Files.map(f => f.key));

  const { data: dbFiles, error } = await supabase
    .from('file_metadata')
    .select('id, file_path');

  if (error) {
    console.error('Error fetching DB files:', error);
    return;
  }

  const orphans = dbFiles?.filter(f => !r2Paths.has(f.file_path)) || [];

  if (orphans.length === 0) {
    console.log('\n✅ No orphan entries in database');
    return;
  }

  console.log(`\n🧹 Found ${orphans.length} orphan entries in database`);
  
  for (const orphan of orphans) {
    const { error: deleteError } = await supabase
      .from('file_metadata')
      .delete()
      .eq('id', orphan.id);

    if (deleteError) {
      console.log(`❌ Failed to remove: ${orphan.file_path}`);
    } else {
      console.log(`🗑️  Removed: ${orphan.file_path}`);
    }
  }
}

// Main function
async function main() {
  console.log('🚀 Starting R2 to Database sync...');
  console.log(`🪣 Bucket: ${R2_BUCKET_NAME}`);
  console.log(`🔗 Supabase: ${SUPABASE_URL}\n`);

  try {
    // List all files from R2
    console.log('📂 Listing files from R2...');
    const r2Files = await listR2Files();

    // Sync to database
    await syncToDatabase(r2Files);

    // Clean up orphan entries
    await cleanupOrphans(r2Files);

    console.log('\n✨ All done!');
  } catch (error) {
    console.error('💥 Sync failed:', error);
    process.exit(1);
  }
}

main();
