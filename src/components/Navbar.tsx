
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsDropdown } from './admin/NotificationsDropdown';
import { LazyImage } from '@/components/LazyImage';
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
  ScrollText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const { user, profile, signOut, isAdmin } = useOptimizedAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/10 dark:bg-black/10 border-b border-white/20 dark:border-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <LazyImage 
                src="/lovable-uploads/760b99f2-12c5-4e29-8b02-5d93d41f41a9.png" 
                alt="Ziggy" 
                className="h-8 w-8 rounded-full border-2 border-white" 
              />
              <span className="text-lg sm:text-xl font-bold">Ziggy Online Debate</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex ml-10 items-baseline space-x-4">
              {/* About Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-1 hover:text-primary transition-colors">
                    <Info className="h-4 w-4" />
                    <span>About</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link to="/about" className="flex items-center">
                      <Info className="mr-2 h-4 w-4" />
                      <span>About Us</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/features" className="flex items-center">
                      <Trophy className="mr-2 h-4 w-4" />
                      <span>Features</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/getting-started" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Getting Started</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contact" className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      <span>Contact</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/faq" className="flex items-center">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>FAQ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/rules" className="flex items-center">
                      <ScrollText className="mr-2 h-4 w-4" />
                      <span>Rules</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/results" className="flex items-center space-x-1 hover:text-primary transition-colors">
                <BarChart3 className="h-4 w-4" />
                <span>Results</span>
              </Link>

              <Link to="/blog" className="flex items-center space-x-1 hover:text-primary transition-colors">
                <FileText className="h-4 w-4" />
                <span>Blog</span>
              </Link>

              <Link to="/sponsors" className="flex items-center space-x-1 hover:text-primary transition-colors">
                <Users className="h-4 w-4" />
                <span>Sponsors</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            
            {user ? (
              <>
                {isAdmin && <NotificationsDropdown />}
                
                {/* Desktop Dashboard Dropdown */}
                <div className="hidden sm:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center space-x-1 hover:text-primary transition-colors">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden lg:inline">Dashboard</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
            <div className="mobile-px pt-2 pb-3 space-y-1 bg-background/95 backdrop-blur-md border-b border-border">
              <Link
                to="/results"
                className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Results</span>
              </Link>

              <Link
                to="/about"
                className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Info className="h-5 w-5" />
                <span>About</span>
              </Link>

              <Link
                to="/blog"
                className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FileText className="h-5 w-5" />
                <span>Blog</span>
              </Link>

              <Link
                to="/rules"
                className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ScrollText className="h-5 w-5" />
                <span>Rules</span>
              </Link>

              <Link
                to="/sponsors"
                className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="h-5 w-5" />
                <span>Sponsors</span>
              </Link>

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home className="h-5 w-5" />
                    <span>My Dashboard</span>
                  </Link>

                  <Link
                    to="/my-tournaments"
                    className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Trophy className="h-5 w-5" />
                    <span>My Tournaments</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <Link
                    to="/account"
                    className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted touch-target"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-3 rounded-md text-base font-medium hover:bg-muted w-full text-left touch-target"
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
  );
}
