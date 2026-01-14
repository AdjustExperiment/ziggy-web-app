# Ziggy Web App - Refactor Backlog

This document lists identified technical debt and recommended refactoring work, prioritized by impact and risk. These are **documentation-only recommendations** - no code changes should be made without explicit approval.

---

## Priority Levels

| Priority | Criteria |
|----------|----------|
| **P0 - Critical** | Blocking issues, security concerns, data integrity risks |
| **P1 - High** | Significant code duplication, maintenance burden, developer confusion |
| **P2 - Medium** | Optimization opportunities, minor inconsistencies |
| **P3 - Low** | Nice-to-have improvements, aesthetic cleanup |

---

## Backlog Items

### 1. Unify Notification System

**Priority:** P1 - High

**Problem:**
Two notification hooks exist with overlapping functionality:
- `src/hooks/useUnifiedNotifications.tsx` - Unified system (admin + judge + competitor)
- `src/hooks/useNotifications.tsx` - Legacy admin-only notifications

This causes:
- Code duplication
- Potential inconsistency in notification behavior
- Confusion about which hook to use

**Current State:**
```
useUnifiedNotifications.tsx (306 lines)
├── Fetches from admin_notifications, judge_notifications, competitor_notifications
├── Merges and sorts by priority/time
├── Realtime subscriptions for all three tables
└── Used by UnifiedNotificationDropdown.tsx

useNotifications.tsx (195 lines)
├── Fetches only from admin_notifications
├── Realtime subscription for admin_notifications
└── Potentially unused or used by legacy components
```

**Recommended Action:**
1. Audit usage of `useNotifications.tsx` across the codebase
2. Migrate any remaining consumers to `useUnifiedNotifications.tsx`
3. Delete `useNotifications.tsx`
4. Rename `useUnifiedNotifications.tsx` to `useNotifications.tsx` (optional)

**Effort:** ~2 hours

**Files Affected:**
- `src/hooks/useNotifications.tsx` (delete)
- `src/hooks/useUnifiedNotifications.tsx` (keep)
- Any consumers of the legacy hook

---

### 2. Unify Tournament Chat Implementations

**Priority:** P1 - High

**Problem:**
Tournament chat is implemented twice with different strategies:
- `src/components/tournament/TournamentSidebar.tsx` - Uses realtime subscription
- `src/components/tournament/TournamentChat.tsx` - Uses 10-second polling

This causes:
- Inconsistent UX (some users get instant updates, others delayed)
- Duplicate code
- Double network traffic when both are used

**Current State:**
```
TournamentSidebar.tsx
├── Realtime subscription to pairing_chat_messages
├── Filters by message_type='tournament_chat' and tournament_id
└── Part of larger sidebar component (~488 lines)

TournamentChat.tsx  
├── Polling every 10 seconds
├── Same filtering logic
└── Standalone component (~177 lines)
```

**Recommended Action:**
1. Extract chat logic into a dedicated `useTournamentChat.ts` hook
2. Use realtime subscription (not polling) as the standard approach
3. Have both components use the shared hook
4. Consider consolidating into a single reusable `<TournamentChatPanel />` component

**Effort:** ~3-4 hours

**Files Affected:**
- Create `src/hooks/useTournamentChat.ts`
- Refactor `src/components/tournament/TournamentSidebar.tsx`
- Refactor `src/components/tournament/TournamentChat.tsx`

---

### 3. Normalize Data Fetching Patterns

**Priority:** P2 - Medium

**Problem:**
Inconsistent data fetching approaches across pages:
- Some use React Query hooks (recommended)
- Some use local `useState + useEffect` with direct Supabase calls

This causes:
- Inconsistent caching behavior
- Duplicated loading/error handling logic
- Different stale times and retry policies

**Examples of Inconsistency:**

| File | Current Approach | Recommended |
|------|------------------|-------------|
| `src/pages/TournamentLanding.tsx` | Local useState + useEffect | React Query hook |
| `src/components/tournament/TournamentSidebar.tsx` | Local useState + useEffect | React Query hook |
| `src/components/admin/Dashboard.tsx` | Local useState + useEffect | React Query hook |

**Recommended Action:**
1. Create missing React Query hooks for common data patterns
2. Gradually migrate pages to use these hooks
3. Prioritize high-traffic pages first

