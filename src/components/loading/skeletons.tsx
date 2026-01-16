import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * CardSkeleton - Matches tournament/dashboard card layout
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 space-y-4", className)}>
      {/* Header with badge */}
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      
      {/* Title */}
      <Skeleton className="h-6 w-3/4" />
      
      {/* Description lines */}
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-5/6" />
      </div>
      
      {/* Meta info row */}
      <div className="flex items-center gap-4 pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      
      {/* Action button */}
      <Skeleton className="h-10 w-full rounded-lg mt-4" />
    </div>
  );
}

/**
 * TournamentCardSkeleton - Specific to tournament cards with image
 */
export function TournamentCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      {/* Image placeholder */}
      <Skeleton className="h-40 w-full rounded-none" />
      
      <div className="p-4 space-y-3">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        
        {/* Title */}
        <Skeleton className="h-6 w-full" />
        
        {/* Date and location */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" className="h-4 w-4" />
            <Skeleton variant="text" className="w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton variant="circular" className="h-4 w-4" />
            <Skeleton variant="text" className="w-24" />
          </div>
        </div>
        
        {/* Participants */}
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-4 w-full" />
        </div>
        
        {/* Button */}
        <Skeleton className="h-9 w-full rounded-lg mt-2" />
      </div>
    </div>
  );
}

/**
 * StatsSkeleton - For dashboard stats cards
 */
export function StatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton variant="circular" className="h-10 w-10" />
      </div>
    </div>
  );
}

/**
 * StatsRowSkeleton - Row of stats cards
 */
export function StatsRowSkeleton({ 
  count = 4, 
  className 
}: { 
  count?: number; 
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)} style={{ gridTemplateColumns: `repeat(${Math.min(count, 4)}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <StatsSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * TableSkeleton - For results, standings tables
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card overflow-hidden", className)}>
      {/* Table header */}
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton 
              key={i} 
              variant="text" 
              className={cn(
                i === 0 ? "w-12" : "flex-1",
                "max-w-[150px]"
              )} 
            />
          ))}
        </div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-4 py-3">
            <div className="flex items-center gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  variant="text" 
                  className={cn(
                    colIndex === 0 ? "w-12" : "flex-1",
                    "max-w-[150px]"
                  )} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ListSkeleton - For registration lists, pairings, etc.
 */
export function ListSkeleton({ 
  items = 3,
  showAvatar = false,
  className 
}: { 
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
        >
          {showAvatar && (
            <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

/**
 * TabsSkeleton - For tab navigation areas
 */
export function TabsSkeleton({ 
  tabCount = 4, 
  className 
}: { 
  tabCount?: number; 
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: tabCount }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn("h-9 rounded-lg", i === 0 ? "w-24" : "w-20")} 
          />
        ))}
      </div>
      
      {/* Content area */}
      <div className="space-y-4">
        <ListSkeleton items={3} />
      </div>
    </div>
  );
}

/**
 * FormSkeleton - For forms and settings
 */
export function FormSkeleton({ 
  fields = 4,
  className 
}: { 
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" className="w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}
