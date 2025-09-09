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
      admin_notifications: {
        Row: {
          action_text: string | null
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          priority: string
          registration_id: string | null
          title: string
          tournament_id: string | null
          type: string
        }
        Insert: {
          action_text?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          priority?: string
          registration_id?: string | null
          title: string
          tournament_id?: string | null
          type: string
        }
        Update: {
          action_text?: string | null
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          priority?: string
          registration_id?: string | null
          title?: string
          tournament_id?: string | null
          type?: string
        }
        Relationships: []
      }
      ballot_templates: {
        Row: {
          created_at: string
          event_style: string
          html: string | null
          id: string
          is_default: boolean
          schema: Json
          supported_tags: string[]
          template_key: string
          tournament_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_style: string
          html?: string | null
          id?: string
          is_default?: boolean
          schema?: Json
          supported_tags?: string[]
          template_key: string
          tournament_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_style?: string
          html?: string | null
          id?: string
          is_default?: boolean
          schema?: Json
          supported_tags?: string[]
          template_key?: string
          tournament_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_templates_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      ballots: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          judge_profile_id: string
          judge_user_id: string
          pairing_id: string
          payload: Json
          revealed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          judge_profile_id: string
          judge_user_id: string
          pairing_id: string
          payload?: Json
          revealed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          judge_profile_id?: string
          judge_user_id?: string
          pairing_id?: string
          payload?: Json
          revealed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballots_judge_profile_id_fkey"
            columns: ["judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballots_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: true
            referencedRelation: "pairings"
            referencedColumns: ["id"]
          },
        ]
      }
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
      debate_formats: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
          rules: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
          rules?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          rules?: Json
          updated_at?: string
        }
        Relationships: []
      }
      email_api_keys: {
        Row: {
          api_key_name: string
          created_at: string
          id: string
          is_active: boolean | null
          provider: string
          test_email: string | null
          updated_at: string
        }
        Insert: {
          api_key_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider: string
          test_email?: string | null
          updated_at?: string
        }
        Update: {
          api_key_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider?: string
          test_email?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          attempt: number
          created_at: string
          email_type: string
          error: string | null
          id: string
          registration_id: string
          sent_at: string
          status: string
        }
        Insert: {
          attempt?: number
          created_at?: string
          email_type: string
          error?: string | null
          id?: string
          registration_id: string
          sent_at?: string
          status?: string
        }
        Update: {
          attempt?: number
          created_at?: string
          email_type?: string
          error?: string | null
          id?: string
          registration_id?: string
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_provider_settings: {
        Row: {
          created_at: string
          from_email: string | null
          id: string
          provider: string
          reply_to: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_email?: string | null
          id?: string
          provider?: string
          reply_to?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_email?: string | null
          id?: string
          provider?: string
          reply_to?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string
          enabled: boolean
          from_email: string | null
          html: string
          id: string
          reply_to: string | null
          subject: string
          template_key: string
          text: string | null
          tournament_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          from_email?: string | null
          html: string
          id?: string
          reply_to?: string | null
          subject: string
          template_key: string
          text?: string | null
          tournament_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          from_email?: string | null
          html?: string
          id?: string
          reply_to?: string | null
          subject?: string
          template_key?: string
          text?: string | null
          tournament_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates_enhanced: {
        Row: {
          created_at: string
          enabled: boolean | null
          from_email: string | null
          html_content: string
          id: string
          images: Json | null
          reply_to: string | null
          subject: string
          template_key: string
          template_name: string
          tournament_id: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          from_email?: string | null
          html_content: string
          id?: string
          images?: Json | null
          reply_to?: string | null
          subject: string
          template_key: string
          template_name: string
          tournament_id?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          from_email?: string | null
          html_content?: string
          id?: string
          images?: Json | null
          reply_to?: string | null
          subject?: string
          template_key?: string
          template_name?: string
          tournament_id?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_enhanced_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_round_requests: {
        Row: {
          created_at: string
          id: string
          note: string | null
          registration_id: string
          round_id: string
          status: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          registration_id: string
          round_id: string
          status?: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          registration_id?: string
          round_id?: string
          status?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_round_requests_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_round_requests_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_round_requests_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_availability: {
        Row: {
          available_dates: Json
          created_at: string
          id: string
          judge_profile_id: string
          max_rounds_per_day: number | null
          special_requirements: string | null
          time_preferences: Json
          tournament_id: string
          updated_at: string
        }
        Insert: {
          available_dates?: Json
          created_at?: string
          id?: string
          judge_profile_id: string
          max_rounds_per_day?: number | null
          special_requirements?: string | null
          time_preferences?: Json
          tournament_id: string
          updated_at?: string
        }
        Update: {
          available_dates?: Json
          created_at?: string
          id?: string
          judge_profile_id?: string
          max_rounds_per_day?: number | null
          special_requirements?: string | null
          time_preferences?: Json
          tournament_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      judge_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          judge_profile_id: string
          message: string
          pairing_id: string | null
          title: string
          tournament_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          judge_profile_id: string
          message: string
          pairing_id?: string | null
          title: string
          tournament_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          judge_profile_id?: string
          message?: string
          pairing_id?: string | null
          title?: string
          tournament_id?: string | null
          type?: string
        }
        Relationships: []
      }
      judge_profiles: {
        Row: {
          availability: Json
          bio: string | null
          created_at: string
          email: string
          experience_level: string
          experience_years: number
          id: string
          name: string
          phone: string | null
          qualifications: string | null
          specializations: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability?: Json
          bio?: string | null
          created_at?: string
          email: string
          experience_level?: string
          experience_years?: number
          id?: string
          name: string
          phone?: string | null
          qualifications?: string | null
          specializations?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: Json
          bio?: string | null
          created_at?: string
          email?: string
          experience_level?: string
          experience_years?: number
          id?: string
          name?: string
          phone?: string | null
          qualifications?: string | null
          specializations?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      judge_requests: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          judge_id: string
          pairing_id: string
          request_reason: string | null
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          judge_id: string
          pairing_id: string
          request_reason?: string | null
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          judge_id?: string
          pairing_id?: string
          request_reason?: string | null
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_published: boolean
          page_key: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          page_key: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          page_key?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      pairing_evidence: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          pairing_id: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          pairing_id: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          pairing_id?: string
          uploader_id?: string
        }
        Relationships: []
      }
      pairing_judge_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          judge_profile_id: string
          notes: string | null
          pairing_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          judge_profile_id: string
          notes?: string | null
          pairing_id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          judge_profile_id?: string
          notes?: string | null
          pairing_id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pairing_judge_assignments_judge_profile_id_fkey"
            columns: ["judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairing_judge_assignments_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "pairings"
            referencedColumns: ["id"]
          },
        ]
      }
      pairing_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          pairing_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          pairing_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          pairing_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      pairings: {
        Row: {
          aff_registration_id: string
          created_at: string
          id: string
          judge_id: string | null
          neg_registration_id: string
          method: string | null
          released: boolean
          result: Json | null
          room: string | null
          round_id: string
          scheduled_time: string | null
          status: string
          seed: Json | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          aff_registration_id: string
          created_at?: string
          id?: string
          judge_id?: string | null
          neg_registration_id: string
          method?: string | null
          released?: boolean
          result?: Json | null
          room?: string | null
          round_id: string
          scheduled_time?: string | null
          status?: string
          seed?: Json | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          aff_registration_id?: string
          created_at?: string
          id?: string
          judge_id?: string | null
          neg_registration_id?: string
          method?: string | null
          released?: boolean
          result?: Json | null
          room?: string | null
          round_id?: string
          scheduled_time?: string | null
          status?: string
          seed?: Json | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pairings_aff_registration_id_fkey"
            columns: ["aff_registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairings_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairings_neg_registration_id_fkey"
            columns: ["neg_registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairings_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pairings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_locked: boolean
          last_name: string | null
          lock_reason: string | null
          locked_by_user_id: string | null
          locked_until: string | null
          phone: string | null
          region: string | null
          region_number: number | null
          role: string
          state: string | null
          time_zone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_locked?: boolean
          last_name?: string | null
          lock_reason?: string | null
          locked_by_user_id?: string | null
          locked_until?: string | null
          phone?: string | null
          region?: string | null
          region_number?: number | null
          role?: string
          state?: string | null
          time_zone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_locked?: boolean
          last_name?: string | null
          lock_reason?: string | null
          locked_by_user_id?: string | null
          locked_until?: string | null
          phone?: string | null
          region?: string | null
          region_number?: number | null
          role?: string
          state?: string | null
          time_zone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          allowed_emails: string[]
          allowed_user_ids: string[]
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          max_redemptions: number | null
          per_user_limit: number
          tournament_id: string | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          active?: boolean
          allowed_emails?: string[]
          allowed_user_ids?: string[]
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          id?: string
          max_redemptions?: number | null
          per_user_limit?: number
          tournament_id?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          active?: boolean
          allowed_emails?: string[]
          allowed_user_ids?: string[]
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          max_redemptions?: number | null
          per_user_limit?: number
          tournament_id?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_redemptions: {
        Row: {
          amount_discounted: number
          created_at: string
          id: string
          promo_code_id: string
          registration_id: string | null
          tournament_id: string | null
          user_id: string
        }
        Insert: {
          amount_discounted: number
          created_at?: string
          id?: string
          promo_code_id: string
          registration_id?: string | null
          tournament_id?: string | null
          user_id: string
        }
        Update: {
          amount_discounted?: number
          created_at?: string
          id?: string
          promo_code_id?: string
          registration_id?: string | null
          tournament_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
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
          tournament_id: string | null
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
          tournament_id?: string | null
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
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "results_recent_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      round_opt_outs: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          registration_id: string
          round_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          registration_id: string
          round_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          registration_id?: string
          round_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_opt_outs_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_opt_outs_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "round_opt_outs_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          created_at: string
          id: string
          name: string
          round_number: number
          scheduled_date: string | null
          status: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          round_number: number
          scheduled_date?: string | null
          status?: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          round_number?: number
          scheduled_date?: string | null
          status?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_proposals: {
        Row: {
          created_at: string
          id: string
          note: string | null
          pairing_id: string
          proposed_room: string | null
          proposed_time: string | null
          proposer_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          pairing_id: string
          proposed_room?: string | null
          proposed_time?: string | null
          proposer_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          pairing_id?: string
          proposed_room?: string | null
          proposed_time?: string | null
          proposer_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_proposals_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "pairings"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          context: Json
          created_at: string
          id: string
          ip: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          context?: Json
          created_at?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          context?: Json
          created_at?: string
          id?: string
          ip?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_flags: {
        Row: {
          created_at: string
          details: Json
          id: string
          raised_by_user_id: string | null
          reason: string | null
          related_user_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          severity: string
          source_id: string | null
          source_table: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          details?: Json
          id?: string
          raised_by_user_id?: string | null
          reason?: string | null
          related_user_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: string
          source_id?: string | null
          source_table?: string | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          details?: Json
          id?: string
          raised_by_user_id?: string | null
          reason?: string | null
          related_user_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: string
          source_id?: string | null
          source_table?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      site_blocks: {
        Row: {
          content: Json
          created_at: string
          id: string
          page_id: string
          parent_block_id: string | null
          position: number
          type: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          page_id: string
          parent_block_id?: string | null
          position?: number
          type: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          page_id?: string
          parent_block_id?: string | null
          position?: number
          type?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "site_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_blocks_parent_block_id_fkey"
            columns: ["parent_block_id"]
            isOneToOne: false
            referencedRelation: "site_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      site_page_versions: {
        Row: {
          created_at: string
          id: string
          page_id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          snapshot?: Json
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "site_page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          published_at: string | null
          seo: Json
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          seo?: Json
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string | null
          seo?: Json
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          accent_color: string
          created_at: string
          custom_css: string | null
          dark_mode_enabled: boolean
          id: string
          is_published: boolean
          primary_color: string
          primary_font: string
          secondary_font: string
          site_description: string | null
          site_title: string
          updated_at: string
          version: number
        }
        Insert: {
          accent_color?: string
          created_at?: string
          custom_css?: string | null
          dark_mode_enabled?: boolean
          id?: string
          is_published?: boolean
          primary_color?: string
          primary_font?: string
          secondary_font?: string
          site_description?: string | null
          site_title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          accent_color?: string
          created_at?: string
          custom_css?: string | null
          dark_mode_enabled?: boolean
          id?: string
          is_published?: boolean
          primary_color?: string
          primary_font?: string
          secondary_font?: string
          site_description?: string | null
          site_title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      spectate_requests: {
        Row: {
          aff_team_approval: boolean | null
          created_at: string
          id: string
          neg_team_approval: boolean | null
          pairing_id: string
          request_reason: string | null
          requester_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          aff_team_approval?: boolean | null
          created_at?: string
          id?: string
          neg_team_approval?: boolean | null
          pairing_id: string
          request_reason?: string | null
          requester_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          aff_team_approval?: boolean | null
          created_at?: string
          id?: string
          neg_team_approval?: boolean | null
          pairing_id?: string
          request_reason?: string | null
          requester_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsor_applications: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          offerings: string | null
          requests: string | null
          sponsor_profile_id: string
          status: string
          tier: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          offerings?: string | null
          requests?: string | null
          sponsor_profile_id: string
          status?: string
          tier: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          offerings?: string | null
          requests?: string | null
          sponsor_profile_id?: string
          status?: string
          tier?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_applications_sponsor_profile_id_fkey"
            columns: ["sponsor_profile_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsor_applications_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsor_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_platform_partner: boolean
          logo_url: string | null
          name: string
          partnership_notes: string | null
          resources: Json
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_platform_partner?: boolean
          logo_url?: string | null
          name: string
          partnership_notes?: string | null
          resources?: Json
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_platform_partner?: boolean
          logo_url?: string | null
          name?: string
          partnership_notes?: string | null
          resources?: Json
          updated_at?: string
          user_id?: string
          website?: string | null
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
      tournament_content: {
        Row: {
          announcements: Json | null
          contact_info: string | null
          created_at: string
          description: string | null
          id: string
          rules: string | null
          schedule_notes: string | null
          sponsors: Json | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          announcements?: Json | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          rules?: string | null
          schedule_notes?: string | null
          sponsors?: Json | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          announcements?: Json | null
          contact_info?: string | null
          created_at?: string
          description?: string | null
          id?: string
          rules?: string | null
          schedule_notes?: string | null
          sponsors?: Json | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_email_settings: {
        Row: {
          created_at: string
          from_email: string | null
          id: string
          reminder_initial_delay_minutes: number
          reminder_max_count: number
          reminder_repeat_minutes: number
          reply_to: string | null
          send_pending_reminders: boolean
          send_success_email: boolean
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_email?: string | null
          id?: string
          reminder_initial_delay_minutes?: number
          reminder_max_count?: number
          reminder_repeat_minutes?: number
          reply_to?: string | null
          send_pending_reminders?: boolean
          send_success_email?: boolean
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_email?: string | null
          id?: string
          reminder_initial_delay_minutes?: number
          reminder_max_count?: number
          reminder_repeat_minutes?: number
          reply_to?: string | null
          send_pending_reminders?: boolean
          send_success_email?: boolean
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_email_settings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_observers: {
        Row: {
          created_at: string
          id: string
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_observers_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_payment_settings: {
        Row: {
          created_at: string
          id: string
          payment_handler: string | null
          paypal_button_html: string | null
          paypal_client_id: string | null
          tournament_id: string
          updated_at: string
          venmo_button_html: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_handler?: string | null
          paypal_button_html?: string | null
          paypal_client_id?: string | null
          tournament_id: string
          updated_at?: string
          venmo_button_html?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_handler?: string | null
          paypal_button_html?: string | null
          paypal_client_id?: string | null
          tournament_id?: string
          updated_at?: string
          venmo_button_html?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_payment_settings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          additional_info: Json | null
          amount_paid: number | null
          created_at: string
          dietary_requirements: string | null
          emergency_contact: string | null
          id: string
          last_reminder_sent_at: string | null
          participant_email: string
          participant_name: string
          partner_name: string | null
          payment_id: string | null
          payment_status: string
          registration_date: string
          reminder_count: number
          requested_judge_profile_id: string | null
          school_organization: string | null
          success_email_sent_at: string | null
          tournament_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_info?: Json | null
          amount_paid?: number | null
          created_at?: string
          dietary_requirements?: string | null
          emergency_contact?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          participant_email: string
          participant_name: string
          partner_name?: string | null
          payment_id?: string | null
          payment_status?: string
          registration_date?: string
          reminder_count?: number
          requested_judge_profile_id?: string | null
          school_organization?: string | null
          success_email_sent_at?: string | null
          tournament_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_info?: Json | null
          amount_paid?: number | null
          created_at?: string
          dietary_requirements?: string | null
          emergency_contact?: string | null
          id?: string
          last_reminder_sent_at?: string | null
          participant_email?: string
          participant_name?: string
          partner_name?: string | null
          payment_id?: string | null
          payment_status?: string
          registration_date?: string
          reminder_count?: number
          requested_judge_profile_id?: string | null
          school_organization?: string | null
          success_email_sent_at?: string | null
          tournament_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_requested_judge_profile_id_fkey"
            columns: ["requested_judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_staff_shares: {
        Row: {
          active: boolean
          admin_user_id: string
          created_at: string
          id: string
          percentage: number
          tournament_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          admin_user_id: string
          created_at?: string
          id?: string
          percentage?: number
          tournament_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          admin_user_id?: string
          created_at?: string
          id?: string
          percentage?: number
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_staff_shares_tournament_id_fkey"
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
          auto_schedule_rounds: boolean | null
          ballot_reveal_mode: string
          cash_prize_total: number | null
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
          opt_outs_enabled: boolean
          prize_items: string[] | null
          prize_pool: string | null
          registration_deadline: string | null
          registration_fee: number | null
          registration_open: boolean | null
          round_count: number | null
          round_interval_days: number | null
          round_schedule_type: string | null
          rounds_config: Json | null
          sponsors: Json | null
          start_date: string
          status: string
          supported_tags: string[]
          tournament_info: string | null
          updated_at: string
          venue_details: string | null
        }
        Insert: {
          additional_info?: Json | null
          auto_schedule_rounds?: boolean | null
          ballot_reveal_mode?: string
          cash_prize_total?: number | null
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
          opt_outs_enabled?: boolean
          prize_items?: string[] | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_open?: boolean | null
          round_count?: number | null
          round_interval_days?: number | null
          round_schedule_type?: string | null
          rounds_config?: Json | null
          sponsors?: Json | null
          start_date: string
          status?: string
          supported_tags?: string[]
          tournament_info?: string | null
          updated_at?: string
          venue_details?: string | null
        }
        Update: {
          additional_info?: Json | null
          auto_schedule_rounds?: boolean | null
          ballot_reveal_mode?: string
          cash_prize_total?: number | null
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
          opt_outs_enabled?: boolean
          prize_items?: string[] | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_open?: boolean | null
          round_count?: number | null
          round_interval_days?: number | null
          round_schedule_type?: string | null
          rounds_config?: Json | null
          sponsors?: Json | null
          start_date?: string
          status?: string
          supported_tags?: string[]
          tournament_info?: string | null
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
      admin_lock_ballots: {
        Args: { _round_id?: string; _tournament_id: string }
        Returns: number
      }
      can_submit_ballot: {
        Args: { _pairing_id: string }
        Returns: boolean
      }
      is_account_locked: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      lock_account: {
        Args: { _reason?: string; _target_user_id: string; _until?: string }
        Returns: boolean
      }
      make_admin_by_email: {
        Args: { target_email: string }
        Returns: boolean
      }
      map_sponsor_tier_for_display: {
        Args: { _tier: string }
        Returns: string
      }
      publish_due_ballots: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      recompute_results_from_ballots: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      unlock_account: {
        Args: { _target_user_id: string }
        Returns: boolean
      }
      user_is_competitor_for_pairing: {
        Args: { _pairing_id: string }
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
