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
      adjudicator_conflicts: {
        Row: {
          conflict_type: string
          created_at: string
          id: string
          institution: string | null
          judge_profile_id: string
          registration_id: string | null
          tournament_id: string | null
        }
        Insert: {
          conflict_type?: string
          created_at?: string
          id?: string
          institution?: string | null
          judge_profile_id: string
          registration_id?: string | null
          tournament_id?: string | null
        }
        Update: {
          conflict_type?: string
          created_at?: string
          id?: string
          institution?: string | null
          judge_profile_id?: string
          registration_id?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adjudicator_conflicts_judge_profile_id_fkey"
            columns: ["judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjudicator_conflicts_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjudicator_conflicts_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ballot_submissions: {
        Row: {
          ballot_id: string | null
          id: string
          judge_profile_id: string | null
          pairing_id: string | null
          submission_data: Json
          submission_notes: string | null
          submitted_at: string
        }
        Insert: {
          ballot_id?: string | null
          id?: string
          judge_profile_id?: string | null
          pairing_id?: string | null
          submission_data?: Json
          submission_notes?: string | null
          submitted_at?: string
        }
        Update: {
          ballot_id?: string | null
          id?: string
          judge_profile_id?: string | null
          pairing_id?: string | null
          submission_data?: Json
          submission_notes?: string | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_submissions_ballot_id_fkey"
            columns: ["ballot_id"]
            isOneToOne: false
            referencedRelation: "ballots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_submissions_judge_profile_id_fkey"
            columns: ["judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ballot_submissions_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "pairings"
            referencedColumns: ["id"]
          },
        ]
      }
      ballot_templates: {
        Row: {
          created_at: string
          event_style: string
          format_id: string | null
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
          format_id?: string | null
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
          format_id?: string | null
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
            foreignKeyName: "ballot_templates_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "debate_formats"
            referencedColumns: ["id"]
          },
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
          sponsor_id: string | null
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
          sponsor_id?: string | null
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
          sponsor_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      break_categories: {
        Row: {
          break_size: number
          created_at: string
          id: string
          institution_cap: number | null
          is_general: boolean
          name: string
          priority: number
          rule: string
          slug: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          break_size?: number
          created_at?: string
          id?: string
          institution_cap?: number | null
          is_general?: boolean
          name: string
          priority?: number
          rule?: string
          slug: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          break_size?: number
          created_at?: string
          id?: string
          institution_cap?: number | null
          is_general?: boolean
          name?: string
          priority?: number
          rule?: string
          slug?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_categories_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
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
      competitor_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          pairing_id: string | null
          registration_id: string
          round_id: string | null
          title: string
          tournament_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          pairing_id?: string | null
          registration_id: string
          round_id?: string | null
          title: string
          tournament_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          pairing_id?: string | null
          registration_id?: string
          round_id?: string | null
          title?: string
          tournament_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_notifications_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "pairings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_notifications_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_notifications_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_notifications_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          responded_at: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          responded_at?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          responded_at?: string | null
          subject?: string | null
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
          uses_resolution: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
          rules?: Json
          updated_at?: string
          uses_resolution?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          rules?: Json
          updated_at?: string
          uses_resolution?: boolean
        }
        Relationships: []
      }
      debate_teams: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          school_organization: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          school_organization?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          school_organization?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      elimination_seeds: {
        Row: {
          break_category_id: string | null
          created_at: string
          id: string
          registration_id: string
          seed: number
          tournament_id: string
        }
        Insert: {
          break_category_id?: string | null
          created_at?: string
          id?: string
          registration_id: string
          seed: number
          tournament_id: string
        }
        Update: {
          break_category_id?: string | null
          created_at?: string
          id?: string
          registration_id?: string
          seed?: number
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elimination_seeds_break_category_id_fkey"
            columns: ["break_category_id"]
            isOneToOne: false
            referencedRelation: "break_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elimination_seeds_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elimination_seeds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
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
          alumni: boolean
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
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alumni?: boolean
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
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alumni?: boolean
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
          status?: string
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
      judge_school_conflicts: {
        Row: {
          conflict_type: string
          created_at: string
          id: string
          judge_profile_id: string
          school_name: string
          tournament_id: string
        }
        Insert: {
          conflict_type?: string
          created_at?: string
          id?: string
          judge_profile_id: string
          school_name: string
          tournament_id: string
        }
        Update: {
          conflict_type?: string
          created_at?: string
          id?: string
          judge_profile_id?: string
          school_name?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_school_conflicts_judge_profile_id_fkey"
            columns: ["judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_school_conflicts_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_team_conflicts: {
        Row: {
          conflict_type: string
          created_at: string
          id: string
          judge_profile_id: string
          registration_id: string
          tournament_id: string
        }
        Insert: {
          conflict_type?: string
          created_at?: string
          id?: string
          judge_profile_id: string
          registration_id: string
          tournament_id: string
        }
        Update: {
          conflict_type?: string
          created_at?: string
          id?: string
          judge_profile_id?: string
          registration_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_team_conflicts_judge_profile_id_fkey"
            columns: ["judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_team_conflicts_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_team_conflicts_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_admins: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_admins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          contact_email: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
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
      pairing_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string | null
          metadata: Json | null
          pairing_id: string | null
          sender_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          metadata?: Json | null
          pairing_id?: string | null
          sender_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          metadata?: Json | null
          pairing_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pairing_chat_messages_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "pairings"
            referencedColumns: ["id"]
          },
        ]
      }
      pairing_edit_history: {
        Row: {
          change_reason: string | null
          changed_at: string
          changed_by: string
          field_changed: string
          id: string
          new_value: Json | null
          old_value: Json | null
          pairing_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string
          changed_by: string
          field_changed: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          pairing_id: string
        }
        Update: {
          change_reason?: string | null
          changed_at?: string
          changed_by?: string
          field_changed?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          pairing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pairing_edit_history_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "pairings"
            referencedColumns: ["id"]
          },
        ]
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
      pairings: {
        Row: {
          aff_registration_id: string
          bracket: number | null
          created_at: string
          event_id: string | null
          flags: string[]
          id: string
          judge_id: string | null
          neg_registration_id: string
          released: boolean
          result: Json | null
          room: string | null
          room_rank: number | null
          round_id: string
          scheduled_time: string | null
          side_locked: boolean
          status: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          aff_registration_id: string
          bracket?: number | null
          created_at?: string
          event_id?: string | null
          flags?: string[]
          id?: string
          judge_id?: string | null
          neg_registration_id: string
          released?: boolean
          result?: Json | null
          room?: string | null
          room_rank?: number | null
          round_id: string
          scheduled_time?: string | null
          side_locked?: boolean
          status?: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          aff_registration_id?: string
          bracket?: number | null
          created_at?: string
          event_id?: string | null
          flags?: string[]
          id?: string
          judge_id?: string | null
          neg_registration_id?: string
          released?: boolean
          result?: Json | null
          room?: string | null
          room_rank?: number | null
          round_id?: string
          scheduled_time?: string | null
          side_locked?: boolean
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
            foreignKeyName: "pairings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "tournament_events"
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
      participant_checkins: {
        Row: {
          checked_in_at: string
          checked_in_by: string | null
          checked_out_at: string | null
          created_at: string
          id: string
          judge_profile_id: string | null
          registration_id: string | null
          tournament_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by?: string | null
          checked_out_at?: string | null
          created_at?: string
          id?: string
          judge_profile_id?: string | null
          registration_id?: string | null
          tournament_id: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string | null
          checked_out_at?: string | null
          created_at?: string
          id?: string
          judge_profile_id?: string | null
          registration_id?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_checkins_judge_profile_id_fkey"
            columns: ["judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_checkins_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_checkins_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          link_url: string
          provider: string
          tournament_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_url: string
          provider: string
          tournament_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          link_url?: string
          provider?: string
          tournament_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          registration_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          registration_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          registration_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_judge_invitations: {
        Row: {
          claimed_at: string | null
          claimed_by_user_id: string | null
          email: string
          id: string
          invited_at: string
          invited_by_user_id: string | null
          registration_id: string | null
          tournament_id: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          email: string
          id?: string
          invited_at?: string
          invited_by_user_id?: string | null
          registration_id?: string | null
          tournament_id: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          email?: string
          id?: string
          invited_at?: string
          invited_by_user_id?: string | null
          registration_id?: string | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_judge_invitations_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_judge_invitations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_sponsor_invitations: {
        Row: {
          claimed_at: string | null
          claimed_by_user_id: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invite_token: string
          invited_by: string | null
          organization_name: string
          personal_message: string | null
          suggested_tier: string
          tournament_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invite_token?: string
          invited_by?: string | null
          organization_name: string
          personal_message?: string | null
          suggested_tier?: string
          tournament_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_by_user_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invite_token?: string
          invited_by?: string | null
          organization_name?: string
          personal_message?: string | null
          suggested_tier?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_sponsor_invitations_tournament_id_fkey"
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
          preferred_language: string | null
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
          preferred_language?: string | null
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
          preferred_language?: string | null
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
      refund_requests: {
        Row: {
          admin_notes: string | null
          id: string
          payment_transaction_id: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string
          registration_id: string | null
          requested_amount: number | null
          requested_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          id?: string
          payment_transaction_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          registration_id?: string | null
          requested_amount?: number | null
          requested_at?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          id?: string
          payment_transaction_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          registration_id?: string | null
          requested_amount?: number | null
          requested_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      resolutions: {
        Row: {
          created_at: string
          id: string
          info_slide: string | null
          is_released: boolean
          released_at: string | null
          resolution_text: string
          round_id: string | null
          seq: number
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          info_slide?: string | null
          is_released?: boolean
          released_at?: string | null
          resolution_text: string
          round_id?: string | null
          seq?: number
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          info_slide?: string | null
          is_released?: boolean
          released_at?: string | null
          resolution_text?: string
          round_id?: string | null
          seq?: number
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolutions_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolutions_tournament_id_fkey"
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
          event_id: string | null
          id: string
          name: string
          resolution_released: boolean
          round_number: number
          scheduled_date: string | null
          status: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          name: string
          resolution_released?: boolean
          round_number: number
          scheduled_date?: string | null
          status?: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          name?: string
          resolution_released?: boolean
          round_number?: number
          scheduled_date?: string | null
          status?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "tournament_events"
            referencedColumns: ["id"]
          },
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
          approved_at: string | null
          approved_by: string | null
          approved_tier: string | null
          blog_posts_limit: number | null
          blog_posts_used: number | null
          created_at: string
          description: string | null
          id: string
          is_approved: boolean | null
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
          approved_at?: string | null
          approved_by?: string | null
          approved_tier?: string | null
          blog_posts_limit?: number | null
          blog_posts_used?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_approved?: boolean | null
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
          approved_at?: string | null
          approved_by?: string | null
          approved_tier?: string | null
          blog_posts_limit?: number | null
          blog_posts_used?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_approved?: boolean | null
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
      sponsor_tier_settings: {
        Row: {
          blog_posts_limit: number
          created_at: string | null
          display_priority: number
          features: Json | null
          id: string
          tier: string
          updated_at: string | null
        }
        Insert: {
          blog_posts_limit?: number
          created_at?: string | null
          display_priority?: number
          features?: Json | null
          id?: string
          tier: string
          updated_at?: string | null
        }
        Update: {
          blog_posts_limit?: number
          created_at?: string | null
          display_priority?: number
          features?: Json | null
          id?: string
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_achievements: {
        Row: {
          achieved_at: string | null
          achievement_type: string
          created_at: string | null
          id: string
          members: Json | null
          position: string | null
          prize_amount: number | null
          registration_id: string | null
          team_id: string
          tournament_id: string | null
        }
        Insert: {
          achieved_at?: string | null
          achievement_type?: string
          created_at?: string | null
          id?: string
          members?: Json | null
          position?: string | null
          prize_amount?: number | null
          registration_id?: string | null
          team_id: string
          tournament_id?: string | null
        }
        Update: {
          achieved_at?: string | null
          achievement_type?: string
          created_at?: string | null
          id?: string
          members?: Json | null
          position?: string | null
          prize_amount?: number | null
          registration_id?: string | null
          team_id?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_achievements_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_achievements_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "debate_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_achievements_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      team_break_eligibility: {
        Row: {
          break_category_id: string
          break_rank: number | null
          created_at: string
          id: string
          is_eligible: boolean
          registration_id: string
          remark: string | null
        }
        Insert: {
          break_category_id: string
          break_rank?: number | null
          created_at?: string
          id?: string
          is_eligible?: boolean
          registration_id: string
          remark?: string | null
        }
        Update: {
          break_category_id?: string
          break_rank?: number | null
          created_at?: string
          id?: string
          is_eligible?: boolean
          registration_id?: string
          remark?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_break_eligibility_break_category_id_fkey"
            columns: ["break_category_id"]
            isOneToOne: false
            referencedRelation: "break_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_break_eligibility_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_conflicts: {
        Row: {
          conflict_type: string
          created_at: string
          id: string
          team1_id: string
          team2_id: string
          tournament_id: string
        }
        Insert: {
          conflict_type?: string
          created_at?: string
          id?: string
          team1_id: string
          team2_id: string
          tournament_id: string
        }
        Update: {
          conflict_type?: string
          created_at?: string
          id?: string
          team1_id?: string
          team2_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_conflicts_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_conflicts_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_conflicts_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      team_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          is_virtual: boolean | null
          location: string | null
          scheduled_date: string
          scheduled_time: string | null
          team_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          team_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          team_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "debate_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "debate_teams"
            referencedColumns: ["id"]
          },
        ]
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
      tournament_admins: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          permissions: Json | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permissions?: Json | null
          tournament_id: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          permissions?: Json | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_admins_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
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
      tournament_events: {
        Row: {
          created_at: string
          format_id: string | null
          id: string
          is_active: boolean
          name: string
          short_code: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          format_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          short_code: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          format_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          short_code?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_events_format_id_fkey"
            columns: ["format_id"]
            isOneToOne: false
            referencedRelation: "debate_formats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_events_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_judge_registrations: {
        Row: {
          created_at: string
          id: string
          judge_profile_id: string
          notes: string | null
          registered_at: string
          status: string
          tournament_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          judge_profile_id: string
          notes?: string | null
          registered_at?: string
          status?: string
          tournament_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          judge_profile_id?: string
          notes?: string | null
          registered_at?: string
          status?: string
          tournament_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_judge_registrations_judge_profile_id_fkey"
            columns: ["judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_judge_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
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
          aff_count: number
          amount_paid: number | null
          created_at: string
          dietary_requirements: string | null
          emergency_contact: string | null
          event_id: string | null
          id: string
          invited_judge_email: string | null
          is_active: boolean
          last_reminder_sent_at: string | null
          neg_count: number
          participant_email: string
          participant_name: string
          partner_name: string | null
          payment_id: string | null
          payment_status: string
          registration_date: string
          reminder_count: number
          requested_judge_profile_id: string | null
          school_organization: string | null
          seed: number | null
          success_email_sent_at: string | null
          team_id: string | null
          tournament_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_info?: Json | null
          aff_count?: number
          amount_paid?: number | null
          created_at?: string
          dietary_requirements?: string | null
          emergency_contact?: string | null
          event_id?: string | null
          id?: string
          invited_judge_email?: string | null
          is_active?: boolean
          last_reminder_sent_at?: string | null
          neg_count?: number
          participant_email: string
          participant_name: string
          partner_name?: string | null
          payment_id?: string | null
          payment_status?: string
          registration_date?: string
          reminder_count?: number
          requested_judge_profile_id?: string | null
          school_organization?: string | null
          seed?: number | null
          success_email_sent_at?: string | null
          team_id?: string | null
          tournament_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_info?: Json | null
          aff_count?: number
          amount_paid?: number | null
          created_at?: string
          dietary_requirements?: string | null
          emergency_contact?: string | null
          event_id?: string | null
          id?: string
          invited_judge_email?: string | null
          is_active?: boolean
          last_reminder_sent_at?: string | null
          neg_count?: number
          participant_email?: string
          participant_name?: string
          partner_name?: string | null
          payment_id?: string | null
          payment_status?: string
          registration_date?: string
          reminder_count?: number
          requested_judge_profile_id?: string | null
          school_organization?: string | null
          seed?: number | null
          success_email_sent_at?: string | null
          team_id?: string | null
          tournament_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "tournament_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_requested_judge_profile_id_fkey"
            columns: ["requested_judge_profile_id"]
            isOneToOne: false
            referencedRelation: "judge_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "debate_teams"
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
      tournament_role_access: {
        Row: {
          can_chat: boolean
          can_view_pairings: boolean
          can_view_rooms: boolean
          can_view_stream: boolean
          created_at: string
          id: string
          role: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          can_chat?: boolean
          can_view_pairings?: boolean
          can_view_rooms?: boolean
          can_view_stream?: boolean
          created_at?: string
          id?: string
          role: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          can_chat?: boolean
          can_view_pairings?: boolean
          can_view_rooms?: boolean
          can_view_stream?: boolean
          created_at?: string
          id?: string
          role?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_sponsor_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_primary: boolean | null
          sponsor_profile_id: string
          tier: string
          tournament_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          sponsor_profile_id: string
          tier?: string
          tournament_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_primary?: boolean | null
          sponsor_profile_id?: string
          tier?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_sponsor_links_sponsor_profile_id_fkey"
            columns: ["sponsor_profile_id"]
            isOneToOne: false
            referencedRelation: "sponsor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_sponsor_links_tournament_id_fkey"
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
      tournament_standings: {
        Row: {
          id: string
          is_breaking: boolean | null
          losses: number
          opp_strength: number
          rank: number | null
          registration_id: string
          speaks_avg: number
          speaks_total: number
          tournament_id: string
          updated_at: string
          wins: number
        }
        Insert: {
          id?: string
          is_breaking?: boolean | null
          losses?: number
          opp_strength?: number
          rank?: number | null
          registration_id: string
          speaks_avg?: number
          speaks_total?: number
          tournament_id: string
          updated_at?: string
          wins?: number
        }
        Update: {
          id?: string
          is_breaking?: boolean | null
          losses?: number
          opp_strength?: number
          rank?: number | null
          registration_id?: string
          speaks_avg?: number
          speaks_total?: number
          tournament_id?: string
          updated_at?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "tournament_standings_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "tournament_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_standings_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_tabulation_settings: {
        Row: {
          allow_judges_view_all_chat: boolean
          avoid_rematches: boolean
          club_protect: boolean
          created_at: string
          draw_method: string
          history_penalty: number
          id: string
          institution_penalty: number
          max_repeat_opponents: number
          odd_bracket: string
          pairing_method: string
          preserve_break_rounds: boolean
          prevent_bracket_breaks: boolean
          pullup_restriction: string
          side_balance_target: number
          side_method: string
          side_penalty: number
          speaker_points_method: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          allow_judges_view_all_chat?: boolean
          avoid_rematches?: boolean
          club_protect?: boolean
          created_at?: string
          draw_method?: string
          history_penalty?: number
          id?: string
          institution_penalty?: number
          max_repeat_opponents?: number
          odd_bracket?: string
          pairing_method?: string
          preserve_break_rounds?: boolean
          prevent_bracket_breaks?: boolean
          pullup_restriction?: string
          side_balance_target?: number
          side_method?: string
          side_penalty?: number
          speaker_points_method?: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          allow_judges_view_all_chat?: boolean
          avoid_rematches?: boolean
          club_protect?: boolean
          created_at?: string
          draw_method?: string
          history_penalty?: number
          id?: string
          institution_penalty?: number
          max_repeat_opponents?: number
          odd_bracket?: string
          pairing_method?: string
          preserve_break_rounds?: boolean
          prevent_bracket_breaks?: boolean
          pullup_restriction?: string
          side_balance_target?: number
          side_method?: string
          side_penalty?: number
          speaker_points_method?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournaments: {
        Row: {
          additional_info: Json | null
          auto_judge_assignment: boolean | null
          auto_schedule_rounds: boolean | null
          ballot_reveal_mode: string
          cash_prize_total: number | null
          check_in_enabled: boolean
          created_at: string
          created_by: string | null
          current_participants: number
          debate_style: string | null
          description: string | null
          end_date: string
          format: string
          id: string
          judges_per_room: number | null
          location: string
          max_participants: number
          name: string
          opt_outs_enabled: boolean
          organization_id: string | null
          prize_items: string[] | null
          prize_pool: string | null
          registration_deadline: string | null
          registration_fee: number | null
          registration_open: boolean | null
          resolutions_enabled: boolean
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
          auto_judge_assignment?: boolean | null
          auto_schedule_rounds?: boolean | null
          ballot_reveal_mode?: string
          cash_prize_total?: number | null
          check_in_enabled?: boolean
          created_at?: string
          created_by?: string | null
          current_participants?: number
          debate_style?: string | null
          description?: string | null
          end_date: string
          format: string
          id?: string
          judges_per_room?: number | null
          location: string
          max_participants?: number
          name: string
          opt_outs_enabled?: boolean
          organization_id?: string | null
          prize_items?: string[] | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_open?: boolean | null
          resolutions_enabled?: boolean
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
          auto_judge_assignment?: boolean | null
          auto_schedule_rounds?: boolean | null
          ballot_reveal_mode?: string
          cash_prize_total?: number | null
          check_in_enabled?: boolean
          created_at?: string
          created_by?: string | null
          current_participants?: number
          debate_style?: string | null
          description?: string | null
          end_date?: string
          format?: string
          id?: string
          judges_per_room?: number | null
          location?: string
          max_participants?: number
          name?: string
          opt_outs_enabled?: boolean
          organization_id?: string | null
          prize_items?: string[] | null
          prize_pool?: string | null
          registration_deadline?: string | null
          registration_fee?: number | null
          registration_open?: boolean | null
          resolutions_enabled?: boolean
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
        Relationships: [
          {
            foreignKeyName: "tournaments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      admin_lock_ballots: {
        Args: { _round_id?: string; _tournament_id: string }
        Returns: number
      }
      can_admin_tournament: {
        Args: { _tournament_id: string }
        Returns: boolean
      }
      can_submit_ballot: { Args: { _pairing_id: string }; Returns: boolean }
      get_admin_tournament_ids: { Args: never; Returns: string[] }
      get_ballot_template: {
        Args: { p_format_id?: string; p_tournament_id: string }
        Returns: string
      }
      get_sponsor_blog_quota: {
        Args: { _user_id: string }
        Returns: {
          posts_limit: number
          posts_remaining: number
          posts_used: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_account_locked: { Args: { _user_id: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_approved_sponsor: { Args: never; Returns: boolean }
      is_org_admin: { Args: { _organization_id: string }; Returns: boolean }
      is_tournament_admin: {
        Args: { _tournament_id: string }
        Returns: boolean
      }
      lock_account: {
        Args: { _reason?: string; _target_user_id: string; _until?: string }
        Returns: boolean
      }
      make_admin_by_email: { Args: { target_email: string }; Returns: boolean }
      map_sponsor_tier_for_display: { Args: { _tier: string }; Returns: string }
      publish_due_ballots: { Args: never; Returns: number }
      recalc_tournament_standings: {
        Args: { p_tournament_id: string }
        Returns: number
      }
      recompute_results_from_ballots: { Args: never; Returns: number }
      reveal_tournament_results: {
        Args: { p_tournament_id: string }
        Returns: number
      }
      unlock_account: { Args: { _target_user_id: string }; Returns: boolean }
      user_can_view_judge_for_pairing: {
        Args: { _judge_profile_id: string }
        Returns: boolean
      }
      user_is_competitor_for_pairing: {
        Args: { _pairing_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "judge"
        | "observer"
        | "participant"
        | "user"
        | "sponsor"
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
      app_role: [
        "admin",
        "judge",
        "observer",
        "participant",
        "user",
        "sponsor",
      ],
    },
  },
} as const
