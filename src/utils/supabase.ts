import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const authHelpers = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Check if current user is admin
  isAdmin: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;

    const { data, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return !dbError && data?.role === 'admin';
  },

  // Get user role
  getUserRole: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data, error: dbError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return !dbError ? data?.role : null;
  },
};

// R2 Public URL for constructing file URLs
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;

// PDF Files helper functions - fetches from Supabase metadata (with API fallback)
export const pdfHelpers = {
  // Cache for files to avoid repeated API calls
  _cache: null as any[] | null,
  _cacheTime: 0,
  _cacheDuration: 5 * 60 * 1000, // 5 minutes
  _pendingRequest: null as Promise<any> | null, // Prevent duplicate requests

  // Semester order for sorting
  _semesterOrder: ['First Semester', 'Second Semester', 'Third Semester', 'Fourth Semester', 'Fifth Semester', 'Sixth Semester'],

  // Sort files by semester order
  _sortFiles: (files: any[]) => {
    return files.sort((a: any, b: any) => {
      const aOrder = pdfHelpers._semesterOrder.indexOf(a.semester);
      const bOrder = pdfHelpers._semesterOrder.indexOf(b.semester);
      if (aOrder !== bOrder) return aOrder - bOrder;
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      return a.file_name.localeCompare(b.file_name);
    });
  },

  // Get all PDF files - queries Supabase directly, falls back to API
  getAllFiles: async () => {
    // Check cache first (fastest path)
    if (pdfHelpers._cache && Date.now() - pdfHelpers._cacheTime < pdfHelpers._cacheDuration) {
      return { data: pdfHelpers._cache, error: null, source: 'cache' };
    }

    // Prevent duplicate concurrent requests
    if (pdfHelpers._pendingRequest) {
      return pdfHelpers._pendingRequest;
    }

    pdfHelpers._pendingRequest = (async () => {
      try {
        // Direct Supabase query - select only needed fields for faster response
        const { data: files, error: dbError } = await supabase
          .from('file_metadata')
          .select('id, file_name, file_path, file_size, file_url, semester, subject, description, tags, created_at')
          .order('semester', { ascending: true })
          .order('subject', { ascending: true })
          .order('file_name', { ascending: true });

        if (!dbError && files && files.length > 0) {
          const sortedFiles = pdfHelpers._sortFiles(files);
          pdfHelpers._cache = sortedFiles;
          pdfHelpers._cacheTime = Date.now();
          return { data: sortedFiles, error: null, source: 'supabase' };
        }

        // Fallback to API only if Supabase fails or returns empty
        const response = await fetch('/api/list-files');
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.data) {
          pdfHelpers._cache = result.data;
          pdfHelpers._cacheTime = Date.now();
        }

        return result;
      } catch (error) {
        console.error('Error fetching files:', error);
        return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch files' };
      } finally {
        pdfHelpers._pendingRequest = null;
      }
    })();

    return pdfHelpers._pendingRequest;
  },

  // Get files by semester (filters from all files)
  getFilesBySemester: async (semester: string) => {
    const { data, error } = await pdfHelpers.getAllFiles();
    if (error || !data) return { data: null, error };

    const filtered = data.filter((f: any) => f.semester === semester);
    return { data: filtered, error: null };
  },

  // Get files by semester and subject
  getFilesBySubject: async (semester: string, subject: string) => {
    const { data, error } = await pdfHelpers.getAllFiles();
    if (error || !data) return { data: null, error };

    const filtered = data.filter((f: any) => f.semester === semester && f.subject === subject);
    return { data: filtered, error: null };
  },

  // Clear cache (call after upload/delete)
  clearCache: () => {
    pdfHelpers._cache = null;
    pdfHelpers._cacheTime = 0;
  },

  // Delete file - deletes from Supabase metadata (R2 deletion requires API in production)
  deleteFile: async (filePath: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'Not authenticated' };
      }

      // Try API first (works in production with Vercel)
      try {
        const response = await fetch('/api/delete-file', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ filePath }),
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            pdfHelpers.clearCache();
            return { success: true, error: null };
          }
        }
      } catch {
        // API not available, fall through to direct Supabase delete
      }

      // Fallback: Delete metadata from Supabase directly
      // Note: This won't delete from R2, but metadata will be removed
      const { error: deleteError } = await supabase
        .from('file_metadata')
        .delete()
        .eq('file_path', filePath);

      if (deleteError) {
        return { error: deleteError.message };
      }

      pdfHelpers.clearCache();
      return { success: true, error: null, warning: 'Metadata deleted. R2 file may still exist (use production API to fully delete).' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Delete failed' };
    }
  },

  // Delete file by path
  deleteFileByPath: async (filePath: string) => {
    return pdfHelpers.deleteFile(filePath);
  },

  // Sync is not needed - data is already in Supabase
  // This function is kept for compatibility but now just refreshes the cache
  syncFilesToSupabase: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'Not authenticated' };
      }

      // Try API first (works in production)
      try {
        const response = await fetch('/api/sync-files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        if (response.ok) {
          const text = await response.text();
          if (text) {
            const result = JSON.parse(text);
            if (result.success) {
              pdfHelpers.clearCache();
              return result;
            }
          }
        }
      } catch {
        // API not available
      }

      // In dev mode, just clear cache and return success
      // The data is already synced via the migration script
      pdfHelpers.clearCache();
      return { 
        success: true, 
        synced: 0, 
        message: 'Cache cleared. Use "npm run migrate-metadata" to sync R2 files to database.',
        error: null 
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Sync failed' };
    }
  },

  // Search files by query
  searchFiles: async (query: string) => {
    const { data, error } = await pdfHelpers.getAllFiles();
    if (error || !data) return { data: null, error };

    const lowerQuery = query.toLowerCase();
    const filtered = data.filter((f: any) =>
      f.file_name?.toLowerCase().includes(lowerQuery) ||
      f.subject?.toLowerCase().includes(lowerQuery) ||
      f.semester?.toLowerCase().includes(lowerQuery) ||
      f.description?.toLowerCase().includes(lowerQuery)
    );
    return { data: filtered, error: null };
  },

  // Get all unique subjects across all semesters
  getAllSubjects: async () => {
    const { data, error } = await pdfHelpers.getAllFiles();
    if (error || !data) return { data: null, error };

    const subjects = [...new Set(data.map((f: any) => f.subject as string))].sort();
    return { data: subjects, error: null };
  },

  // Get file counts grouped by semester
  getFileCounts: async () => {
    const { data, error } = await pdfHelpers.getAllFiles();
    if (error || !data) return { data: null, error };

    const counts: Record<string, number> = {};
    data.forEach((f: any) => {
      counts[f.semester] = (counts[f.semester] || 0) + 1;
    });
    return { data: counts, error: null };
  },
};
