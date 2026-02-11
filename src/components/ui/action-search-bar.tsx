"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send } from "lucide-react";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { staticPages } from "@/hooks/useGlobalSearch";
import { Moon, Sun, LogOut } from "lucide-react";

function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface Action {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  short?: string;
  end?: string;
  href?: string;
  onSelect?: () => void;
}

interface SearchResult {
  actions: Action[];
}

function buildActionsFromIndex(
  user: unknown,
  isAdmin: boolean,
  profile: { role?: string } | null,
  navigate: (url: string) => void,
  setTheme: (theme: "light" | "dark") => void,
  theme: string | undefined,
  signOut: () => void
): Action[] {
  const actions: Action[] = [];

  for (const page of staticPages) {
    if (page.isAdminOnly && !isAdmin) continue;
    if (page.requiresAuth && !user) continue;
    if (page.roles && page.roles.length > 0 && !isAdmin) {
      const role = profile?.role ?? "";
      if (!page.roles.includes(role)) continue;
    }

    const Icon = page.icon;
    const typeLabel = page.type === "admin" ? "Admin" : page.type === "dashboard" ? "Dashboard" : "Page";

    actions.push({
      id: page.id,
      label: page.title,
      icon: <Icon className="h-4 w-4 text-muted-foreground" />,
      description: page.description,
      short: "⌘K",
      end: typeLabel,
      href: page.url,
      onSelect: () => navigate(page.url),
    });
  }

  // Theme toggle
  actions.push({
    id: "theme-toggle",
    label: theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
    icon: theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-500" />,
    description: "Toggle site theme",
    short: "",
    end: "Command",
    onSelect: () => setTheme(theme === "dark" ? "light" : "dark"),
  });

  if (user) {
    actions.push({
      id: "sign-out",
      label: "Sign Out",
      icon: <LogOut className="h-4 w-4 text-muted-foreground" />,
      description: "Log out of your account",
      short: "",
      end: "Account",
      onSelect: () => {
        signOut();
        navigate("/");
      },
    });
  }

  return actions;
}

interface ActionSearchBarProps {
  actions?: Action[];
  className?: string;
  placeholder?: string;
  label?: string;
}

function ActionSearchBar({
  actions: actionsProp,
  className,
  placeholder = "Search pages and commands…",
  label = "Search Commands",
}: ActionSearchBarProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useOptimizedAuth();
  const { isAdmin } = useGlobalSearch();

  const indexActions = useMemo(
    () =>
      buildActionsFromIndex(
        user,
        isAdmin,
        profile ?? null,
        navigate,
        setTheme,
        theme,
        signOut
      ),
    [user, isAdmin, profile, navigate, setTheme, theme, signOut]
  );

  const allActions = actionsProp ?? indexActions;

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (!isFocused) {
      setResult(null);
      return;
    }

    if (!debouncedQuery.trim()) {
      setResult({ actions: allActions });
      return;
    }

    const normalizedQuery = debouncedQuery.toLowerCase().trim();
    const filteredActions = allActions.filter((action) => {
      const searchableText = [
        action.label,
        action.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(normalizedQuery);
    });

    setResult({ actions: filteredActions });
  }, [debouncedQuery, isFocused, allActions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSelect = (action: Action) => {
    setSelectedAction(action);
    if (action.onSelect) {
      action.onSelect();
    } else if (action.href) {
      navigate(action.href);
    }
    setQuery("");
    setSelectedAction(null);
  };

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: { duration: 0.4 },
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2 },
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25 },
    },
    exit: {
      opacity: 0,
      y: -8,
      transition: { duration: 0.2 },
    },
  };

  const handleFocus = () => {
    setSelectedAction(null);
    setIsFocused(true);
  };

  return (
    <div className={className}>
      <div className="relative flex flex-col justify-start items-stretch min-h-[200px]">
        <div className="w-full sticky top-0 bg-background z-10 pt-2 pb-1">
          <label
            className="text-xs font-medium text-muted-foreground mb-1 block"
            htmlFor="action-search"
          >
            {label}
          </label>
          <div className="relative">
            <Input
              id="action-search"
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="pl-3 pr-9 py-1.5 h-9 text-sm rounded-lg focus-visible:ring-offset-0"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none">
              <AnimatePresence mode="wait">
                {query.length > 0 ? (
                  <motion.div
                    key="send"
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 12, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Send className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ y: -12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 12, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full">
          <AnimatePresence>
            {isFocused && result && result.actions.length > 0 && (
              <motion.div
                className="w-full border border-border rounded-lg shadow-sm overflow-hidden bg-background mt-1"
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.ul className="max-h-[280px] overflow-y-auto py-1">
                  {result.actions.map((action) => (
                    <motion.li
                      key={action.id}
                      className="px-3 py-2 flex items-center justify-between hover:bg-accent cursor-pointer rounded-md transition-colors"
                      variants={item}
                      layout
                      onClick={() => handleSelect(action)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-muted-foreground">
                          {action.icon}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {action.label}
                        </span>
                        {action.description && (
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                            {action.description}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {action.short && (
                          <span className="text-xs text-muted-foreground">
                            {action.short}
                          </span>
                        )}
                        {action.end && (
                          <span className="text-xs text-muted-foreground">
                            {action.end}
                          </span>
                        )}
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
                <div className="px-3 py-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Press ⌘K for full search</span>
                    <span>ESC to close</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export { ActionSearchBar };
