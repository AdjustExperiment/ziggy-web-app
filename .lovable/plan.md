

# Comprehensive Tournament Workflow Test Suite

## Overview

This plan creates a complete end-to-end test suite that validates the entire tournament lifecycle - from user registration through results publication. We'll enhance the existing `qa-simulation` edge function and create complementary frontend tests.

---

## Test Architecture

```text
+---------------------------+     +---------------------------+
|  Edge Function Tests      |     |  E2E Playwright Tests     |
|  (Database/API Layer)     |     |  (UI Interactions)        |
+---------------------------+     +---------------------------+
           |                                   |
           v                                   v
+------------------------------------------------------------------+
|                    qa-comprehensive-test                          |
|  Edge Function that orchestrates full tournament simulation       |
+------------------------------------------------------------------+
           |
           v
+------------------------------------------------------------------+
|                     Database Layer                                |
|  tournaments, registrations, rounds, pairings, ballots,          |
|  sponsor_profiles, computed_standings, results                   |
+------------------------------------------------------------------+
```

---

## Phase 1: Enhanced Edge Function - `qa-comprehensive-test`

Create a new edge function that orchestrates the complete workflow:

### 1.1 Test Account Matrix

| Account Type | Email Pattern | Count | Purpose |
|--------------|---------------|-------|---------|
| Global Admin | `qa_admin@ziggy-test.qa` | 1 | Tournament management |
| Debaters | `qa_debater_{N}@ziggy-test.qa` | 32 (16 teams) | Team Policy pairs |
| Judges | `qa_judge_{N}@ziggy-test.qa` | 12 | Round coverage |
| Sponsor | `qa_sponsor@ziggy-test.qa` | 1 | Sponsor onboarding |
| Register-for-Others | `qa_registrar@ziggy-test.qa` | 1 | Bulk registration |

### 1.2 Tournament Configuration

- **Format**: Team Policy (TP) - 2v2
- **Teams**: 16 registered teams (32 debaters)
- **Prelim Rounds**: 6 Swiss/Power-paired rounds
- **Break**: Top 8 teams to elimination
- **Elim Rounds**: Quarterfinals (4), Semifinals (2), 3rd Place (1), Finals (1)
- **Judges**: 12 judges with varied specializations

---

## Phase 2: Test Workflows

### 2.1 User & Account Workflows

```text
Test: User Registration Flow
  1. Create standalone account (/signup)
  2. Verify email confirmation (auto-confirm in test)
  3. Complete profile setup
  4. Verify user_roles assignment
  
Test: Account Editing
  1. Login as existing user
  2. Navigate to /account
  3. Update first name, last name, email
  4. Verify changes persisted
  
Test: Registration Drop
  1. User with active registration
  2. Navigate to tournament dashboard
  3. Request registration cancellation
  4. Admin approves refund request
  5. Verify registration marked inactive
```

### 2.2 Tournament Registration Workflows

```text
Test: Self-Registration
  1. Login as debater
  2. Navigate to tournament landing
  3. Add to cart (self + partner)
  4. Apply promo code
  5. Complete PayPal checkout (simulated)
  6. Verify registration created

Test: Register-for-Others
  1. Login as registrar account
  2. Add multiple teams to cart (other people)
  3. Complete checkout
  4. Verify pending_registrant_invitations created
  5. Invited user claims registration via /claim-registration/:token
  6. Verify registration linked to claimed user
```

### 2.3 Sponsor Onboarding Workflow

```text
Test: Sponsor Invitation Flow
  1. Admin creates sponsor invitation via SponsorInvitationManager
  2. System creates pending_sponsor_invitations record
  3. send-sponsor-invitation edge function triggered
  4. Sponsor visits /sponsor/invite/:token
  5. Sponsor creates account
  6. Sponsor profile created with is_approved=false
  7. Admin approves sponsor in SponsorsManager
  8. Verify sponsor_profile.is_approved=true
  9. Verify user_roles includes 'sponsor'
```

### 2.4 Tournament Lifecycle (6 Prelims + 4 Elims)

```text
Round Flow (repeated 6 times for prelims):
  1. Admin generates pairings via PairingGenerator
  2. Pairings saved with power-pairing logic
  3. Judges auto-assigned via JudgeAllocator
  4. Round posted (released=true)
  5. Competitor notifications created
  6. For each pairing:
     a. Judge submits ballot via BallotEntry
     b. Trigger sync_ballot_to_pairing updates pairings.result
     c. Ballot marked submitted
  7. Round status set to 'completed'
  8. Standings recalculated

Break Announcement:
  1. After Round 6, admin clicks "Generate Break"
  2. Top 8 teams identified via BreakGenerator
  3. Break notifications sent
  4. computed_standings.is_breaking=true for top 8

Elimination Rounds:
  - Quarterfinals: 4 matchups (1v8, 2v7, 3v6, 4v5)
  - Semifinals: 2 matchups
  - Finals: 1 matchup (+ 3rd place)
  - Each uses single-elimination pairing
  - Ballots submitted for each round
```

### 2.5 Results Publication

```text
Test: Publish Results
  1. Tournament status set to 'Completed'
  2. Admin navigates to ResultsManager
  3. Selects tournament, configures visibility
  4. Clicks "Publish Results"
  5. Verify tournaments.results_published=true
  6. Verify public /results page shows tournament
  7. Verify standings visible on /tournament/:id/standings
```

---

## Phase 3: Implementation Details

### 3.1 New Edge Function: `qa-comprehensive-test/index.ts`

**Features:**
- Configurable via JSON body
- Returns detailed phase-by-phase report
- Cleans up test data (optional)
- Validates all integration points

