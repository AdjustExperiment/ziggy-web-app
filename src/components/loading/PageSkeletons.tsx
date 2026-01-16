import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TournamentCardSkeleton, 
  StatsRowSkeleton, 
  TabsSkeleton, 
  ListSkeleton,
  TableSkeleton,
  CardSkeleton,
  FormSkeleton
} from './skeletons';

/**
 * TournamentGridSkeleton - For the tournaments listing page
 */
export function TournamentGridSkeleton({ 
  count = 6,
  className 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Page header */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton variant="text" className="w-96 max-w-full" />
      </div>
      
      {/* Filters row */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
      
      {/* Tournament grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <TournamentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * DashboardSkeleton - For MyDashboard and JudgeDashboard pages
 */
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Welcome header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton variant="text" className="w-96 max-w-full" />
      </div>
      
      {/* Stats row */}
      <StatsRowSkeleton count={4} />
      
      {/* Quick actions */}
      <div className="flex gap-3">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      
      {/* Tabs content */}
      <TabsSkeleton tabCount={4} />
    </div>
  );
}

/**
 * TournamentDetailSkeleton - For tournament landing pages
 */
export function TournamentDetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Hero header */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-24 w-24 rounded-lg flex-shrink-0" />
        </div>
        
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-5/6" />
        
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-11 w-40 rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
        </div>
      </div>
      
      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <TabsSkeleton tabCount={3} />
        </div>
        
        {/* Sidebar */}
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

/**
 * ResultsSkeleton - For results and standings pages
 */
export function ResultsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton variant="text" className="w-64" />
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-10 w-48 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      
      {/* Results table */}
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}

/**
 * AccountSkeleton - For user account/settings pages
 */
export function AccountSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton variant="text" className="w-72" />
      </div>
      
      {/* Profile card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton variant="circular" className="h-20 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton variant="text" className="w-48" />
          </div>
        </div>
        <FormSkeleton fields={4} />
      </div>
      
      {/* Settings sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * PostingsSkeleton - For tournament postings/pairings pages
 */
export function PostingsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton variant="text" className="w-80" />
      </div>
      
      {/* Round selector */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-lg" />
        ))}
      </div>
      
      {/* Pairings list */}
      <ListSkeleton items={5} showAvatar />
    </div>
  );
}

/**
 * MyTournamentsSkeleton - For user's tournaments list
 */
export function MyTournamentsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton variant="text" className="w-64" />
      </div>
      
      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      
      {/* Tournament cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
