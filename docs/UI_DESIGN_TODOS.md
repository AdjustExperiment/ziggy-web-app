# UI Design To-Dos

**Last Updated:** January 2026  
**Focus:** UI/UX improvements for existing features and pages

---

## Priority Levels

- **P1 (Critical):** Blocking issues, broken functionality, inaccessible components
- **P2 (High):** Consistency issues, confusing UX patterns, mobile problems
- **P3 (Medium):** Polish, refinements, enhanced interactions
- **P4 (Low):** Nice-to-have improvements, visual enhancements

---

## P1: Critical UI Issues

### 1.1 Mobile Navigation Improvements
**Location:** `src/components/Navbar.tsx`  
**Issue:** Mobile menu sheet could benefit from better touch targets and clearer visual hierarchy  
**Acceptance Criteria:**
- [ ] Increase mobile menu item touch targets to 48px minimum
- [ ] Add visual separators between navigation sections
- [ ] Improve active state visibility on mobile
- [ ] Add swipe-to-close gesture for mobile menu

### 1.2 Form Validation Feedback
**Location:** Various registration and form pages  
**Issue:** Form validation errors not consistently visible; some forms lack inline validation  
**Acceptance Criteria:**
- [ ] Add real-time inline validation to all forms
- [ ] Ensure error messages have sufficient color contrast (red on dark)
- [ ] Add focus ring to invalid fields
- [ ] Scroll to first error on form submission

### 1.3 Loading State Consistency ✅ COMPLETED
**Location:** Multiple pages  
**Issue:** Loading states vary between pages (spinner, skeleton, blank)  
**Acceptance Criteria:**
- [x] Create unified `<PageLoader>` component with consistent skeleton
- [x] Apply to all data-fetching pages: Tournaments, Dashboard, etc.
- [x] Add loading shimmer animation matching design system
- [x] Prevent layout shift during loading transitions

**Implementation Notes:**
- Created `src/components/loading/` with:
  - `PageLoader.tsx` - Full-page and inline loading components
  - `skeletons.tsx` - Card, Table, Stats, List, Form skeleton variants
  - `PageSkeletons.tsx` - Page-specific layouts (Tournament, Dashboard, Results, etc.)
- Enhanced `Skeleton` primitive with `variant` and `shimmer` props
- Applied to 8 critical pages: Tournaments, MyDashboard, JudgeDashboard, MyTournaments, TournamentPostings, TournamentLanding, Results, UserAccount

### 1.4 Empty State Standardization ✅ COMPLETED
**Location:** Tournament rounds, pairings, registrations  
**Issue:** Empty states inconsistent; some show only text, others have icons  
**Acceptance Criteria:**
- [x] Create `<EmptyState>` component with icon, title, description, action
- [x] Apply to: Tournament Rounds, My Tournaments, Judge Assignments
- [x] Use consistent illustration style (lucide icons)
- [x] Include contextual call-to-action buttons

**Implementation Notes:**
- Promoted `src/components/ui/empty-state.tsx` as canonical component with `action?: ReactNode` API
- Refactored `RoundEmptyState` to wrap canonical `EmptyState`
- Renamed duplicate `EmptyState` in `ErrorDisplay.tsx` to `SimpleEmptyState` (deprecated)
- Applied to: `TournamentRounds.tsx`, `MyTournaments.tsx`, `MyJudgings.tsx`

---

## P2: Consistency Improvements

### 2.1 Card Layout Standardization
**Location:** Throughout application  
**Issue:** Card components use varying padding, header styles, and shadows  
**Acceptance Criteria:**
- [ ] Audit all Card usage and categorize by purpose
- [ ] Create card variants: `default`, `elevated`, `interactive`, `tournament`
- [ ] Standardize header patterns (icon + title + badge alignment)
- [ ] Document card usage guidelines

