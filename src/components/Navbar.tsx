import { useState, useRef, useEffect } from "react";
import { Search, Menu, X, ExternalLink, User, ChevronDown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import debateLogo from "@/assets/debate-logo.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useNavbarSearch } from "@/hooks/useNavbarSearch";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const navigation = [
  { name: "Results", href: "/results" },
  { name: "Blog", href: "/blog" },
];

const adminNavigation = [
  { name: "Teams", href: "/teams" },
];

const dashboardNavigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Analytics", href: "/analytics" },
];

const aboutNavigation = [
  { name: "About Us", href: "/about" },
  { name: "Getting Started", href: "/getting-started" },
  { name: "Features", href: "/features" },
  { name: "Testimonials", href: "/testimonials" },
  { name: "Contact", href: "/contact" },
  { name: "FAQ", href: "/faq" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const { isAdmin } = useAuth();
  const { searchTerm, setSearchTerm, results, isSearching, showResults, clearSearch, setShowResults } = useNavbarSearch();
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Navigate to open tournament registration
  const goToOpenRegistration = async () => {
    setNavigationLoading(true);
    try {
      // First, try to find tournaments with registration_open = true
      let { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('id')
        .eq('registration_open', true)
        .order('start_date', { ascending: true })
        .limit(1);

      // If no tournaments with registration_open = true, try status = 'Registration Open'
      if (!tournaments || tournaments.length === 0) {
        const { data: fallbackTournaments } = await supabase
          .from('tournaments')
          .select('id')
          .ilike('status', '%registration%open%')
          .order('start_date', { ascending: true })
          .limit(1);
        tournaments = fallbackTournaments;
      }

      if (tournaments && tournaments.length > 0) {
        navigate(`/tournament/${tournaments[0].id}/register`);
      } else {
        // No open tournaments, go to tournaments page
        navigate('/tournaments');
      }
    } catch (error) {
      console.error('Error finding open tournament:', error);
      navigate('/tournaments');
    } finally {
      setNavigationLoading(false);
    }
  };

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowResults]);

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-lg border-border animate-fade-in rounded-b-2xl overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-background/80 rounded-b-2xl backdrop-blur-sm">
        <div className="flex h-24 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <a href="/" className="hover:scale-105 transition-transform duration-300">
              <img 
                src="/lovable-uploads/6e80f49d-b786-40a0-b14e-b90c43b076af.png" 
                alt="Debate Champions Logo" 
                className="h-16 sm:h-18 lg:h-20 w-auto object-contain border-2 border-white rounded-full" 
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-12">
            <div className="flex items-center space-x-8">
              {/* About Dropdown */}
              <DropdownMenu open={aboutOpen} onOpenChange={setAboutOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-foreground hover:text-primary transition-all duration-300 font-medium text-sm flex items-center gap-2 hover:bg-primary/10 relative group"
                  >
                    About 
                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${aboutOpen ? 'rotate-180' : ''}`} />
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background/95 border-border backdrop-blur-lg min-w-[200px] animate-scale-in rounded-xl z-50">
                  {aboutNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <a
                        href={item.href}
                        className="block px-4 py-2 text-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300 text-sm"
                      >
                        {item.name}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Dashboard Dropdown */}
              <DropdownMenu open={dashboardOpen} onOpenChange={setDashboardOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-foreground hover:text-primary transition-all duration-300 font-medium text-sm flex items-center gap-2 hover:bg-primary/10 relative group"
                  >
                    Dashboard 
                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${dashboardOpen ? 'rotate-180' : ''}`} />
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background/95 border-border backdrop-blur-lg min-w-[200px] animate-scale-in rounded-xl z-50">
                  {dashboardNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <a
                        href={item.href}
                        className="block px-4 py-2 text-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-300 text-sm"
                      >
                        {item.name}
                      </a>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Regular Navigation Items */}
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-all duration-300 font-medium text-sm relative group"
                >
                  {item.name}
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </a>
              ))}
              
              {/* Admin Navigation Items */}
              {isAdmin && adminNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-foreground hover:text-primary transition-all duration-300 font-medium text-sm relative group"
                >
                  {item.name}
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </a>
              ))}
            </div>
          </div>

          {/* Search & Actions */}
          <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
            <div className="relative" ref={searchRef}>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary animate-spin" />
                )}
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setShowResults(true)}
                  className="w-48 xl:w-64 pl-10 pr-10 bg-background/50 border-border text-foreground placeholder:text-muted-foreground text-sm font-secondary focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300"
                />
              </div>
              
              {/* Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 border border-border rounded-lg backdrop-blur-lg shadow-tournament z-[100] max-h-80 overflow-y-auto animate-scale-in">
                  {results.length > 0 ? (
                    <div className="py-2">
                      {results.map((result) => (
                        <a
                          key={result.id}
                          href={result.url}
                          className="block px-4 py-3 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 border-b border-border last:border-b-0"
                          onClick={() => {
                            clearSearch();
                            setShowResults(false);
                          }}
                        >
                          <div className="font-medium text-sm">{result.title}</div>
                          {result.description && (
                            <div className="text-xs text-muted-foreground mt-1">{result.description}</div>
                          )}
                          <div className="text-xs text-primary/70 capitalize mt-1">{result.type}</div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                      No results found for "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <a href="/tournaments">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-secondary transition-all duration-300 hover:scale-105 rounded-xl"
              >
                Sign Up
              </Button>
            </a>
            
            <a href="https://tournament.ziggyonlinedebate.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary text-sm font-secondary transition-all duration-300 hover:scale-105 rounded-xl">
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">Tournament App</span>
              </Button>
            </a>

            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground hover:text-primary hover:bg-primary/10 text-sm font-secondary transition-all duration-300 hover:scale-105">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background/95 border-border backdrop-blur-lg animate-scale-in">
                <DropdownMenuItem 
                  className="text-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-all duration-300"
                  onClick={() => window.location.href = '/login?type=team'}
                >
                  Team Login
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-all duration-300"
                  onClick={() => window.location.href = '/login?type=individual'}
                >
                  Individual Login
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-foreground hover:text-primary hover:bg-primary/10 cursor-pointer transition-all duration-300"
                  onClick={() => window.location.href = '/login?type=admin'}
                >
                  Admin Portal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-foreground hover:text-primary min-h-[44px] min-w-[44px] transition-all duration-300 hover:scale-110"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? 
              <X className="h-6 w-6 rotate-90 transition-transform duration-300" /> : 
              <Menu className="h-6 w-6 hover:rotate-12 transition-transform duration-300" />
            }
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden border-t bg-background/95 backdrop-blur-sm border-border animate-slide-in-right">
            <div className="px-4 py-4 space-y-4">
              {/* About dropdown items */}
              <div className="space-y-2">
                <div className="px-4 py-2 text-primary font-medium text-sm font-secondary">About</div>
                {aboutNavigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block px-8 py-2 text-foreground hover:text-primary transition-all duration-300 text-base rounded-lg hover:bg-primary/5 min-h-[44px] flex items-center font-secondary hover:translate-x-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              {/* Dashboard dropdown items */}
              <div className="space-y-2">
                <div className="px-4 py-2 text-primary font-medium text-sm font-secondary">Dashboard</div>
                {dashboardNavigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block px-8 py-2 text-foreground hover:text-primary transition-all duration-300 text-base rounded-lg hover:bg-primary/5 min-h-[44px] flex items-center font-secondary hover:translate-x-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              {/* Main navigation items */}
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-foreground hover:text-primary transition-all duration-300 text-lg font-medium rounded-lg hover:bg-primary/5 min-h-[44px] flex items-center font-secondary hover:translate-x-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              
              {/* Admin navigation items */}
              {isAdmin && adminNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-foreground hover:text-primary transition-all duration-300 text-lg font-medium rounded-lg hover:bg-primary/5 min-h-[44px] flex items-center font-secondary hover:translate-x-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="px-4 py-2">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                  <Input 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 py-3 bg-background/50 border-border text-foreground placeholder:text-muted-foreground text-base min-h-[44px] font-secondary focus:border-primary transition-all duration-300" 
                  />
                </div>
              </div>
              <div className="px-4 space-y-3">
                <a href="/tournaments">
                  <Button 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-base min-h-[44px] font-secondary transition-all duration-300 hover:scale-105"
                  >
                    Sign Up
                  </Button>
                </a>
                <a href="https://tournament.ziggyonlinedebate.com" target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="outline" 
                    className="w-full border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary py-3 text-base min-h-[44px] font-secondary transition-all duration-300 hover:scale-105"
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Tournament App
                  </Button>
                </a>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full text-foreground hover:text-primary hover:bg-primary/10 py-3 text-base min-h-[44px] justify-start font-secondary transition-all duration-300 hover:translate-x-2"
                    onClick={() => { window.location.href = '/login?type=team'; setIsOpen(false); }}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Team Login
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-foreground hover:text-primary hover:bg-primary/10 py-3 text-base min-h-[44px] justify-start font-secondary transition-all duration-300 hover:translate-x-2"
                    onClick={() => { window.location.href = '/login?type=individual'; setIsOpen(false); }}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Individual Login
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-foreground hover:text-primary hover:bg-primary/10 py-3 text-base min-h-[44px] justify-start font-secondary transition-all duration-300 hover:translate-x-2"
                    onClick={() => { window.location.href = '/login?type=admin'; setIsOpen(false); }}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Admin Portal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}