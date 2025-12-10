import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Trophy, 
  Users, 
  Globe, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Star,
  Zap,
  ArrowRight,
  Crown,
  Shield,
  Gift
} from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  organization_name: string;
  tournament_id: string | null;
  suggested_tier: string;
  personal_message: string | null;
  invite_token: string;
  expires_at: string;
  claimed_at: string | null;
  claimed_by_user_id: string | null;
  tournaments?: {
    id: string;
    name: string;
    start_date: string | null;
    end_date: string | null;
    location: string | null;
    format: string | null;
  } | null;
}

const tierConfig: Record<string, { 
  icon: React.ElementType; 
  color: string; 
  gradient: string;
  benefits: string[];
  priority: number;
}> = {
  bronze: {
    icon: Shield,
    color: "text-amber-600",
    gradient: "from-amber-700/20 to-amber-900/20",
    benefits: [
      "Logo on tournament page",
      "Social media recognition",
      "Certificate of appreciation",
      "Quarterly newsletter mention"
    ],
    priority: 1
  },
  silver: {
    icon: Star,
    color: "text-slate-300",
    gradient: "from-slate-400/20 to-slate-600/20",
    benefits: [
      "All Bronze benefits",
      "Prominent logo placement",
      "1 blog post opportunity",
      "Event announcements",
      "Early access to sponsorship opportunities"
    ],
    priority: 2
  },
  gold: {
    icon: Crown,
    color: "text-yellow-400",
    gradient: "from-yellow-500/20 to-amber-600/20",
    benefits: [
      "All Silver benefits",
      "Premium logo placement",
      "3 blog posts",
      "Speaking opportunity at events",
      "Dedicated sponsor page",
      "Priority support"
    ],
    priority: 3
  },
  platinum: {
    icon: Sparkles,
    color: "text-purple-300",
    gradient: "from-purple-500/20 to-pink-600/20",
    benefits: [
      "All Gold benefits",
      "Title sponsorship recognition",
      "Unlimited blog posts",
      "VIP event access",
      "Exclusive branding opportunities",
      "Custom partnership benefits",
      "Direct line to leadership"
    ],
    priority: 4
  }
};

const impactStats = [
  { icon: Users, value: "10,000+", label: "Debaters Reached" },
  { icon: Trophy, value: "500+", label: "Tournaments Hosted" },
  { icon: Globe, value: "50+", label: "Countries Represented" },
  { icon: Zap, value: "99%", label: "Satisfaction Rate" }
];

