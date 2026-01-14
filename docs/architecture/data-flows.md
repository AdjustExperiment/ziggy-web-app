# Ziggy Web App - Data Flows

This document describes the key data flows through the application: how data moves from the backend to the UI, how auth and permissions work, and how realtime updates propagate.

---

## 1. Authentication & Authorization Flow

### Overview

Authentication is handled by Supabase Auth, with an optimized provider that minimizes unnecessary queries for anonymous users and computes admin scope (global vs scoped admin access).

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Browser
    participant main.tsx
    participant OptimizedAuthProvider
    participant SupabaseAuth as supabase.auth
    participant SupabaseDB as Supabase DB

    Browser->>main.tsx: Load app
    main.tsx->>OptimizedAuthProvider: Mount provider
    
    Note over OptimizedAuthProvider: Check localStorage for stored session token
    
    alt Has stored session
        OptimizedAuthProvider->>SupabaseAuth: getSession()
        SupabaseAuth-->>OptimizedAuthProvider: session/user
        
        OptimizedAuthProvider->>SupabaseDB: SELECT * FROM profiles WHERE user_id = ?
        SupabaseDB-->>OptimizedAuthProvider: profile data
        
        OptimizedAuthProvider->>SupabaseDB: SELECT role FROM user_roles WHERE user_id = ?
        SupabaseDB-->>OptimizedAuthProvider: role
        
        OptimizedAuthProvider->>SupabaseDB: SELECT * FROM tournament_admins WHERE user_id = ?
        SupabaseDB-->>OptimizedAuthProvider: tournament admin assignments
        
        OptimizedAuthProvider->>SupabaseDB: SELECT * FROM organization_admins WHERE user_id = ?
        SupabaseDB-->>OptimizedAuthProvider: org admin assignments
        
        Note over OptimizedAuthProvider: Compute accessibleTournamentIds
    else No stored session
        Note over OptimizedAuthProvider: Skip all queries, set loading=false immediately
    end
    
    OptimizedAuthProvider-->>Browser: Context ready (user, profile, adminScope)
```

### Key Data Structures

```typescript
// Profile returned from auth context
interface Profile {
  id: string;
  user_id: string;
  role: 'user' | 'admin' | 'judge' | 'observer' | 'participant';
  first_name?: string;
  last_name?: string;
  // ...
}

// Admin scope computed by auth provider
interface AdminScope {
  tournamentAdmins: TournamentAdminAssignment[];  // Direct tournament access
  organizationAdmins: OrganizationAdminAssignment[];  // Org-level access
  accessibleTournamentIds: string[];  // Combined list of all accessible tournaments
}

// Context exposed to consumers
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;  // Global admin (role === 'admin')
  adminScope: AdminScope;
  isTournamentAdmin: (tournamentId: string) => boolean;
  isOrgAdmin: (orgId: string) => boolean;
  canAccessTournament: (tournamentId: string) => boolean;
  hasAnyAdminAccess: boolean;
  signUp, signIn, signOut, refreshUser
}
```

### Route Protection

Routes are protected using the `ProtectedRoute` component:

```mermaid
flowchart TD
    Route[Route Request] --> PR[ProtectedRoute]
    PR --> Loading{loading?}
    Loading -->|Yes| Spinner[Show Loading Spinner]
    Loading -->|No| HasUser{user exists?}
    HasUser -->|No| Redirect[Redirect to /login]
    HasUser -->|Yes| RequireAdmin{requireAdmin?}
    RequireAdmin -->|No| Render[Render Children]
    RequireAdmin -->|Yes| IsAdmin{profile.role === admin?}
    IsAdmin -->|Yes| Render
    IsAdmin -->|No| RedirectHome[Redirect to /]
```

---

## 2. Data Fetching with React Query

### Standard Query Flow

Most data fetching uses React Query for caching and state management:

```mermaid
flowchart TD
    Component[Component mounts] --> UseQuery[useQuery hook]
    UseQuery --> Cache{Data in cache?}
    Cache -->|Yes, fresh| Return[Return cached data]
    Cache -->|Stale or missing| Fetch[Fetch from Supabase]
    Fetch --> Success{Success?}
    Success -->|Yes| UpdateCache[Update cache]
    UpdateCache --> Return
    Success -->|No| Retry{Retry count < 3?}
    Retry -->|Yes| Fetch
    Retry -->|No| Error[Return error state]
```

### Query Configuration

Default settings from `QueryProvider.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes (garbage collection)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 3;
      },
    },
  },
});
```

### Example: Tournament Data Hook

```mermaid
sequenceDiagram
    participant Component
    participant useTournament
    participant QueryClient
    participant Supabase

    Component->>useTournament: useTournament(tournamentId)
    useTournament->>QueryClient: Check cache ['tournament', tournamentId]
    
    alt Cache hit (fresh)
        QueryClient-->>useTournament: Cached tournament
        useTournament-->>Component: { tournament, isLoading: false }
    else Cache miss or stale
        useTournament->>Supabase: SELECT * FROM tournaments WHERE id = ?
        Supabase-->>useTournament: Tournament data
        useTournament->>QueryClient: Update cache
        useTournament-->>Component: { tournament, isLoading: false }
    end
