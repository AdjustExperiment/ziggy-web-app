import React, { useMemo, memo, lazy, Suspense, useState, useCallback, useEffect, useRef } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSelector } from './LanguageSelector';
import { LazyImage } from '@/components/LazyImage';
import LazyGlobalSearch from './LazyGlobalSearch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
  Bell,
  GripHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Lazy load unified notification dropdown - only needed when user is logged in
const UnifiedNotificationDropdown = lazy(() => import('./UnifiedNotificationDropdown').then(m => ({ default: m.UnifiedNotificationDropdown })));

// Notification loading fallback
const NotificationFallback = () => (
  <Button variant="ghost" size="sm" disabled className="relative">
    <Bell className="h-4 w-4 animate-pulse" />
  </Button>
);

// Mobile nav link with active state
interface MobileNavLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}

const MobileNavLink = ({ to, icon, children, onClick }: MobileNavLinkProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center space-x-3 px-4 min-h-[48px] rounded-lg text-sm transition-colors",
        isActive 
          ? "bg-accent text-foreground border-l-2 border-primary font-medium" 
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

// Mobile nav section header
const MobileNavSectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground font-medium">
    {children}
  </div>
);

// Check if any child routes are active
const useIsChildRouteActive = (routes: string[]) => {
  const location = useLocation();
  return routes.some(route => location.pathname === route || location.pathname.startsWith(route + '/'));
};

