export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      blog_comments: {
        Row: {
          blog_id: number | null;
          content: string;
          created_at: string;
          id: number;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          blog_id?: number | null;
          content: string;
          created_at?: string;
          id?: number;
          name: string;
        };
        Update: {
          blog_id?: number | null;
          content?: string;
          created_at?: string;
          id?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_comments_blog_id_fkey';
            columns: ['blog_id'];
            isOneToOne: false;
            referencedRelation: 'blogs';
            referencedColumns: ['id'];
          },
        ];
      };
      blogs: {
        Row: {
          content: string | null;
          created_at: string;
          excerpt: string | null;
          id: number;
          images: string[] | null;
          is_featured: boolean;
          published_at: string | null;
          slug: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          content?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: number;
          images?: string[] | null;
          is_featured?: boolean;
          published_at?: string | null;
          slug?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: number;
          images?: string[] | null;
          is_featured?: boolean;
          published_at?: string | null;
          slug?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          created_at: string;
          credential_url: string | null;
          description: string | null;
          expiry_date: string | null;
          file_url: string | null;
          id: number;
          issued_by: string | null;
          issued_date: string | null;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          credential_url?: string | null;
          description?: string | null;
          expiry_date?: string | null;
          file_url?: string | null;
          id?: number;
          issued_by?: string | null;
          issued_date?: string | null;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          credential_url?: string | null;
          description?: string | null;
          expiry_date?: string | null;
          file_url?: string | null;
          id?: number;
          issued_by?: string | null;
          issued_date?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          created_at: string;
          email: string;
          id: number;
          is_read: boolean;
          message: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          id?: number;
          is_read?: boolean;
          message: string;
          name: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: number;
          is_read?: boolean;
          message?: string;
          name?: string;
        };
        Relationships: [];
      };
      profile: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          badge_text: string | null;
          detailed_bio: string | null;
          display_name: string | null;
          footer_text: string | null;
          hero_title: string | null;
          id: string;
          logo_text: string | null;
          logo_url: string | null;
          privacy_content: string | null;
          resume_url: string | null;
          short_description: string | null;
          social_links: Json | null;
          terms_content: string | null;
          updated_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          badge_text?: string | null;
          detailed_bio?: string | null;
          display_name?: string | null;
          footer_text?: string | null;
          hero_title?: string | null;
          id: string;
          logo_text?: string | null;
          logo_url?: string | null;
          privacy_content?: string | null;
          resume_url?: string | null;
          short_description?: string | null;
          social_links?: Json | null;
          terms_content?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          badge_text?: string | null;
          detailed_bio?: string | null;
          display_name?: string | null;
          footer_text?: string | null;
          hero_title?: string | null;
          id?: string;
          logo_text?: string | null;
          logo_url?: string | null;
          privacy_content?: string | null;
          resume_url?: string | null;
          short_description?: string | null;
          social_links?: Json | null;
          terms_content?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          content: string | null;
          created_at: string;
          demo_url: string | null;
          id: number;
          images: string[] | null;
          is_featured: boolean;
          repo_url: string | null;
          short_description: string | null;
          slug: string | null;
          tags: string[] | null;
          tech_stack: string[] | null;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          content?: string | null;
          created_at?: string;
          demo_url?: string | null;
          id?: number;
          images?: string[] | null;
          is_featured?: boolean;
          repo_url?: string | null;
          short_description?: string | null;
          slug?: string | null;
          tags?: string[] | null;
          tech_stack?: string[] | null;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          demo_url?: string | null;
          id?: number;
          images?: string[] | null;
          is_featured?: boolean;
          repo_url?: string | null;
          short_description?: string | null;
          slug?: string | null;
          tags?: string[] | null;
          tech_stack?: string[] | null;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      resume: {
        Row: {
          description: string | null;
          gpa: string | null;
          id: number;
          institution: string | null;
          period: string | null;
          tags: string[] | null;
          title: string;
          type: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          description?: string | null;
          gpa?: string | null;
          id?: number;
          institution?: string | null;
          period?: string | null;
          tags?: string[] | null;
          title: string;
          type: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          description?: string | null;
          gpa?: string | null;
          id?: number;
          institution?: string | null;
          period?: string | null;
          tags?: string[] | null;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      services: {
        Row: {
          description: string | null;
          icon_name: string | null;
          id: number;
          title: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          description?: string | null;
          icon_name?: string | null;
          id?: number;
          title: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          description?: string | null;
          icon_name?: string | null;
          id?: number;
          title?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      tech_stack: {
        Row: {
          category: string | null;
          created_at: string;
          icon_url: string | null;
          id: number;
          name: string;
          updated_at: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          category?: string | null;
          created_at?: string;
          icon_url?: string | null;
          id?: number;
          name: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          icon_url?: string | null;
          id?: number;
          name?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
