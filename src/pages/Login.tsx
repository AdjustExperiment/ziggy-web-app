import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { User, Lock, Mail, Users, Shield, Eye, EyeOff, ArrowRight, Building } from "lucide-react";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { scrollToFirstInvalid } from "@/lib/forms/scrollToFirstInvalid";

// Sign-in schema (just email + password)
const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// Sign-up schema (includes name fields and password confirmation)
const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required").min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required").min(2, "Last name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, isAdmin, loading } = useOptimizedAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isSponsorSignup, setIsSponsorSignup] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [loginType, setLoginType] = useState(() => {
    const typeParam = searchParams.get("type");
    return ["user", "team", "admin"].includes(typeParam || "") ? typeParam || "user" : "user";
  });

  // Sign-in form (used for sign-in mode and admin tab)
  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Sign-up form (used for sign-up mode)
  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (["user", "team", "admin"].includes(typeParam || "")) {
      setLoginType(typeParam || "user");
    }
  }, [searchParams]);

  // Reset forms when switching modes
  useEffect(() => {
    if (isSignUpMode) {
      signUpForm.reset();
    } else {
      signInForm.reset();
    }
  }, [isSignUpMode]);

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

  const handleSignIn = async (data: SignInFormValues) => {
    setFormLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      
      if (error) {
        toast({
          title: 'Sign In Error', 
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Signed in successfully! Redirecting...',
        });
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

  const handleSignUp = async (data: SignUpFormValues) => {
    setFormLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, {
        data: {
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim()
        }
      });
      
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
        setIsSignUpMode(false);
        signUpForm.reset();
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

  const toggleSignUpMode = () => {
    setIsSignUpMode(!isSignUpMode);
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

  // Render sign-up form for User and Team tabs
  const renderSignUpForm = (tabId: string, buttonClass: string) => (
    <Form {...signUpForm}>
      <form onSubmit={signUpForm.handleSubmit(handleSignUp, scrollToFirstInvalid)} className="space-y-4">
        <div className="text-center mb-4">
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Creating {tabId === 'user' && isSponsorSignup ? 'Sponsor' : tabId === 'team' ? 'ZIP' : 'User'} Account
          </Badge>
        </div>
        
        {tabId === 'user' && (
          <>
            <div className="flex items-center space-x-3 mb-4 p-3 bg-muted rounded-lg border border-border">
              <Building className="h-4 w-4 text-muted-foreground" />
              <FormLabel htmlFor="sponsor-toggle" className="text-foreground text-sm cursor-pointer">
                Create sponsor account
              </FormLabel>
              <Switch
                id="sponsor-toggle"
                checked={isSponsorSignup}
                onCheckedChange={setIsSponsorSignup}
              />
            </div>
            
            {isSponsorSignup && (
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 mb-4">
                <p className="text-sm text-blue-300">
                  Sponsor accounts can apply for tournament sponsorship opportunities and manage their brand presence.
                </p>
              </div>
            )}
          </>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={signUpForm.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">First Name *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="First name"
                      className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={signUpForm.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Last Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Last name"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={signUpForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Email Address *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={tabId === 'team' ? "team@university.edu" : "your.email@example.com"}
                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={signUpForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Password *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={signUpForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Confirm Password *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="rounded" />
            Remember me
          </label>
          <Button variant="link" className="text-primary hover:text-primary/80 p-0" type="button">
            Forgot password?
          </Button>
        </div>

        <Button 
          type="submit" 
          className={buttonClass}
          disabled={formLoading}
        >
          {formLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : null}
          Create {tabId === 'user' && isSponsorSignup ? 'Sponsor' : tabId === 'team' ? 'ZIP' : 'User'} Account
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <Button
            variant="link"
            className="text-muted-foreground hover:text-foreground p-0 touch-target"
            type="button"
            onClick={toggleSignUpMode}
          >
            Already have an account? Sign in
          </Button>
        </div>
      </form>
    </Form>
  );

  // Render sign-in form for User and Team tabs
  const renderSignInForm = (tabId: string, buttonClass: string, buttonText: string) => (
    <Form {...signInForm}>
      <form onSubmit={signInForm.handleSubmit(handleSignIn, scrollToFirstInvalid)} className="space-y-4">
        <FormField
          control={signInForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">
                {tabId === 'team' ? 'ZIP Email' : 'Email Address'}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder={tabId === 'team' ? "team@university.edu" : "your.email@example.com"}
                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={signInForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" className="rounded" />
            Remember me
          </label>
          <Button variant="link" className="text-primary hover:text-primary/80 p-0" type="button">
            Forgot password?
          </Button>
        </div>

        <Button 
          type="submit" 
          className={buttonClass}
          disabled={formLoading}
        >
          {formLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : null}
          {buttonText}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        <div className="text-center">
          <Button
            variant="link"
            className="text-muted-foreground hover:text-foreground p-0 touch-target"
            type="button"
            onClick={toggleSignUpMode}
          >
            Need an account? Sign up
          </Button>
        </div>
      </form>
    </Form>
  );

  // Render admin sign-in form (no sign-up option)
  const renderAdminForm = () => (
    <Form {...signInForm}>
      <form onSubmit={signInForm.handleSubmit(handleSignIn, scrollToFirstInvalid)} className="space-y-4">
        <FormField
          control={signInForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Admin Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="admin@debatechampions.com"
                    className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={signInForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Admin Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    className="pl-10 pr-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
    </Form>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
                Welcome Back
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8">
                Access your debate tournament platform and continue your journey to excellence.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span>Secure authentication</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <Users className="h-5 w-5 text-primary" />
                <span>Team collaboration tools</span>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <User className="h-5 w-5 text-primary" />
                <span>Personal performance tracking</span>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden lg:grid grid-cols-3 gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">1,342+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">156</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">98.7%</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Forms */}
          <div className="w-full order-first lg:order-last">
            <Card className="bg-card border-border shadow-tournament">
              <CardHeader className="text-center px-4 sm:px-6 py-4 sm:py-6">
                <CardTitle className="text-xl sm:text-2xl text-card-foreground font-primary">Sign In</CardTitle>
                <p className="text-sm sm:text-base text-muted-foreground">Choose your account type to continue</p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <Tabs value={loginType} onValueChange={setLoginType} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-muted border border-border">
                    <TabsTrigger 
                      value="user" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <User className="h-4 w-4 mr-2" />
                      User
                    </TabsTrigger>
                    <TabsTrigger 
                      value="team" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      title="Ziggy Involvement Program - For club members and volunteers"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">ZIP Member</span>
                      <span className="sm:hidden">ZIP</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="admin" 
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="user" className="space-y-4">
                    {isSignUpMode 
                      ? renderSignUpForm('user', 'w-full bg-primary hover:bg-primary/90 text-primary-foreground touch-target')
                      : renderSignInForm('user', 'w-full bg-primary hover:bg-primary/90 text-primary-foreground touch-target', 'Sign In')
                    }
                  </TabsContent>

                  <TabsContent value="team" className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-sm text-muted-foreground mb-3">
                        This login is for members of the <span className="text-primary font-medium">Ziggy Involvement Program</span>
                      </p>
                    </div>
                    {isSignUpMode 
                      ? renderSignUpForm('team', 'w-full bg-red-500 hover:bg-red-600 text-white')
                      : renderSignInForm('team', 'w-full bg-red-500 hover:bg-red-600 text-white', 'Sign In to ZIP Portal')
                    }
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-4">
                    <div className="mb-4">
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin Access Required
                      </Badge>
                    </div>
                    {renderAdminForm()}
                  </TabsContent>
                </Tabs>

                <Separator className="my-6 bg-border" />

                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">Don't have an account?</p>
                  <Button 
                    variant="outline" 
                    className="w-full border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    onClick={() => navigate('/signup')}
                  >
                    Create New Account
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-muted-foreground">
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
