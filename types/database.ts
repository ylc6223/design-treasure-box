// types/database.ts
// Supabase 数据库类型定义
// 这些类型基于数据库 schema 手动创建
// 也可以使用 Supabase CLI 自动生成：supabase gen types typescript --project-id <project-id>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
          role: 'USER' | 'ADMIN';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email: string;
          image?: string | null;
          role?: 'USER' | 'ADMIN';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          image?: string | null;
          role?: 'USER' | 'ADMIN';
          created_at?: string;
          updated_at?: string;
        };
      };
      resources: {
        Row: {
          id: string;
          name: string;
          url: string;
          description: string;
          category_id: string;
          tags: string[];
          curator_note: string;
          is_featured: boolean;
          curator_rating: Json;
          view_count: number;
          favorite_count: number;
          average_rating: number;
          rating_count: number;
          screenshot_url: string | null;
          screenshot_updated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          description: string;
          category_id: string;
          tags: string[];
          curator_note: string;
          is_featured?: boolean;
          curator_rating: Json;
          view_count?: number;
          favorite_count?: number;
          average_rating?: number;
          rating_count?: number;
          screenshot_url?: string | null;
          screenshot_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          description?: string;
          category_id?: string;
          tags?: string[];
          curator_note?: string;
          is_featured?: boolean;
          curator_rating?: Json;
          view_count?: number;
          favorite_count?: number;
          average_rating?: number;
          rating_count?: number;
          screenshot_url?: string | null;
          screenshot_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          user_id: string;
          resource_id: string;
          overall: number;
          usability: number;
          aesthetics: number;
          update_frequency: number;
          free_level: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_id: string;
          overall: number;
          usability: number;
          aesthetics: number;
          update_frequency: number;
          free_level: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resource_id?: string;
          overall?: number;
          usability?: number;
          aesthetics?: number;
          update_frequency?: number;
          free_level?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: 'USER' | 'ADMIN';
    };
  };
}
