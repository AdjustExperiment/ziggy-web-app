-- =============================================
-- TEST ONLY: Ziggy TP Simulation Open
-- Full 6-round tournament simulation for QA
-- Uses existing auth users to satisfy FK constraints
-- =============================================

-- Step 1: Create the test tournament
INSERT INTO tournaments (
  id, name, format, debate_style, start_date, end_date,
  location, max_participants, current_participants, round_count,
  status, registration_open, opt_outs_enabled, resolutions_enabled
) VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'TEST ONLY: Ziggy TP Simulation Open',
  'Policy Debate',
  'Team Policy (TP)',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '3 days',
  'Virtual - Ziggy Platform (TEST)',
  20,
  8,
  6,
  'Ongoing',
  false,
  true,
  true
);

-- Step 2: Create test judge profiles (using real user IDs)
INSERT INTO judge_profiles (id, user_id, name, email, phone, experience_level, experience_years, specializations, status, bio) VALUES
  ('bbbbbbbb-0001-0000-0000-000000000001', '1c030ffc-46a9-4e10-957a-37ec0f56b540', 'TEST Judge Alpha', 'test-judge-1@ziggy-test.local', '555-0101', 'experienced', 5, ARRAY['Policy Debate', 'Team Policy'], 'approved', 'TEST ONLY - Simulated judge'),
  ('bbbbbbbb-0002-0000-0000-000000000001', '748a38c7-38a1-4eae-83e8-21dd9ec93174', 'TEST Judge Beta', 'test-judge-2@ziggy-test.local', '555-0102', 'intermediate', 3, ARRAY['Policy Debate', 'Team Policy'], 'approved', 'TEST ONLY - Simulated judge'),
  ('bbbbbbbb-0003-0000-0000-000000000001', '53e7d955-1457-4bc2-8b7a-af63c61ee647', 'TEST Judge Gamma', 'test-judge-3@ziggy-test.local', '555-0103', 'novice', 1, ARRAY['Policy Debate'], 'approved', 'TEST ONLY - Simulated judge'),
  ('bbbbbbbb-0004-0000-0000-000000000001', '8bbf3139-5a85-4098-bfbf-9766363052fe', 'TEST Judge Delta', 'test-judge-4@ziggy-test.local', '555-0104', 'experienced', 7, ARRAY['Policy Debate', 'Team Policy'], 'approved', 'TEST ONLY - Simulated judge');

