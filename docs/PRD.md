# Ziggy Online Debate Platform - Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** January 2026  
**Platform:** Web Application (React + TypeScript + Supabase)

---

## 1. Executive Summary

### 1.1 Product Overview

Ziggy Online Debate is a comprehensive web-based platform for hosting, managing, and participating in online debate tournaments. Founded in 2011, the platform supports multiple debate formats including Team Policy, Lincoln-Douglas, Parliamentary, and Moot Court.

### 1.2 Target Users

| User Type | Description |
|-----------|-------------|
| **Debaters** | Students competing in online debate tournaments |
| **Judges** | Qualified individuals who evaluate debates and submit ballots |
| **Tournament Admins** | Organizers who create and manage tournament operations |
| **Observers/Spectators** | Users who watch debates without participating |
| **Sponsors** | Organizations providing financial support or prizes |
| **Club Partners** | Debate clubs with group registration benefits |

### 1.3 Core Value Propositions

1. **Affordable Access** - $25-35 per debater for 8-10 rounds (vs. $40-55 per tournament elsewhere)
2. **Flexible Scheduling** - Debaters choose when to compete during scheduled weeks
3. **Global Competition** - Worldwide participation expands competitive experience
4. **Complete Platform** - Registration, pairing, judging, and results in one system
5. **Self-Service Hosting** - Tournament organizers manage all aspects independently

---

## 2. Feature Inventory

### 2.1 Public-Facing Pages

| Page | Path | Status | Description |
|------|------|--------|-------------|
| Homepage | `/` | Complete | Hero, features showcase, tournament calendar |
| Tournaments | `/tournaments` | Complete | Tournament directory with filtering |
| Tournament Landing | `/tournaments/:id` | Complete | Individual tournament details & registration |
| About | `/about` | Complete | Platform history, team, features |
| Contact | `/contact` | Complete | Contact form with multiple channels |
| FAQ | `/faq` | Complete | Searchable FAQ accordion |
| Getting Started | `/getting-started` | Complete | Step-by-step guides for debaters/judges |
| Learn About Debate | `/learn-about-debate` | Complete | Debate format explanations |
| Rules | `/rules` | Complete | Official tournament rules with TOC |
| Blog | `/blog` | Complete | Dynamic blog with categories |
| Testimonials | `/testimonials` | Complete | User success stories |
| Host Tournament | `/host-tournament` | Complete | Self-service hosting info |
| Club Partners | `/club-partners` | Complete | Partnership program details |
| Sponsors | `/sponsors` | Complete | Sponsor directory |
| Privacy | `/privacy` | Complete | Privacy policy |
| Terms | `/terms` | Complete | Terms of service |

### 2.2 Authenticated User Pages

| Page | Path | Status | Description |
|------|------|--------|-------------|
| Login | `/login` | Complete | Email/password authentication |
| Sign Up | `/signup` | Complete | New user registration |
| My Dashboard | `/dashboard` | Complete | Personalized user dashboard |
| User Account | `/account` | Complete | Profile, security, judge settings |
| My Tournaments | `/my-tournaments` | Complete | User's registered tournaments |
| Tournament Rounds | `/tournaments/:id/rounds` | Complete | Round/pairing viewer |
| Tournament My Match | `/tournaments/:id/my-match` | Complete | Match details, chat, scheduling |
| Tournament Postings | `/tournaments/:id/postings` | Complete | Pairing postings for participants |
| Tournament Live | `/tournaments/:id/live` | Complete | Live tournament interface |
| Tournament Dashboard | `/tournaments/:id/dashboard` | Complete | Admin tournament control |
| Judge Dashboard | `/judge` | Complete | Judge assignments, availability, stats |
| Pairing Detail | `/pairings/:id` | Complete | Individual pairing with chat |

### 2.3 Admin Features

| Component | Status | Description |
|-----------|--------|-------------|
| Tournament Manager | Complete | CRUD operations for tournaments |
| Tabulation Dashboard | Complete | Central tabulation control |
| Pairing Generator | Complete | Automatic pairing with power-matching |
| Judge Auto-Assignment | Complete | Hungarian algorithm optimization |
| Standings View | Complete | Real-time standings calculation |
| Spreadsheet View | Complete | Tabular data editing |
| Break Manager | Complete | Elimination round management |
| Brackets Manager | Complete | Visual bracket display |
| Results Manager | Complete | Result entry and publishing |
| Email Manager | Complete | Template-based communications |
| Blog Manager | Complete | Content management system |
| Payment Manager | Complete | Registration fee tracking |
| Sponsor Manager | Complete | Sponsor relationships |
| Observer Manager | Complete | Spectator access control |

### 2.4 Tournament Lifecycle Features

```
Planning → Registration Open → Registration Closed → Active → Completed
    ↓           ↓                    ↓                ↓          ↓
  Setup     Collect Fees        Generate Pairs    Run Rounds   Publish Results
```

