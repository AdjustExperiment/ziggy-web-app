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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string
          content: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          id: string
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      championships: {
        Row: {
          created_at: string
          date: string
          id: string
          location: string
          name: string
          participants: number
          runner_up: string
          winner: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          location: string
          name: string
          participants: number
          runner_up: string
          winner: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          location?: string
          name?: string
          participants?: number
          runner_up?: string
          winner?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      results_recent: {
        Row: {
          created_at: string
          date: string
          format: string
          id: string
          participants: number
          points: number
          position: string
          prize: string | null
          tournament: string
        }
        Insert: {
          created_at?: string
          date: string
          format: string
          id?: string
          participants: number
          points: number
          position: string
          prize?: string | null
          tournament: string
        }
        Update: {
          created_at?: string
          date?: string
          format?: string
          id?: string
          participants?: number
          points?: number
          position?: string
          prize?: string | null
          tournament?: string
        }
        Relationships: []
      }
      top_performers: {
        Row: {
          created_at: string
          id: string
          name: string
          points: number
          rank: number
          school: string
          tournaments: number
          win_rate: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          points: number
          rank: number
          school: string
          tournaments: number
          win_rate: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          points?: number
          rank?: number
          school?: string
          tournaments?: number
          win_rate?: number
        }
        Relationships: []
      }
      tournament_registrations: {
        Row: {
          additional_info: Json | null
          amount_paid: number | null
          created_at: string
          dietary_requirements: string | null
          emergency_contact: string | null
          id: string
          participant_email: string
          participant_name: string
          partner_name: string | null
          payment_id: string | null
          payment_status: string
          registration_date: string
          school_organization: string | null
          tournament_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          additional_info?: Json | null
          amount_paid?: number | null
          created_at?: string
          dietary_requirements?: string | null
          emergency_contact?: string | null
          id?: string
          participant_email: string
          participant_name: string
          partner_name?: string | null
          payment_id?: string | null
          payment_status?: string
          registration_date?: string
          school_organization?: string | null
          tournament_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          additional_info?: Json | null
          amount_paid?: number | null
          created_at?: string
          dietary_requirements?: string | null
          emergency_contact?: string | null
          id?: string
          participant_email?: string
          participant_name?: string
          partner_name?: string | null
          payment_id?: string | null
          payment_status?: string
          registration_date?: string
          school_organization?: string | null
          tournament_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          additional_info: Json | null
          created_at: string
          created_by: string | null
          current_participants: number
          debate_style: string | null
          description: string | null
          end_date: string
          format: string
          id: string
          location: string
          max_participants: number
          name: string
          payment_handler: string | null
          paypal_client_id: string | null
          prize_pool: string | null
          registration_deadline: string | null
          registration_fee: number | null
          registration_open: boolean | null
          sponsors: Json | null
          start_date: string
          status: string
          updated_at: string
          venue_details: string | null
        }
        Insert: {
          additional_info?: Json | null
          created_at?: string
          created_by?: string | null
          current_participants?: number
          debate_style?: string | null
          description?: string | null
          end_date: string
          format: string
          id?: string
          location: string
          max_participants?: number
          name: string
          payment_handler?: string | null
          paypal_client_id?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_open?: boolean | null
          sponsors?: Json | null
          start_date: string
          status?: string
          updated_at?: string
          venue_details?: string | null
        }
        Update: {
          additional_info?: Json | null
          created_at?: string
          created_by?: string | null
          current_participants?: number
          debate_style?: string | null
          description?: string | null
          end_date?: string
          format?: string
          id?: string
          location?: string
          max_participants?: number
          name?: string
          payment_handler?: string | null
          paypal_client_id?: string | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_open?: boolean | null
          sponsors?: Json | null
          start_date?: string
          status?: string
          updated_at?: string
          venue_details?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
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
