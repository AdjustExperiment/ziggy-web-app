import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Lock, Mail, Users, Shield, Eye, EyeOff, ArrowRight } from "lucide-react";

const Login = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState(() => {
    const typeParam = searchParams.get("type");
    return ["team", "individual", "admin"].includes(typeParam || "") ? typeParam || "team" : "team";
  });

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (["team", "individual", "admin"].includes(typeParam || "")) {
      setLoginType(typeParam || "team");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left">
            <div className="mb-8">
              <img 
                src="/lovable-uploads/bb7e942b-4006-461c-b9ed-9bdde6f1500c.png" 
                alt="Debate Champions Logo" 
                className="h-16 w-16 mx-auto lg:mx-0 mb-4 rounded-full" 
              />
              <h1 className="text-4xl font-bold text-white mb-4 font-primary">
                Welcome Back
              </h1>
              <p className="text-xl text-white/70 mb-8">
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
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/10">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1,342+</div>
                <div className="text-sm text-white/70">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">156</div>
                <div className="text-sm text-white/70">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">98.7%</div>
                <div className="text-sm text-white/70">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Forms */}
          <div className="w-full">
            <Card className="bg-black border-white/10 shadow-tournament">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white font-primary">Sign In</CardTitle>
                <p className="text-white/70">Choose your account type to continue</p>
              </CardHeader>
              <CardContent>
                <Tabs value={loginType} onValueChange={setLoginType} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3 bg-black border border-white/10">
                    <TabsTrigger 
                      value="team" 
                      className="data-[state=active]:bg-red-500 data-[state=active]:text-white text-white/70"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Team
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
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="team-email" className="text-white">Team Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                          <Input
                            id="team-email"
                            type="email"
                            placeholder="team@university.edu"
                            className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
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

                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-white/70">
                          <input type="checkbox" className="rounded" />
                          Remember me
                        </label>
                        <Button variant="link" className="text-red-500 hover:text-red-400 p-0">
                          Forgot password?
                        </Button>
                      </div>

                      <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                        Sign In to Team Portal
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="individual" className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="individual-email" className="text-white">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                          <Input
                            id="individual-email"
                            type="email"
                            placeholder="your.email@example.com"
                            className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
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

                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-white/70">
                          <input type="checkbox" className="rounded" />
                          Keep me signed in
                        </label>
                        <Button variant="link" className="text-red-500 hover:text-red-400 p-0">
                          Need help?
                        </Button>
                      </div>

                      <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                        Sign In as Individual
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="admin" className="space-y-4">
                    <div className="mb-4">
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin Access Required
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-email" className="text-white">Admin Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                          <Input
                            id="admin-email"
                            type="email"
                            placeholder="admin@debatechampions.com"
                            className="pl-10 bg-black border-white/20 text-white placeholder:text-white/70"
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

                      <div className="space-y-2">
                        <Label htmlFor="admin-code" className="text-white">2FA Code</Label>
                        <Input
                          id="admin-code"
                          type="text"
                          placeholder="000000"
                          className="bg-black border-white/20 text-white placeholder:text-white/70 text-center font-mono"
                          maxLength={6}
                        />
                      </div>

                      <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                        Access Admin Portal
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
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