import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape variant for the skeleton */
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  /** Whether to show shimmer animation overlay */
  shimmer?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', shimmer = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-muted relative overflow-hidden",
          variant === 'circular' && "rounded-full",
          variant === 'text' && "rounded h-4",
          variant === 'rectangular' && "rounded-lg",
          variant === 'default' && "rounded-md",
          className
        )}
        {...props}
      >
        {shimmer && (
          <div 
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
            style={{ animationDuration: '1.5s', animationIterationCount: 'infinite' }}
          />
        )}
      </div>
    )
  }
)
Skeleton.displayName = "Skeleton"

export { Skeleton }
