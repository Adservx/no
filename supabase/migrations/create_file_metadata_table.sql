-- Migration: Create file_metadata table for storing R2 file metadata
-- Run this migration in your Supabase SQL editor
-- This table stores metadata about files while actual files remain in R2 storage

-- Create file_metadata table
CREATE TABLE IF NOT EXISTS file_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE, -- The R2 object key (e.g., "first-semester/Mathematics/chapter1.pdf")
    file_size BIGINT NOT NULL DEFAULT 0,
    file_url TEXT NOT NULL, -- The public R2 URL
    semester TEXT NOT NULL,
    subject TEXT NOT NULL,
    content_type TEXT DEFAULT 'application/pdf',
    description TEXT,
    tags TEXT[], -- Array of tags for easy filtering
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_file_metadata_semester ON file_metadata(semester);
CREATE INDEX IF NOT EXISTS idx_file_metadata_subject ON file_metadata(subject);
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_path ON file_metadata(file_path);
CREATE INDEX IF NOT EXISTS idx_file_metadata_uploaded_by ON file_metadata(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_metadata_created_at ON file_metadata(created_at DESC);

-- Full text search index on file_name for quick searches
CREATE INDEX IF NOT EXISTS idx_file_metadata_file_name_search ON file_metadata USING gin(to_tsvector('english', file_name));

-- Enable RLS (Row Level Security)
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view file metadata (files are public)
CREATE POLICY "Anyone can view file metadata"
    ON file_metadata FOR SELECT
    USING (true);

-- Only authenticated users with admin role can insert file metadata
CREATE POLICY "Admins can insert file metadata"
    ON file_metadata FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Only admins can update file metadata
CREATE POLICY "Admins can update file metadata"
    ON file_metadata FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Only admins can delete file metadata
CREATE POLICY "Admins can delete file metadata"
    ON file_metadata FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_file_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row changes
DROP TRIGGER IF EXISTS trigger_file_metadata_updated_at ON file_metadata;
CREATE TRIGGER trigger_file_metadata_updated_at
    BEFORE UPDATE ON file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_file_metadata_updated_at();

-- Helper function to search files
CREATE OR REPLACE FUNCTION search_files(search_query TEXT)
RETURNS SETOF file_metadata AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM file_metadata
    WHERE 
        file_name ILIKE '%' || search_query || '%'
        OR subject ILIKE '%' || search_query || '%'
        OR description ILIKE '%' || search_query || '%'
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;
