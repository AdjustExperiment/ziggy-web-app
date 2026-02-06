
# Comprehensive Tabulation System Review

## Executive Summary

I've conducted a thorough review of the tabulation system, analyzing the database schema, business logic, UI components, and data flow. The system is well-architected with Tabbycat-style algorithms but has several critical issues and workflow gaps that need addressing.

## Current System Architecture

```text
+-------------------+     +-------------------+     +-------------------+
|   Admin Tab UI    |     |   Draw Generator  |     |   Database        |
|   (Dashboard)     |---->|   (Algorithms)    |---->|   (Supabase)      |
+-------------------+     +-------------------+     +-------------------+
        |                         |                         |
        v                         v                         v
+-------------------+     +-------------------+     +-------------------+
| PairingGenerator  |     | Munkres/Swiss     |     | pairings          |
| StandingsView     |     | PowerPairing      |     | rounds            |
| BreakManager      |     | TiebreakerEngine  |     | ballots           |
| SpreadsheetView   |     | JudgeAllocator    |     | tournament_stands |
+-------------------+     +-------------------+     +-------------------+
```

## Critical Issues Identified

### 1. Missing Database Tables (CRITICAL)

**Issue**: The code references tables that don't exist in the database:
- `computed_standings` - referenced in `standingsService.ts` but doesn't exist
- `head_to_head` - referenced in `standingsService.ts` but doesn't exist  
- `tournament_tab_config` - referenced in `TiebreakerConfig.tsx` but doesn't exist
- `tab_audit_log` - referenced in `AuditLogViewer.tsx` but doesn't exist

**Impact**: The `upsertStandings()` and `upsertHeadToHead()` functions silently fail, meaning computed standings are never cached. The standings are recomputed from scratch every time.

**Evidence**: Query for `computed_standings` returned "relation does not exist" error.

### 2. Dual Standings Systems Causing Confusion

**Issue**: There are TWO standings tables:
1. `tournament_standings` - contains 4 rows with precomputed test data
2. `computed_standings` - referenced in code but doesn't exist

**Impact**: Results page reads from `tournament_standings`, but `StandingsView` computes standings on-the-fly from `pairings.result`. These could become out of sync.

### 3. Ballot-to-Standings Data Flow Incomplete

**Issue**: The standings computation in `standingsService.ts` reads from `pairings.result` JSONB field, but the ballot entry (`BallotEntry.tsx`) does NOT update `pairings.result` after ballot submission.

**Current Flow**:
1. Judge submits ballot -> saves to `ballots` table with `payload`
2. `pairings.result` is NOT updated
3. Standings computation reads from `pairings.result` -> Gets stale/empty data

**Expected Flow**:
1. Judge submits ballot -> saves to `ballots` table
2. Trigger/function updates `pairings.result` from ballot
3. Standings computation reads correct data

### 4. Type Assertions Hiding Errors

**Issue**: Multiple files use `as any` type assertions to bypass TypeScript errors, hiding schema mismatches:
- `standingsService.ts` lines 740-745: `supabase.from('computed_standings' as any)`
- `AuditLogViewer.tsx`: `supabase.from('tab_audit_log' as any)`
- `TiebreakerConfig.tsx`: `supabase.from('tournament_tab_config' as any)`

**Impact**: These queries silently fail at runtime instead of catching issues at compile time.

---

## Medium Priority Issues

### 5. Speaker Points Field Mismatch

**Issue**: Ballot entry uses `aff_points/neg_points` but standings service expects `aff_speaks/neg_speaks`:
- `BallotEntry.tsx` saves: `{ winner, aff_points, neg_points }`
- Test data has: `{ winner, aff_speaks, neg_speaks }`
- `PairingGenerator.tsx` reads: `payload.aff_speaks`

### 6. Break Manager Not Connected to Computed Standings

**Issue**: `BreakManager.tsx` receives `standings: TeamStanding[]` as prop but this interface doesn't match `ComputedStanding`. The break generation might fail when connecting to real data.

### 7. Legacy Export/Import Edge Cases

**Issue**: `LegacyPairingUploader` uses fuzzy matching but doesn't handle:
- Teams with identical names from different schools
- Unicode characters in names
- Partner name variations

### 8. Round Status Inconsistency

**Issue**: Round status values aren't enforced:
- Code uses: `'upcoming' | 'in_progress' | 'completed' | 'locked'`
- Some places check for capitalized versions
- No database enum constraint

---

## Workflow Gaps

### 9. No Automatic Standings Recalculation

**Gap**: After ballot submission, standings are not automatically recalculated. Admin must manually click "Recalculate" in StandingsView.

**Recommendation**: Add a database trigger or post-ballot-submit hook to flag standings as stale.

### 10. No Ballot Validation

**Gap**: `BallotEntry.tsx` allows submission with:
- No speaker point range validation (min/max)
- No check for duplicate ballots from same judge
- No warning if both teams get same points

### 11. No Break Announcement Workflow

**Gap**: After breaks are generated, there's no workflow to:
- Notify breaking teams
- Generate elimination brackets
- Lock break results

### 12. Missing Print/Export Features

**Gap**: While `StandingsView` has export buttons, they're not connected to:
- Tournament name in exports
- Multi-event filtering
- PDF generation

---

## What's Working Well

