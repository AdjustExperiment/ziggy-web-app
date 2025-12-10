import React, { Suspense, lazy, useRef, useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

// Lazy load the heavy AnimatedGlobe component
const AnimatedGlobe = lazy(() => import('./AnimatedGlobe').then(m => ({ default: m.AnimatedGlobe })));

// Skeleton placeholder for the globe
function GlobeSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "relative flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 animate-pulse",
      className
    )}>
      {/* Globe outline */}
      <div className="w-[60%] h-[60%] rounded-full border-2 border-muted/30 relative">
        {/* Latitude lines */}
        <div className="absolute inset-[15%] rounded-full border border-muted/20" />
        <div className="absolute inset-[30%] rounded-full border border-muted/20" />
        {/* Longitude line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-muted/20" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-muted/20" />
      </div>
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/10 to-transparent -translate-x-full animate-shimmer" />
    </div>
  );
}

interface LazyGlobeProps {
  className?: string;
}

export function LazyGlobe({ className }: LazyGlobeProps) {
  const [hasLoaded, setHasLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true, // Only load once when in view
    rootMargin: '100px', // Start loading slightly before in view
  });

  // Track if component should render globe
  const shouldRenderGlobe = inView || hasLoaded;

  useEffect(() => {
    if (inView) {
      setHasLoaded(true);
    }
  }, [inView]);

  return (
    <div ref={ref} className={className}>
      {shouldRenderGlobe ? (
        <Suspense fallback={<GlobeSkeleton className={className} />}>
          <AnimatedGlobe className={className} />
        </Suspense>
      ) : (
        <GlobeSkeleton className={className} />
      )}
    </div>
  );
}

export default LazyGlobe;
