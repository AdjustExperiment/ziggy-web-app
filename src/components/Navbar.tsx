import React, { useMemo, memo, lazy, Suspense, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { LazyImage } from '@/components/LazyImage';
import LazyGlobalSearch from './LazyGlobalSearch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  BarChart3, 
  FileText, 
  Users, 
  User,
  Settings,
  LogOut,
  Trophy,
  Info,
  ChevronDown,
  Home,
  HelpCircle,
  Menu,
  X,
  ScrollText,
  BookOpen,
  Gavel,
  Eye,
  Building,
  Search,
  Bell
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Lazy load notification components - only needed when user is logged in
const UserNotifications = lazy(() => import('./UserNotifications').then(m => ({ default: m.UserNotifications })));
const NotificationsDropdown = lazy(() => import('./admin/NotificationsDropdown').then(m => ({ default: m.NotificationsDropdown })));

// Notification loading fallback
const NotificationFallback = () => (
  <Button variant="ghost" size="sm" disabled className="relative">
    <Bell className="h-4 w-4 animate-pulse" />
  </Button>
);

function NavbarComponent() {
  const { user, profile, signOut, isAdmin } = useOptimizedAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Detect platform for keyboard shortcut display
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  }, []);
  const modifierKey = isMac ? '⌘' : 'Ctrl+';

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <LazyImage 
                src="/lovable-uploads/760b99f2-12c5-4e29-8b02-5d93d41f41a9.png" 
                alt="Ziggy" 
                className="h-8 w-8 rounded-full border-2 border-border" 
              />
              <span className="text-lg sm:text-xl font-bold">Ziggy Online Debate</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex ml-8 items-baseline space-x-6">

              {/* Tournaments Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 text-xs hover:text-primary transition-colors p-0 h-auto">
                    <Trophy className="h-4 w-4" />
                    <span>Tournaments</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-[60]">
                  <DropdownMenuItem asChild>
                    <Link to="/tournaments" className="flex items-center">
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>Browse Tournaments</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/results" className="flex items-center">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Results</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/host-tournament" className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Host a Tournament</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Partners Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 text-xs hover:text-primary transition-colors p-0 h-auto">
                    <Users className="h-4 w-4" />
                    <span>Partners</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-[60]">
                  <DropdownMenuItem asChild>
                    <Link to="/club-partners" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Club Partners</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/ambassador" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Ambassador Program</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/sponsors" className="flex items-center">
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>Sponsors</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/sponsor" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Become a Sponsor</span>
                    </Link>
                  </DropdownMenuItem>
                  {user && (
                    <DropdownMenuItem asChild>
                      <Link to="/sponsor/dashboard" className="flex items-center">
                        <Building className="mr-2 h-4 w-4" />
                        <span>Sponsor Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Resources Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 text-xs hover:text-primary transition-colors p-0 h-auto">
                    <Info className="h-4 w-4" />
                    <span>Resources</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-[60]">
                  <DropdownMenuItem asChild>
                    <Link to="/about" className="flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      <span>About Us</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/getting-started" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Getting Started</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/learn-about-debate" className="flex items-center">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <span>Learn about Debate</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rules" className="flex items-center">
                      <ScrollText className="mr-2 h-4 w-4" />
                      <span>Rules</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/faq" className="flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>FAQ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contact" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Contact</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/blog" className="flex items-center space-x-1 text-xs hover:text-primary transition-colors">
                <FileText className="h-4 w-4" />
                <span>Blog</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Global Search - lazy loaded */}
            <LazyGlobalSearch className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground" />

            <LanguageSelector />
            <ThemeToggle />
            
            {user ? (
              <>
                {isAdmin && (
                  <Suspense fallback={<NotificationFallback />}>
                    <NotificationsDropdown />
                  </Suspense>
                )}
                <Suspense fallback={<NotificationFallback />}>
                  <UserNotifications />
                </Suspense>
                
                {/* Desktop Dashboard Dropdown */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1 text-sm hover:text-primary transition-colors p-1">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden lg:inline">Dashboard</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="z-[60]">
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="flex items-center">
                          <Home className="mr-2 h-4 w-4" />
                          <span>My Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/my-tournaments" className="flex items-center">
                          <Trophy className="mr-2 h-4 w-4" />
                          <span>My Tournaments</span>
                        </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                         <Link to="/portal" className="flex items-center">
                           <Users className="mr-2 h-4 w-4" />
                           <span>Participant Portal (Legacy)</span>
                         </Link>
                       </DropdownMenuItem>
                       {profile?.role === 'judge' && (
                         <DropdownMenuItem asChild>
                           <Link to="/judge" className="flex items-center">
                             <Gavel className="mr-2 h-4 w-4" />
                             <span>Judge Dashboard</span>
                           </Link>
                         </DropdownMenuItem>
                       )}
                       <DropdownMenuItem asChild>
                         <Link to="/observer" className="flex items-center">
                           <Eye className="mr-2 h-4 w-4" />
                           <span>Observer Dashboard</span>
                         </Link>
                       </DropdownMenuItem>
                       {isAdmin && (
                         <DropdownMenuItem asChild>
                           <Link to="/admin" className="flex items-center">
                             <Settings className="mr-2 h-4 w-4" />
                             <span>Admin Dashboard</span>
                           </Link>
                         </DropdownMenuItem>
                       )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Desktop User Account Dropdown */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span className="hidden lg:inline">{displayName}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link to="/account" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Account Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut} className="flex items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/tournaments">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden touch-target p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden animate-mobile-slide-up">
            <div className="mobile-px pt-2 pb-3 space-y-1 bg-background/95 backdrop-blur-md border-b border-border max-h-[calc(100vh-4rem)] overflow-y-auto">
              
              {/* Tournaments Group */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Tournaments</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-8 space-y-1">
                  <Link
                    to="/tournaments"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Browse Tournaments</span>
                  </Link>
                  <Link
                    to="/results"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Results</span>
                  </Link>
                  <Link
                    to="/host-tournament"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Host a Tournament</span>
                  </Link>
                </CollapsibleContent>
              </Collapsible>

              {/* Partners Group */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Partners</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-8 space-y-1">
                  <Link
                    to="/club-partners"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    <span>Club Partners</span>
                  </Link>
                  <Link
                    to="/ambassador"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Ambassador Program</span>
                  </Link>
                  <Link
                    to="/sponsors"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Sponsors</span>
                  </Link>
                  <Link
                    to="/sponsor"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    <span>Become a Sponsor</span>
                  </Link>
                  {user && (
                    <Link
                      to="/sponsor/dashboard"
                      className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Building className="h-4 w-4" />
                      <span>Sponsor Dashboard</span>
                    </Link>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Resources Group */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target">
                  <div className="flex items-center space-x-2">
                    <Info className="h-5 w-5" />
                    <span>Resources</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-8 space-y-1">
                  <Link
                    to="/about"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Info className="h-4 w-4" />
                    <span>About Us</span>
                  </Link>
                  <Link
                    to="/getting-started"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Getting Started</span>
                  </Link>
                  <Link
                    to="/learn-about-debate"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Learn about Debate</span>
                  </Link>
                  <Link
                    to="/rules"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ScrollText className="h-4 w-4" />
                    <span>Rules</span>
                  </Link>
                  <Link
                    to="/faq"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>FAQ</span>
                  </Link>
                  <Link
                    to="/contact"
                    className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    <span>Contact</span>
                  </Link>
                </CollapsibleContent>
              </Collapsible>

              {/* Blog - Direct Link */}
              <Link
                to="/blog"
                className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FileText className="h-5 w-5" />
                <span>Blog</span>
              </Link>

              <Separator className="my-2" />

              {user ? (
                <>
                  {/* Dashboard Group */}
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>Dashboard</span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-8 space-y-1">
                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Home className="h-4 w-4" />
                        <span>My Dashboard</span>
                      </Link>
                      <Link
                        to="/my-tournaments"
                        className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Trophy className="h-4 w-4" />
                        <span>My Tournaments</span>
                      </Link>
                      <Link
                        to="/portal"
                        className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Users className="h-4 w-4" />
                        <span>Participant Portal (Legacy)</span>
                      </Link>
                      {profile?.role === 'judge' && (
                        <Link
                          to="/judge"
                          className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Gavel className="h-4 w-4" />
                          <span>Judge Dashboard</span>
                        </Link>
                      )}
                      <Link
                        to="/observer"
                        className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Eye className="h-4 w-4" />
                        <span>Observer Dashboard</span>
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-sm hover:bg-muted touch-target"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Account - Direct Link */}
                  <Link
                    to="/account"
                    className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Account Settings</span>
                  </Link>

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted w-full text-left touch-target text-destructive"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign out</span>
                  </button>
                </>
              ) : (
                <div className="space-y-3 px-3 py-2">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start touch-target">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/tournaments" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full justify-start touch-target">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}

export const Navbar = memo(NavbarComponent);