1. **Draw Generation Algorithm**: Munkres/power-pairing implementation is solid with proper conflict avoidance
2. **Test Data Seeding**: Edge function `seed-test-data` provides good sample data for QA
3. **Real-time Subscriptions**: Pairings table has postgres_changes subscriptions
4. **Tiebreaker Engine**: Comprehensive with 12 tiebreaker types and head-to-head support
5. **Multi-Event Support**: Dashboard properly filters by event_id
6. **Spreadsheet View**: Good data visualization with sorting and filtering

---

## Implementation Plan

### Phase 1: Database Schema Fixes (Critical)

1. Create missing tables via migration:
   - `computed_standings` with proper columns matching `ComputedStanding` type
   - `head_to_head` for head-to-head records
   - `tournament_tab_config` for tournament-specific tab settings
   - `tab_audit_log` for audit logging

2. Add trigger to sync `ballots.payload` to `pairings.result` on ballot insert/update

3. Add database enum for round status

### Phase 2: Data Flow Fixes

1. Update `BallotEntry.tsx` to:
   - Use consistent field names (`aff_speaks` not `aff_points`)
   - Validate speaker point ranges
   - Update `pairings.result` after ballot submission

2. Add standings recalculation trigger after ballot submission

3. Fix type assertions with proper database types

### Phase 3: UI/UX Improvements

1. Add "Sync from Ballots" button to populate `pairings.result` from existing ballots
2. Add break announcement workflow
3. Add ballot validation warnings
4. Connect export functions to tournament metadata

### Phase 4: Testing & Verification

1. Run existing unit tests for standings/tiebreaker
2. Test full workflow: registration -> pairing -> ballot -> standings
3. Test break generation with real standings data
4. Test import/export with edge cases

---

## Technical Details

### Tables to Create

```sql
-- computed_standings: cache for computed standings
CREATE TABLE computed_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  event_id UUID REFERENCES tournament_events(id),
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  byes INTEGER DEFAULT 0,
  forfeits_given INTEGER DEFAULT 0,
  forfeits_received INTEGER DEFAULT 0,
  total_speaks NUMERIC DEFAULT 0,
  avg_speaks NUMERIC DEFAULT 0,
  adjusted_speaks NUMERIC DEFAULT 0,
  double_adjusted_speaks NUMERIC DEFAULT 0,
  total_ranks NUMERIC DEFAULT 0,
  avg_ranks NUMERIC DEFAULT 0,
  adjusted_ranks NUMERIC DEFAULT 0,
  double_adjusted_ranks NUMERIC DEFAULT 0,
  opp_wins INTEGER DEFAULT 0,
  opp_win_pct NUMERIC DEFAULT 0,
  aff_rounds INTEGER DEFAULT 0,
  neg_rounds INTEGER DEFAULT 0,
  prelim_rank INTEGER,
  overall_rank INTEGER,
  is_breaking BOOLEAN DEFAULT false,
  break_seed INTEGER,
  rounds_completed INTEGER DEFAULT 0,
  last_computed_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, registration_id)
);

-- head_to_head: records of matchups between teams
CREATE TABLE head_to_head (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  event_id UUID REFERENCES tournament_events(id),
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id),
  opponent_id UUID NOT NULL REFERENCES tournament_registrations(id),
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_speaks_for NUMERIC DEFAULT 0,
  total_speaks_against NUMERIC DEFAULT 0,
  UNIQUE(tournament_id, registration_id, opponent_id)
);

-- tournament_tab_config: per-tournament tabulation settings
CREATE TABLE tournament_tab_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) UNIQUE,
  event_id UUID REFERENCES tournament_events(id),
  debate_format_id UUID REFERENCES debate_formats(id),
  speaker_point_min NUMERIC DEFAULT 20,
  speaker_point_max NUMERIC DEFAULT 30,
  rank_scale INTEGER DEFAULT 4,
  tiebreaker_order TEXT[] DEFAULT ARRAY['wins','speaks','adjusted_speaks','opp_wins'],
  drop_high_low_speaks INTEGER DEFAULT 1,
  drop_high_low_ranks INTEGER DEFAULT 1,
  prelim_rounds INTEGER,
  break_to INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- tab_audit_log: audit trail for tabulation changes
CREATE TABLE tab_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Ballot-to-Pairing Sync Trigger

```sql
CREATE OR REPLACE FUNCTION sync_ballot_to_pairing()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pairings
  SET result = NEW.payload,
      status = CASE WHEN NEW.status = 'submitted' THEN 'completed' ELSE status END,
      updated_at = now()
  WHERE id = NEW.pairing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_ballot_insert_update
AFTER INSERT OR UPDATE ON ballots
FOR EACH ROW
EXECUTE FUNCTION sync_ballot_to_pairing();
```

---

## Risk Assessment

| Issue | Severity | Likelihood | Impact |
|-------|----------|------------|--------|
| Missing computed_standings table | High | Certain | Standings never cached |
| Ballot field mismatch | Medium | Likely | Incorrect speaks in standings |
| No auto standings refresh | Medium | Certain | Stale standings shown |
| Type assertion hiding errors | Low | Certain | Silent failures in production |

---

## Recommended Approval Flow

1. **First**: Create database tables and triggers (Phase 1)
2. **Second**: Fix data flow and field consistency (Phase 2)  
3. **Third**: Add UI improvements and validation (Phase 3)
4. **Fourth**: Comprehensive testing (Phase 4)

This plan addresses all critical issues first while maintaining backward compatibility with existing data.