function NavbarComponent() {
  const { user, profile, signOut, isAdmin } = useOptimizedAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Swipe-to-close state
  const swipeHandleRef = useRef<HTMLDivElement>(null);
  const swipeStartY = useRef<number | null>(null);
  
  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  
  // Detect platform for keyboard shortcut display
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  }, []);
  const modifierKey = isMac ? '⌘' : 'Ctrl+';

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';

  // Close mobile menu
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);
  
  // Swipe-to-close handlers
  const handleSwipeStart = useCallback((e: React.PointerEvent) => {
    swipeStartY.current = e.clientY;
  }, []);
  
  const handleSwipeMove = useCallback((e: React.PointerEvent) => {
    if (swipeStartY.current === null) return;
    const deltaY = e.clientY - swipeStartY.current;
    // If user swipes down more than 60px, close the sheet
    if (deltaY > 60) {
      setIsMobileMenuOpen(false);
      swipeStartY.current = null;
    }
  }, []);
  
  const handleSwipeEnd = useCallback(() => {
    swipeStartY.current = null;
  }, []);

  // Check if section has active child
  const isTournamentsActive = useIsChildRouteActive(['/tournaments', '/results', '/host-tournament']);
  const isPartnersActive = useIsChildRouteActive(['/club-partners', '/ambassador', '/sponsors', '/sponsor']);
  const isResourcesActive = useIsChildRouteActive(['/about', '/getting-started', '/learn-about-debate', '/rules', '/faq', '/contact']);
  const isDashboardActive = useIsChildRouteActive(['/dashboard', '/my-tournaments', '/portal', '/judge', '/observer', '/admin']);

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
                <Suspense fallback={<NotificationFallback />}>
                  <UnifiedNotificationDropdown />
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
              className="lg:hidden min-h-[48px] min-w-[48px] p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Navigation Sheet */}
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-2xl px-0 pb-0 lg:hidden"
      >
        {/* Swipe handle */}
        <div 
          ref={swipeHandleRef}
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handleSwipeStart}
          onPointerMove={handleSwipeMove}
          onPointerUp={handleSwipeEnd}
          onPointerCancel={handleSwipeEnd}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Scrollable content */}
        <div className="overflow-y-auto h-[calc(85vh-48px)] px-2 pb-8 mobile-scroll">
          
          {/* Tournaments Section */}
          <MobileNavSectionHeader>Tournaments</MobileNavSectionHeader>
          <Collapsible defaultOpen={isTournamentsActive}>
            <CollapsibleTrigger className={cn(
              "group flex items-center justify-between w-full px-4 min-h-[48px] rounded-lg text-base font-medium transition-colors",
              isTournamentsActive ? "bg-accent/50 text-foreground" : "hover:bg-muted"
            )}>
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5" />
                <span>Tournaments</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              <MobileNavLink to="/tournaments" icon={<Trophy className="h-4 w-4" />} onClick={closeMobileMenu}>
                Browse Tournaments
              </MobileNavLink>
              <MobileNavLink to="/results" icon={<BarChart3 className="h-4 w-4" />} onClick={closeMobileMenu}>
                Results
              </MobileNavLink>
              <MobileNavLink to="/host-tournament" icon={<Calendar className="h-4 w-4" />} onClick={closeMobileMenu}>
                Host a Tournament
              </MobileNavLink>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-3" />

          {/* Partners Section */}
          <MobileNavSectionHeader>Partners</MobileNavSectionHeader>
          <Collapsible defaultOpen={isPartnersActive}>
            <CollapsibleTrigger className={cn(
              "group flex items-center justify-between w-full px-4 min-h-[48px] rounded-lg text-base font-medium transition-colors",
              isPartnersActive ? "bg-accent/50 text-foreground" : "hover:bg-muted"
            )}>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5" />
                <span>Partners</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              <MobileNavLink to="/club-partners" icon={<Users className="h-4 w-4" />} onClick={closeMobileMenu}>
                Club Partners
              </MobileNavLink>
              <MobileNavLink to="/ambassador" icon={<User className="h-4 w-4" />} onClick={closeMobileMenu}>
                Ambassador Program
              </MobileNavLink>
              <MobileNavLink to="/sponsors" icon={<Trophy className="h-4 w-4" />} onClick={closeMobileMenu}>
                Sponsors
              </MobileNavLink>
              <MobileNavLink to="/sponsor" icon={<Users className="h-4 w-4" />} onClick={closeMobileMenu}>
                Become a Sponsor
              </MobileNavLink>
              {user && (
                <MobileNavLink to="/sponsor/dashboard" icon={<Building className="h-4 w-4" />} onClick={closeMobileMenu}>
                  Sponsor Dashboard
                </MobileNavLink>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-3" />

          {/* Resources Section */}
          <MobileNavSectionHeader>Resources</MobileNavSectionHeader>
          <Collapsible defaultOpen={isResourcesActive}>
            <CollapsibleTrigger className={cn(
              "group flex items-center justify-between w-full px-4 min-h-[48px] rounded-lg text-base font-medium transition-colors",
              isResourcesActive ? "bg-accent/50 text-foreground" : "hover:bg-muted"
            )}>
              <div className="flex items-center space-x-3">
                <Info className="h-5 w-5" />
                <span>Resources</span>
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              <MobileNavLink to="/about" icon={<Info className="h-4 w-4" />} onClick={closeMobileMenu}>
                About Us
              </MobileNavLink>
              <MobileNavLink to="/getting-started" icon={<FileText className="h-4 w-4" />} onClick={closeMobileMenu}>
                Getting Started
              </MobileNavLink>
              <MobileNavLink to="/learn-about-debate" icon={<BookOpen className="h-4 w-4" />} onClick={closeMobileMenu}>
                Learn about Debate
              </MobileNavLink>
              <MobileNavLink to="/rules" icon={<ScrollText className="h-4 w-4" />} onClick={closeMobileMenu}>
                Rules
              </MobileNavLink>
              <MobileNavLink to="/faq" icon={<HelpCircle className="h-4 w-4" />} onClick={closeMobileMenu}>
                FAQ
              </MobileNavLink>
              <MobileNavLink to="/contact" icon={<Users className="h-4 w-4" />} onClick={closeMobileMenu}>
                Contact
              </MobileNavLink>
            </CollapsibleContent>
          </Collapsible>

          {/* Blog - Direct Link */}
          <div className="mt-1">
            <MobileNavLink to="/blog" icon={<FileText className="h-5 w-5" />} onClick={closeMobileMenu}>
              Blog
            </MobileNavLink>
          </div>

          <Separator className="my-3" />

          {user ? (
            <>
              {/* Account Section */}
              <MobileNavSectionHeader>Account</MobileNavSectionHeader>
              
              {/* Dashboard Group */}
              <Collapsible defaultOpen={isDashboardActive}>
                <CollapsibleTrigger className={cn(
                  "group flex items-center justify-between w-full px-4 min-h-[48px] rounded-lg text-base font-medium transition-colors",
                  isDashboardActive ? "bg-accent/50 text-foreground" : "hover:bg-muted"
                )}>
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="h-5 w-5" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 space-y-1 mt-1">
                  <MobileNavLink to="/dashboard" icon={<Home className="h-4 w-4" />} onClick={closeMobileMenu}>
                    My Dashboard
                  </MobileNavLink>
                  <MobileNavLink to="/my-tournaments" icon={<Trophy className="h-4 w-4" />} onClick={closeMobileMenu}>
                    My Tournaments
                  </MobileNavLink>
                  <MobileNavLink to="/portal" icon={<Users className="h-4 w-4" />} onClick={closeMobileMenu}>
                    Participant Portal (Legacy)
                  </MobileNavLink>
                  {profile?.role === 'judge' && (
                    <MobileNavLink to="/judge" icon={<Gavel className="h-4 w-4" />} onClick={closeMobileMenu}>
                      Judge Dashboard
                    </MobileNavLink>
                  )}
                  <MobileNavLink to="/observer" icon={<Eye className="h-4 w-4" />} onClick={closeMobileMenu}>
                    Observer Dashboard
                  </MobileNavLink>
                  {isAdmin && (
                    <MobileNavLink to="/admin" icon={<Settings className="h-4 w-4" />} onClick={closeMobileMenu}>
                      Admin Dashboard
                    </MobileNavLink>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Account Settings - Direct Link */}
              <div className="mt-1">
                <MobileNavLink to="/account" icon={<User className="h-5 w-5" />} onClick={closeMobileMenu}>
                  Account Settings
                </MobileNavLink>
              </div>

              {/* Sign Out */}
              <div className="mt-3">
                <button
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                  className="flex items-center space-x-3 px-4 min-h-[48px] rounded-lg text-base font-medium hover:bg-destructive/10 w-full text-left text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 px-4 pt-2">
              <Link to="/login" onClick={closeMobileMenu}>
                <Button variant="outline" className="w-full justify-center min-h-[48px]">
                  Sign in
                </Button>
              </Link>
              <Link to="/tournaments" onClick={closeMobileMenu}>
                <Button className="w-full justify-center min-h-[48px]">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}

export const Navbar = memo(NavbarComponent);
