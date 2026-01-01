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
      blogs: {
        Row: {
          id: number
          user_id: string
          title: string
          slug: string | null
          excerpt: string | null
          content: string | null
          image_url: string | null
          tags: string[] | null
          is_featured: boolean | null
          published_at: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          slug?: string | null
          excerpt?: string | null
          content?: string | null
          image_url?: string | null
          tags?: string[] | null
          is_featured?: boolean | null
          published_at?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          slug?: string | null
          excerpt?: string | null
          content?: string | null
          image_url?: string | null
          tags?: string[] | null
          is_featured?: boolean | null
          published_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blogs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: number
          name: string
          email: string
          message: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          message: string
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          message?: string
          created_at?: string
        }
        Relationships: []
      }
      profile: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: number
          user_id: string
          title: string
          slug: string | null
          description: string | null
          image_url: string | null
          project_url: string | null
          tags: string[] | null
          is_featured: boolean | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          slug?: string | null
          description?: string | null
          image_url?: string | null
          project_url?: string | null
          tags?: string[] | null
          is_featured?: boolean | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          slug?: string | null
          description?: string | null
          image_url?: string | null
          project_url?: string | null
          tags?: string[] | null
          is_featured?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      resume: {
        Row: {
          id: number
          user_id: string
          type: string
          title: string
          institution: string | null
          start_date: string | null
          end_date: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          type: string
          title: string
          institution?: string | null
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          type?: string
          title?: string
          institution?: string | null
          start_date?: string | null
          end_date?: string | null
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          id: number
          user_id: string
          title: string
          description: string | null
          icon_name: string | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          description?: string | null
          icon_name?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          icon_name?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
