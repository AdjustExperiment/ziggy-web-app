# Ziggy Web App - Development Conventions

This document establishes standard patterns and conventions for development in the Ziggy codebase. Following these conventions ensures consistency, maintainability, and predictable behavior.

---

## 1. Data Fetching

### When to Use React Query vs Local State

| Use React Query | Use Local State |
|-----------------|-----------------|
| Data from Supabase/API | UI-only state (modals, form inputs) |
| Data shared across components | Component-specific toggles |
| Data that should survive route changes | Ephemeral state |
| Data requiring caching | Derived state from props |
| Data with refetch/invalidation needs | Animation state |

### Standard React Query Hook Pattern

```typescript
// src/hooks/useTournament.ts - RECOMMENDED PATTERN

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

interface UseTournamentOptions {
  enabled?: boolean;
  staleTime?: number;
}

export function useTournament(
  tournamentId: string | undefined, 
  options: UseTournamentOptions = {}
) {
  const { enabled = true, staleTime = 5 * 60 * 1000 } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    // 1. Structured query key with entity and ID
    queryKey: ['tournament', tournamentId],
    
    // 2. Query function with early validation
    queryFn: async () => {
      if (!tournamentId) throw new Error('Tournament ID required');
      
      // 3. Dev-only logging
      if (import.meta.env.DEV) {
        console.log('[useTournament] Fetching:', tournamentId);
      }

      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournamentId)
        .single();

      if (error) throw error;
      return data;
    },
    
    // 4. Conditional enabling
    enabled: enabled && !!tournamentId,
    staleTime,
    gcTime: 10 * 60 * 1000,
  });

  // 5. Expose invalidation helper
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tournament', tournamentId] });
  }, [queryClient, tournamentId]);

  // 6. Return structured object
  return {
    tournament: query.data,
    isLoading: query.isLoading,
    error: query.error,
    invalidate,
    refetch: query.refetch,
  };
}
```

### Query Key Conventions

```typescript
// Entity queries
['tournament', tournamentId]
['tournament-rounds', tournamentId]
['round-pairings', roundId]
['profile', userId]

// List queries
['tournaments']
['tournaments', { status: 'active' }]

// Admin/scoped queries
['adminScope', userId]
['admin-notifications']
```

### Error Handling Pattern

```typescript
// In hooks - throw errors, let React Query handle retry
queryFn: async () => {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;  // React Query will retry based on config
  return data;
}

// In components - use error state from hook
function MyComponent() {
  const { data, error, isLoading } = useMyData();
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorDisplay error={error} />;
  return <DataDisplay data={data} />;
}
```

### Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateTournament() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['tournament', data.id] });
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}
```

---

## 2. Realtime Subscriptions

### Subscription Hook Pattern

```typescript
// src/hooks/useTournamentRealtime.ts - RECOMMENDED PATTERN

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseTournamentRealtimeOptions {
  tournamentId: string | null;
  onRoundUpdate?: (event: RealtimeEvent) => void;
  // ... other callbacks
}

