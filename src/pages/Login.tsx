import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Lock, Mail, Users, Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, isAdmin, loading } = useOptimizedAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [loginType, setLoginType] = useState(() => {
    const typeParam = searchParams.get("type");
    return ["team", "individual", "admin"].includes(typeParam || "") ? typeParam || "team" : "team";
  });
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (["team", "individual", "admin"].includes(typeParam || "")) {
      setLoginType(typeParam || "team");
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      if (loginType === 'admin' && isAdmin) {
        navigate('/admin');
      } else if (loginType === 'admin' && !isAdmin) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
      } else {
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      }
    }
  }, [user, isAdmin, loading, navigate, location, loginType, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({
            title: 'Error',
            description: 'Passwords do not match',
            variant: 'destructive',
          });
          return;
        }
        
        const { error } = await signUp(email, password);
        
        if (error) {
          toast({
            title: 'Sign Up Error',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Success',
            description: 'Account created successfully! Please check your email to verify your account.',
          });
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(email, password);
        
        if (error) {
          toast({
            title: 'Sign In Error', 
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left order-last lg:order-first">
            <div className="mb-6 sm:mb-8">
              <img 
                src="/lovable-uploads/bb7e942b-4006-461c-b9ed-9bdde6f1500c.png" 
                alt="Debate Champions Logo" 
                className="h-12 sm:h-16 w-auto mx-auto lg:mx-0 mb-4 rounded-full" 
              />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 font-primary">
                Welcome Back
              </h1>
              <p className="text-lg sm:text-xl text-white/70 mb-6 sm:mb-8">
                Access your debate tournament platform and continue your journey to excellence.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white/80">
                <Shield className="h-5 w-5 text-red-500" />
                <span>Secure authentication</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Users className="h-5 w-5 text-red-500" />
                <span>Team collaboration tools</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <User className="h-5 w-5 text-red-500" />
                <span>Personal performance tracking</span>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden lg:grid grid-cols-3 gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">1,342+</div>
                <div className="text-xs sm:text-sm text-white/70">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">156</div>
                <div className="text-xs sm:text-sm text-white/70">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">98.7%</div>
                <div className="text-xs sm:text-sm text-white/70">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Forms */}
          <div className="w-full order-first lg:order-last">
            <Card className="bg-black border-white/10 shadow-tournament">
              <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-xl sm:text-2xl text-white font-primary">Sign In</CardTitle>
                <p className="text-sm sm:text-base text-white/70">Choose your account type to continue</p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <Tabs value={loginType} onValueChange={setLoginType} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-black border border-white/10">
                    <TabsTrigger 
                      value="team" 
                      className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      ZIP
                    </TabsTrigger>
                    <TabsTrigger 
                      value="individual" 
                      className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Individual
                    </TabsTrigger>
                    <TabsTrigger 
                      value="admin" 
                      className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="team" className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-sm text-white/70 mb-3">
                        This login is for members of the <span className="text-red-500 font-medium">Ziggy Involvement Program</span>
                      </p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {isSignUp && (
                        <div className="text-center mb-4">
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            Creating ZIP Account
                          </Badge>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="team-email" className="text-white">ZIP Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                          <Input
                            id="team-email"
                            type="email"
                            placeholder="team@university.edu"
                            className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="team-password" className="text-white">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                          <Input
                            id="team-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10 bg-black border-white/20 text-white placeholder:text-white/70"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      {isSignUp && (
                        <div className="space-y-2">
                          <Label htmlFor="team-confirm-password" className="text-white">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                            <Input
                              id="team-confirm-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-white/70">
                          <input type="checkbox" className="rounded" />
                          Remember me
                        </label>
                        <Button variant="link" className="text-red-500 hover:text-red-400 p-0" type="button">
                          Forgot password?
                        </Button>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-red-500 hover:bg-red-600 text-white" 
                        disabled={formLoading}
                      >
                        {formLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        ) : null}
                        {isSignUp ? 'Create ZIP Account' : 'Sign In to ZIP Portal'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      
                      <div className="text-center">
                        <Button
                          variant="link"
                          className="text-white/70 hover:text-white p-0"
                          type="button"
                          onClick={() => setIsSignUp(!isSignUp)}
                        >
                          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="individual" className="space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {isSignUp && (
                        <div className="text-center mb-4">
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            Creating Individual Account
                          </Badge>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="individual-email" className="text-white">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                          <Input
                            id="individual-email"
                            type="email"
                            placeholder="your.email@example.com"
                            className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="individual-password" className="text-white">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                          <Input
                            id="individual-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pl-10 pr-10 bg-black border-white/20 text-white placeholder:text-white/70"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      {isSignUp && (
                        <div className="space-y-2">
                          <Label htmlFor="individual-confirm-password" className="text-white">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                            <Input
                              id="individual-confirm-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-white/70">
                          <input type="checkbox" className="rounded" />
                          Keep me signed in
                        </label>
                        <Button variant="link" className="text-red-500 hover:text-red-400 p-0" type="button">
                          Need help?
                        </Button>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-red-500 hover:bg-red-600 text-white"
                        disabled={formLoading}
                      >
                        {formLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        ) : null}
                        {isSignUp ? 'Create Individual Account' : 'Sign In as Individual'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      
                      <div className="text-center">
                        <Button
                          variant="link"
                          className="text-white/70 hover:text-white p-0"
                          type="button"
                          onClick={() => setIsSignUp(!isSignUp)}
                        >
                          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                        </Button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-4">
                    <div className="mb-4">
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin Access Required
                      </Badge>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-email" className="text-white">Admin Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                          <Input
                            id="admin-email"
                            type="email"
                            placeholder="admin@debatechampions.com"
                            className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin-password" className="text-white">Admin Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                          <Input
                            id="admin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter admin password"
                            className="pl-10 pr-10 bg-black border-white/20 text-white placeholder:text-white/70"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button 
                        type="submit"
                        className="w-full bg-red-500 hover:bg-red-600 text-white"
                        disabled={formLoading}
                      >
                        {formLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        ) : null}
                        Access Admin Portal
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                <Separator className="my-6 bg-white/10" />

                <div className="text-center space-y-4">
                  <p className="text-sm text-white/70">Don't have an account?</p>
                  <Button 
                    variant="outline" 
                    className="w-full border-white/30 text-white hover:bg-red-500 hover:border-red-500"
                    onClick={() => window.location.href = '/signup'}
                  >
                    Create New Account
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-white/50">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;