export default function SponsorInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, session } = useOptimizedAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("pending_sponsor_invitations")
        .select(`
          *,
          tournaments:tournament_id (
            id,
            name,
            start_date,
            end_date,
            location,
            format
          )
        `)
        .eq("invite_token", token)
        .single();

      if (fetchError) throw fetchError;
      
      if (!data) {
        setError("Invitation not found");
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError("This invitation has expired");
        return;
      }

      // Check if already claimed
      if (data.claimed_at) {
        setError("This invitation has already been claimed");
        return;
      }

      setInvitation(data as Invitation);
    } catch (err: any) {
      console.error("Error fetching invitation:", err);
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimInvitation = async () => {
    if (!invitation) return;

    if (!user) {
      // Redirect to login/signup with return URL
      navigate(`/login?redirect=/sponsor/invite/${token}`);
      return;
    }

    setClaiming(true);
    try {
      // Check if user already has a sponsor profile
      const { data: existingProfile } = await supabase
        .from("sponsor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Mark invitation as claimed
      await supabase
        .from("pending_sponsor_invitations")
        .update({
          claimed_at: new Date().toISOString(),
          claimed_by_user_id: user.id
        })
        .eq("id", invitation.id);

      toast({
        title: "Invitation claimed!",
        description: existingProfile 
          ? "You already have a sponsor profile. Redirecting to your dashboard."
          : "Please complete your sponsor application."
      });

      // Redirect to application page (or dashboard if already has profile)
      if (existingProfile) {
        navigate("/sponsor/dashboard");
      } else {
        navigate(`/sponsor/apply?org=${encodeURIComponent(invitation.organization_name)}&tier=${invitation.suggested_tier}`);
      }
    } catch (err: any) {
      console.error("Error claiming invitation:", err);
      toast({
        title: "Error",
        description: "Failed to claim invitation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/30">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{error}</h2>
            <p className="text-muted-foreground">
              {error === "This invitation has expired" 
                ? "Please contact our team to request a new invitation."
                : error === "This invitation has already been claimed"
                ? "If you've already claimed this invitation, visit your sponsor dashboard."
                : "The invitation link may be invalid or corrupted."}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate("/contact")}>
                Contact Us
              </Button>
              <Button onClick={() => navigate("/sponsor/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  const tier = tierConfig[invitation.suggested_tier] || tierConfig.bronze;
  const TierIcon = tier.icon;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/10 via-transparent to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-yellow-500/5 to-amber-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 border-primary/30 bg-primary/5">
            <Gift className="w-3.5 h-3.5 mr-1.5" />
            Exclusive Invitation
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
            Welcome,{" "}
            <span className="bg-gradient-to-r from-primary via-red-400 to-primary bg-clip-text text-transparent">
              {invitation.organization_name}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            You've been personally invited to partner with Ziggy Debate — 
            the premier platform for hosting and managing debate tournaments worldwide.
          </p>
        </div>

        {/* Personal Message Card */}
        {invitation.personal_message && (
          <Card className={`mb-8 border-l-4 border-l-primary bg-gradient-to-r ${tier.gradient} backdrop-blur-sm`}>
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-foreground italic text-lg leading-relaxed">
                    "{invitation.personal_message}"
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">— Ziggy Debate Team</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Tournament Card */}
          {invitation.tournaments && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-red-400" />
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Tournament Opportunity</h3>
                </div>
                
                <h4 className="text-xl font-bold text-foreground mb-4">
                  {invitation.tournaments.name}
                </h4>
                
                <div className="space-y-3 text-sm">
                  {invitation.tournaments.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{invitation.tournaments.location}</span>
                    </div>
                  )}
                  {invitation.tournaments.start_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(invitation.tournaments.start_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        {invitation.tournaments.end_date && invitation.tournaments.end_date !== invitation.tournaments.start_date && (
                          <> – {new Date(invitation.tournaments.end_date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}</>
                        )}
                      </span>
                    </div>
                  )}
                  {invitation.tournaments.format && (
                    <Badge variant="secondary" className="mt-2">
                      {invitation.tournaments.format}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tier Benefits Card */}
          <Card className={`border-border/50 bg-gradient-to-br ${tier.gradient} backdrop-blur-sm overflow-hidden ${!invitation.tournaments ? 'md:col-span-2 max-w-xl mx-auto w-full' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full bg-background/50 flex items-center justify-center`}>
                  <TierIcon className={`w-5 h-5 ${tier.color}`} />
                </div>
                <div>
                  <Badge variant="outline" className={`${tier.color} border-current/30 bg-background/50`}>
                    Suggested Tier
                  </Badge>
                  <h3 className="font-bold text-foreground text-xl capitalize mt-1">
                    {invitation.suggested_tier} Sponsor
                  </h3>
                </div>
              </div>
              
              <ul className="space-y-2.5">
                {tier.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${tier.color}`} />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {impactStats.map((stat, idx) => (
            <Card key={idx} className="border-border/30 bg-card/30 backdrop-blur-sm text-center py-6">
              <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-card to-primary/5 overflow-hidden">
          <CardContent className="py-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Ready to Make an Impact?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Join the Ziggy sponsor community and help empower the next generation of debaters worldwide.
            </p>
            
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
              onClick={handleClaimInvitation}
              disabled={claiming}
            >
              {claiming ? (
                "Claiming..."
              ) : user ? (
                <>
                  Accept Invitation
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              ) : (
                <>
                  Sign Up to Accept
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
            
            {!user && (
              <p className="text-sm text-muted-foreground mt-4">
                Already have an account?{" "}
                <button 
                  onClick={() => navigate(`/login?redirect=/sponsor/invite/${token}`)}
                  className="text-primary hover:underline"
                >
                  Log in
                </button>
              </p>
            )}
            
            <p className="text-xs text-muted-foreground mt-6">
              This invitation expires on{" "}
              {new Date(invitation.expires_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </CardContent>
        </Card>

        {/* Testimonial */}
        <div className="mt-12 text-center">
          <blockquote className="text-lg md:text-xl text-muted-foreground italic max-w-2xl mx-auto">
            "Partnering with Ziggy has been transformative for our brand visibility in the academic community. 
            Their professionalism and reach are unmatched."
          </blockquote>
          <p className="text-sm text-muted-foreground mt-4">— Previous Sponsor Partner</p>
        </div>
      </div>
    </div>
  );
}