export function useTournamentRealtime(options: UseTournamentRealtimeOptions) {
  const { tournamentId, onRoundUpdate } = options;
  
  // 1. Use ref to track channel (avoids closure issues)
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 2. Memoized subscribe function
  const subscribe = useCallback(() => {
    if (!tournamentId) return;

    // 3. Always clean up before creating new subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // 4. Create channel with unique name
    const channel = supabase
      .channel(`tournament-realtime-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',  // or 'INSERT' | 'UPDATE' | 'DELETE'
          schema: 'public',
          table: 'rounds',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          // 5. Transform payload before callback
          const event = {
            type: 'round',
            action: payload.eventType,
            data: payload.new || payload.old
          };
          onRoundUpdate?.(event);
        }
      );

    // 6. Subscribe and track status
    channel.subscribe((status) => {
      if (import.meta.env.DEV) {
        console.log('[Realtime] Status:', status);
      }
    });

    channelRef.current = channel;
  }, [tournamentId, onRoundUpdate]);

  // 7. Effect with cleanup
  useEffect(() => {
    subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [subscribe]);

  // 8. Expose resubscribe for manual recovery
  return { resubscribe: subscribe };
}
```

### Realtime Best Practices

1. **Always clean up** - Remove channels in useEffect cleanup
2. **Use refs for channels** - Prevents stale closure issues
3. **Unique channel names** - Include entity ID in channel name
4. **Filter server-side** - Use `filter` param to reduce traffic
5. **Debounce UI updates** - Batch rapid changes if needed
6. **Handle reconnection** - Expose resubscribe for error recovery

### Combining Realtime with React Query

```typescript
// Invalidate React Query cache on realtime updates
function TournamentPage({ tournamentId }) {
  const queryClient = useQueryClient();
  const { rounds } = useTournamentRounds(tournamentId);
  
  useTournamentRealtime({
    tournamentId,
    onRoundUpdate: () => {
      // Invalidate instead of manually updating state
      queryClient.invalidateQueries({ 
        queryKey: ['tournament-rounds', tournamentId] 
      });
    },
  });
  
  return <RoundsList rounds={rounds} />;
}
```

---

## 3. TypeScript & Typing

### Using Supabase Types

```typescript
// Import generated types
import type { Database } from '@/integrations/supabase/types';

// Extract table row types
type Tournament = Database['public']['Tables']['tournaments']['Row'];
type TournamentInsert = Database['public']['Tables']['tournaments']['Insert'];
type TournamentUpdate = Database['public']['Tables']['tournaments']['Update'];

// Use in hooks
export function useTournaments() {
  return useQuery({
    queryKey: ['tournaments'],
    queryFn: async (): Promise<Tournament[]> => {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*');
      if (error) throw error;
      return data;
    },
  });
}
```

### When to Use `src/types/database.ts`

Use temporary types in `database.ts` when:
- Waiting for Supabase type regeneration
- Need types for views or complex joins
- Extending generated types with computed fields

```typescript
// src/types/database.ts
// Mark with TODO for removal once types are regenerated
// TODO: Remove after running `supabase gen types typescript`
export interface ExtendedPairing extends Pairing {
  aff_registration: { participant_name: string };
  neg_registration: { participant_name: string };
}
```

### Interface vs Type

```typescript
// Use interface for object shapes (extendable)
interface Tournament {
  id: string;
  name: string;
}

// Use type for unions, intersections, and utilities
type TournamentStatus = 'draft' | 'active' | 'completed';
type TournamentWithRounds = Tournament & { rounds: Round[] };
```

### Props Interface Pattern

```typescript
// Component props
interface TournamentCardProps {
  tournament: Tournament;
  onSelect?: (id: string) => void;
  className?: string;
}

// Hook options
interface UseTournamentOptions {
  enabled?: boolean;
  staleTime?: number;
}
```

---

## 4. Component Organization

### Component Structure

```typescript
// Recommended order within a component file

// 1. Imports (grouped: react, third-party, internal)
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useTournament } from '@/hooks/useTournament';

// 2. Types/Interfaces
interface TournamentCardProps {
  tournamentId: string;
}

// 3. Helper functions (if small)
const formatDate = (date: string) => new Date(date).toLocaleDateString();

// 4. Component
export function TournamentCard({ tournamentId }: TournamentCardProps) {
  // 4a. Hooks (order: context, queries, state, effects)
  const { tournament, isLoading } = useTournament(tournamentId);
  const [expanded, setExpanded] = useState(false);
  
  // 4b. Derived values
  const isActive = tournament?.status === 'active';
  
  // 4c. Handlers
  const handleExpand = () => setExpanded(!expanded);
  
  // 4d. Early returns (loading, error)
  if (isLoading) return <Skeleton />;
  if (!tournament) return null;
  
  // 4e. Render
  return (
    <div>...</div>
  );
}
```

### File Organization in `components/`

```
components/
├── ui/                    # Design system primitives (from shadcn)
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
│
├── admin/                 # Admin-specific components
│   ├── AdminLayout.tsx    # Shell/layout
│   ├── TournamentManager.tsx  # Feature module
│   └── tabulation/        # Feature subgroup
│
├── tournament/            # Tournament participant components
│   ├── TournamentSidebar.tsx
│   └── ...
│
├── Navbar.tsx             # Global components at root
├── Footer.tsx
└── ProtectedRoute.tsx
```

### When to Create a New Component

Create a new component when:
- Logic/UI is reused in 2+ places
- Component exceeds ~150 lines
- A clear abstraction boundary exists
- Testing in isolation is valuable

### Component Naming

```typescript
// Feature components: [Feature][Purpose].tsx
TournamentCard.tsx
TournamentList.tsx
TournamentManager.tsx

// UI components: [Element].tsx (lowercase in ui/)
button.tsx
card.tsx
dialog.tsx

// Layout components: [Area]Layout.tsx
AdminLayout.tsx

// Provider components: [Feature]Provider.tsx
GlobalSearchProvider.tsx
```

---

## 5. Hook Conventions

### Custom Hook Naming

```typescript
// Data hooks: use[Entity]
useTournament(id)
useTournamentRounds(tournamentId)
useProfile(userId)

// Action hooks: use[Action][Entity]
useUpdateTournament()
useDeletePairing()

// State hooks: use[State]
useGlobalSearch()
useRegistrationCart()

// Utility hooks: use[Utility]
useDebounce(value, delay)
useMobile()
```

### Hook Return Value Pattern

```typescript
// Query hooks - return object with named fields
function useTournament(id) {
  return {
    tournament: data,      // The data
    isLoading,             // Loading state
    error,                 // Error state
    invalidate,            // Cache invalidation
    refetch,               // Manual refetch
  };
}

// Mutation hooks - return mutation object
function useUpdateTournament() {
  return useMutation({...});  // Includes mutate, isLoading, error, etc.
}

// State hooks - return [state, actions]
function useGlobalSearch() {
  return {
    searchTerm,
    setSearchTerm,
    results,
    isOpen,
    setIsOpen,
  };
}
```

---

## 6. Error Handling

### API Error Handling

```typescript
// In hooks - throw to React Query
const { data, error } = await supabase.from('table').select('*');
if (error) throw error;

// In components - display error state
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
```

### User Feedback

```typescript
// Success feedback - use toast
import { toast } from '@/components/ui/use-toast';

const handleSave = async () => {
  try {
    await mutation.mutateAsync(data);
    toast({
      title: 'Success',
      description: 'Tournament saved successfully',
    });
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive',
    });
  }
};
```

---

## 7. Testing Approach

### Test File Location

```
src/
├── components/
│   └── TournamentCard.tsx
├── hooks/
│   └── useTournament.ts
└── __tests__/              # OR colocated as .test.tsx
    ├── TournamentCard.test.tsx
    └── useTournament.test.ts
```

### Testing Priorities

1. **High Priority** - Custom hooks with complex logic
2. **Medium Priority** - Key user flows (registration, auth)
3. **Lower Priority** - Pure presentational components

### Test Setup

```typescript
// setupTests.ts is already configured
// Use @testing-library/react for components
// Use renderHook from @testing-library/react for hooks

import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

---

## 8. Safe Change Checklist

### High-Risk Files (require extra review)

| File | Impact | Testing Required |
|------|--------|------------------|
| `src/main.tsx` | App bootstrap | Manual full-app test |
| `src/App.tsx` | All routes | Manual navigation test |
| `src/hooks/useOptimizedAuth.tsx` | Auth everywhere | Auth flow test |
| `src/providers/QueryProvider.tsx` | All data fetching | Regression test |
| `src/components/Navbar.tsx` | All pages | Visual check |
| `src/components/ProtectedRoute.tsx` | Route security | Auth flow test |

### Low-Risk Files (isolated changes)

- Individual pages in `src/pages/` (except AdminDashboard)
- Admin components in `src/components/admin/`
- Tournament components in `src/components/tournament/`
- Utility functions in `src/lib/` and `src/utils/`
- Translation files in `src/i18n/locales/`

### Before Committing

1. Run `npm run lint` - fix any errors
2. Run `npm run build` - ensure no build errors
3. Test the specific feature manually
4. If touching auth/routing, test login/logout flow
5. If touching realtime, test subscription/unsubscription

---

## Summary Checklist

- [ ] Use React Query for server state, local state for UI
- [ ] Follow query key conventions: `['entity', id]`
- [ ] Always clean up realtime subscriptions
- [ ] Use generated Supabase types where possible
- [ ] Keep components under 150 lines
- [ ] Return structured objects from hooks
- [ ] Handle errors with try/catch and toast feedback
- [ ] Test high-risk changes thoroughly

