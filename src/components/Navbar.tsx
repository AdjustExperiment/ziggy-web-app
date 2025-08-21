import { useState } from "react";
import { Search, Menu, X, ExternalLink, User, ChevronDown } from "lucide-react";
import debateLogo from "@/assets/debate-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
  { name: "Results", href: "/results" },
  { name: "Teams", href: "/teams" },
  { name: "Blog", href: "/blog" },
];

const dashboardNavigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Analytics", href: "/analytics" },
];

const aboutNavigation = [
  { name: "About Us", href: "/about" },
  { name: "Features", href: "/features" },
  { name: "Testimonials", href: "/testimonials" },
  { name: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-black/95 backdrop-blur-lg border-white/10 animate-fade-in rounded-b-2xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/bb7e942b-4006-461c-b9ed-9bdde6f1500c.png" 
              alt="Debate Champions Logo" 
              className="h-12 sm:h-16 w-auto object-contain rounded-lg hover:scale-105 transition-transform duration-300" 
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-12">
            <div className="flex items-center space-x-8">
              {/* About Dropdown */}
              <DropdownMenu open={aboutOpen} onOpenChange={setAboutOpen}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:text-red-500 transition-all duration-300 font-medium text-sm flex items-center gap-2 hover:bg-white/5 relative group"
                  >
                    About 
                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${aboutOpen ? 'rotate-180' : ''}`} />
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/95 border-white/20 backdrop-blur-lg min-w-[200px] animate-scale-in rounded-xl z-50">
                  {aboutNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <a
                        href={item.href}
                        className="block px-4 py-2 text-white hover:text-red-500 hover:bg-white/10 rounded-lg transition-all duration-300 text-sm"
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
                    className="text-white hover:text-red-500 transition-all duration-300 font-medium text-sm flex items-center gap-2 hover:bg-white/5 relative group"
                  >
                    Dashboard 
                    <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${dashboardOpen ? 'rotate-180' : ''}`} />
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/95 border-white/20 backdrop-blur-lg min-w-[200px] animate-scale-in rounded-xl z-50">
                  {dashboardNavigation.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <a
                        href={item.href}
                        className="block px-4 py-2 text-white hover:text-red-500 hover:bg-white/10 rounded-lg transition-all duration-300 text-sm"
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
                  className="text-white hover:text-red-500 transition-all duration-300 font-medium text-sm relative group"
                >
                  {item.name}
                  <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </a>
              ))}
            </div>
          </div>

          {/* Search & Actions */}
          <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70 group-focus-within:text-red-500 transition-colors duration-300" />
              <Input
                placeholder="Search..."
                className="w-48 xl:w-64 pl-10 bg-black/50 border-white/20 text-white placeholder:text-white/70 text-sm font-secondary focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all duration-300"
              />
            </div>
            
            <Button className="bg-red-500 text-white hover:bg-red-600 border-red-500 text-sm font-secondary transition-all duration-300 hover:scale-105 rounded-xl">
              Sign Up
            </Button>
            
            <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 text-sm font-secondary transition-all duration-300 hover:scale-105 rounded-xl">
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="hidden xl:inline">Platform</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:text-red-500 hover:bg-white/10 text-sm font-secondary transition-all duration-300 hover:scale-105">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black/95 border-white/20 backdrop-blur-lg animate-scale-in">
                <DropdownMenuItem 
                  className="text-white hover:text-red-500 hover:bg-white/10 cursor-pointer transition-all duration-300"
                  onClick={() => window.location.href = '/login?type=team'}
                >
                  Team Login
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:text-red-500 hover:bg-white/10 cursor-pointer transition-all duration-300"
                  onClick={() => window.location.href = '/login?type=individual'}
                >
                  Individual Login
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:text-red-500 hover:bg-white/10 cursor-pointer transition-all duration-300"
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
            className="lg:hidden text-white hover:text-red-500 min-h-[44px] min-w-[44px] transition-all duration-300 hover:scale-110"
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
          <div className="lg:hidden border-t bg-black/95 backdrop-blur-sm border-white/10 animate-slide-in-right">
            <div className="px-4 py-4 space-y-4">
              {/* About dropdown items */}
              <div className="space-y-2">
                <div className="px-4 py-2 text-red-500 font-medium text-sm font-secondary">About</div>
                {aboutNavigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block px-8 py-2 text-white hover:text-red-500 transition-all duration-300 text-base rounded-lg hover:bg-white/5 min-h-[44px] flex items-center font-secondary hover:translate-x-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
              {/* Dashboard dropdown items */}
              <div className="space-y-2">
                <div className="px-4 py-2 text-red-500 font-medium text-sm font-secondary">Dashboard</div>
                {dashboardNavigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="block px-8 py-2 text-white hover:text-red-500 transition-all duration-300 text-base rounded-lg hover:bg-white/5 min-h-[44px] flex items-center font-secondary hover:translate-x-2"
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
                  className="block px-4 py-3 text-white hover:text-red-500 transition-all duration-300 text-lg font-medium rounded-lg hover:bg-white/5 min-h-[44px] flex items-center font-secondary hover:translate-x-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="px-4 py-2">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70 group-focus-within:text-red-500 transition-colors duration-300" />
                  <Input 
                    placeholder="Search..." 
                    className="w-full pl-10 py-3 bg-black/50 border-white/20 text-white placeholder:text-white/70 text-base min-h-[44px] font-secondary focus:border-red-500 transition-all duration-300" 
                  />
                </div>
              </div>
              <div className="px-4 space-y-3">
                <Button 
                  className="w-full bg-red-500 text-white hover:bg-red-600 py-3 text-base min-h-[44px] font-secondary transition-all duration-300 hover:scale-105"
                >
                  Sign Up
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 py-3 text-base min-h-[44px] font-secondary transition-all duration-300 hover:scale-105"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Platform
                </Button>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full text-white hover:text-red-500 hover:bg-white/10 py-3 text-base min-h-[44px] justify-start font-secondary transition-all duration-300 hover:translate-x-2"
                    onClick={() => { window.location.href = '/login?type=team'; setIsOpen(false); }}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Team Login
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-white hover:text-red-500 hover:bg-white/10 py-3 text-base min-h-[44px] justify-start font-secondary transition-all duration-300 hover:translate-x-2"
                    onClick={() => { window.location.href = '/login?type=individual'; setIsOpen(false); }}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Individual Login
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-white hover:text-red-500 hover:bg-white/10 py-3 text-base min-h-[44px] justify-start font-secondary transition-all duration-300 hover:translate-x-2"
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