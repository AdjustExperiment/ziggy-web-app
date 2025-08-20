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
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img src="/lovable-uploads/bb7e942b-4006-461c-b9ed-9bdde6f1500c.png" alt="Debate Champions Logo" className="rounded-full" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground/80 hover:text-primary transition-smooth font-medium"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Search & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tournaments..."
                className="w-64 pl-10 bg-muted/50 border-border/50"
              />
            </div>
            
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Platform
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Team Login</DropdownMenuItem>
                <DropdownMenuItem>Admin Portal</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t bg-card/95 backdrop-blur-sm">
            <div className="px-2 py-3 space-y-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-foreground/80 hover:text-primary transition-smooth"
                >
                  {item.name}
                </a>
              ))}
              <div className="px-3 py-2">
                <Input placeholder="Search..." className="w-full" />
              </div>
              <div className="flex space-x-2 px-3">
                <Button variant="outline" size="sm" className="flex-1">
                  Platform
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  Login
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}