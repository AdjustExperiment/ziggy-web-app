

// Temporary type definitions for new tables until Supabase types are regenerated
export interface DebateFormat {
  id: string;
  key: string;
  name: string;
  description: string | null;
  rules: any;
  created_at: string;
  updated_at: string;
}

export interface Round {
  id: string;
  tournament_id: string;
  name: string;
  round_number: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Pairing {
  id: string;
  tournament_id: string;
  round_id: string;
  aff_registration_id: string;
  neg_registration_id: string;
  room: string | null;
  scheduled_time: string | null;
  released: boolean;
  created_at: string;
  updated_at: string;
  aff_registration: {
    participant_name: string;
    participant_email: string;
  };
  neg_registration: {
    participant_name: string;
    participant_email: string;
  };
  round: {
    name: string;
  };
  tournaments: {
    name: string;
  };
}

export interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  experience_level: string;
  specializations: string[];
  availability: any;
  bio: string | null;
  qualifications: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundRequest {
  id: string;
  registration_id: string;
  reason: string | null;
  status: string;
  requested_at: string;
  processed_at: string | null;
  admin_notes: string | null;
}

// Updated Registration interface to match tournament_registrations table structure
export interface Registration {
  id: string;
  tournament_id: string;
  participant_name: string;
  participant_email: string;
  partner_name: string | null;
  judge_name: string | null;
  partnership_status: string | null;
  payment_status: string;
  additional_info: any;
  amount_paid: number | null;
  created_at: string;
  dietary_requirements: string | null;
  emergency_contact: string | null;
  last_reminder_sent_at: string | null;
  payment_id: string | null;
  registration_date: string;
  reminder_count: number;
  school_organization: string | null;
  success_email_sent_at: string | null;
  updated_at: string;
  user_id: string | null;
}
