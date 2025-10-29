export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          credits: number;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          credits?: number;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          credits?: number;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
        };
      };
      ai_tools: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon_url: string | null;
          credits_cost: number;
          is_active: boolean;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon_url?: string | null;
          credits_cost?: number;
          is_active?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon_url?: string | null;
          credits_cost?: number;
          is_active?: boolean;
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          input_data: Json;
          output_data: Json | null;
          credits_used: number;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_id: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          input_data: Json;
          output_data?: Json | null;
          credits_used?: number;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          tool_id?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          input_data?: Json;
          output_data?: Json | null;
          credits_used?: number;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
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
      [_ in never]: never;
    };
  };
}
