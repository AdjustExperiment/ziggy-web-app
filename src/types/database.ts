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
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pairing {
  id: string;
  tournament_id: string;
  round_id: string;
  aff_registration_id: string;
  neg_registration_id: string;
  judge_id: string | null;
  room: string | null;
  scheduled_time: string | null;
  released: boolean;
  status: string;
  result: any;
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
  judge_profiles?: {
    name: string;
    email: string;
  };
}

export interface JudgeProfile {
  id: string;
  user_id: string | null;
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

export interface BallotTemplate {
  id: string;
  tournament_id: string | null;
  event_style: string;
  template_key: string;
  schema: any;
  html: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ballot {
  id: string;
  pairing_id: string;
  judge_profile_id: string;
  judge_user_id: string;
  payload: any;
  status: string;
  is_published: boolean;
  revealed_at: string | null;
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

// Updated Tournament interface
export interface Tournament {
  id: string;
  name: string;
  ballot_reveal_mode: string;
  end_date: string;
  status: string;
  // ... other existing fields
}

// New interfaces for Phase 4
export interface ScheduleProposal {
  id: string;
  pairing_id: string;
  proposer_user_id: string;
  proposed_time: string | null;
  proposed_room: string | null;
  note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  pairing?: Pairing;
}

export interface PairingJudgeAssignment {
  id: string;
  pairing_id: string;
  judge_profile_id: string;
  role: string;
  status: string;
  assigned_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  judge_profiles?: JudgeProfile;
}

export interface JudgeRequest {
  id: string;
  pairing_id: string;
  judge_id: string;
  requester_id: string;
  request_reason: string | null;
  admin_response: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  pairing?: Pairing;
  judge_profiles?: JudgeProfile;
}
