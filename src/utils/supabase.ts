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

// PDF Files helper functions
export const pdfHelpers = {
  // Get all PDF files grouped by semester and subject
  getAllFiles: async () => {
    const { data, error } = await supabase
      .from('pdf_files')
      .select('*')
      .order('semester', { ascending: true })
      .order('subject', { ascending: true })
      .order('file_name', { ascending: true });

    return { data, error };
  },

  // Get files by semester
  getFilesBySemester: async (semester: string) => {
    const { data, error } = await supabase
      .from('pdf_files')
      .select('*')
      .eq('semester', semester)
      .order('subject', { ascending: true })
      .order('file_name', { ascending: true });

    return { data, error };
  },

  // Get files by semester and subject
  getFilesBySubject: async (semester: string, subject: string) => {
    const { data, error } = await supabase
      .from('pdf_files')
      .select('*')
      .eq('semester', semester)
      .eq('subject', subject)
      .order('file_name', { ascending: true });

    return { data, error };
  },

  // Delete file by ID
  deleteFile: async (fileId: string) => {
    const { error } = await supabase
      .from('pdf_files')
      .delete()
      .eq('id', fileId);

    return { error };
  },

  // Delete file by path
  deleteFileByPath: async (filePath: string) => {
    const { error } = await supabase
      .from('pdf_files')
      .delete()
      .eq('file_path', filePath);

    return { error };
  },
};
