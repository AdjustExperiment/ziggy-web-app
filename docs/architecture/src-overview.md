# Ziggy Web App - Source Directory Overview

This document provides a comprehensive map of the `src/` directory, explaining what each folder owns and identifying the key files that new contributors should read first.

## Directory Structure at a Glance

```
src/
├── main.tsx              # App bootstrap (providers, rendering)
├── App.tsx               # Routing shell + global UI
├── index.css             # Global styles (Tailwind base)
├── vite-env.d.ts         # Vite type declarations
│
├── components/           # Reusable UI components
│   ├── ui/               # shadcn/radix primitives (Button, Card, Dialog, etc.)
│   ├── admin/            # Admin dashboard components (81 files)
│   ├── tournament/       # Tournament-specific components
│   ├── cart/             # Registration cart components
│   ├── auth/             # Auth-related components
│   ├── payment/          # Payment UI components
│   └── sponsor/          # Sponsor-related components
│
├── pages/                # Route-level page components (45 files)
├── hooks/                # Custom React hooks (22 files)
├── providers/            # React context providers
├── integrations/         # External service clients (Supabase)
├── lib/                  # Domain logic & utilities
├── types/                # TypeScript type definitions
├── utils/                # General utility functions
├── i18n/                 # Internationalization
├── data/                 # Static data files
└── assets/               # Static assets (images, SVGs)
```

---

## Directory Ownership

### `src/main.tsx` - Application Bootstrap

**Owner:** Core infrastructure

The app's entry point. Responsible for:
- Initializing i18n before anything else
- Setting up the provider hierarchy (QueryProvider → AuthProvider → ThemeProvider)
- Rendering the root App component

```tsx
// Provider hierarchy (outer to inner):
// 1. QueryProvider (React Query)
// 2. OptimizedAuthProvider (auth state + admin scope)
// 3. ThemeProvider (light/dark mode)
// 4. App (routing)
```

### `src/App.tsx` - Routing Shell

**Owner:** Navigation + global UI

Responsibilities:
- Defines all application routes using React Router
- Lazy-loads page components for code splitting
- Mounts global UI: Navbar, Footer, Toaster, VitalsCollector
- Wraps protected routes with `ProtectedRoute`

### `src/components/` - UI Components

**Owner:** Presentation layer

| Subdirectory | Purpose | Key Files |
|--------------|---------|-----------|
| `ui/` | shadcn/radix design system primitives | `button.tsx`, `card.tsx`, `dialog.tsx`, `sidebar.tsx` |
| `admin/` | Admin dashboard modules | `AdminLayout.tsx`, `AppSidebar.tsx`, `TournamentManager.tsx` |
| `tournament/` | Tournament participant views | `TournamentSidebar.tsx`, `TournamentChat.tsx`, `RoundPairingsTable.tsx` |
| `cart/` | Registration cart | `AddToCartForm.tsx`, `CartSummary.tsx` |
| `auth/` | Authentication UI | `ProfileSetup.tsx` |
| `payment/` | Payment flows | `PayPalCheckout.tsx` |
| `sponsor/` | Sponsor features | `SponsorBlogManager.tsx` |

**Important root-level components:**
- `Navbar.tsx` - Global navigation bar
- `Footer.tsx` - Global footer
- `ProtectedRoute.tsx` - Auth gating wrapper
- `VitalsCollector.tsx` - Performance telemetry
- `UnifiedNotificationDropdown.tsx` - Notification center
- `EnhancedMyMatch.tsx` - Competitor match view
- `LiveDashboard.tsx` - Live tournament dashboard

### `src/components/admin/` - Admin Dashboard (81 files)

**Owner:** Administrative functionality

Organized into management modules:

