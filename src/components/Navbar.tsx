import { useState } from "react";
import { Search, Menu, X, ExternalLink, User } from "lucide-react";
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
  { name: "Dashboard", href: "/dashboard" },
  { name: "Tournaments", href: "/tournaments" },
  { name: "Analytics", href: "/analytics" },
  { name: "Results", href: "/results" },
  { name: "Teams", href: "/teams" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b bg-black backdrop-blur-lg border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/bb7e942b-4006-461c-b9ed-9bdde6f1500c.png" 
              alt="Debate Champions Logo" 
              className="h-8 sm:h-10 w-auto rounded-full" 
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-white hover:text-red-500 transition-smooth font-medium text-sm xl:text-base"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Search & Actions */}
          <div className="hidden lg:flex items-center space-x-3 xl:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <Input
                placeholder="Search tournaments..."
                className="w-48 xl:w-64 pl-10 bg-black/50 border-white/20 text-white placeholder:text-white/70 text-sm"
              />
            </div>
            
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-red-500 hover:border-red-500 text-sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="hidden xl:inline">Platform</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:text-red-500 hover:bg-white/10 text-sm">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black border-white/20 z-50">
                <DropdownMenuItem 
                  className="text-white hover:text-red-500 hover:bg-white/10 cursor-pointer"
                  onClick={() => window.location.href = '/login?type=team'}
                >
                  Team Login
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:text-red-500 hover:bg-white/10 cursor-pointer"
                  onClick={() => window.location.href = '/login?type=individual'}
                >
                  Individual Login
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-white hover:text-red-500 hover:bg-white/10 cursor-pointer"
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
            className="lg:hidden text-white hover:text-red-500 min-h-[44px] min-w-[44px]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden border-t bg-black/95 backdrop-blur-sm border-white/10">
            <div className="px-4 py-4 space-y-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-3 text-white hover:text-red-500 transition-smooth text-lg font-medium rounded-lg hover:bg-white/5 min-h-[44px] flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
                  <Input 
                    placeholder="Search tournaments..." 
                    className="w-full pl-10 py-3 bg-black/50 border-white/20 text-white placeholder:text-white/70 text-base min-h-[44px]" 
                  />
                </div>
              </div>
              <div className="px-4 space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-white/30 text-white hover:bg-red-500 hover:border-red-500 py-3 text-base min-h-[44px]"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Platform
                </Button>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full text-white hover:text-red-500 hover:bg-white/10 py-3 text-base min-h-[44px] justify-start"
                    onClick={() => { window.location.href = '/login?type=team'; setIsOpen(false); }}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Team Login
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-white hover:text-red-500 hover:bg-white/10 py-3 text-base min-h-[44px] justify-start"
                    onClick={() => { window.location.href = '/login?type=individual'; setIsOpen(false); }}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Individual Login
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full text-white hover:text-red-500 hover:bg-white/10 py-3 text-base min-h-[44px] justify-start"
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