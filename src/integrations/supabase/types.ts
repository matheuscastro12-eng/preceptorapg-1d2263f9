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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      enamed_attempts: {
        Row: {
          answers: Json
          area_filter: string | null
          correct_answers: number
          created_at: string
          id: string
          modo: string
          percentage: number
          source: string
          total_questions: number
          user_id: string
        }
        Insert: {
          answers?: Json
          area_filter?: string | null
          correct_answers: number
          created_at?: string
          id?: string
          modo: string
          percentage: number
          source?: string
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          area_filter?: string | null
          correct_answers?: number
          created_at?: string
          id?: string
          modo?: string
          percentage?: number
          source?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      enamed_ebooks: {
        Row: {
          content: string
          created_at: string
          id: string
          specialty_id: string
          specialty_name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          specialty_id: string
          specialty_name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          specialty_id?: string
          specialty_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      enamed_questions: {
        Row: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          ano: number
          anulada: boolean
          area: string
          created_at: string
          enunciado: string
          explicacao: string | null
          gabarito: string
          id: string
          numero: number
        }
        Insert: {
          alternativa_a: string
          alternativa_b: string
          alternativa_c: string
          alternativa_d: string
          ano?: number
          anulada?: boolean
          area: string
          created_at?: string
          enunciado: string
          explicacao?: string | null
          gabarito: string
          id?: string
          numero: number
        }
        Update: {
          alternativa_a?: string
          alternativa_b?: string
          alternativa_c?: string
          alternativa_d?: string
          ano?: number
          anulada?: boolean
          area?: string
          created_at?: string
          enunciado?: string
          explicacao?: string | null
          gabarito?: string
          id?: string
          numero?: number
        }
        Relationships: []
      }
      fechamentos: {
        Row: {
          created_at: string
          exam_config: Json | null
          favorito: boolean
          id: string
          objetivos: string | null
          resultado: string
          tema: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_config?: Json | null
          favorito?: boolean
          id?: string
          objetivos?: string | null
          resultado: string
          tema: string
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_config?: Json | null
          favorito?: boolean
          id?: string
          objetivos?: string | null
          resultado?: string
          tema?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          area: string | null
          back: string
          created_at: string
          ease_factor: number
          front: string
          id: string
          interval_days: number
          next_review: string
          repetitions: number
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          area?: string | null
          back: string
          created_at?: string
          ease_factor?: number
          front: string
          id?: string
          interval_days?: number
          next_review?: string
          repetitions?: number
          source_id?: string | null
          source_type?: string
          user_id: string
        }
        Update: {
          area?: string | null
          back?: string
          created_at?: string
          ease_factor?: number
          front?: string
          id?: string
          interval_days?: number
          next_review?: string
          repetitions?: number
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      generation_logs: {
        Row: {
          created_at: string
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          fechamento_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          fechamento_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          fechamento_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_fechamento_id_fkey"
            columns: ["fechamento_id"]
            isOneToOne: false
            referencedRelation: "fechamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          semester: string | null
          university: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          semester?: string | null
          university?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          semester?: string | null
          university?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          access_expires_at: string | null
          created_at: string
          current_period_end: string | null
          granted_by: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          created_at?: string
          current_period_end?: string | null
          granted_by?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          created_at?: string
          current_period_end?: string | null
          granted_by?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_progress: {
        Row: {
          created_at: string
          exam_count: number
          id: string
          last_studied_at: string | null
          resumo_count: number
          studied: boolean
          topic_key: string
          topic_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_count?: number
          id?: string
          last_studied_at?: string | null
          resumo_count?: number
          studied?: boolean
          topic_key: string
          topic_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_count?: number
          id?: string
          last_studied_at?: string | null
          resumo_count?: number
          studied?: boolean
          topic_key?: string
          topic_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          full_name: string | null
          semester: string | null
          university: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          semester?: string | null
          university?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          full_name?: string | null
          semester?: string | null
          university?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
