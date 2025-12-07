-- Migration: Create likes and comments tables for Manikant posts
-- Run this migration in your Supabase SQL editor

-- Create manikant_likes table
CREATE TABLE IF NOT EXISTS manikant_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES manikant_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create manikant_comments table
CREATE TABLE IF NOT EXISTS manikant_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES manikant_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manikant_likes_post_id ON manikant_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_manikant_likes_user_id ON manikant_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_manikant_comments_post_id ON manikant_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_manikant_comments_user_id ON manikant_comments(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE manikant_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE manikant_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manikant_likes

-- Anyone can view likes
CREATE POLICY "Anyone can view likes"
    ON manikant_likes FOR SELECT
    USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "Users can insert their own likes"
    ON manikant_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
CREATE POLICY "Users can delete their own likes"
    ON manikant_likes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for manikant_comments

-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
    ON manikant_comments FOR SELECT
    USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comments"
    ON manikant_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own comments
CREATE POLICY "Users can delete their own comments"
    ON manikant_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Grant access for the profiles join in comments
-- Make sure the comments can fetch related profile data
ALTER TABLE manikant_comments ADD CONSTRAINT fk_comments_profiles 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
