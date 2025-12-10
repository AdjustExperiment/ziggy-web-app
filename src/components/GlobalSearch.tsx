import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
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
import { 
  Clock, Search, Plus, Settings, Moon, Sun, LogOut, Shield, 
  FileText, Calendar, Zap, LucideIcon
} from 'lucide-react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action: () => void;
  isAdminOnly?: boolean;
  requiresAuth?: boolean;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { signOut } = useOptimizedAuth();
  const {
    searchTerm,
    setSearchTerm,
    isOpen,
    setIsOpen,
    groupedResults,
    recentSearches,
    addToRecent,
    user,
    isAdmin,
  } = useGlobalSearch();

  // Quick actions
  const quickActions = useMemo((): QuickAction[] => {
    const actions: QuickAction[] = [
      {
        id: 'create-tournament',
        title: 'Host a Tournament',
        description: 'Create and host a new debate tournament',
        icon: Plus,
        action: () => navigate('/host-tournament'),
      },
      {
        id: 'browse-tournaments',
        title: 'Browse Tournaments',
        description: 'Find tournaments to compete in',
        icon: Calendar,
        action: () => navigate('/tournaments'),
      },
      {
        id: 'toggle-theme',
        title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: 'Toggle between light and dark theme',
        icon: theme === 'dark' ? Sun : Moon,
        action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
    ];

    // Auth-required actions
    if (user) {
      actions.push(
        {
          id: 'my-dashboard',
          title: 'Go to Dashboard',
          description: 'View your personal dashboard',
          icon: Zap,
          action: () => navigate('/dashboard'),
          requiresAuth: true,
        },
        {
          id: 'settings',
          title: 'Account Settings',
          description: 'Manage your account preferences',
          icon: Settings,
          action: () => navigate('/account'),
          requiresAuth: true,
        },
        {
          id: 'sign-out',
          title: 'Sign Out',
          description: 'Log out of your account',
          icon: LogOut,
          action: () => {
            signOut();
            navigate('/');
          },
          requiresAuth: true,
        }
      );
    }

    // Admin-only actions
    if (isAdmin) {
      actions.push(
        {
          id: 'admin-dashboard',
          title: 'Admin Dashboard',
          description: 'Access administration tools',
          icon: Shield,
          action: () => navigate('/admin'),
          isAdminOnly: true,
        },
        {
          id: 'create-blog-post',
          title: 'Create Blog Post',
          description: 'Write a new blog article',
          icon: FileText,
          action: () => navigate('/admin?tab=blog'),
          isAdminOnly: true,
        }
      );
    }

    return actions;
  }, [navigate, theme, setTheme, user, isAdmin, signOut]);

  const handleSelect = useCallback((result: GlobalSearchResult) => {
    addToRecent(result);
    setIsOpen(false);
    setSearchTerm('');
    navigate(result.url);
  }, [addToRecent, setIsOpen, setSearchTerm, navigate]);

  const handleQuickAction = useCallback((action: QuickAction) => {
    setIsOpen(false);
    setSearchTerm('');
    action.action();
  }, [setIsOpen, setSearchTerm]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm('');
    }
  }, [setIsOpen, setSearchTerm]);

  const hasResults = Object.values(groupedResults).some(group => group.length > 0);
  const showRecent = !searchTerm.trim() && recentSearches.length > 0;
  const showQuickActions = !searchTerm.trim();

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search pages, tournaments, or type a command..."
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

        {/* Quick Actions - Show when no search query */}
        {showQuickActions && (
          <>
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={`action-${action.title}`}
                    onSelect={() => handleQuickAction(action)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{action.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {action.description}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

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

        {/* Search tips when no query and no recent */}
        {!searchTerm.trim() && !showRecent && !showQuickActions && (
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
