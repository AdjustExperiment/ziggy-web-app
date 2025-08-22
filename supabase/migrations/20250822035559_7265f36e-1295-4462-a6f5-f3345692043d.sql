-- Create 20 test users for debugging and testing
-- 10 debaters and 10 judges

-- Create 10 debater users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, aud, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'debater1@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Alice", "last_name": "Johnson"}', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'debater2@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Bob", "last_name": "Smith"}', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'debater3@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Carol", "last_name": "Davis"}', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'debater4@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "David", "last_name": "Wilson"}', 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', 'debater5@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Emma", "last_name": "Brown"}', 'authenticated', 'authenticated'),
  ('66666666-6666-6666-6666-666666666666', 'debater6@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Frank", "last_name": "Miller"}', 'authenticated', 'authenticated'),
  ('77777777-7777-7777-7777-777777777777', 'debater7@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Grace", "last_name": "Taylor"}', 'authenticated', 'authenticated'),
  ('88888888-8888-8888-8888-888888888888', 'debater8@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Henry", "last_name": "Anderson"}', 'authenticated', 'authenticated'),
  ('99999999-9999-9999-9999-999999999999', 'debater9@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Iris", "last_name": "Garcia"}', 'authenticated', 'authenticated'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'debater10@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Jack", "last_name": "Martinez"}', 'authenticated', 'authenticated');

-- Create 10 judge users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, aud, role)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'judge1@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Judge", "last_name": "Roberts"}', 'authenticated', 'authenticated'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'judge2@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Justice", "last_name": "Thompson"}', 'authenticated', 'authenticated'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'judge3@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Honorable", "last_name": "White"}', 'authenticated', 'authenticated'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'judge4@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Magistrate", "last_name": "Lewis"}', 'authenticated', 'authenticated'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'judge5@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Chief", "last_name": "Walker"}', 'authenticated', 'authenticated'),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'judge6@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Senior", "last_name": "Hall"}', 'authenticated', 'authenticated'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'judge7@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Associate", "last_name": "Allen"}', 'authenticated', 'authenticated'),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'judge8@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Circuit", "last_name": "Young"}', 'authenticated', 'authenticated'),
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'judge9@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "District", "last_name": "King"}', 'authenticated', 'authenticated'),
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'judge10@test.com', '$2a$10$dummy.encrypted.password.hash', NOW(), NOW(), NOW(), '{"first_name": "Federal", "last_name": "Wright"}', 'authenticated', 'authenticated');

-- Create profiles for all users (this will be done automatically by the trigger for new auth users)
-- But we need to do it manually for these test users since they're inserted directly into auth.users

-- Create profiles for debaters
INSERT INTO public.profiles (user_id, first_name, last_name, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alice', 'Johnson', 'user'),
  ('22222222-2222-2222-2222-222222222222', 'Bob', 'Smith', 'user'),
  ('33333333-3333-3333-3333-333333333333', 'Carol', 'Davis', 'user'),
  ('44444444-4444-4444-4444-444444444444', 'David', 'Wilson', 'user'),
  ('55555555-5555-5555-5555-555555555555', 'Emma', 'Brown', 'user'),
  ('66666666-6666-6666-6666-666666666666', 'Frank', 'Miller', 'user'),
  ('77777777-7777-7777-7777-777777777777', 'Grace', 'Taylor', 'user'),
  ('88888888-8888-8888-8888-888888888888', 'Henry', 'Anderson', 'user'),
  ('99999999-9999-9999-9999-999999999999', 'Iris', 'Garcia', 'user'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Jack', 'Martinez', 'user');

-- Create profiles for judges  
INSERT INTO public.profiles (user_id, first_name, last_name, role, phone, region, state)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Judge', 'Roberts', 'user', '555-0101', 'Northeast', 'NY'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Justice', 'Thompson', 'user', '555-0102', 'Southeast', 'FL'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Honorable', 'White', 'user', '555-0103', 'Midwest', 'IL'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Magistrate', 'Lewis', 'user', '555-0104', 'Southwest', 'TX'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Chief', 'Walker', 'user', '555-0105', 'West', 'CA'),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Senior', 'Hall', 'user', '555-0106', 'Northeast', 'MA'),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Associate', 'Allen', 'user', '555-0107', 'Southeast', 'GA'),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Circuit', 'Young', 'user', '555-0108', 'Midwest', 'OH'),
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'District', 'King', 'user', '555-0109', 'Southwest', 'AZ'),
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'Federal', 'Wright', 'user', '555-0110', 'West', 'OR');