**New Hooks Needed:**
- `useTournamentContent(tournamentId)` - For tournament_content table
- `useTournamentRegistrations(tournamentId)` - For registration data
- `useDashboardStats()` - For admin dashboard metrics

**Effort:** ~6-8 hours (incremental)

**Files Affected:**
- Create new hooks in `src/hooks/`
- Refactor individual pages (can be done incrementally)

---

### 4. Regenerate Supabase Types

**Priority:** P2 - Medium

**Problem:**
The `src/types/database.ts` file contains "temporary" type definitions that supplement the auto-generated `src/integrations/supabase/types.ts`. This suggests schema drift or delayed type regeneration.

**Current State:**
- `src/integrations/supabase/types.ts` - 4,469 lines (auto-generated)
- `src/types/database.ts` - 334 lines (manual additions)

**Manual Types Include:**
- `DebateFormat`, `TournamentEvent`, `Round`, `Pairing`
- `WeeklyAvailability`, `JudgeProfile`, `BallotTemplate`
- `ScheduleProposal`, `PairingJudgeAssignment`, `JudgeRequest`

**Recommended Action:**
1. Run `supabase gen types typescript` to regenerate types
2. Compare generated output with `database.ts`
3. Remove any types that are now covered by generated file
4. Keep only truly supplementary types (computed fields, etc.)
5. Add TODO comments to remaining manual types

**Effort:** ~1-2 hours

**Files Affected:**
- `src/integrations/supabase/types.ts` (regenerate)
- `src/types/database.ts` (cleanup)

---

### 5. Consolidate Admin Notification Components

**Priority:** P3 - Low

**Problem:**
Multiple notification-related components with overlapping purposes:
- `src/components/UnifiedNotificationDropdown.tsx`
- `src/components/UnifiedNotifications.tsx`
- `src/components/UserNotifications.tsx`
- `src/components/admin/NotificationsDropdown.tsx`

**Recommended Action:**
1. Audit which components are actually used
2. Consolidate into a single notification dropdown component
3. Remove unused components

**Effort:** ~2-3 hours

---

### 6. Clean Up Legacy Re-exports

**Priority:** P3 - Low

**Problem:**
`src/hooks/useAuth.tsx` is just a re-export:
```typescript
export { OptimizedAuthProvider as AuthProvider, useOptimizedAuth as useAuth } from './useOptimizedAuth';
```

This indirection adds confusion without providing value.

**Recommended Action:**
1. Find all imports of `useAuth`
2. Replace with direct imports from `useOptimizedAuth`
3. Delete `useAuth.tsx`

**Effort:** ~30 minutes

---

## PayPal Integration Roadmap (Appendix)

Per the plan, here's where PayPal integration would fit:

### Backend (Supabase Edge Functions)

Create new edge functions in `supabase/functions/`:
- `create-paypal-order` - Initialize PayPal order
- `capture-paypal-payment` - Complete payment after approval
- `paypal-webhook` - Handle PayPal IPN/webhooks

### Frontend Components

- Extend `src/components/payment/PayPalCheckout.tsx` (already exists)
- Update `src/components/PaymentButtons.tsx` with PayPal option
- Add PayPal configuration in `src/components/admin/PaymentManager.tsx`

### Database

Existing tables should work:
- `payment_transactions` - Store PayPal transaction IDs
- `tournament_registrations` - Link payments to registrations

### Flow

```
User → PayPalCheckout → create-paypal-order → PayPal
                                                  ↓
User ← Redirect ← capture-paypal-payment ← PayPal approval
```

---

## Summary Table

| # | Item | Priority | Effort | Dependencies |
|---|------|----------|--------|--------------|
| 1 | Unify Notification System | P1 | 2h | None |
| 2 | Unify Tournament Chat | P1 | 3-4h | None |
| 3 | Normalize Data Fetching | P2 | 6-8h | None (incremental) |
| 4 | Regenerate Supabase Types | P2 | 1-2h | Supabase CLI access |
| 5 | Consolidate Notification Components | P3 | 2-3h | After #1 |
| 6 | Clean Up Legacy Re-exports | P3 | 30m | None |

---

## Implementation Notes

- Items can be tackled independently (no blocking dependencies)
- P1 items provide immediate developer experience improvement
- P2 items improve long-term maintainability
- All changes should follow conventions documented in `conventions.md`
- Each refactor should include updating any affected tests

