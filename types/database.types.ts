export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_editing_tools: {
        Row: {
          category: string | null
          created_at: string | null
          credits_cost: number
          description: string | null
          description_pt: string | null
          display_name: string
          display_name_pt: string | null
          display_order: number | null
          icon_path: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          metadata: Json | null
          tool_name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          credits_cost?: number
          description?: string | null
          description_pt?: string | null
          display_name: string
          display_name_pt?: string | null
          display_order?: number | null
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          metadata?: Json | null
          tool_name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          credits_cost?: number
          description?: string | null
          description_pt?: string | null
          display_name?: string
          display_name_pt?: string | null
          display_order?: number | null
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          metadata?: Json | null
          tool_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_generated_prompts: {
        Row: {
          created_at: string | null
          generated_prompt: string
          generation_id: string
          id: string
          input_data: Json
          is_deleted: boolean | null
          metadata: Json | null
          prompt_optimizer_model: string
          tokens_used: number | null
        }
        Insert: {
          created_at?: string | null
          generated_prompt: string
          generation_id: string
          id?: string
          input_data: Json
          is_deleted?: boolean | null
          metadata?: Json | null
          prompt_optimizer_model?: string
          tokens_used?: number | null
        }
        Update: {
          created_at?: string | null
          generated_prompt?: string
          generation_id?: string
          id?: string
          input_data?: Json
          is_deleted?: boolean | null
          metadata?: Json | null
          prompt_optimizer_model?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_prompts_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tools: {
        Row: {
          created_at: string | null
          credits_cost: number
          description: string
          display_order: number | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          name: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits_cost?: number
          description: string
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits_cost?: number
          description?: string
          display_order?: number | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      background_presets: {
        Row: {
          category: string
          color_hex: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string
          is_active: boolean
          is_featured: boolean
          is_premium: boolean | null
          metadata: Json | null
          name: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          color_hex?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url: string
          is_active?: boolean
          is_featured?: boolean
          is_premium?: boolean | null
          metadata?: Json | null
          name: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          color_hex?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          is_premium?: boolean | null
          metadata?: Json | null
          name?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      category_tip_avoid_items: {
        Row: {
          created_at: string
          display_order: number
          id: string
          item_text: string
          tip_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          item_text: string
          tip_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          item_text?: string
          tip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_tip_avoid_items_tip_id_fkey"
            columns: ["tip_id"]
            isOneToOne: false
            referencedRelation: "category_tips"
            referencedColumns: ["id"]
          },
        ]
      }
      category_tip_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_type: string
          image_url: string
          tip_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_type: string
          image_url: string
          tip_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_type?: string
          image_url?: string
          tip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_tip_images_tip_id_fkey"
            columns: ["tip_id"]
            isOneToOne: false
            referencedRelation: "category_tips"
            referencedColumns: ["id"]
          },
        ]
      }
      category_tips: {
        Row: {
          avoid_title: string
          category_slug: string
          created_at: string
          good_description: string
          id: string
          is_deleted: boolean | null
          updated_at: string
        }
        Insert: {
          avoid_title?: string
          category_slug: string
          created_at?: string
          good_description: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string
        }
        Update: {
          avoid_title?: string
          category_slug?: string
          created_at?: string
          good_description?: string
          id?: string
          is_deleted?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          attachment_type: string
          created_at: string | null
          file_url: string | null
          id: string
          message_id: string
          metadata: Json | null
          reference_id: string | null
        }
        Insert: {
          attachment_type: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          message_id: string
          metadata?: Json | null
          reference_id?: string | null
        }
        Update: {
          attachment_type?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          message_id?: string
          metadata?: Json | null
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          credits_charged: number | null
          generation_id: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          credits_charged?: number | null
          generation_id?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          credits_charged?: number | null
          generation_id?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_pricing: {
        Row: {
          action_type: string
          created_at: string | null
          credits_required: number
          description: string | null
          description_pt: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          credits_required: number
          description?: string | null
          description_pt?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          credits_required?: number
          description?: string | null
          description_pt?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      customization_options: {
        Row: {
          created_at: string | null
          display_name: string
          display_name_pt: string | null
          display_order: number | null
          icon_path: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          option_type: string
          option_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          display_name_pt?: string | null
          display_order?: number | null
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          option_type: string
          option_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          display_name_pt?: string | null
          display_order?: number | null
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          option_type?: string
          option_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      generation_ai_edits: {
        Row: {
          completed_at: string | null
          created_at: string | null
          credits_charged: number
          error_message: string | null
          generation_id: string
          id: string
          params: Json | null
          result_url: string | null
          status: string
          tool_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          credits_charged?: number
          error_message?: string | null
          generation_id: string
          id?: string
          params?: Json | null
          result_url?: string | null
          status?: string
          tool_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          credits_charged?: number
          error_message?: string | null
          generation_id?: string
          id?: string
          params?: Json | null
          result_url?: string | null
          status?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_ai_edits_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_ai_edits_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "ai_editing_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_customizations: {
        Row: {
          created_at: string | null
          facial_expression: string | null
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          model_height_cm: number | null
          model_weight_kg: number | null
          updated_at: string | null
          upload_id: string
        }
        Insert: {
          created_at?: string | null
          facial_expression?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          model_height_cm?: number | null
          model_weight_kg?: number | null
          updated_at?: string | null
          upload_id: string
        }
        Update: {
          created_at?: string | null
          facial_expression?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          model_height_cm?: number | null
          model_weight_kg?: number | null
          updated_at?: string | null
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_customizations_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: true
            referencedRelation: "user_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_feedback: {
        Row: {
          created_at: string | null
          feedback_text: string | null
          feedback_type: string
          generation_result_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type: string
          generation_result_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_text?: string | null
          feedback_type?: string
          generation_result_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_feedback_generation_result_id_fkey"
            columns: ["generation_result_id"]
            isOneToOne: false
            referencedRelation: "generation_results"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_format_selections: {
        Row: {
          created_at: string | null
          format_preset_id: string
          id: string
          updated_at: string | null
          upload_id: string
        }
        Insert: {
          created_at?: string | null
          format_preset_id: string
          id?: string
          updated_at?: string | null
          upload_id: string
        }
        Update: {
          created_at?: string | null
          format_preset_id?: string
          id?: string
          updated_at?: string | null
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_format_selections_format_preset_id_fkey"
            columns: ["format_preset_id"]
            isOneToOne: false
            referencedRelation: "image_format_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_format_selections_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: true
            referencedRelation: "user_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_results: {
        Row: {
          created_at: string | null
          generation_id: string
          has_watermark: boolean | null
          id: string
          image_url: string
          is_deleted: boolean | null
          is_purchased: boolean | null
          metadata: Json | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          generation_id: string
          has_watermark?: boolean | null
          id?: string
          image_url: string
          is_deleted?: boolean | null
          is_purchased?: boolean | null
          metadata?: Json | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          generation_id?: string
          has_watermark?: boolean | null
          id?: string
          image_url?: string
          is_deleted?: boolean | null
          is_purchased?: boolean | null
          metadata?: Json | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_results_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generations: {
        Row: {
          created_at: string | null
          credits_used: number
          error_message: string | null
          id: string
          input_data: Json | null
          is_deleted: boolean | null
          output_data: Json | null
          status: string
          tool_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_used?: number
          error_message?: string | null
          id?: string
          input_data?: Json | null
          is_deleted?: boolean | null
          output_data?: Json | null
          status?: string
          tool_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_used?: number
          error_message?: string | null
          id?: string
          input_data?: Json | null
          is_deleted?: boolean | null
          output_data?: Json | null
          status?: string
          tool_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "ai_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      image_format_presets: {
        Row: {
          aspect_ratio: string
          category: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          gemini_aspect_ratio: string | null
          height: number
          icon_name: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          platform: string
          updated_at: string | null
          width: number
        }
        Insert: {
          aspect_ratio: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          gemini_aspect_ratio?: string | null
          height: number
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          platform: string
          updated_at?: string | null
          width: number
        }
        Update: {
          aspect_ratio?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          gemini_aspect_ratio?: string | null
          height?: number
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          platform?: string
          updated_at?: string | null
          width?: number
        }
        Relationships: []
      }
      model_poses: {
        Row: {
          age_max: number
          age_min: number
          age_range: Database["public"]["Enums"]["age_range"]
          created_at: string
          description: string | null
          ethnicity: Database["public"]["Enums"]["model_ethnicity"]
          garment_categories: string[]
          gender: Database["public"]["Enums"]["model_gender"]
          id: string
          image_url: string
          is_active: boolean
          is_featured: boolean
          metadata: Json | null
          name: string | null
          pose_category: Database["public"]["Enums"]["pose_category"]
          storage_path: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          age_max: number
          age_min: number
          age_range: Database["public"]["Enums"]["age_range"]
          created_at?: string
          description?: string | null
          ethnicity: Database["public"]["Enums"]["model_ethnicity"]
          garment_categories?: string[]
          gender: Database["public"]["Enums"]["model_gender"]
          id?: string
          image_url: string
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json | null
          name?: string | null
          pose_category: Database["public"]["Enums"]["pose_category"]
          storage_path?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          age_max?: number
          age_min?: number
          age_range?: Database["public"]["Enums"]["age_range"]
          created_at?: string
          description?: string | null
          ethnicity?: Database["public"]["Enums"]["model_ethnicity"]
          garment_categories?: string[]
          gender?: Database["public"]["Enums"]["model_gender"]
          id?: string
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          metadata?: Json | null
          name?: string | null
          pose_category?: Database["public"]["Enums"]["pose_category"]
          storage_path?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number | null
          created_at: string | null
          id: string
          identifier: string
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          action: string
          count?: number | null
          created_at?: string | null
          id?: string
          identifier: string
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          action?: string
          count?: number | null
          created_at?: string | null
          id?: string
          identifier?: string
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      user_daily_limits: {
        Row: {
          created_at: string | null
          date: string
          dislike_count: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          dislike_count?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          dislike_count?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_downloads: {
        Row: {
          credits_charged: number
          downloaded_at: string | null
          generation_id: string
          id: string
          image_url: string
          is_deleted: boolean | null
          result_id: string
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          credits_charged?: number
          downloaded_at?: string | null
          generation_id: string
          id?: string
          image_url: string
          is_deleted?: boolean | null
          result_id: string
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          credits_charged?: number
          downloaded_at?: string | null
          generation_id?: string
          id?: string
          image_url?: string
          is_deleted?: boolean | null
          result_id?: string
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_downloads_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_downloads_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "generation_results"
            referencedColumns: ["id"]
          },
        ]
      }
      user_uploads: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          mime_type: string
          status: string
          thumbnail_path: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          mime_type: string
          status?: string
          thumbnail_path?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          mime_type?: string
          status?: string
          thumbnail_path?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          credits: number | null
          email: string | null
          full_name: string | null
          id: string
          is_deleted: boolean | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id: string
          is_deleted?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credits?: number | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_deleted?: boolean | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          expires_at: string
          id: string
          phone: string
          updated_at: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          phone: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          phone?: string
          updated_at?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      wardrobe_collections: {
        Row: {
          created_at: string | null
          description: string | null
          icon_color: string | null
          id: string
          is_deleted: boolean | null
          item_count: number | null
          metadata: Json | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon_color?: string | null
          id?: string
          is_deleted?: boolean | null
          item_count?: number | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon_color?: string | null
          id?: string
          is_deleted?: boolean | null
          item_count?: number | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          category_slug: string | null
          collection_id: string | null
          created_at: string | null
          garment_type: string | null
          id: string
          is_deleted: boolean | null
          is_favorite: boolean | null
          last_worn_at: string | null
          metadata: Json | null
          piece_type: string | null
          tags: string[] | null
          updated_at: string | null
          upload_id: string
          user_id: string
          wear_count: number | null
        }
        Insert: {
          category_slug?: string | null
          collection_id?: string | null
          created_at?: string | null
          garment_type?: string | null
          id?: string
          is_deleted?: boolean | null
          is_favorite?: boolean | null
          last_worn_at?: string | null
          metadata?: Json | null
          piece_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
          upload_id: string
          user_id: string
          wear_count?: number | null
        }
        Update: {
          category_slug?: string | null
          collection_id?: string | null
          created_at?: string | null
          garment_type?: string | null
          id?: string
          is_deleted?: boolean | null
          is_favorite?: boolean | null
          last_worn_at?: string | null
          metadata?: Json | null
          piece_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
          upload_id?: string
          user_id?: string
          wear_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wardrobe_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wardrobe_items_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "user_uploads"
            referencedColumns: ["id"]
          },
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
      age_range:
        | "TEENS"
        | "TWENTIES"
        | "THIRTIES"
        | "FORTIES"
        | "FIFTIES"
        | "SIXTIES_PLUS"
      model_ethnicity:
        | "CAUCASIAN"
        | "AFRICAN"
        | "ASIAN"
        | "HISPANIC"
        | "MIDDLE_EASTERN"
        | "MIXED"
        | "OTHER"
      model_gender: "MALE" | "FEMALE" | "NON_BINARY"
      pose_category:
        | "STANDING_STRAIGHT"
        | "STANDING_CASUAL"
        | "STANDING_CONFIDENT"
        | "SITTING"
        | "WALKING"
        | "LEANING"
        | "DYNAMIC"
        | "RELAXED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      age_range: [
        "TEENS",
        "TWENTIES",
        "THIRTIES",
        "FORTIES",
        "FIFTIES",
        "SIXTIES_PLUS",
      ],
      model_ethnicity: [
        "CAUCASIAN",
        "AFRICAN",
        "ASIAN",
        "HISPANIC",
        "MIDDLE_EASTERN",
        "MIXED",
        "OTHER",
      ],
      model_gender: ["MALE", "FEMALE", "NON_BINARY"],
      pose_category: [
        "STANDING_STRAIGHT",
        "STANDING_CASUAL",
        "STANDING_CONFIDENT",
        "SITTING",
        "WALKING",
        "LEANING",
        "DYNAMIC",
        "RELAXED",
      ],
    },
  },
} as const