-- Create judge profiles for the 10 judge users
INSERT INTO public.judge_profiles (user_id, name, email, phone, experience_level, qualifications, bio, specializations)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Judge Roberts', 'judge1@test.com', '555-0101', 'expert', 'JD Harvard Law, 15+ years judicial experience', 'Former federal judge with extensive debate judging experience in policy and parliamentary formats.', ARRAY['Policy Debate', 'Parliamentary']),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Justice Thompson', 'judge2@test.com', '555-0102', 'expert', 'JD Yale Law, Constitutional Law Professor', 'Constitutional law scholar who has judged national championship rounds.', ARRAY['Constitutional Law', 'Public Forum']),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Honorable White', 'judge3@test.com', '555-0103', 'advanced', 'JD Northwestern, 10 years litigation experience', 'Trial lawyer turned debate coach with strong background in evidence evaluation.', ARRAY['Evidence Analysis', 'Cross-Examination']),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Magistrate Lewis', 'judge4@test.com', '555-0104', 'intermediate', 'JD University of Texas, Public Defender', 'Criminal defense attorney with passion for argumentation and logic.', ARRAY['Criminal Law', 'Logic']),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Chief Walker', 'judge5@test.com', '555-0105', 'expert', 'JD Stanford, Chief Justice State Supreme Court', 'Retired chief justice with decades of experience in legal reasoning.', ARRAY['Legal Reasoning', 'Appellate Advocacy']),
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Senior Hall', 'judge6@test.com', '555-0106', 'advanced', 'JD Boston University, Corporate Lawyer', 'Corporate attorney specializing in complex commercial litigation.', ARRAY['Commercial Law', 'Contract Disputes']),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'Associate Allen', 'judge7@test.com', '555-0107', 'intermediate', 'JD Emory University, Civil Rights Lawyer', 'Civil rights attorney with strong background in constitutional issues.', ARRAY['Civil Rights', 'Constitutional Issues']),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'Circuit Young', 'judge8@test.com', '555-0108', 'novice', 'JD Ohio State, Recent Graduate', 'Recent law school graduate with undergraduate debate experience.', ARRAY['Research', 'Case Law']),
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'District King', 'judge9@test.com', '555-0109', 'advanced', 'JD Arizona State, Immigration Lawyer', 'Immigration attorney with expertise in federal administrative law.', ARRAY['Administrative Law', 'Immigration']),
  ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'Federal Wright', 'judge10@test.com', '555-0110', 'expert', 'JD University of Oregon, Environmental Lawyer', 'Environmental law specialist with experience in complex regulatory cases.', ARRAY['Environmental Law', 'Regulatory Compliance']);

-- Add some sample tournament registrations for debaters (assuming tournament exists)
-- We'll use tournament_id that might exist from previous testing
INSERT INTO public.tournament_registrations (
  user_id, tournament_id, participant_name, participant_email, school_organization, partner_name, payment_status
)
SELECT 
  user_id,
  (SELECT id FROM public.tournaments LIMIT 1) as tournament_id,
  first_name || ' ' || last_name as participant_name,
  CASE user_id 
    WHEN '11111111-1111-1111-1111-111111111111' THEN 'debater1@test.com'
    WHEN '22222222-2222-2222-2222-222222222222' THEN 'debater2@test.com'
    WHEN '33333333-3333-3333-3333-333333333333' THEN 'debater3@test.com'
    WHEN '44444444-4444-4444-4444-444444444444' THEN 'debater4@test.com'
    WHEN '55555555-5555-5555-5555-555555555555' THEN 'debater5@test.com'
    WHEN '66666666-6666-6666-6666-666666666666' THEN 'debater6@test.com'
    WHEN '77777777-7777-7777-7777-777777777777' THEN 'debater7@test.com'
    WHEN '88888888-8888-8888-8888-888888888888' THEN 'debater8@test.com'
    WHEN '99999999-9999-9999-9999-999999999999' THEN 'debater9@test.com'
    WHEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN 'debater10@test.com'
  END as participant_email,
  CASE 
    WHEN user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') THEN 'Harvard University'
    WHEN user_id IN ('33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444') THEN 'Yale University'
    WHEN user_id IN ('55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666') THEN 'Stanford University'
    WHEN user_id IN ('77777777-7777-7777-7777-777777777777', '88888888-8888-8888-8888-888888888888') THEN 'MIT'
    ELSE 'Princeton University'
  END as school_organization,
  CASE 
    WHEN user_id = '11111111-1111-1111-1111-111111111111' THEN 'Bob Smith'
    WHEN user_id = '22222222-2222-2222-2222-222222222222' THEN 'Alice Johnson'
    WHEN user_id = '33333333-3333-3333-3333-333333333333' THEN 'David Wilson'
    WHEN user_id = '44444444-4444-4444-4444-444444444444' THEN 'Carol Davis'
    WHEN user_id = '55555555-5555-5555-5555-555555555555' THEN 'Frank Miller'
    WHEN user_id = '66666666-6666-6666-6666-666666666666' THEN 'Emma Brown'
    WHEN user_id = '77777777-7777-7777-7777-777777777777' THEN 'Henry Anderson'
    WHEN user_id = '88888888-8888-8888-8888-888888888888' THEN 'Grace Taylor'
    WHEN user_id = '99999999-9999-9999-9999-999999999999' THEN 'Jack Martinez'
    WHEN user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN 'Iris Garcia'
  END as partner_name,
  'paid'
FROM public.profiles 
WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222', 
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
)
AND EXISTS (SELECT 1 FROM public.tournaments LIMIT 1);