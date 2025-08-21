
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Menu, User, LogOut, Settings, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { NotificationsDropdown } from "./admin/NotificationsDropdown";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Tournaments", path: "/tournaments" },
    { name: "Results", path: "/results" },
  ];

  const aboutItems = [
    { name: "About Us", path: "/about" },
    { name: "Features", path: "/features" },
    { name: "Contact", path: "/contact" },
    { name: "FAQ", path: "/faq" },
    { name: "Getting Started", path: "/getting-started" },
  ];

  const dashboardItems = [
    { name: "Analytics", path: "/analytics" },
    { name: "Dashboard", path: "/dashboard" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isDashboardActive = dashboardItems.some(item => isActive(item.path));
  const isAboutActive = aboutItems.some(item => isActive(item.path));

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <img 
              src="/lovable-uploads/01b9369b-8e9b-46ad-9d8f-b4a1802b17b8.png" 
                alt="Ziggy Online Debate Logo"
              className="h-8 w-8 rounded-full border-2 border-white" 
            />
            <span className="hidden font-bold sm:inline-block">
              Ziggy Online Debate
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`transition-colors hover:text-foreground/80 ${
                  isActive(item.path) 
                    ? "text-foreground" 
                    : "text-foreground/60"
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* About Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`transition-colors hover:text-foreground/80 ${
                  isAboutActive ? "text-foreground" : "text-foreground/60"
                }`}>
                  About
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50 bg-background border">
                {aboutItems.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link to={item.path} className="cursor-pointer">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Dashboard Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`transition-colors hover:text-foreground/80 ${
                  isDashboardActive ? "text-foreground" : "text-foreground/60"
                }`}>
                  Dashboard
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50 bg-background border">
                {dashboardItems.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link to={item.path} className="cursor-pointer">
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <Link
              to="/"
              className="flex items-center space-x-2"
              onClick={() => setIsOpen(false)}
            >
              <img 
                src="/lovable-uploads/01b9369b-8e9b-46ad-9d8f-b4a1802b17b8.png" 
                alt="Ziggy Online Debate Logo"
                className="h-6 w-6 rounded-full border-2 border-white" 
              />
              <span className="font-bold">Ziggy Online Debate</span>
            </Link>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`transition-colors hover:text-foreground/80 ${
                      isActive(item.path) 
                        ? "text-foreground" 
                        : "text-foreground/60"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile About Items */}
                <div className="pt-2 space-y-2">
                  <p className="text-sm font-medium text-foreground/80">About</p>
                  {aboutItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`block pl-2 transition-colors hover:text-foreground/80 ${
                        isActive(item.path) 
                          ? "text-foreground" 
                          : "text-foreground/60"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                
                {/* Mobile Dashboard Items */}
                <div className="pt-2 space-y-2">
                  <p className="text-sm font-medium text-foreground/80">Dashboard</p>
                  {dashboardItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`block pl-2 transition-colors hover:text-foreground/80 ${
                        isActive(item.path) 
                          ? "text-foreground" 
                          : "text-foreground/60"
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                
                {/* Mobile auth buttons */}
                <div className="pt-4 space-y-2">
                  {user ? (
                    <>
                      <Link
                        to="/account"
                        onClick={() => setIsOpen(false)}
                        className="block text-foreground/60 hover:text-foreground/80 transition-colors"
                      >
                        My Account
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsOpen(false)}
                          className="block text-foreground/60 hover:text-foreground/80 transition-colors"
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          handleSignOut();
                        }}
                        className="block text-foreground/60 hover:text-foreground/80 transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsOpen(false)}
                        className="block text-foreground/60 hover:text-foreground/80 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        <Link
                          to="/signup"
                          onClick={() => setIsOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link to="/" className="flex items-center space-x-2 md:hidden">
              <img 
                src="/lovable-uploads/01b9369b-8e9b-46ad-9d8f-b4a1802b17b8.png" 
                alt="Ziggy Online Debate Logo" 
                className="h-6 w-6 rounded-full border-2 border-white" 
              />
              <span className="font-bold">Ziggy Online Debate</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Admin notifications */}
                {isAdmin && <NotificationsDropdown />}
                
                {/* User menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">
                        {user.email?.split('@')[0] || 'User'}
                      </span>
                      {isAdmin && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Admin
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 z-50 bg-background border">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center cursor-pointer">
                            <Settings className="h-4 w-4 mr-2" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
                <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                  <Link to="/tournaments">Tournament App</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