```

---

## 3. Tournament Participant Flow

### Browse to Registration Journey

```mermaid
flowchart TD
    subgraph Public
        Browse[/tournaments] --> List[Tournament List]
        List --> Landing[/tournaments/:id - Landing Page]
    end
    
    subgraph Registration
        Landing --> Register[/tournaments/:id/register]
        Register --> Form[Registration Form]
        Form --> Payment{Payment Required?}
        Payment -->|Yes| PayFlow[Payment Flow]
        Payment -->|No| Confirm[Confirm Registration]
        PayFlow --> Confirm
    end
    
    subgraph Participant_Dashboard[Participant Dashboard]
        Confirm --> MyTournaments[/my-tournaments]
        MyTournaments --> TournamentDash[/tournaments/:id/dashboard]
        TournamentDash --> MyMatch[/tournaments/:id/my-match]
        TournamentDash --> Postings[/tournaments/:id/postings]
        TournamentDash --> Rounds[/tournaments/:id/rounds]
    end
```

### Registration Data Flow

```mermaid
sequenceDiagram
    participant User
    participant RegPage as TournamentRegistration
    participant Cart as useRegistrationCart
    participant Supabase

    User->>RegPage: Fill registration form
    RegPage->>Cart: addToCart(registration)
    
    User->>RegPage: Submit registration
    RegPage->>Supabase: INSERT INTO tournament_registrations
    Supabase-->>RegPage: registration record
    
    alt Has payment
        RegPage->>Supabase: Create payment_transaction
        RegPage->>User: Redirect to payment
    else No payment
        RegPage->>User: Redirect to confirmation
    end
```

---

## 4. Realtime Updates

### Tournament Realtime Subscription

The `useTournamentRealtime` hook subscribes to multiple database tables:

```mermaid
flowchart LR
    subgraph Supabase
        DB[(Database)]
        RT[Realtime Server]
        DB -->|Changes| RT
    end
    
    subgraph Client
        Hook[useTournamentRealtime]
        RT -->|rounds table| Hook
        RT -->|pairings table| Hook
        RT -->|tournament_content table| Hook
        Hook --> Callbacks[onRoundUpdate / onPairingUpdate / onAnnouncementUpdate]
        Callbacks --> UIUpdate[UI State Update]
    end
```

### Subscription Lifecycle

```mermaid
sequenceDiagram
    participant Component
    participant Hook as useTournamentRealtime
    participant Channel as Supabase Channel
    participant Server as Supabase Realtime

    Component->>Hook: Mount with tournamentId
    Hook->>Channel: Create channel
    Channel->>Server: Subscribe to tables
    Server-->>Channel: Subscription confirmed
    
    loop On database change
        Server-->>Channel: Postgres change event
        Channel-->>Hook: Payload (new/old data)
        Hook->>Component: Callback invocation
        Component->>Component: Update state / invalidate queries
    end
    
    Component->>Hook: Unmount
    Hook->>Channel: removeChannel()
```

### Pairing-Specific Realtime

For round-specific pairing updates, `usePairingRealtime` provides a focused subscription:

```typescript
// Subscribes to pairings for a specific round
usePairingRealtime({
  roundId: 'abc-123',
  onUpdate: (payload) => { /* handle pairing update */ },
  onInsert: (payload) => { /* handle new pairing */ },
  onDelete: (payload) => { /* handle pairing removal */ },
});
```

---

## 5. Notifications System

### Unified Notification Architecture

```mermaid
flowchart TD
    subgraph Database
        AdminNotifs[(admin_notifications)]
        JudgeNotifs[(judge_notifications)]
        CompNotifs[(competitor_notifications)]
    end
    
    subgraph Hook[useUnifiedNotifications]
        Fetch[Fetch all sources]
        Merge[Merge & sort by priority/time]
        Subscribe[Realtime subscriptions]
    end
    
    AdminNotifs --> Fetch
    JudgeNotifs --> Fetch
    CompNotifs --> Fetch
    
    Fetch --> Merge
    Merge --> State[notifications state]
    
    Subscribe --> AdminNotifs
    Subscribe --> JudgeNotifs
    Subscribe --> CompNotifs
    
    State --> UI[UnifiedNotificationDropdown]