### 2.2 Button Usage Audit
**Location:** Global  
**Issue:** Inconsistent button variant usage across similar actions  
**Acceptance Criteria:**
- [ ] Primary actions always use `default` or `hero` variant
- [ ] Secondary actions use `outline` variant
- [ ] Destructive actions use `destructive` variant
- [ ] Audit and fix 15+ inconsistent button usages

### 2.3 Badge Color System
**Location:** Tournament status, payment status, round status  
**Issue:** Badge colors not consistently mapped to status meanings  
**Acceptance Criteria:**
- [ ] Define badge color semantics (success=green, warning=yellow, etc.)
- [ ] Create status-to-variant mapping utility
- [ ] Apply consistently to: Tournament status, Payment status, Round status
- [ ] Document badge usage guidelines

### 2.4 Form Label Consistency
**Location:** All forms (Registration, Contact, Profile, etc.)  
**Issue:** Some forms use `<Label>`, others use inline text; required field indicators vary  
**Acceptance Criteria:**
- [ ] All form fields use `<Label>` component
- [ ] Required fields marked with red asterisk consistently
- [ ] Optional fields labeled "(optional)" consistently
- [ ] Form field spacing standardized (space-y-4)

### 2.5 Icon Usage Standardization
**Location:** Global  
**Issue:** Mixed icon sizes (h-4 w-4, h-5 w-5, h-6 w-6) without clear rules  
**Acceptance Criteria:**
- [ ] Define icon size rules: inline=4, button=4, card header=5, hero=6
- [ ] Audit and correct inconsistent icon sizes
- [ ] Ensure icon color matches text color in context

---

## P3: UX Enhancements

### 3.1 Tournament Calendar View Enhancement
**Location:** `src/components/TournamentCalendarView.tsx`  
**Issue:** Calendar could show more tournament info at a glance  
**Acceptance Criteria:**
- [ ] Add tournament format badge to calendar entries
- [ ] Show registration deadline indicator
- [ ] Add hover preview card with quick details
- [ ] Improve mobile calendar touch interactions

### 3.2 Dashboard Information Hierarchy
**Location:** `src/pages/MyDashboard.tsx`  
**Issue:** Important information not immediately visible; requires scrolling  
**Acceptance Criteria:**
- [ ] Move upcoming matches to top of dashboard
- [ ] Add "Action Required" section for pending items
- [ ] Create at-a-glance stats cards (upcoming, pending, completed)
- [ ] Add quick actions bar (Register, View Matches, etc.)

### 3.3 Judge Dashboard Stats Visualization
**Location:** `src/pages/JudgeDashboard.tsx`  
**Issue:** Stats shown as numbers only; could benefit from visual progress  
**Acceptance Criteria:**
- [ ] Add progress rings or bars for completed/pending ballots
- [ ] Show judging history trend (last 30 days)
- [ ] Add achievement badges for milestones
- [ ] Improve mobile layout of stats cards

### 3.4 Tournament Registration Flow Enhancement
**Location:** `src/pages/TournamentRegistration.tsx`  
**Issue:** Multi-step process not clearly communicated; no progress indicator  
**Acceptance Criteria:**
- [ ] Add step indicator (1. Details → 2. Partner → 3. Payment → 4. Confirm)
- [ ] Show estimated completion time
- [ ] Add "Save & Continue Later" functionality
- [ ] Improve error recovery without losing form data

### 3.5 Pairing Chat UX Improvements
**Location:** `src/components/PairingChat.tsx`, `src/components/ChatPanel.tsx`  
**Issue:** Chat lacks modern messaging UX patterns  
**Acceptance Criteria:**
- [ ] Add typing indicators
- [ ] Show read receipts
- [ ] Add message timestamps in human-readable format
- [ ] Improve new message notification visibility
- [ ] Add emoji reactions to messages

