import { useState, useEffect, useMemo, useCallback, createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';
import { 
  Trophy, Users, Info, FileText, BarChart3, Settings, Shield, 
  Calendar, Award, Gavel, Eye, Building, CreditCard, Mail,
  Home, HelpCircle, Phone, BookOpen, Flag, Sparkles, LucideIcon
} from 'lucide-react';

export interface GlobalSearchResult {
  id: string;
  title: string;
  type: 'page' | 'tournament' | 'blog' | 'admin' | 'dashboard';
  url: string;
  description?: string;
  icon: LucideIcon;
  isAdminOnly?: boolean;
  tags?: string[];
  matchScore: number;
}

export interface SearchablePage {
  id: string;
  title: string;
  url: string;
  description: string;
  keywords: string[];
  icon: LucideIcon;
  type: 'page' | 'admin' | 'dashboard';
  isAdminOnly?: boolean;
  requiresAuth?: boolean;
  roles?: string[];
}

// Static page index (exported for action search bar and other search UIs)
export const staticPages: SearchablePage[] = [
  // Public pages
  { id: 'home', title: 'Home', url: '/', description: 'Welcome to Ziggy Debate', keywords: ['home', 'main', 'landing'], icon: Home, type: 'page' },
  { id: 'tournaments', title: 'Browse Tournaments', url: '/tournaments', description: 'Find and register for debate tournaments', keywords: ['tournaments', 'events', 'competition', 'register'], icon: Trophy, type: 'page' },
  { id: 'results', title: 'Results', url: '/results', description: 'View tournament results and standings', keywords: ['results', 'standings', 'winners', 'scores'], icon: Award, type: 'page' },
  { id: 'host', title: 'Host a Tournament', url: '/host-tournament', description: 'Learn how to host your own tournament', keywords: ['host', 'organize', 'create', 'tournament'], icon: Calendar, type: 'page' },
  { id: 'blog', title: 'Blog', url: '/blog', description: 'Read the latest debate news and articles', keywords: ['blog', 'news', 'articles', 'posts'], icon: FileText, type: 'page' },
  { id: 'about', title: 'About Us', url: '/about', description: 'Learn about Ziggy Debate', keywords: ['about', 'team', 'mission', 'story'], icon: Info, type: 'page' },
  { id: 'getting-started', title: 'Getting Started', url: '/getting-started', description: 'New to debate? Start here', keywords: ['getting started', 'beginner', 'new', 'learn', 'start'], icon: Sparkles, type: 'page' },
  { id: 'learn', title: 'Learn About Debate', url: '/learn-about-debate', description: 'Educational resources about debate', keywords: ['learn', 'education', 'debate', 'how to'], icon: BookOpen, type: 'page' },
  { id: 'rules', title: 'Rules', url: '/rules', description: 'Official debate rules and guidelines', keywords: ['rules', 'guidelines', 'regulations', 'format'], icon: Flag, type: 'page' },
  { id: 'faq', title: 'FAQ', url: '/faq', description: 'Frequently asked questions', keywords: ['faq', 'questions', 'help', 'support'], icon: HelpCircle, type: 'page' },
  { id: 'contact', title: 'Contact', url: '/contact', description: 'Get in touch with us', keywords: ['contact', 'email', 'support', 'help'], icon: Phone, type: 'page' },
  { id: 'club-partners', title: 'Club Partners', url: '/club-partners', description: 'Partner with Ziggy Debate', keywords: ['partners', 'clubs', 'schools', 'organizations'], icon: Building, type: 'page' },
  { id: 'ambassador', title: 'Ambassador Program', url: '/ambassador', description: 'Become a Ziggy ambassador', keywords: ['ambassador', 'represent', 'program'], icon: Users, type: 'page' },
  { id: 'sponsors', title: 'Sponsors', url: '/sponsors', description: 'Our tournament sponsors', keywords: ['sponsors', 'partners', 'supporters'], icon: Building, type: 'page' },
  { id: 'become-sponsor', title: 'Become a Sponsor', url: '/sponsor', description: 'Sponsor debate tournaments', keywords: ['sponsor', 'sponsorship', 'support'], icon: CreditCard, type: 'page' },
  { id: 'teams', title: 'Teams', url: '/teams', description: 'Browse debate teams', keywords: ['teams', 'schools', 'groups'], icon: Users, type: 'page' },

  // Auth-required pages
  { id: 'dashboard', title: 'My Dashboard', url: '/dashboard', description: 'Your personal dashboard', keywords: ['dashboard', 'my', 'home', 'overview'], icon: BarChart3, type: 'dashboard', requiresAuth: true },
  { id: 'my-tournaments', title: 'My Tournaments', url: '/my-tournaments', description: 'Tournaments you\'re registered for', keywords: ['my tournaments', 'registered', 'upcoming'], icon: Trophy, type: 'dashboard', requiresAuth: true },
  { id: 'account', title: 'Account Settings', url: '/account', description: 'Manage your account', keywords: ['account', 'settings', 'profile', 'preferences'], icon: Settings, type: 'dashboard', requiresAuth: true },

  // Role-specific pages
  { id: 'judge-dashboard', title: 'Judge Dashboard', url: '/judge', description: 'Judge management and assignments', keywords: ['judge', 'judging', 'ballots', 'assignments'], icon: Gavel, type: 'dashboard', requiresAuth: true, roles: ['judge', 'admin'] },
  { id: 'observer', title: 'Observer Dashboard', url: '/observer', description: 'Observe debates', keywords: ['observer', 'spectate', 'watch'], icon: Eye, type: 'dashboard', requiresAuth: true },
  { id: 'sponsor-dashboard', title: 'Sponsor Dashboard', url: '/sponsor/dashboard', description: 'Manage your sponsorship', keywords: ['sponsor', 'sponsorship', 'dashboard'], icon: Building, type: 'dashboard', requiresAuth: true },

  // Admin pages
  { id: 'admin', title: 'Admin Dashboard', url: '/admin', description: 'Administration overview', keywords: ['admin', 'administration', 'management'], icon: Shield, type: 'admin', isAdminOnly: true },
  { id: 'admin-tournaments', title: 'Tournament Manager', url: '/admin?tab=tournaments', description: 'Manage all tournaments', keywords: ['admin', 'tournaments', 'manage', 'create'], icon: Trophy, type: 'admin', isAdminOnly: true },
  { id: 'admin-users', title: 'User Manager', url: '/admin?tab=users', description: 'Manage user accounts', keywords: ['admin', 'users', 'accounts', 'members'], icon: Users, type: 'admin', isAdminOnly: true },
  { id: 'admin-judges', title: 'Judges Manager', url: '/admin?tab=judges', description: 'Manage judge profiles', keywords: ['admin', 'judges', 'adjudicators'], icon: Gavel, type: 'admin', isAdminOnly: true },
  { id: 'admin-sponsors', title: 'Sponsors Manager', url: '/admin?tab=sponsors', description: 'Manage sponsors', keywords: ['admin', 'sponsors', 'partnerships'], icon: Building, type: 'admin', isAdminOnly: true },
  { id: 'admin-blog', title: 'Blog Manager', url: '/admin?tab=blog', description: 'Manage blog posts', keywords: ['admin', 'blog', 'posts', 'content'], icon: FileText, type: 'admin', isAdminOnly: true },
  { id: 'admin-email', title: 'Email Manager', url: '/admin?tab=email', description: 'Manage email templates', keywords: ['admin', 'email', 'templates', 'notifications'], icon: Mail, type: 'admin', isAdminOnly: true },
  { id: 'admin-payments', title: 'Payment Manager', url: '/admin?tab=payments', description: 'Manage payments and transactions', keywords: ['admin', 'payments', 'transactions', 'finance'], icon: CreditCard, type: 'admin', isAdminOnly: true },
  { id: 'admin-security', title: 'Security Dashboard', url: '/admin?tab=security', description: 'Security settings and audit logs', keywords: ['admin', 'security', 'audit', 'logs'], icon: Shield, type: 'admin', isAdminOnly: true },
  { id: 'admin-tabulation', title: 'Tabulation Platform', url: '/admin?tab=tabulation', description: 'Tournament tabulation tools', keywords: ['admin', 'tabulation', 'tab', 'pairings', 'results'], icon: BarChart3, type: 'admin', isAdminOnly: true },
];

const RECENT_SEARCHES_KEY = 'ziggy_recent_searches';
const MAX_RECENT = 5;

// Fuzzy matching algorithm
function fuzzyMatch(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Exact match bonus
  if (lowerText === lowerQuery) return 150;
  if (lowerText.includes(lowerQuery)) return 100;
  
  // Word start match bonus
  const words = lowerText.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(lowerQuery)) return 80;
  }
  
  // Character sequence match (fuzzy)
  let queryIdx = 0;
  let score = 0;
  let consecutiveBonus = 0;
  
  for (let i = 0; i < lowerText.length && queryIdx < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIdx]) {
      score += 10 + consecutiveBonus;
      consecutiveBonus += 5;
      queryIdx++;
    } else {
      consecutiveBonus = 0;
    }
  }
  
  return queryIdx === lowerQuery.length ? score : 0;
}

