export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      file_metadata: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_url: string
          id: string
          semester: string
          subject: string
          tags: string[] | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_url: string
          id?: string
          semester: string
          subject: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_url?: string
          id?: string
          semester?: string
          subject?: string
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type FileMetadata = Database['public']['Tables']['file_metadata']['Row']
export type FileMetadataInsert = Database['public']['Tables']['file_metadata']['Insert']
export type FileMetadataUpdate = Database['public']['Tables']['file_metadata']['Update']
export type User = Database['public']['Tables']['users']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
