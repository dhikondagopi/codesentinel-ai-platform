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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      detected_issues: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_path: string | null
          id: string
          is_resolved: boolean | null
          line_end: number | null
          line_start: number | null
          repository_id: string
          scan_id: string
          severity: string
          suggestion: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          is_resolved?: boolean | null
          line_end?: number | null
          line_start?: number | null
          repository_id: string
          scan_id: string
          severity?: string
          suggestion?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          id?: string
          is_resolved?: boolean | null
          line_end?: number | null
          line_start?: number | null
          repository_id?: string
          scan_id?: string
          severity?: string
          suggestion?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detected_issues_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_issues_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_results"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      quality_scores: {
        Row: {
          created_at: string
          id: string
          maintainability: number | null
          overall_score: number
          performance: number | null
          reliability: number | null
          repository_id: string
          scan_id: string
          security: number | null
          test_coverage: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          maintainability?: number | null
          overall_score?: number
          performance?: number | null
          reliability?: number | null
          repository_id: string
          scan_id: string
          security?: number | null
          test_coverage?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          maintainability?: number | null
          overall_score?: number
          performance?: number | null
          reliability?: number | null
          repository_id?: string
          scan_id?: string
          security?: number | null
          test_coverage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_scores_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_scores_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scan_results"
            referencedColumns: ["id"]
          },
        ]
      }
      repositories: {
        Row: {
          created_at: string
          default_branch: string
          description: string | null
          full_name: string
          id: string
          language: string | null
          last_scanned_at: string | null
          name: string
          stars: number | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_branch?: string
          description?: string | null
          full_name: string
          id?: string
          language?: string | null
          last_scanned_at?: string | null
          name: string
          stars?: number | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_branch?: string
          description?: string | null
          full_name?: string
          id?: string
          language?: string | null
          last_scanned_at?: string | null
          name?: string
          stars?: number | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      scan_results: {
        Row: {
          completed_at: string | null
          created_at: string
          critical_count: number | null
          duration_ms: number | null
          id: string
          info_count: number | null
          repository_id: string
          scan_type: string
          started_at: string | null
          status: string
          total_issues: number | null
          user_id: string
          warning_count: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          critical_count?: number | null
          duration_ms?: number | null
          id?: string
          info_count?: number | null
          repository_id: string
          scan_type?: string
          started_at?: string | null
          status?: string
          total_issues?: number | null
          user_id: string
          warning_count?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          critical_count?: number | null
          duration_ms?: number | null
          id?: string
          info_count?: number | null
          repository_id?: string
          scan_type?: string
          started_at?: string | null
          status?: string
          total_issues?: number | null
          user_id?: string
          warning_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_results_repository_id_fkey"
            columns: ["repository_id"]
            isOneToOne: false
            referencedRelation: "repositories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          alert_email: string | null
          auto_generate_tests: boolean
          auto_scan_on_push: boolean
          created_at: string
          critical_alerts: boolean
          github_token: string | null
          github_username: string | null
          id: string
          security_scanning: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_email?: string | null
          auto_generate_tests?: boolean
          auto_scan_on_push?: boolean
          created_at?: string
          critical_alerts?: boolean
          github_token?: string | null
          github_username?: string | null
          id?: string
          security_scanning?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_email?: string | null
          auto_generate_tests?: boolean
          auto_scan_on_push?: boolean
          created_at?: string
          critical_alerts?: boolean
          github_token?: string | null
          github_username?: string | null
          id?: string
          security_scanning?: boolean
          updated_at?: string
          user_id?: string
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
    Enums: {},
  },
} as const
