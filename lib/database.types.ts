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
          created_at: string
          published_at: string | null
          id: number
          user_id: string
          title: string
          slug: string | null
          excerpt: string | null
          content: string | null
          images: string[] | null
          tags: string[] | null
          is_featured: boolean | null
        }
        Insert: {
          created_at?: string
          published_at?: string | null
          id?: number
          user_id: string
          title: string
          slug?: string | null
          excerpt?: string | null
          content?: string | null
          images?: string[] | null
          tags?: string[] | null
          is_featured?: boolean | null
        }
        Update: {
          created_at?: string
          published_at?: string | null
          id?: number
          user_id?: string
          title?: string
          slug?: string | null
          excerpt?: string | null
          content?: string | null
          images?: string[] | null
          tags?: string[] | null
          is_featured?: boolean | null
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
          created_at: string
          name: string
          email: string
          message: string
          is_read: boolean | null
        }
        Insert: {
          id?: number
          created_at?: string
          name: string
          email: string
          message: string
          is_read?: boolean | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string
          email?: string
          message?: string
          is_read?: boolean | null
        }
        Relationships: []
      }
      profile: {
        Row: {
          id: string
          updated_at: string | null
          logo_text: string | null
          logo_url: string | null
          display_name: string | null
          badge_text: string | null
          hero_title: string | null
          short_description: string | null
          detailed_bio: string | null
          avatar_url: string | null
          resume_url: string | null
          address: string | null
          footer_text: string | null
          privacy_content: string | null
          terms_content: string | null
          social_links: Json | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          logo_text?: string | null
          logo_url?: string | null
          display_name?: string | null
          badge_text?: string | null
          hero_title?: string | null
          short_description?: string | null
          detailed_bio?: string | null
          avatar_url?: string | null
          resume_url?: string | null
          address?: string | null
          footer_text?: string | null
          privacy_content?: string | null
          terms_content?: string | null
          social_links?: Json | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          logo_text?: string | null
          logo_url?: string | null
          display_name?: string | null
          badge_text?: string | null
          hero_title?: string | null
          short_description?: string | null
          detailed_bio?: string | null
          avatar_url?: string | null
          resume_url?: string | null
          address?: string | null
          footer_text?: string | null
          privacy_content?: string | null
          terms_content?: string | null
          social_links?: Json | null
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
          created_at: string
          title: string
          slug: string | null
          short_description: string | null
          content: string | null
          images: string[] | null
          tech_stack: string[] | null
          tags: string[] | null
          demo_url: string | null
          repo_url: string | null
          is_featured: boolean | null
        }
        Insert: {
          id?: number
          user_id: string
          created_at?: string
          title: string
          slug?: string | null
          short_description?: string | null
          content?: string | null
          images?: string[] | null
          tech_stack?: string[] | null
          tags?: string[] | null
          demo_url?: string | null
          repo_url?: string | null
          is_featured?: boolean | null
        }
        Update: {
          id?: number
          user_id?: string
          created_at?: string
          title?: string
          slug?: string | null
          short_description?: string | null
          content?: string | null
          images?: string[] | null
          tech_stack?: string[] | null
          tags?: string[] | null
          demo_url?: string | null
          repo_url?: string | null
          is_featured?: boolean | null
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
          period: string | null
          description: string | null
          gpa: string | null
          tags: string[] | null
        }
        Insert: {
          id?: number
          user_id: string
          type: string
          title: string
          institution?: string | null
          period?: string | null
          description?: string | null
          gpa?: string | null
          tags?: string[] | null
        }
        Update: {
          id?: number
          user_id?: string
          type?: string
          title?: string
          institution?: string | null
          period?: string | null
          description?: string | null
          gpa?: string | null
          tags?: string[] | null
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
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          description?: string | null
          icon_name?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          icon_name?: string | null
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