### 3.6 Search Results Enhancement
**Location:** `src/components/GlobalSearch.tsx`  
**Issue:** Search results could be more informative  
**Acceptance Criteria:**
- [ ] Add result type icons (tournament, user, judge)
- [ ] Show match context highlighting
- [ ] Add keyboard navigation (arrow keys, enter to select)
- [ ] Remember recent searches

### 3.7 Table Pagination & Sorting
**Location:** Admin tables, standings views  
**Issue:** Large tables lack proper pagination; sorting not obvious  
**Acceptance Criteria:**
- [ ] Add pagination to all tables with 25+ rows
- [ ] Make sortable columns visually obvious (icon + hover state)
- [ ] Remember sort/filter preferences per table
- [ ] Add "Jump to page" for large datasets

---

## P4: Polish & Refinement

### 4.1 Page Transition Animations
**Location:** Global routing  
**Issue:** No page transitions; content appears abruptly  
**Acceptance Criteria:**
- [ ] Add subtle fade-in animation on route change
- [ ] Consider slide transitions for nested routes
- [ ] Ensure animations respect `prefers-reduced-motion`
- [ ] Keep transitions under 300ms

### 4.2 Micro-interactions
**Location:** Interactive elements  
**Issue:** Some interactions lack feedback  
**Acceptance Criteria:**
- [ ] Add button press feedback (scale down slightly)
- [ ] Add toggle switch animation
- [ ] Add checkbox check animation
- [ ] Add successful action confetti/celebration for wins

### 4.3 Empty State Illustrations
**Location:** All empty states  
**Issue:** Empty states use generic icons; could use custom illustrations  
**Acceptance Criteria:**
- [ ] Design 5-7 themed illustrations for common empty states
- [ ] Create: No Tournaments, No Matches, No Notifications, etc.
- [ ] Maintain consistent illustration style with brand
- [ ] Support dark mode color scheme

### 4.4 Skeleton Loading Enhancements
**Location:** Data-fetching components  
**Issue:** Skeleton loading could better match content structure  
**Acceptance Criteria:**
- [ ] Create content-aware skeletons for tournament cards
- [ ] Add shimmer animation to skeleton elements
- [ ] Match skeleton dimensions to actual content
- [ ] Create skeleton variants for different card types

### 4.5 Toast Notification Improvements
**Location:** `src/components/ui/toast.tsx`  
**Issue:** Toasts could have more personality and better actions  
**Acceptance Criteria:**
- [ ] Add success celebration animation
- [ ] Include undo action for destructive operations
- [ ] Add progress bar for timed toasts
- [ ] Improve stacking behavior for multiple toasts

### 4.6 Dark Mode Fine-tuning
**Location:** Global styles  
**Issue:** Some elements could have better dark mode contrast  
**Acceptance Criteria:**
- [ ] Audit all text on dark backgrounds for contrast
- [ ] Improve code block contrast in blog posts
- [ ] Ensure form inputs visible against card backgrounds
- [ ] Add subtle gradients to break up large dark areas

### 4.7 Footer Enhancement
**Location:** `src/components/Footer.tsx`  
**Issue:** Footer is functional but could be more visually engaging  
**Acceptance Criteria:**
- [ ] Add social media icons with hover effects
- [ ] Include newsletter signup inline
- [ ] Add sponsor logo bar
- [ ] Improve mobile footer layout

---

## Component-Specific To-Dos

### Navbar Component
- [ ] Add notification count badge
- [ ] Improve dropdown menu animations
- [ ] Add breadcrumb trail for deep navigation
- [ ] Consider sticky header with scroll effects

### Tournament Card Component
- [ ] Add registration progress bar
- [ ] Show days until registration deadline
- [ ] Add save/bookmark functionality
- [ ] Improve image loading (placeholder → actual)

### Judge Availability Component
- [ ] Add drag-to-select for multiple time slots
- [ ] Show timezone conversion preview
- [ ] Add "Copy from last week" functionality
- [ ] Improve mobile time slot selection

