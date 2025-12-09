# R2 Storage + Supabase Metadata Integration

This document explains the file storage architecture where **actual files are stored in Cloudflare R2** and **file metadata is stored in Supabase** for fast, queryable access.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   Client App    │────▶│   Vercel API        │────▶│  Cloudflare R2   │
│  (React/Vite)   │     │   Endpoints         │     │  (File Storage)  │
└─────────────────┘     └─────────────────────┘     └──────────────────┘
                               │
                               ▼
                        ┌─────────────────────┐
                        │     Supabase        │
                        │  (Metadata + Auth)  │
                        └─────────────────────┘
```

## Benefits

1. **Fast Listing**: File listings come from Supabase (SQL query) instead of R2 object listing
2. **Rich Metadata**: Store descriptions, tags, upload dates, and more
3. **Searchable**: Full-text search on file names and metadata
4. **Scalable**: R2 handles large files, Supabase handles metadata queries
5. **Cost Effective**: R2's generous free tier + Supabase's free tier

## Setup Instructions

### 1. Run the Supabase Migration

Execute the SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste contents from:
-- supabase/migrations/create_file_metadata_table.sql
```

This creates:
- `file_metadata` table with all necessary columns
- Indexes for fast queries
- RLS policies for security
- Trigger for auto-updating `updated_at`

### 2. Get Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the `service_role` key (NOT the `anon` key)

⚠️ **Warning**: Never expose the service role key on the client-side!

### 3. Configure Environment Variables

Add these to your Vercel Dashboard → Settings → Environment Variables:

```env
# Supabase (Server-side)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# These should already exist:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
VITE_R2_PUBLIC_URL=https://your-public-r2-url.r2.dev
```

### 4. Sync Existing R2 Files

If you have existing files in R2 that aren't in the metadata table:

1. Log in as admin
2. Go to **Manage Files** 
3. Click **"🔄 Sync R2 to DB"**
4. This scans R2 and adds missing files to Supabase

## API Endpoints

### `POST /api/upload-file`
Upload a file to R2 and store metadata in Supabase.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "fileName": "chapter1.pdf",
  "filePath": "first-semester/Mathematics/chapter1.pdf",
  "fileData": "<base64-encoded-file>",
  "fileSize": 1234567,
  "contentType": "application/pdf",
  "semester": "First Semester",
  "subject": "Mathematics",
  "description": "Optional description",
  "tags": ["optional", "tags"]
}
```

### `GET /api/list-files`
Fetch all files. Prioritizes Supabase, falls back to R2.

**Query Parameters:**
- `source=r2` - Force R2 listing (bypasses Supabase)

**Response:**
```json
{
  "data": [...files],
  "error": null,
  "source": "supabase" | "r2"
}
```

### `DELETE /api/delete-file`
Delete a file from both R2 and Supabase.

**Headers:**
- `Authorization: Bearer <token>`

**Body:**
```json
{
  "filePath": "first-semester/Mathematics/chapter1.pdf"
}
```

### `POST /api/sync-files`
Sync existing R2 files to Supabase metadata.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "synced": 15,
  "skipped": 10,
  "total_in_r2": 25,
  "errors": null
}
```

## Database Schema

```sql
CREATE TABLE file_metadata (
    id UUID PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,  -- R2 object key
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,           -- Public R2 URL
    semester TEXT NOT NULL,
    subject TEXT NOT NULL,
    content_type TEXT,
    description TEXT,
    tags TEXT[],
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

## Client-Side Helpers

Use `pdfHelpers` from `src/utils/supabase.ts`:

```typescript
import { pdfHelpers } from '../utils/supabase';

// Get all files
const { data, error } = await pdfHelpers.getAllFiles();

// Get files by semester
const { data } = await pdfHelpers.getFilesBySemester('First Semester');

// Get files by semester and subject
const { data } = await pdfHelpers.getFilesBySubject('First Semester', 'Mathematics');

// Search files
const { data } = await pdfHelpers.searchFiles('calculus');

// Sync R2 to Supabase (admin only)
const result = await pdfHelpers.syncFilesToSupabase();

// Delete file (admin only)
await pdfHelpers.deleteFile('path/to/file.pdf');
```

## Troubleshooting

### Files not appearing after upload
1. Check browser console for errors
2. Verify all environment variables are set
3. Run the sync function from Admin panel

### "Missing Supabase environment variables" error
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- Redeploy after adding environment variables

### Metadata mismatch with R2
- Use the "Sync R2 to DB" button in Admin panel
- This adds any missing files to the metadata table

### RLS Policy errors
- Ensure the `users` table has the current user with `role = 'admin'`
- Check that auth is working correctly

## Files Changed

- `api/upload-file.ts` - New: Upload to R2 + Supabase
- `api/list-files.ts` - Updated: Supabase-first with R2 fallback
- `api/delete-file.ts` - Updated: Delete from both R2 and Supabase
- `api/sync-files.ts` - New: Sync R2 files to Supabase
- `src/utils/supabase.ts` - Added: sync, search, and helper functions
- `src/components/AdminFileUpload.tsx` - Updated: Use server-side upload
- `src/components/AdminFileManager.tsx` - Added: Sync button
- `supabase/migrations/create_file_metadata_table.sql` - New: Migration file
- `vercel.json` - Updated: New API routes