| Category | Components |
|----------|------------|
| **Layout** | `AdminLayout.tsx`, `AppSidebar.tsx`, `AdminSessionTimeout.tsx` |
| **Tournament Mgmt** | `TournamentManager.tsx`, `TournamentEventsManager.tsx`, `TournamentSettingsManager.tsx` |
| **Tabulation** | `tabulation/TabulationDashboard.tsx`, `PairingsManager.tsx`, `RoundsManager.tsx` |
| **User Mgmt** | `UserManager.tsx`, `RoleAccessManager.tsx`, `JudgeApplicationManager.tsx` |
| **Content** | `BlogManager.tsx`, `WebsiteBuilder.tsx`, `FooterContentManager.tsx` |
| **Financial** | `PaymentManager.tsx`, `PaymentLinksManager.tsx`, `PromoCodesManager.tsx` |
| **Security** | `SecurityDashboard.tsx`, `security/AuditLogsViewer.tsx` |
| **Analytics** | `PerformanceDashboard.tsx`, `HeatmapDashboard.tsx` |

### `src/pages/` - Route Pages (45 files)

**Owner:** Page-level screens

| Category | Pages |
|----------|-------|
| **Public** | `Index.tsx`, `Tournaments.tsx`, `About.tsx`, `Contact.tsx`, `FAQ.tsx`, `Blog.tsx` |
| **Auth** | `Login.tsx`, `SignUpPage.tsx` |
| **User Dashboard** | `MyDashboard.tsx`, `MyTournaments.tsx`, `UserAccount.tsx` |
| **Tournament** | `TournamentLanding.tsx`, `TournamentRegistration.tsx`, `TournamentRounds.tsx`, `TournamentMyMatch.tsx`, `TournamentPostings.tsx`, `TournamentDashboard.tsx`, `TournamentLive.tsx` |
| **Judge** | `JudgeDashboard.tsx` |
| **Observer** | `ObserverDashboard.tsx` |
| **Sponsor** | `Sponsor.tsx`, `SponsorDashboard.tsx`, `SponsorApplication.tsx`, `Sponsors.tsx` |
| **Admin** | `AdminDashboard.tsx` (nested routes), `PrintPostings.tsx` |
| **Legal** | `Privacy.tsx`, `Terms.tsx`, `Rules.tsx` |

### `src/hooks/` - Custom Hooks (22 files)

**Owner:** State management + data fetching

| Hook | Purpose |
|------|---------|
| **Auth** | |
| `useOptimizedAuth.tsx` | Primary auth context provider + admin scope |
| `useAuth.tsx` | Re-exports useOptimizedAuth for compatibility |
| **Data Fetching** | |
| `useTournament.ts` | Single tournament data + caching |
| `useTournamentRounds.ts` | Tournament rounds + pairings |
| `useOptimizedData.tsx` | Results, profiles, security data |
| `useRegistrationCart.tsx` | Shopping cart state |
| `useTeam.tsx` | Team data management |
| **Realtime** | |
| `useTournamentRealtime.ts` | Tournament-wide realtime subscriptions |
| `usePairingRealtime.tsx` | Pairing-specific realtime |
| `useRealtimeNotifications.tsx` | Notification realtime |
| **Notifications** | |
| `useUnifiedNotifications.tsx` | Unified notification system (admin+judge+competitor) |
| `useNotifications.tsx` | Legacy admin-only notifications |
| `useCompetitorNotifications.tsx` | Competitor notifications |
| **Telemetry** | |
| `useWebVitals.ts` | Core Web Vitals collection |
| `useInteractionLogging.ts` | User interaction tracking |
| **UI** | |
| `useGlobalSearch.tsx` | Global search provider |
| `use-mobile.tsx` | Mobile detection |
| `use-toast.ts` | Toast notifications |

### `src/providers/` - Context Providers

**Owner:** Global state containers

- `QueryProvider.tsx` - React Query client configuration with default stale times and retry logic

### `src/integrations/supabase/` - Supabase Integration

**Owner:** Backend communication

| File | Purpose |
|------|---------|
| `client.ts` | Supabase client instance (auto-generated) |
| `types.ts` | Database types (auto-generated, ~4500 lines) |
| `pairings.ts` | Pairing-specific DB operations |

### `src/lib/` - Domain Logic

**Owner:** Business logic + algorithms

