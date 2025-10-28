import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local') });

// Cloudflare R2 configuration - load from environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('Missing R2 environment variables. Please set:');
  console.error('- R2_ACCOUNT_ID');
  console.error('- R2_ACCESS_KEY_ID');
  console.error('- R2_SECRET_ACCESS_KEY');
  console.error('- R2_BUCKET_NAME');
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

// Function to upload a file to R2
async function uploadFile(filePath: string, key: string) {
  try {
    const fileContent = readFileSync(filePath);
    const contentType = getContentType(filePath);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      ACL: 'public-read', // Make files publicly readable
    });

    await s3Client.send(command);
    console.log(`✅ Uploaded: ${key}`);
  } catch (error) {
    console.error(`❌ Failed to upload ${key}:`, error);
  }
}

// Get content type based on file extension
function getContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}

// Recursively upload all files from a directory
async function uploadDirectory(dirPath: string, baseKey: string = '') {
  const items = readdirSync(dirPath);

  for (const item of items) {
    const fullPath = join(dirPath, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Recurse into subdirectory
      await uploadDirectory(fullPath, baseKey ? `${baseKey}/${item}` : item);
    } else if (stat.isFile()) {
      // Upload file
      const key = baseKey ? `${baseKey}/${item}` : item;
      await uploadFile(fullPath, key);
    }
  }
}

// Main upload function
async function main() {
  const pdfDir = join(process.cwd(), 'public', 'pdf-files');

  console.log('🚀 Starting upload to Cloudflare R2...');
  console.log(`📁 Source directory: ${pdfDir}`);
  console.log(`🪣 Bucket: ${R2_BUCKET_NAME}`);

  try {
    await uploadDirectory(pdfDir);
    console.log('🎉 Upload complete!');
  } catch (error) {
    console.error('💥 Upload failed:', error);
    process.exit(1);
  }
}

main();