---

## 3. User Roles & Permissions

### 3.1 Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| `user` | Basic authenticated user | View tournaments, register |
| `participant` | Registered tournament competitor | View pairings, chat, match details |
| `judge` | Qualified judge with profile | Judge assignments, ballot entry |
| `observer` | Approved spectator | Watch debates (per-tournament) |
| `admin` | Tournament administrator | Full tournament management |
| `global_admin` | Platform administrator | All tournaments + system settings |

### 3.2 Permission Matrix

| Action | User | Participant | Judge | Observer | Admin |
|--------|------|-------------|-------|----------|-------|
| View public pages | ✓ | ✓ | ✓ | ✓ | ✓ |
| Register for tournaments | ✓ | ✓ | ✓ | ✓ | ✓ |
| View own pairings | - | ✓ | - | - | ✓ |
| Access pairing chat | - | ✓ | ✓ | - | ✓ |
| Submit ballots | - | - | ✓ | - | ✓ |
| View all pairings | - | - | - | ✓ | ✓ |
| Manage tournament | - | - | - | - | ✓ |
| Generate pairings | - | - | - | - | ✓ |
| Assign judges | - | - | - | - | ✓ |
| Publish results | - | - | - | - | ✓ |

---

## 4. Design System Reference

### 4.1 Color Palette

```css
/* Primary Colors */
--primary: oklch(0.55 0.16 17.5);        /* Deep red - brand color */
--primary-foreground: oklch(0.98 0 0);    /* White text on primary */

/* Background Colors */
--background: oklch(0.12 0.02 255);       /* Near-black base */
--card: oklch(0.15 0.02 255);             /* Elevated card background */
--muted: oklch(0.25 0.02 255);            /* Muted elements */

/* Accent Colors */
--accent: oklch(0.25 0.04 255);           /* Highlight areas */
--destructive: oklch(0.55 0.18 25);       /* Error/delete actions */
--secondary: oklch(0.30 0.04 255);        /* Secondary elements */

/* Text Colors */
--foreground: oklch(0.95 0.01 255);       /* Primary text */
--muted-foreground: oklch(0.65 0.02 255); /* Secondary text */
```

### 4.2 Typography

| Usage | Font Family | Weight | Size |
|-------|-------------|--------|------|
| Headings | `font-primary` (Inter var) | 600-700 | 1.5-3.5rem |
| Body text | `font-secondary` (Inter var) | 400-500 | 0.875-1rem |
| Code/Mono | `font-mono` (system) | 400 | 0.875rem |

### 4.3 Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 0.25rem | Tight spacing |
| `space-2` | 0.5rem | Compact spacing |
| `space-4` | 1rem | Standard spacing |
| `space-6` | 1.5rem | Section padding |
| `space-8` | 2rem | Large gaps |

### 4.4 Component Variants

**Button Variants:**
- `default` - Primary action (red background)
- `outline` - Secondary action (bordered)
- `ghost` - Tertiary action (no background)
- `destructive` - Dangerous action (red)
- `hero` - CTA buttons (gradient + glow)
- `tournament` - Tournament-specific styling

**Card Variants:**
- Standard card with `border-border`, `shadow-card`
- Elevated card with `border-primary/30`, `shadow-elegant`
- Tournament card with `shadow-tournament`, hover effects

### 4.5 Animation Tokens

```css
/* Transitions */
--transition-smooth: all 0.2s ease;
--transition-spring: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Animations */
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
.hover-scale { transform: scale(1.02); }
```

---

## 5. User Flows

### 5.1 Tournament Registration Flow

```
1. Browse Tournaments → 2. Select Tournament → 3. View Details
                                                      ↓
4. Click Register → 5. Login/Signup (if needed) → 6. Complete Profile
                                                      ↓
7. Fill Registration Form → 8. Apply Promo Code → 9. Payment
                                                      ↓
10. Confirmation Email → 11. Added to "My Tournaments"
```

### 5.2 Debate Round Flow (Participant)

```
1. Pairing Released → 2. View Opponent Details → 3. Post Availability
                                                      ↓
4. Negotiate Schedule → 5. Request Judge → 6. Set Room Link
                                                      ↓
7. Receive Reminder → 8. Join Room → 9. Complete Debate
                                                      ↓
10. Await Ballot → 11. View Results
```

### 5.3 Judge Assignment Flow

```
1. Create Judge Profile → 2. Set Availability → 3. Receive Request
                                                      ↓
4. Accept/Decline → 5. Join Scheduled Room → 6. Judge Debate
                                                      ↓
7. Fill Ballot → 8. Submit Results → 9. View Stats
```

### 5.4 Admin Tournament Management Flow

