import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useGlobalSearch, GlobalSearchResult } from '@/hooks/useGlobalSearch';
import { Clock, Search } from 'lucide-react';

export function GlobalSearch() {
  const navigate = useNavigate();
  const {
    searchTerm,
    setSearchTerm,
    isOpen,
    setIsOpen,
    groupedResults,
    recentSearches,
    addToRecent,
  } = useGlobalSearch();

  const handleSelect = useCallback((result: GlobalSearchResult) => {
    addToRecent(result);
    setIsOpen(false);
    setSearchTerm('');
    navigate(result.url);
  }, [addToRecent, setIsOpen, setSearchTerm, navigate]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm('');
    }
  }, [setIsOpen, setSearchTerm]);

  const hasResults = Object.values(groupedResults).some(group => group.length > 0);
  const showRecent = !searchTerm.trim() && recentSearches.length > 0;

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search pages, tournaments, posts..."
        value={searchTerm}
        onValueChange={setSearchTerm}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <Search className="h-8 w-8 opacity-50" />
            <p>No results found.</p>
            <p className="text-xs">Try searching for pages, tournaments, or blog posts</p>
          </div>
        </CommandEmpty>

        {/* Recent searches */}
        {showRecent && (
          <>
            <CommandGroup heading="Recent">
              {recentSearches.map((result) => {
                const Icon = result.icon;
                return (
                  <CommandItem
                    key={`recent-${result.id}`}
                    value={`recent-${result.title}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {result.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Pages */}
        {groupedResults.page.length > 0 && (
          <CommandGroup heading="Pages">
            {groupedResults.page.map((result) => {
              const Icon = result.icon;
              return (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {result.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Dashboard */}
        {groupedResults.dashboard.length > 0 && (
          <CommandGroup heading="Dashboard">
            {groupedResults.dashboard.map((result) => {
              const Icon = result.icon;
              return (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {result.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Tournaments */}
        {groupedResults.tournament.length > 0 && (
          <CommandGroup heading="Tournaments">
            {groupedResults.tournament.map((result) => {
              const Icon = result.icon;
              return (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {result.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Blog Posts */}
        {groupedResults.blog.length > 0 && (
          <CommandGroup heading="Blog Posts">
            {groupedResults.blog.map((result) => {
              const Icon = result.icon;
              return (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {result.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Admin Pages */}
        {groupedResults.admin.length > 0 && (
          <CommandGroup heading="Admin">
            {groupedResults.admin.map((result) => {
              const Icon = result.icon;
              return (
                <CommandItem
                  key={result.id}
                  value={result.title}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {result.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Search tips when no query */}
        {!searchTerm.trim() && !showRecent && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>Start typing to search...</p>
            <p className="text-xs mt-2">
              Use <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">#admin</kbd> or{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">#tournament</kbd> to filter by type
            </p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
