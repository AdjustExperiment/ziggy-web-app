

# Tournament Interface Assessment and Unification Plan

## Current State Analysis

The tournament experience is split across **two fundamentally different interfaces** that don't share data, settings, or admin controls consistently:

### 1. Tournament Landing Page (`/tournaments/:id` -- TournamentLanding.tsx)
- **635 lines**, static/informational page
- Data sources: `tournaments` table + `tournament_content` table (JSONB announcements, sponsors, rules, contact)
- Admin controls: Only a `TournamentContentManager` embedded in a "Manage" tab (edits JSONB content blobs)
- Shows: Overview, announcements, rules, sponsors, contact, registration status, calendar, related tournaments
- No real-time data, no rounds/pairings, no live state

### 2. Enter Tournament / Live Page (`/tournaments/:id/live` -- TournamentLive.tsx)
- **534 lines**, real-time interactive interface
- Data sources: `tournaments`, `tournament_events`, `rounds`, `pairings`, `tournament_registrations`, `judge_profiles`, `tournament_observers`, `tournament_sponsor_links`
- Real-time WebSocket subscriptions for rounds, pairings, chat
- Shows: Rounds accordion, pairings table with expandable details, sidebar (announcements, info, schedule, chat)
- Admin features: sees unreleased pairings, can edit pairings (swap teams/judges via PairingEditModal), Admin View badge
- **Missing admin controls**: No round management (create/delete/reorder), no pairing generation, no ballot entry, no standings view, no break management, no settings, no registration management, no announcement creation

### Key Gaps

| Capability | Landing Page | Live Page | Admin Dashboard |
|---|---|---|---|
| Tournament info/description | Yes (from tournament_content JSONB) | Yes (sidebar, from same source) | Yes (TournamentManager) |
| Announcements display | Yes | Yes (sidebar + header collapsible) | -- |
| Announcement creation | Via TournamentContentManager | No | Via TournamentContentManager |
| Rounds display | No | Yes (real-time) | Yes (TabulationDashboard) |
| Pairing generation | No | No | Yes (PairingGenerator) |
| Pairing editing | No | Yes (PairingEditModal) | Yes (ManualPairingEditor) |
| Ballot entry | No | No | Yes (BallotEntry/SpreadsheetView) |
| Standings | No | No | Yes (StandingsView) |
| Round management | No | No | Yes (RoundsManager) |
| Registration management | No | No | Yes (CompetitorDirectory) |
| Judge management | No | No | Yes (JudgePostingsView) |
| Settings | No | No | Yes (TournamentSettingsManager) |
| Real-time updates | No | Yes | Partial |
| Chat | No | Yes (sidebar + header) | No |
| Sponsor display | Yes (from JSONB) | Yes (from sponsor_profiles) | -- |

---

## Proposed Solution: Elevate the Live Page as the Primary Tournament Interface

Rather than maintaining two divergent pages, consolidate the experience by adding admin operational controls directly into the Live page, making it the **single source of truth** for anyone inside a tournament.

### Phase 1: Fix Build Error (Immediate)

**File**: `src/components/ui/action-search-bar.tsx`

The `Action` interface is exported twice -- once as `export interface Action` (line 30) and again in the barrel export `export { ActionSearchBar, type Action }` (line 338). Remove the duplicate export from the barrel statement.

### Phase 2: Add Admin Controls Panel to TournamentLive

Add an admin-only floating action bar or collapsible panel within the Live page that provides:

1. **Round Management** -- Create new round, set round status (upcoming/in_progress/completed), release/unrelease pairings for current round
2. **Pairing Generation** -- Trigger Swiss/power-pairing or elimination bracket generation for the selected round (reuse `PairingGenerator` logic)
3. **Ballot Quick-Entry** -- Inline ballot submission for the selected round's pairings (reuse `BallotEntry` component)
4. **Standings Access** -- Collapsible standings view within the sidebar or as a new sidebar tab (reuse `StandingsView`)
5. **Announcement Creation** -- Quick-post announcements from the sidebar's announcements tab (admin only)

### Phase 3: Reconcile Data Sources

The Landing page uses `tournament_content` JSONB for sponsors/announcements while the Live page uses `tournament_sponsor_links` + `sponsor_profiles` for sponsors and the same `tournament_content` for announcements. Standardize:

- Sponsors: Always use `tournament_sponsor_links` joined with `sponsor_profiles` (the relational source of truth)
- Announcements: Continue using `tournament_content.announcements` JSONB but add the ability for admins to create announcements directly from the Live sidebar

### Phase 4: Simplify Tournament Landing

Reduce the Landing page to a lightweight **public-facing info page** focused on:
- Tournament overview and registration CTA
- Calendar and dates
- Contact info
- A prominent "Enter Tournament" button leading to `/live`

Remove duplicated content tabs (rules, sponsors, announcements) that are better served inside the Live interface.

---

## Technical Implementation

### Files to Modify

| File | Change |
|---|---|
| `src/components/ui/action-search-bar.tsx` | Fix duplicate `Action` export (line 338) |
| `src/pages/TournamentLive.tsx` | Add admin control panel with round management, pairing gen, ballot entry |
| `src/components/tournament/TournamentSidebar.tsx` | Add "Standings" tab, add admin announcement creation form |
| `src/components/tournament/AdminTournamentControls.tsx` | **New** -- Reusable admin control panel component |
| `src/pages/TournamentLanding.tsx` | Simplify to info-only page with prominent "Enter Tournament" CTA |

### New Component: `AdminTournamentControls`

A collapsible panel rendered at the top of the Live page (admin-only) containing:

```text
+-------------------------------------------------------+
| ADMIN CONTROLS                               [Collapse]|
+-------------------------------------------------------+
| [Generate Pairings] [Release Round] [Complete Round]   |
| Round: [Dropdown] | Status: In Progress                |
| Quick Ballot Entry: [Select Pairing] [Enter Scores]   |
+-------------------------------------------------------+
```

This component will import and reuse existing logic from:
- `PairingGenerator` (draw generation)
- `BallotEntry` (ballot submission)
- Round status update queries (already in `RoundsManager`)

### Sidebar Enhancement

Add a 5th tab "Standings" to `TournamentSidebar` (admin + completed-round visibility):

```text
[News] [Info] [Schedule] [Chat] [Standings]
```

Add an "Add Announcement" form at the top of the News tab when `isAdmin === true`.

---

## Execution Order

1. Fix the `action-search-bar.tsx` build error (removes blocking issue)
2. Create `AdminTournamentControls` component
3. Integrate it into `TournamentLive.tsx`
4. Enhance `TournamentSidebar` with standings tab and admin announcement creation
5. Simplify `TournamentLanding.tsx` to avoid data/feature duplication

