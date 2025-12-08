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

// PDF Files helper functions - fetches directly from R2 via API
export const pdfHelpers = {
  // Cache for files to avoid repeated API calls
  _cache: null as any[] | null,
  _cacheTime: 0,
  _cacheDuration: 5 * 60 * 1000, // 5 minutes

  // Get all PDF files from R2
  getAllFiles: async () => {
    // Check cache
    if (pdfHelpers._cache && Date.now() - pdfHelpers._cacheTime < pdfHelpers._cacheDuration) {
      return { data: pdfHelpers._cache, error: null };
    }

    try {
      const response = await fetch('/api/list-files');
      const result = await response.json();
      
      if (result.data) {
        pdfHelpers._cache = result.data;
        pdfHelpers._cacheTime = Date.now();
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching files:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch files' };
    }
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

  // Delete file - calls R2 delete API
  deleteFile: async (fileId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'Not authenticated' };
      }

      const response = await fetch('/api/delete-file', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ filePath: fileId }),
      });
      const result = await response.json();
      if (!result.error) {
        pdfHelpers.clearCache();
      }
      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Delete failed' };
    }
  },

  // Delete file by path
  deleteFileByPath: async (filePath: string) => {
    return pdfHelpers.deleteFile(filePath);
  },
};
