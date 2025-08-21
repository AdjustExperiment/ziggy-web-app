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
          released: boolean
          result: Json | null
          room: string | null
          round_id: string
          scheduled_time: string | null
          status: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          aff_registration_id: string
          created_at?: string
          id?: string
          judge_id?: string | null
          neg_registration_id: string
          released?: boolean
          result?: Json | null
          room?: string | null
          round_id: string
          scheduled_time?: string | null
          status?: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          aff_registration_id?: string
          created_at?: string
          id?: string
          judge_id?: string | null
          neg_registration_id?: string
          released?: boolean
          result?: Json | null
          room?: string | null
          round_id?: string
          scheduled_time?: string | null
          status?: string
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
          last_name: string | null
          phone: string | null
          region: string | null
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
          last_name?: string | null
          phone?: string | null
          region?: string | null
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
          last_name?: string | null
          phone?: string | null
          region?: string | null
          role?: string
          state?: string | null
          time_zone?: string | null
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
          school_organization?: string | null
          success_email_sent_at?: string | null
          tournament_id?: string
          updated_at?: string
          user_id?: string
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      make_admin_by_email: {
        Args: { target_email: string }
        Returns: boolean
      }
      publish_due_ballots: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      recompute_results_from_ballots: {
        Args: Record<PropertyKey, never>
        Returns: number
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
