import React, { Suspense, lazy, useState, useCallback } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';

// Lazy load the full GlobalSearch component
const GlobalSearchLazy = lazy(() => 
  import('@/components/GlobalSearch').then(module => ({ default: module.GlobalSearch }))
);

interface LazyGlobalSearchProps {
  className?: string;
}

const LazyGlobalSearch: React.FC<LazyGlobalSearchProps> = ({ className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { setIsOpen } = useGlobalSearch();

  const handleClick = useCallback(() => {
    console.log('[LazyGlobalSearch] Button clicked, loading search component');
    setIsLoaded(true);
    setHasError(false);
    // Use context state to open the dialog
    setTimeout(() => setIsOpen(true), 50);
  }, [setIsOpen]);

  const handleRetry = useCallback(() => {
    console.log('[LazyGlobalSearch] Retrying load');
    setHasError(false);
    setIsLoaded(true);
    setTimeout(() => setIsOpen(true), 50);
  }, [setIsOpen]);

  // Show error state with retry
  if (hasError) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className={className}
        onClick={handleRetry}
        aria-label="Retry Search"
      >
        <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
        <span className="hidden md:inline">Retry</span>
      </Button>
    );
  }

  return (
    <>
      {/* Always show the search button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className={className}
        onClick={handleClick}
        aria-label="Search"
      >
        <Search className="h-4 w-4 mr-2" />
        <span className="hidden md:inline">Search</span>
        <kbd className="ml-2 hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Load the dialog component when triggered */}
      {isLoaded && (
        <Suspense fallback={null}>
          <GlobalSearchLazy />
        </Suspense>
      )}
    </>
  );
};

export default LazyGlobalSearch;
