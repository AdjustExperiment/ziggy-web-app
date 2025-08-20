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
            <img src="/lovable-uploads/bb7e942b-4006-461c-b9ed-9bdde6f1500c.png" alt="Debate Champions Logo" className="rounded-full" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-white hover:text-red-500 transition-smooth font-medium"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Search & Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <Input
                placeholder="Search tournaments..."
                className="w-64 pl-10 bg-black/50 border-white/20 text-white placeholder:text-white/70"
              />
            </div>
            
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-red-500 hover:border-red-500">
              <ExternalLink className="h-4 w-4 mr-2" />
              Platform
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:text-red-500 hover:bg-white/10">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black border-white/20">
                <DropdownMenuItem className="text-white hover:text-red-500 hover:bg-white/10">Team Login</DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:text-red-500 hover:bg-white/10">Admin Portal</DropdownMenuItem>
                <DropdownMenuItem className="text-white hover:text-red-500 hover:bg-white/10">Support</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white hover:text-red-500"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t bg-black/95 backdrop-blur-sm border-white/10">
            <div className="px-2 py-3 space-y-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-white hover:text-red-500 transition-smooth"
                >
                  {item.name}
                </a>
              ))}
              <div className="px-3 py-2">
                <Input placeholder="Search..." className="w-full bg-black/50 border-white/20 text-white placeholder:text-white/70" />
              </div>
              <div className="flex space-x-2 px-3">
                <Button variant="outline" size="sm" className="flex-1 border-white/30 text-white hover:bg-red-500 hover:border-red-500">
                  Platform
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 text-white hover:text-red-500">
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