### Ballot Entry Component
- [ ] Add auto-save with visual indicator
- [ ] Improve speaker points input (slider option)
- [ ] Add argument flow visualization
- [ ] Include RFD (Reason for Decision) template

---

## Page-Specific To-Dos

### Homepage (Index.tsx)
- [ ] Add animated hero background
- [ ] Improve CTA button prominence
- [ ] Add testimonial carousel
- [ ] Show live tournament count/stats

### Tournaments Page
- [ ] Add map view option for tournament locations
- [ ] Improve filter UI (sidebar on desktop, modal on mobile)
- [ ] Add "Compare Tournaments" feature
- [ ] Show registration trend indicator

### Tournament Landing Page
- [ ] Add countdown timer for registration deadline
- [ ] Improve sponsor visibility section
- [ ] Add shareable tournament card for social
- [ ] Show historical data if returning tournament

### Results Page
- [ ] Add filtering by tournament, round, team
- [ ] Include visual bracket view for elimination rounds
- [ ] Add speaker rankings sortable table
- [ ] Enable result comparison between tournaments

---

## Accessibility Improvements

### Keyboard Navigation
- [ ] Ensure all interactive elements are focusable
- [ ] Add skip-to-content link
- [ ] Improve focus ring visibility across themes
- [ ] Test tab order on all pages

### Screen Reader Support
- [ ] Add aria-live regions for dynamic content
- [ ] Ensure all images have descriptive alt text
- [ ] Label all form inputs properly
- [ ] Test with VoiceOver and NVDA

### Color & Contrast
- [ ] Run WCAG contrast checker on all text
- [ ] Ensure interactive states meet contrast requirements
- [ ] Add non-color indicators for status (icons alongside colors)
- [ ] Test with color blindness simulators

---

## Responsive Design To-Dos

### Mobile (< 768px)
- [ ] Audit all pages for horizontal overflow
- [ ] Ensure tables scroll horizontally or stack
- [ ] Test all modals fit on small screens
- [ ] Verify touch targets meet 44px minimum

### Tablet (768px - 1024px)
- [ ] Optimize sidebar behavior (collapsible)
- [ ] Test two-column layouts don't break
- [ ] Verify navigation works in both orientations

### Large Screens (> 1536px)
- [ ] Ensure content doesn't stretch too wide
- [ ] Consider multi-column layouts for dashboards
- [ ] Test on ultra-wide monitors

---

## Performance-Related UI To-Dos

### Image Optimization
- [ ] Lazy load below-fold images
- [ ] Use WebP format with fallbacks
- [ ] Add blur-up placeholder effect
- [ ] Optimize hero images for different breakpoints

### Component Loading
- [ ] Lazy load admin routes
- [ ] Code split large components (ReactQuill, etc.)
- [ ] Preload critical fonts
- [ ] Defer non-critical scripts

---

## Documentation To-Dos

### Component Documentation
- [ ] Document all button variants with examples
- [ ] Create card usage guidelines
- [ ] Document form patterns and validation
- [ ] Add spacing and layout guidelines

### Design Tokens
- [ ] Export design tokens as CSS variables reference
- [ ] Document color usage guidelines
- [ ] Create typography scale reference
- [ ] Document animation timing tokens

---

## Implementation Notes

### Getting Started

1. Pick a task from P1 (Critical) first
2. Create a feature branch: `ui/[task-id]-[short-description]`
3. Implement changes with responsive testing
4. Run `npm run lint` and `npm run typecheck`
5. Test on Chrome, Firefox, Safari, and mobile
6. Submit PR with before/after screenshots

### Testing Checklist

- [ ] Desktop Chrome/Firefox/Safari
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)
- [ ] Keyboard navigation
- [ ] Screen reader (VoiceOver)
- [ ] Dark mode
- [ ] Slow network (throttled)

---

*This document should be updated as tasks are completed and new issues are discovered.*