| File/Folder | Purpose |
|-------------|---------|
| `utils.ts` | General utilities (cn, classnames) |
| `formats.ts` | Debate format definitions |
| `timezones.ts` | Timezone utilities |
| `globeUtils.ts` | 3D globe visualization helpers |
| `legacyExcelFormat.ts` | Legacy Excel export |
| `legacyNameFormatter.ts` | Legacy name formatting |
| `pairings/swiss.ts` | Swiss pairing algorithm |
| `pairings/elimination.ts` | Elimination bracket algorithm |
| `tabulation/index.ts` | Tabulation exports |
| `tabulation/drawGenerator.ts` | Draw generation |
| `tabulation/breakGenerator.ts` | Break calculation |
| `tabulation/judgeAllocator.ts` | Judge allocation algorithm |
| `tabulation/munkres.ts` | Hungarian algorithm (optimal assignment) |

### `src/types/` - Type Definitions

**Owner:** TypeScript interfaces

| File | Purpose |
|------|---------|
| `database.ts` | Extended/temporary database types (supplements auto-generated types) |
| `website-builder.ts` | Website builder types |

### `src/utils/` - Utilities

**Owner:** Helper functions

| File | Purpose |
|------|---------|
| `adminActions.ts` | Admin action helpers |
| `pairingAlgorithms.ts` | Pairing algorithm utilities |

### `src/i18n/` - Internationalization

**Owner:** Multi-language support

- `index.ts` - i18next configuration + dynamic language loading
- `locales/` - Translation files for 10 languages (en, es, fr, ru, zh, hi, yo, am, sw, zu)

Each locale has 7 namespace files: `common.json`, `nav.json`, `home.json`, `tournament.json`, `judge.json`, `admin.json`, `about.json`

### `src/data/` - Static Data

**Owner:** Reference data

- `capitals.ts` - World capitals data (for globe visualization)

### `src/assets/` - Static Assets

**Owner:** Images and media

- `debate-logo.png/svg` - Branding
- `hero-debate.jpg` - Hero image

---

## Essential Files for New Contributors

Read these files first to understand the codebase:

### Tier 1: Core Architecture (read in order)

1. **`src/main.tsx`** - App entry point, provider hierarchy
2. **`src/App.tsx`** - All routes, global UI structure
3. **`src/hooks/useOptimizedAuth.tsx`** - Auth state, admin scope logic
4. **`src/providers/QueryProvider.tsx`** - Data fetching defaults
5. **`src/integrations/supabase/client.ts`** - Backend connection

### Tier 2: Key Features

6. **`src/components/ProtectedRoute.tsx`** - Route protection pattern
7. **`src/components/Navbar.tsx`** - Navigation structure
8. **`src/pages/AdminDashboard.tsx`** - Admin routing pattern
9. **`src/components/admin/AdminLayout.tsx`** - Admin shell
10. **`src/hooks/useTournamentRealtime.ts`** - Realtime subscription pattern

### Tier 3: Domain Logic

11. **`src/hooks/useTournament.ts`** - Data fetching pattern
12. **`src/hooks/useUnifiedNotifications.tsx`** - Notification system
13. **`src/lib/pairings/swiss.ts`** - Tournament algorithm example
14. **`src/components/admin/TournamentManager.tsx`** - Complex admin form

---

## Where to Make Common Changes

| Task | Location |
|------|----------|
| Add a new route | `src/App.tsx` (add Route + lazy import) |
| Add an admin page | `src/pages/AdminDashboard.tsx` + create component in `src/components/admin/` |
| Create a new hook | `src/hooks/` |
| Add a UI primitive | `src/components/ui/` |
| Add tournament feature | `src/components/tournament/` + optionally `src/pages/Tournament*.tsx` |
| Add database type | `src/types/database.ts` (temporary) or regenerate `src/integrations/supabase/types.ts` |
| Add translation | `src/i18n/locales/{lang}/*.json` |
| Add pairing algorithm | `src/lib/pairings/` |
| Add tabulation logic | `src/lib/tabulation/` |
| Modify global styles | `src/index.css` or `tailwind.config.ts` |

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Pages | PascalCase | `TournamentLanding.tsx` |
| Components | PascalCase | `UnifiedNotificationDropdown.tsx` |
| Hooks | camelCase with `use` prefix | `useTournamentRealtime.ts` |
| Utils | camelCase | `pairingAlgorithms.ts` |
| Types | camelCase | `database.ts` |
| i18n namespaces | lowercase | `tournament.json` |

