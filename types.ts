export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          content: string | null
          tech_stack: string[] | null
          demo_url: string | null
          repo_url: string | null
          thumbnail_url: string | null
          is_featured: boolean
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          content?: string | null
          tech_stack?: string[] | null
          demo_url?: string | null
          repo_url?: string | null
          thumbnail_url?: string | null
          is_featured?: boolean
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          content?: string | null
          tech_stack?: string[] | null
          demo_url?: string | null
          repo_url?: string | null
          thumbnail_url?: string | null
          is_featured?: boolean
          published_at?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          name: string
          email: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          message: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