-- Step 3: Create tournament registrations (4 teams - using 'completed' for payment_status)
INSERT INTO tournament_registrations (id, tournament_id, user_id, participant_name, partner_name, participant_email, school_organization, payment_status, is_active, aff_count, neg_count) VALUES
  ('dddddddd-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '1c030ffc-46a9-4e10-957a-37ec0f56b540', 'TEST Team Alpha - Speaker 1', 'TEST Team Alpha - Speaker 2', 'test-team-1@ziggy-test.local', 'TEST School Alpha', 'completed', true, 3, 3),
  ('dddddddd-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '748a38c7-38a1-4eae-83e8-21dd9ec93174', 'TEST Team Beta - Speaker 1', 'TEST Team Beta - Speaker 2', 'test-team-2@ziggy-test.local', 'TEST School Beta', 'completed', true, 3, 3),
  ('dddddddd-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '53e7d955-1457-4bc2-8b7a-af63c61ee647', 'TEST Team Gamma - Speaker 1', 'TEST Team Gamma - Speaker 2', 'test-team-3@ziggy-test.local', 'TEST School Gamma', 'completed', true, 3, 3),
  ('dddddddd-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '8bbf3139-5a85-4098-bfbf-9766363052fe', 'TEST Team Delta - Speaker 1', 'TEST Team Delta - Speaker 2', 'test-team-4@ziggy-test.local', 'TEST School Alpha', 'completed', true, 3, 3);

-- Step 4: Create tournament tabulation settings
INSERT INTO tournament_tabulation_settings (tournament_id, draw_method, side_method, odd_bracket, avoid_rematches, club_protect, history_penalty, institution_penalty)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'power_paired', 'balance', 'pullup_top', true, true, 1000, 500);

-- Step 5: Add observer (using 6th user)
INSERT INTO tournament_observers (tournament_id, user_id)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'a06d7c10-8515-45a2-8072-d351f6bfb781');

-- Step 6: Create 6 rounds
INSERT INTO rounds (id, tournament_id, round_number, name, scheduled_date, status) VALUES
  ('11111111-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 1, 'Preliminary Round 1', CURRENT_DATE, 'completed'),
  ('11111111-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 2, 'Preliminary Round 2', CURRENT_DATE, 'completed'),
  ('11111111-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 3, 'Preliminary Round 3', CURRENT_DATE, 'completed'),
  ('11111111-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 4, 'Preliminary Round 4', CURRENT_DATE, 'completed'),
  ('11111111-0005-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 5, 'Preliminary Round 5', CURRENT_DATE, 'completed'),
  ('11111111-0006-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 6, 'Preliminary Round 6', CURRENT_DATE, 'in_progress');

-- Step 7: Create pairings for all 6 rounds (2 per round = 12 total)
-- Round 1: Alpha vs Beta, Gamma vs Delta
INSERT INTO pairings (id, tournament_id, round_id, aff_registration_id, neg_registration_id, judge_id, room, released, status, result) VALUES
  ('22222222-0101-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0001-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'dddddddd-0002-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', 'TEST Room 1', true, 'completed', '{"winner": "aff", "aff_speaks": 28, "neg_speaks": 27}'::jsonb),
  ('22222222-0102-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0001-0000-0000-000000000001', 'dddddddd-0003-0000-0000-000000000001', 'dddddddd-0004-0000-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', 'TEST Room 2', true, 'completed', '{"winner": "neg", "aff_speaks": 26, "neg_speaks": 28}'::jsonb),
  -- Round 2
  ('22222222-0201-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0002-0000-0000-000000000001', 'dddddddd-0003-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', 'TEST Room 1', true, 'completed', '{"winner": "neg", "aff_speaks": 27, "neg_speaks": 29}'::jsonb),
  ('22222222-0202-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0002-0000-0000-000000000001', 'dddddddd-0004-0000-0000-000000000001', 'dddddddd-0002-0000-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', 'TEST Room 2', true, 'completed', '{"winner": "aff", "aff_speaks": 28, "neg_speaks": 26}'::jsonb),
  -- Round 3
  ('22222222-0301-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0003-0000-0000-000000000001', 'dddddddd-0002-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', 'TEST Room 1', true, 'completed', '{"winner": "aff", "aff_speaks": 29, "neg_speaks": 27}'::jsonb),
  ('22222222-0302-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0003-0000-0000-000000000001', 'dddddddd-0004-0000-0000-000000000001', 'dddddddd-0003-0000-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', 'TEST Room 2', true, 'completed', '{"winner": "aff", "aff_speaks": 28, "neg_speaks": 27}'::jsonb),
  -- Round 4
  ('22222222-0401-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0004-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'dddddddd-0003-0000-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', 'TEST Room 1', true, 'completed', '{"winner": "neg", "aff_speaks": 26, "neg_speaks": 28}'::jsonb),
  ('22222222-0402-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0004-0000-0000-000000000001', 'dddddddd-0002-0000-0000-000000000001', 'dddddddd-0004-0000-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', 'TEST Room 2', true, 'completed', '{"winner": "neg", "aff_speaks": 27, "neg_speaks": 29}'::jsonb),
  -- Round 5
  ('22222222-0501-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0005-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'dddddddd-0004-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', 'TEST Room 1', true, 'completed', '{"winner": "aff", "aff_speaks": 29, "neg_speaks": 27}'::jsonb),
  ('22222222-0502-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0005-0000-0000-000000000001', 'dddddddd-0003-0000-0000-000000000001', 'dddddddd-0002-0000-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', 'TEST Room 2', true, 'completed', '{"winner": "neg", "aff_speaks": 26, "neg_speaks": 28}'::jsonb),
  -- Round 6 (in progress - no results)
  ('22222222-0601-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0006-0000-0000-000000000001', 'dddddddd-0004-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', 'TEST Room 1', true, 'in_progress', NULL),
  ('22222222-0602-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '11111111-0006-0000-0000-000000000001', 'dddddddd-0002-0000-0000-000000000001', 'dddddddd-0003-0000-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', 'TEST Room 2', true, 'in_progress', NULL);

-- Step 8: Create ballots for completed rounds (10 ballots)
INSERT INTO ballots (pairing_id, judge_profile_id, judge_user_id, status, is_published, payload) VALUES
  ('22222222-0101-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', '1c030ffc-46a9-4e10-957a-37ec0f56b540', 'submitted', true, '{"winner": "aff", "aff_speaks": 28, "neg_speaks": 27, "comments": "TEST R1 ballot"}'::jsonb),
  ('22222222-0102-0000-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', '748a38c7-38a1-4eae-83e8-21dd9ec93174', 'submitted', true, '{"winner": "neg", "aff_speaks": 26, "neg_speaks": 28, "comments": "TEST R1 ballot"}'::jsonb),
  ('22222222-0201-0000-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', '53e7d955-1457-4bc2-8b7a-af63c61ee647', 'submitted', true, '{"winner": "neg", "aff_speaks": 27, "neg_speaks": 29, "comments": "TEST R2 ballot"}'::jsonb),
  ('22222222-0202-0000-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', '8bbf3139-5a85-4098-bfbf-9766363052fe', 'submitted', true, '{"winner": "aff", "aff_speaks": 28, "neg_speaks": 26, "comments": "TEST R2 ballot"}'::jsonb),
  ('22222222-0301-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', '1c030ffc-46a9-4e10-957a-37ec0f56b540', 'submitted', true, '{"winner": "aff", "aff_speaks": 29, "neg_speaks": 27, "comments": "TEST R3 ballot"}'::jsonb),
  ('22222222-0302-0000-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', '748a38c7-38a1-4eae-83e8-21dd9ec93174', 'submitted', true, '{"winner": "aff", "aff_speaks": 28, "neg_speaks": 27, "comments": "TEST R3 ballot"}'::jsonb),
  ('22222222-0401-0000-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', '53e7d955-1457-4bc2-8b7a-af63c61ee647', 'submitted', true, '{"winner": "neg", "aff_speaks": 26, "neg_speaks": 28, "comments": "TEST R4 ballot"}'::jsonb),
  ('22222222-0402-0000-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', '8bbf3139-5a85-4098-bfbf-9766363052fe', 'submitted', true, '{"winner": "neg", "aff_speaks": 27, "neg_speaks": 29, "comments": "TEST R4 ballot"}'::jsonb),
  ('22222222-0501-0000-0000-000000000001', 'bbbbbbbb-0001-0000-0000-000000000001', '1c030ffc-46a9-4e10-957a-37ec0f56b540', 'submitted', true, '{"winner": "aff", "aff_speaks": 29, "neg_speaks": 27, "comments": "TEST R5 ballot"}'::jsonb),
  ('22222222-0502-0000-0000-000000000001', 'bbbbbbbb-0002-0000-0000-000000000001', '748a38c7-38a1-4eae-83e8-21dd9ec93174', 'submitted', true, '{"winner": "neg", "aff_speaks": 26, "neg_speaks": 28, "comments": "TEST R5 ballot"}'::jsonb);

-- Step 9: Create tournament content with announcements
INSERT INTO tournament_content (tournament_id, description, announcements) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'TEST ONLY: This is a simulated 6-round Team Policy tournament for QA testing.',
   '[{"id": "ann-001", "title": "Welcome to TP Simulation Open", "content": "This is a test tournament. All data is simulated.", "created_at": "2025-12-09T10:00:00Z", "priority": "high"}, {"id": "ann-002", "title": "Round 6 Now In Progress", "content": "Final preliminary round is underway. Good luck!", "created_at": "2025-12-09T14:00:00Z", "priority": "normal"}]'::jsonb);

-- Step 10: Create judge availability
INSERT INTO judge_availability (judge_profile_id, tournament_id, available_dates, time_preferences, max_rounds_per_day) VALUES
  ('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '["2025-12-09", "2025-12-10", "2025-12-11"]'::jsonb, '{"morning": true, "afternoon": true, "evening": true}'::jsonb, 3),
  ('bbbbbbbb-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '["2025-12-09", "2025-12-10", "2025-12-11"]'::jsonb, '{"morning": true, "afternoon": true, "evening": false}'::jsonb, 2),
  ('bbbbbbbb-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '["2025-12-09", "2025-12-10"]'::jsonb, '{"morning": false, "afternoon": true, "evening": true}'::jsonb, 2),
  ('bbbbbbbb-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '["2025-12-09", "2025-12-10", "2025-12-11"]'::jsonb, '{"morning": true, "afternoon": true, "evening": true}'::jsonb, 3);

-- Step 11: Create sample notifications
INSERT INTO competitor_notifications (tournament_id, round_id, pairing_id, registration_id, title, message, type) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0006-0000-0000-000000000001', '22222222-0601-0000-0000-000000000001', 'dddddddd-0001-0000-0000-000000000001', 'Round 6 Pairing', 'Your Round 6 pairing is ready', 'pairing_released'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0006-0000-0000-000000000001', '22222222-0601-0000-0000-000000000001', 'dddddddd-0004-0000-0000-000000000001', 'Round 6 Pairing', 'Your Round 6 pairing is ready', 'pairing_released'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0006-0000-0000-000000000001', '22222222-0602-0000-0000-000000000001', 'dddddddd-0002-0000-0000-000000000001', 'Round 6 Pairing', 'Your Round 6 pairing is ready', 'pairing_released'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-0006-0000-0000-000000000001', '22222222-0602-0000-0000-000000000001', 'dddddddd-0003-0000-0000-000000000001', 'Round 6 Pairing', 'Your Round 6 pairing is ready', 'pairing_released');

INSERT INTO judge_notifications (tournament_id, pairing_id, judge_profile_id, title, message, type) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-0601-0000-0000-000000000001', 'bbbbbbbb-0003-0000-0000-000000000001', 'Round 6 Assignment', 'You are assigned to judge Round 6', 'judge_assigned'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-0602-0000-0000-000000000001', 'bbbbbbbb-0004-0000-0000-000000000001', 'Round 6 Assignment', 'You are assigned to judge Round 6', 'judge_assigned');