```
1. Create Tournament → 2. Configure Settings → 3. Open Registration
                                                      ↓
4. Monitor Registrations → 5. Close Registration → 6. Generate Pairings
                                                      ↓
7. Auto-Assign Judges → 8. Release Pairings → 9. Monitor Rounds
                                                      ↓
10. Enter Results → 11. Calculate Standings → 12. Publish Results
```

---

## 6. Current Implementation Status

### 6.1 Feature Completeness

| Category | Complete | Partial | Planned |
|----------|----------|---------|---------|
| Authentication | ✓ | - | - |
| Tournament CRUD | ✓ | - | - |
| Registration System | ✓ | - | - |
| Pairing Generation | ✓ | - | - |
| Judge Management | ✓ | - | - |
| Ballot Entry | ✓ | - | - |
| Real-time Updates | ✓ | - | - |
| Email Notifications | ✓ | - | - |
| Payment Integration | - | ✓ | - |
| Multi-event Support | ✓ | - | - |
| Internationalization | - | ✓ | - |
| Mobile App | - | - | Planned |

### 6.2 Known Limitations

1. **Payment Processing** - Stripe integration pending; currently manual tracking
2. **Mobile Experience** - Responsive but not optimized for small screens
3. **Offline Support** - No offline capability; requires constant connection
4. **i18n Coverage** - 70 language files but incomplete translations

### 6.3 Technical Debt Items

| Item | Priority | Description |
|------|----------|-------------|
| Type Safety | High | Some `any` types in Supabase queries |
| Component Size | Medium | TournamentManager.tsx exceeds 700 lines |
| Test Coverage | Medium | Only smoke tests present |
| Error Boundaries | Medium | Missing in some route segments |
| Bundle Size | Low | Consider code splitting for admin routes |

---

## 7. Accessibility & Standards

### 7.1 Current Implementation

| Feature | Status | Notes |
|---------|--------|-------|
| Semantic HTML | Partial | Most pages use proper landmarks |
| ARIA labels | Partial | Present on interactive elements |
| Keyboard navigation | Partial | Works for most components |
| Focus management | Partial | Modals trap focus properly |
| Color contrast | Pass | Meets WCAG AA in dark theme |
| Screen reader | Partial | Basic support, needs testing |

### 7.2 Touch Targets

- Minimum touch target: 44px × 44px (`min-h-[44px]`)
- Button sizes properly configured in variants
- Form inputs have adequate sizing

### 7.3 Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## 8. Browser & Device Support

### 8.1 Supported Browsers

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome | 90+ | Full Support |
| Firefox | 88+ | Full Support |
| Safari | 14+ | Full Support |
| Edge | 90+ | Full Support |
| Mobile Safari | iOS 14+ | Responsive |
| Chrome Android | 90+ | Responsive |

### 8.2 Responsive Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### 8.3 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Time to Interactive | < 3.5s | ~2.8s |
| Cumulative Layout Shift | < 0.1 | ~0.05 |
| Largest Contentful Paint | < 2.5s | ~2.0s |

---

## 9. API & Data Architecture

### 9.1 Backend: Supabase

- **Database:** PostgreSQL with Row Level Security (RLS)
- **Authentication:** Supabase Auth (email/password)
- **Real-time:** Supabase Realtime subscriptions
- **Storage:** Supabase Storage for uploads
- **Edge Functions:** Deno-based serverless functions

### 9.2 Key Database Tables

| Table | Purpose |
|-------|---------|
| `tournaments` | Tournament configuration |
| `tournament_registrations` | Participant registrations |
| `rounds` | Tournament round definitions |
| `pairings` | Match pairings |
| `ballots` | Judge ballot submissions |
| `judge_profiles` | Judge information |
| `profiles` | User profile data |
| `blog_posts` | CMS content |
| `sponsor_profiles` | Sponsor information |

### 9.3 Real-time Channels

- `tournament-{id}` - Tournament updates
- `pairing-{id}` - Pairing changes
- `chat-{pairing_id}` - Match chat messages

---

## 10. Security Considerations

### 10.1 Authentication

- Email/password with Supabase Auth
- Email verification required
- Password minimum 6 characters
- Session management via secure cookies

### 10.2 Authorization

- Row Level Security (RLS) on all tables
- Role-based access control
- Tournament-scoped admin permissions

### 10.3 Data Protection

- HTTPS enforced in production
- Environment variables for secrets
- No PII in client-side logging

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **AFF** | Affirmative side in a debate |
| **NEG** | Negative side in a debate |
| **Ballot** | Judge's scoring sheet and decision |
| **Pairing** | Match between two teams/individuals |
| **Power-matching** | Pairing based on win-loss records |
| **Break** | Advancement to elimination rounds |
| **Bye** | Round without an opponent |
| **Speaker Points** | Individual presentation score |

---

*This PRD is a living document and should be updated as features evolve.*
