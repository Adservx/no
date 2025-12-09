import { supabase } from '../utils/supabase';

const API_BASE = '/api';

export interface FileMetadata {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_url: string;
  semester: string;
  subject: string;
  content_type?: string;
  description?: string;
  tags?: string[];
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UploadParams {
  file: File;
  semester: string;
  subject: string;
  description?: string;
  tags?: string[];
  onProgress?: (progress: number) => void;
}

export interface FileServiceResponse<T> {
  data: T | null;
  error: string | null;
  source?: 'supabase' | 'r2';
}

// Cache for file listings
let fileCache: FileMetadata[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export const fileService = {
  // Clear cache
  clearCache: () => {
    fileCache = null;
    cacheTime = 0;
  },

  // List all files (from Supabase metadata, falls back to R2)
  listFiles: async (): Promise<FileServiceResponse<FileMetadata[]>> => {
    // Check cache
    if (fileCache && Date.now() - cacheTime < CACHE_DURATION) {
      return { data: fileCache, error: null, source: 'supabase' };
    }

    try {
      const response = await fetch(`${API_BASE}/list-files`);
      const result = await response.json();

      if (result.data) {
        fileCache = result.data;
        cacheTime = Date.now();
      }

      return {
        data: result.data,
        error: result.error,
        source: result.source
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to list files'
      };
    }
  },


  // Get files by semester
  getFilesBySemester: async (semester: string): Promise<FileServiceResponse<FileMetadata[]>> => {
    const { data, error } = await fileService.listFiles();
    if (error || !data) return { data: null, error };

    const filtered = data.filter(f => f.semester === semester);
    return { data: filtered, error: null };
  },

  // Get files by semester and subject
  getFilesBySubject: async (semester: string, subject: string): Promise<FileServiceResponse<FileMetadata[]>> => {
    const { data, error } = await fileService.listFiles();
    if (error || !data) return { data: null, error };

    const filtered = data.filter(f => f.semester === semester && f.subject === subject);
    return { data: filtered, error: null };
  },

  // Search files
  searchFiles: async (query: string): Promise<FileServiceResponse<FileMetadata[]>> => {
    const { data, error } = await fileService.listFiles();
    if (error || !data) return { data: null, error };

    const lowerQuery = query.toLowerCase();
    const filtered = data.filter(f =>
      f.file_name?.toLowerCase().includes(lowerQuery) ||
      f.subject?.toLowerCase().includes(lowerQuery) ||
      f.semester?.toLowerCase().includes(lowerQuery) ||
      f.description?.toLowerCase().includes(lowerQuery)
    );
    return { data: filtered, error: null };
  },

  // Upload file to R2 with metadata in Supabase
  uploadFile: async (params: UploadParams): Promise<FileServiceResponse<FileMetadata>> => {
    const { file, semester, subject, description, tags, onProgress } = params;

    const token = await getAuthToken();
    if (!token) {
      return { data: null, error: 'Not authenticated' };
    }

    try {
      onProgress?.(10);

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      onProgress?.(30);

      // Generate file path
      const sanitizedSemester = semester.toLowerCase().replace(/\s+/g, '-');
      const sanitizedSubject = subject.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
      const filePath = `${sanitizedSemester}/${sanitizedSubject}/${file.name}`;

      onProgress?.(50);

      const response = await fetch(`${API_BASE}/upload-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          filePath,
          fileData: base64,
          fileSize: file.size,
          contentType: file.type || 'application/pdf',
          semester,
          subject,
          description,
          tags,
        }),
      });

      onProgress?.(90);

      const result = await response.json();

      if (result.success) {
        fileService.clearCache();
        onProgress?.(100);
        return { data: result.data, error: null };
      }

      return { data: null, error: result.error || 'Upload failed' };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  },

  // Delete file from R2 and Supabase
  deleteFile: async (filePath: string): Promise<{ success: boolean; error: string | null }> => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE}/delete-file`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ filePath }),
      });

      const result = await response.json();

      if (result.success) {
        fileService.clearCache();
      }

      return { success: result.success, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  },

  // Sync R2 files to Supabase metadata (admin only)
  syncFiles: async (): Promise<{ success: boolean; synced?: number; error: string | null }> => {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${API_BASE}/sync-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Check if response is ok
      if (!response.ok) {
        const text = await response.text();
        return {
          success: false,
          error: `Server error (${response.status}): ${text || 'No response'}`
        };
      }

      // Check if response has content
      const text = await response.text();
      if (!text) {
        return {
          success: false,
          error: 'Empty response from server - sync may have timed out'
        };
      }

      const result = JSON.parse(text);

      if (result.success) {
        fileService.clearCache();
      }

      return {
        success: result.success,
        synced: result.synced,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  },

  // Get unique semesters
  getSemesters: async (): Promise<FileServiceResponse<string[]>> => {
    const { data, error } = await fileService.listFiles();
    if (error || !data) return { data: null, error };

    const semesters = [...new Set(data.map(f => f.semester))];
    const order = ['First Semester', 'Second Semester', 'Third Semester', 'Fourth Semester', 'Fifth Semester', 'Sixth Semester'];
    semesters.sort((a, b) => order.indexOf(a) - order.indexOf(b));

    return { data: semesters, error: null };
  },

  // Get subjects for a semester
  getSubjects: async (semester: string): Promise<FileServiceResponse<string[]>> => {
    const { data, error } = await fileService.listFiles();
    if (error || !data) return { data: null, error };

    const subjects = [...new Set(data.filter(f => f.semester === semester).map(f => f.subject))].sort();
    return { data: subjects, error: null };
  },

  // Get file counts by semester
  getFileCounts: async (): Promise<FileServiceResponse<Record<string, number>>> => {
    const { data, error } = await fileService.listFiles();
    if (error || !data) return { data: null, error };

    const counts: Record<string, number> = {};
    data.forEach(f => {
      counts[f.semester] = (counts[f.semester] || 0) + 1;
    });

    return { data: counts, error: null };
  },
};

export default fileService;
