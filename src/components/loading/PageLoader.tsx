import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
  /** Optional message to display below the spinner */
  message?: string;
  /** Whether to show full-screen or inline */
  fullScreen?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * PageLoader - A consistent full-page or inline loading component
 * 
 * @example
 * // Full screen loader
 * if (loading) return <PageLoader message="Loading tournaments..." />;
 * 
 * // Inline loader
 * <PageLoader fullScreen={false} className="py-12" />
 */
export function PageLoader({ 
  message, 
  fullScreen = true,
  className 
}: PageLoaderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center animate-in fade-in duration-300",
        fullScreen && "min-h-screen bg-background",
        !fullScreen && "py-12",
        className
      )}
    >
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        
        {/* Spinner */}
        <div className="relative flex items-center justify-center h-16 w-16">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </div>
      
      {message && (
        <p className="mt-4 text-muted-foreground text-sm animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

/**
 * InlineLoader - A smaller inline loading indicator
 */
export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className="h-4 w-4 text-primary animate-spin" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  );
}