```

### Notification Sources

| Source | Table | Audience | Example |
|--------|-------|----------|---------|
| Admin | `admin_notifications` | Global admins | System alerts, financial milestones |
| Judge | `judge_notifications` | Judges | Assignment notifications, ballot reminders |
| Competitor | `competitor_notifications` | Registered participants | Pairing releases, schedule changes |

### Data Structure

```typescript
interface UnifiedNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  source: 'admin' | 'judge' | 'competitor';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  action_url?: string;
  action_text?: string;
  pairing_id?: string;
  tournament_id?: string;
}
```

---

## 6. Admin Access & Scope

### Permission Hierarchy

```mermaid
flowchart TD
    User[User] --> Role{profile.role}
    Role -->|admin| GlobalAdmin[Global Admin]
    Role -->|other| ScopedCheck{Check admin tables}
    
    ScopedCheck --> OrgAdmin{organization_admins?}
    OrgAdmin -->|Yes| OrgScope[Organization Admin]
    OrgAdmin -->|No| TournAdmin{tournament_admins?}
    TournAdmin -->|Yes| TournScope[Tournament Admin]
    TournAdmin -->|No| RegularUser[Regular User]
    
    GlobalAdmin --> AllAccess[Access to everything]
    OrgScope --> OrgTournaments[Access to org's tournaments]
    TournScope --> SpecificTournaments[Access to assigned tournaments]
```

### Admin Route Structure

```mermaid
flowchart TD
    subgraph AdminDashboard[/admin/*]
        Index[/admin - Dashboard]
        
        subgraph AllAdmins[All Admin Types]
            Tournaments[/admin/tournaments]
            Payments[/admin/payments]
            PaymentLinks[/admin/payment-links]
            Applications[/admin/applications]
            Judges[/admin/judges]
            Emails[/admin/emails]
            Notifications[/admin/notifications]
        end
        
        subgraph GlobalOnly[Global Admin Only]
            Users[/admin/users]
            Roles[/admin/roles]
            Promos[/admin/promos]
            Staff[/admin/staff]
            Blog[/admin/blog]
            Site[/admin/site]
            Footer[/admin/footer]
            Sponsors[/admin/sponsors]
            Security[/admin/security]
            Results[/admin/results]
            Orgs[/admin/organizations]
            Performance[/admin/performance]
            Heatmap[/admin/heatmap]
        end
    end
```

---

## 7. Telemetry Flow

### Web Vitals Collection

```mermaid
sequenceDiagram
    participant Browser
    participant VitalsCollector
    participant useWebVitals
    participant EdgeFunction as Supabase Edge Function

    Browser->>VitalsCollector: Mount (inside Router)
    VitalsCollector->>useWebVitals: Initialize
    
    useWebVitals->>Browser: Register vitals observers
    Note over Browser: Collect FCP, LCP, CLS, TTFB, FID, INP
    
    Browser-->>useWebVitals: Metric events
    useWebVitals->>useWebVitals: Accumulate metrics
    
    alt After 5 seconds OR page hide
        useWebVitals->>EdgeFunction: collect-performance-metrics
        Note right of EdgeFunction: Stores in DB
    end
```

### Interaction Logging

```mermaid
sequenceDiagram
    participant User
    participant useInteractionLogging
    participant Supabase

    User->>useInteractionLogging: Navigate to page
    useInteractionLogging->>useInteractionLogging: Record page load time
    
    User->>useInteractionLogging: Scroll page
    useInteractionLogging->>useInteractionLogging: Track max scroll depth
    
    alt After 30 seconds OR page visibility change
        useInteractionLogging->>Supabase: INSERT INTO user_interaction_logs
        Note right of Supabase: route, scroll_depth, load_time_ms, device_type
    end
```

---

## 8. Tournament Chat Flow

### Current Implementation (Dual)

There are currently two chat implementations:

```mermaid
flowchart TD
    subgraph TournamentSidebar[TournamentSidebar.tsx]
        RT1[Realtime Subscription]
        RT1 --> Messages1[Chat Messages State]
    end
    
    subgraph TournamentChat[TournamentChat.tsx]
        Poll[10-second Polling]
        Poll --> Messages2[Chat Messages State]
    end
    
    Both --> DB[(pairing_chat_messages)]
```

**Note:** This duplication is identified as a technical debt item. See conventions document for recommended approach.

### Message Storage

Tournament chat uses the `pairing_chat_messages` table with a `message_type` discriminator:

```typescript
// Tournament-wide chat message
{
  message: string,
  sender_id: string,
  message_type: 'tournament_chat',
  metadata: { tournament_id: string }
}

// Pairing-specific chat message
{
  message: string,
  sender_id: string,
  message_type: 'pairing_chat',
  pairing_id: string
}
```

---

## Summary: Data Sources & Caching Strategy

| Data Type | Source | Cache Strategy | Realtime? |
|-----------|--------|----------------|-----------|
| Auth/Profile | Supabase Auth + DB | 10 min stale time | No (refresh on demand) |
| Tournament list | `tournaments` table | 5 min stale time | No |
| Single tournament | `tournaments` table | 5 min stale time | Optional |
| Rounds | `rounds` table | 2 min stale time | Yes |
| Pairings | `pairings` table | 1 min stale time | Yes |
| Notifications | Multiple tables | 2 min stale time | Yes |
| Chat messages | `pairing_chat_messages` | No cache (realtime) | Yes |
| Ballots | `ballots` table | No standard cache | No |

