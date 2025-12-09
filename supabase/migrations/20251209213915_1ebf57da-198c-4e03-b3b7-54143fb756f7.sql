-- Phase 1: Insert pairing_judge_assignments for all test pairings so judges see their assignments
INSERT INTO pairing_judge_assignments (pairing_id, judge_profile_id, role, status)
SELECT p.id, p.judge_id, 'chair', 'assigned'
FROM pairings p
WHERE p.tournament_id = 'aaaaaaaa-0000-0000-0000-000000000001'
AND p.judge_id IS NOT NULL
ON CONFLICT DO NOTHING;