// Parse search tags from query
function parseSearchQuery(query: string): { cleanQuery: string; tags: string[] } {
  const tagRegex = /#(\w+)/g;
  const tags: string[] = [];
  let match;
  
  while ((match = tagRegex.exec(query)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  
  const cleanQuery = query.replace(tagRegex, '').trim();
  return { cleanQuery, tags };
}

// Context type
interface GlobalSearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  results: GlobalSearchResult[];
  groupedResults: Record<string, GlobalSearchResult[]>;
  recentSearches: GlobalSearchResult[];
  addToRecent: (result: GlobalSearchResult) => void;
  user: any;
  isAdmin: boolean;
}

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, isAdmin } = useOptimizedAuth();

  // Fetch tournaments for search
  const { data: tournaments } = useQuery({
    queryKey: ['search-tournaments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('id, name, format, status, description, start_date')
        .order('start_date', { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

  // Fetch published blog posts
  const { data: blogPosts } = useQuery({
    queryKey: ['search-blogs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, tags')
        .eq('status', 'published')
        .limit(30);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

  // Get recent searches from localStorage
  const getRecentSearches = useCallback((): GlobalSearchResult[] => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Add to recent searches
  const addToRecent = useCallback((result: GlobalSearchResult) => {
    try {
      const recent = getRecentSearches();
      const updated = [
        { ...result, matchScore: 0 },
        ...recent.filter((r) => r.id !== result.id)
      ].slice(0, MAX_RECENT);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }, [getRecentSearches]);

  // Filter and score results
  const results = useMemo((): GlobalSearchResult[] => {
    if (!searchTerm.trim()) return [];

    const { cleanQuery, tags } = parseSearchQuery(searchTerm);
    if (!cleanQuery && tags.length === 0) return [];

    const allResults: GlobalSearchResult[] = [];

    // Filter static pages
    for (const page of staticPages) {
      // Role-based filtering
      if (page.isAdminOnly && !isAdmin) continue;
      if (page.requiresAuth && !user) continue;
      if (page.roles && !page.roles.includes(profile?.role || '')) {
        if (!isAdmin) continue;
      }

      // Tag filtering
      if (tags.length > 0) {
        const typeMatch = tags.some(tag => 
          page.type.includes(tag) || 
          page.keywords.some(k => k.includes(tag))
        );
        if (!typeMatch) continue;
      }

      // Calculate match score
      let score = 0;
      if (cleanQuery) {
        score = Math.max(
          fuzzyMatch(page.title, cleanQuery) * 1.5,
          fuzzyMatch(page.description, cleanQuery),
          ...page.keywords.map(k => fuzzyMatch(k, cleanQuery) * 1.2)
        );
      } else if (tags.length > 0) {
        score = 50; // Base score for tag-only matches
      }

      if (score > 0) {
        allResults.push({
          id: page.id,
          title: page.title,
          type: page.type,
          url: page.url,
          description: page.description,
          icon: page.icon,
          isAdminOnly: page.isAdminOnly,
          tags: page.keywords,
          matchScore: score,
        });
      }
    }

    // Add tournament results
    if (tournaments && cleanQuery) {
      for (const tournament of tournaments) {
        const score = Math.max(
          fuzzyMatch(tournament.name, cleanQuery) * 1.5,
          fuzzyMatch(tournament.description || '', cleanQuery),
          fuzzyMatch(tournament.format || '', cleanQuery)
        );

        if (score > 0) {
          allResults.push({
            id: `tournament-${tournament.id}`,
            title: tournament.name,
            type: 'tournament',
            url: `/tournaments/${tournament.id}`,
            description: tournament.description || `${tournament.format} tournament`,
            icon: Trophy,
            matchScore: score,
          });
        }
      }
    }

    // Add blog post results
    if (blogPosts && cleanQuery) {
      for (const post of blogPosts) {
        const score = Math.max(
          fuzzyMatch(post.title, cleanQuery) * 1.5,
          fuzzyMatch(post.excerpt || '', cleanQuery),
          ...(post.tags || []).map((t: string) => fuzzyMatch(t, cleanQuery))
        );

        if (score > 0) {
          allResults.push({
            id: `blog-${post.id}`,
            title: post.title,
            type: 'blog',
            url: `/blog/${post.slug}`,
            description: post.excerpt || 'Blog post',
            icon: FileText,
            matchScore: score,
          });
        }
      }
    }

    // Sort by score descending
    return allResults.sort((a, b) => b.matchScore - a.matchScore).slice(0, 20);
  }, [searchTerm, tournaments, blogPosts, user, profile, isAdmin]);

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, GlobalSearchResult[]> = {
      page: [],
      dashboard: [],
      tournament: [],
      blog: [],
      admin: [],
    };

    for (const result of results) {
      groups[result.type]?.push(result);
    }

    return groups;
  }, [results]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // "/" to open (when not in input)
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const value: GlobalSearchContextType = {
    searchTerm,
    setSearchTerm,
    isOpen,
    setIsOpen,
    results,
    groupedResults,
    recentSearches: getRecentSearches(),
    addToRecent,
    user,
    isAdmin,
  };

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return context;
}
