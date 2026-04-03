/**
 * Script to remove PDF files that are NOT registered in the Supabase database
 *
 * This script:
 * 1. Fetches all registered files from Supabase
 * 2. Scans the public/pdf-files directory
 * 3. Identifies files that exist on disk but NOT in database
 * 4. Removes unregistered files (including duplicates with apostrophes)
 *
 * Usage: node scripts/cleanup-unregistered-files.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get all registered files from database
async function getRegisteredFiles() {
  const { data, error } = await supabase
    .from('file_metadata')
    .select('file_path');

  if (error) {
    console.error('❌ Error fetching files from database:', error);
    return null;
  }

  return new Set(data.map(f => f.file_path));
}

// Recursively get all files in directory
function getAllFilesInDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFilesInDirectory(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Convert absolute path to relative path format used in database
function toRelativePath(absolutePath) {
  const publicDir = path.join(__dirname, '..', 'public');
  const relativePath = path.relative(publicDir, absolutePath);
  return '/' + relativePath.replace(/\\/g, '/');
}

async function main() {
  console.log('🔍 Fetching registered files from database...');
  const registeredFiles = await getRegisteredFiles();

  if (!registeredFiles) {
    console.error('❌ Failed to fetch registered files');
    process.exit(1);
  }

  console.log(`✅ Found ${registeredFiles.size} registered files in database`);

  const pdfDir = path.join(__dirname, '..', 'public', 'pdf-files');

  if (!fs.existsSync(pdfDir)) {
    console.error('❌ PDF directory not found:', pdfDir);
    process.exit(1);
  }

  console.log('\n🔍 Scanning filesystem for PDF files...');
  const allFiles = getAllFilesInDirectory(pdfDir);
  console.log(`✅ Found ${allFiles.length} files on disk`);

  // Find unregistered files
  const unregisteredFiles = [];

  for (const filePath of allFiles) {
    const relativePath = toRelativePath(filePath);

    if (!registeredFiles.has(relativePath)) {
      unregisteredFiles.push({
        absolute: filePath,
        relative: relativePath,
        size: fs.statSync(filePath).size
      });
    }
  }

  console.log(`\n📋 Found ${unregisteredFiles.length} unregistered files`);

  if (unregisteredFiles.length === 0) {
    console.log('✅ All files are registered. Nothing to clean up!');
    return;
  }

  // Calculate total size
  const totalSize = unregisteredFiles.reduce((sum, f) => sum + f.size, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  console.log(`\n📊 Unregistered files (${totalSizeMB} MB):`);
  unregisteredFiles.forEach(f => {
    const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
    console.log(`  - ${f.relative} (${sizeMB} MB)`);
  });

  // Ask for confirmation
  console.log(`\n⚠️  This will DELETE ${unregisteredFiles.length} files (${totalSizeMB} MB)`);
  console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to proceed...');

  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n🗑️  Deleting unregistered files...');

  let deletedCount = 0;
  let deletedSize = 0;

  for (const file of unregisteredFiles) {
    try {
      fs.unlinkSync(file.absolute);
      deletedCount++;
      deletedSize += file.size;
      console.log(`  ✅ Deleted: ${file.relative}`);
    } catch (error) {
      console.error(`  ❌ Failed to delete ${file.relative}:`, error.message);
    }
  }

  const deletedSizeMB = (deletedSize / (1024 * 1024)).toFixed(2);
  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Deleted: ${deletedCount} files`);
  console.log(`   Freed: ${deletedSizeMB} MB`);
}

main().catch(console.error);