**Configuration Options:**
```typescript
interface QAComprehensiveConfig {
  // Core settings
  testPrefix: string;           // Default: 'QA_COMP_'
  numTeams: number;             // Default: 16
  numJudges: number;            // Default: 12
  numPrelimRounds: number;      // Default: 6
  breakSize: number;            // Default: 8
  
  // Feature toggles
  testSponsorFlow: boolean;     // Default: true
  testRegisterForOthers: boolean; // Default: true
  testDropRegistration: boolean;  // Default: true
  testAccountEditing: boolean;    // Default: true
  
  // Cleanup
  cleanupAfter: boolean;        // Default: false
}
```

### 3.2 Database Validations

Each phase validates database state:

| Phase | Tables Validated | Assertions |
|-------|------------------|------------|
| User Creation | `auth.users`, `profiles`, `user_roles` | Users created, roles assigned |
| Registration | `tournament_registrations`, `payment_transactions` | Paid registrations exist |
| Judge Setup | `judge_profiles`, `judge_availability`, `tournament_judge_registrations` | Judges available |
| Pairing Gen | `rounds`, `pairings`, `pairing_judge_assignments` | Pairings created |
| Ballots | `ballots`, `pairings.result` | Sync trigger works |
| Standings | `computed_standings`, `head_to_head` | Standings computed |
| Break | `computed_standings.is_breaking` | Top 8 marked |
| Results | `tournaments.results_published` | Results visible |

### 3.3 Ballot Generation Strategy

Realistic ballot data with controlled randomness:
- Winner: 55% higher seed wins (realistic upset rate)
- Speaker points: Normal distribution 26-29, ±0.5 decimal
- Edge cases: Some tied scores, some max/min points

### 3.4 Error Handling & Reporting

```typescript
interface PhaseReport {
  phase: string;
  status: 'pass' | 'fail' | 'warning' | 'skipped';
  message: string;
  duration_ms: number;
  assertions: {
    name: string;
    passed: boolean;
    expected?: any;
    actual?: any;
  }[];
  data?: Record<string, unknown>;
}
```

---

## Phase 4: Playwright E2E Tests

### 4.1 Enhanced Test Suite Structure

```
e2e/
├── fixtures/
│   └── comprehensive-test-data.ts    # Extended fixtures
├── workflows/
│   ├── user-registration.spec.ts     # Account creation/editing
│   ├── tournament-registration.spec.ts # Self/other registration
│   ├── sponsor-onboarding.spec.ts    # Sponsor invitation flow
│   └── results-publication.spec.ts   # Publish & verify
└── tournament-simulation/
    └── comprehensive-tournament.spec.ts # Full lifecycle
```

### 4.2 Test Execution Strategy

```text
1. Pre-test: Call qa-comprehensive-test edge function to seed data
2. UI Tests: Validate critical user-facing workflows
3. Post-test: Verify database state matches expectations
4. Cleanup: Optionally purge QA_COMP_ prefixed data
```

---

## Phase 5: Execution Plan

### Step 1: Create Edge Function (New File)
`supabase/functions/qa-comprehensive-test/index.ts`
- Complete tournament lifecycle simulation
- 16 teams, 6 prelim rounds, 4 elim rounds
- Sponsor invitation + onboarding
- Register-for-others workflow
- Results publication

### Step 2: Update E2E Fixtures
`e2e/fixtures/comprehensive-test-data.ts`
- Extended test accounts
- Sponsor invitation data
- Register-for-others data

### Step 3: Create Comprehensive Test Suite
`e2e/workflows/*.spec.ts`
- User registration/editing tests
- Sponsor onboarding tests
- Registration drop tests

### Step 4: Enhance Tournament Simulation
`e2e/tournament-simulation/comprehensive-tournament.spec.ts`
- 6 prelim rounds (not 5)
- Full elimination bracket
- Results publication verification

---

## Technical Considerations

### Database Trigger Verification
The `sync_ballot_to_pairing` trigger must:
1. Update `pairings.result` from `ballots.payload`
2. Set `pairings.status = 'completed'`
3. Work for both INSERT and UPDATE on ballots

### Standings Calculation
After each round:
1. Compute wins/losses from `pairings.result`
2. Calculate speaker point averages
3. Determine opponent strength
4. Rank teams appropriately

### Elimination Pairing Logic
- Use `generateEliminationPairings` from `src/lib/pairings/elimination.ts`
- Seeds: 1v8, 2v7, 3v6, 4v5 standard bracket

---

## Success Criteria

All phases must pass:
- **50+ test users created** successfully
- **16 teams registered** with paid status
- **6 prelim rounds** with power-paired matchups
- **96 ballots submitted** (16 teams * 6 rounds / 2 pairings)
- **8 teams break** to elimination
- **4 elim rounds** completed (QF, SF, 3rd, Finals)
- **Results published** and visible publicly
- **Sponsor onboarded** via invitation flow
- **Registration claimed** via register-for-others

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/qa-comprehensive-test/index.ts` | Create | Main test orchestrator |
| `e2e/fixtures/comprehensive-test-data.ts` | Create | Extended test data |
| `e2e/workflows/user-registration.spec.ts` | Create | Account tests |
| `e2e/workflows/sponsor-onboarding.spec.ts` | Create | Sponsor flow tests |
| `e2e/workflows/results-publication.spec.ts` | Create | Results tests |
| `e2e/tournament-simulation/comprehensive-tournament.spec.ts` | Create | Full lifecycle |

---

## Suggested Additions

1. **Performance Benchmarks**: Track time for each phase, set baseline thresholds
2. **Stress Test Mode**: Generate 50+ teams to test scaling
3. **Rollback Testing**: Verify registration cancellations properly refund
4. **Notification Verification**: Check all notification types created
5. **Chat Simulation**: Validate pairing chat RLS policies with test messages
6. **PDF/Export Verification**: Test standings export functionality

