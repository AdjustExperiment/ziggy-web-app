import React, { Suspense, lazy, useState, useCallback, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy load the full GlobalSearch component with proper default export handling
const GlobalSearchLazy = lazy(() => 
  import('@/components/GlobalSearch').then(module => ({ default: module.GlobalSearch }))
);

interface LazyGlobalSearchProps {
  className?: string;
}

const LazyGlobalSearch: React.FC<LazyGlobalSearchProps> = ({ className }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Listen for keyboard shortcut to trigger load
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShouldLoad(true);
        setIsOpen(true);
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setShouldLoad(true);
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClick = useCallback(() => {
    setShouldLoad(true);
    setIsOpen(true);
  }, []);

  // Only render the button until needed
  if (!shouldLoad) {
    return (
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
    );
  }

  return (
    <Suspense fallback={
      <Button variant="ghost" size="sm" className={className} disabled>
        <Search className="h-4 w-4 mr-2 animate-pulse" />
        <span className="hidden md:inline">Loading...</span>
      </Button>
    }>
      <GlobalSearchLazy />
    </Suspense>
  );
};

export default LazyGlobalSearch;
