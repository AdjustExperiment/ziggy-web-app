import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionFX } from "@/components/SectionFX";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Trophy, 
  Star,
  CheckCircle,
  ArrowRight,
  Building2,
  Sparkles,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";

const partnerBenefits = [
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Discounted Entry Fees",
    description: "Club partners receive special discounted rates for all members registering for Ziggy tournaments."
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Priority Scheduling",
    description: "Get priority access to scheduling windows and first notification of new tournament dates."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Group Registration",
    description: "Streamlined registration process for your entire club with simplified billing options."
  },
  {
    icon: <Trophy className="h-6 w-6" />,
    title: "Club Rankings",
    description: "Your club appears in our partner directory and receives recognition in results announcements."
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Exclusive Resources",
    description: "Access to member-only preparation materials, coaching resources, and practice opportunities."
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Dedicated Support",
    description: "Direct communication channel with Ziggy staff for quick resolution of any issues."
  }
];

const requirements = [
  "Active debate club or homeschool co-op with at least 4 members",
  "Commitment to participate in at least one tournament per season",
  "Designated club coordinator to manage registrations",
  "Agreement to uphold Ziggy's code of conduct and fair play standards"
];

const ClubPartners = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SectionFX variant="hero" intensity="medium" />
      
      {/* Coming Soon Banner */}
      <div className="bg-primary text-primary-foreground py-3 text-center relative z-20">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <span className="font-semibold">Club Partner Program - Now Accepting Applications!</span>
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-border hover:bg-primary/20 animate-fade-in">
            <Building2 className="h-4 w-4 mr-2" />
            Partnership Program
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 font-primary animate-fade-in">
            Become a <span className="text-primary">Club Partner</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary animate-fade-in">
            Join our network of partner clubs and unlock exclusive benefits for your debate program. 
            From discounted entries to priority scheduling, we're here to support your club's success.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              asChild
            >
              <Link to="/contact?subject=Club%20Partnership%20Application">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-border text-foreground hover:bg-accent"
              asChild
            >
              <Link to="/about">
                Learn About Ziggy
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="relative py-16 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              Partner <span className="text-primary">Benefits</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-secondary">
              Exclusive advantages for our partner clubs and their members.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partnerBenefits.map((benefit, index) => (
              <Card key={index} className="bg-card border-border/50 shadow-card hover:shadow-tournament transition-smooth group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-spring group-hover:bg-primary/20">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-xl font-primary text-card-foreground">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              Partnership <span className="text-primary">Requirements</span>
            </h2>
          </div>
          
          <Card className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-4">
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{requirement}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How to Apply */}
      <section className="relative py-16 bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              How to <span className="text-primary">Apply</span>
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: "1", title: "Contact Us", desc: "Fill out our partnership inquiry form with your club details" },
              { step: "2", title: "Review", desc: "Our team will review your application within 48 hours" },
              { step: "3", title: "Welcome!", desc: "Once approved, you'll receive your partner benefits immediately" }
            ].map((item, index) => (
              <Card key={index} className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm text-center">
                <CardHeader>
                  <span className="text-4xl font-mono font-bold text-primary mb-2">
                    {item.step}
                  </span>
                  <CardTitle className="text-lg font-primary text-card-foreground">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Users className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
            Ready to Partner With Us?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-secondary">
            Join our growing network of partner clubs and give your debaters the competitive edge they deserve.
          </p>
          
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
            asChild
          >
            <Link to="/contact?subject=Club%20Partnership%20Application">
              Apply for Partnership
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ClubPartners;
