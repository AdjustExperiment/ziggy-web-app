import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionFX } from "@/components/SectionFX";
import { 
  Star, 
  Trophy, 
  Users, 
  Gift,
  Megaphone,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Heart,
  Share2
} from "lucide-react";
import { Link } from "react-router-dom";

const ambassadorBenefits = [
  {
    icon: <Gift className="h-6 w-6" />,
    title: "Free Tournament Entries",
    description: "Earn free entries to Ziggy tournaments based on your ambassador activities and referrals."
  },
  {
    icon: <Trophy className="h-6 w-6" />,
    title: "Exclusive Ziggy Swag",
    description: "Receive official Ziggy merchandise including t-shirts, stickers, and more."
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Early Access",
    description: "Be the first to know about new features, tournament dates, and special opportunities."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Community Leadership",
    description: "Join a network of passionate debaters representing Ziggy in their communities."
  },
  {
    icon: <Megaphone className="h-6 w-6" />,
    title: "Platform Recognition",
    description: "Get featured on our website and social media as an official Ziggy Ambassador."
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: "Make an Impact",
    description: "Help grow the debate community and introduce new students to competitive debate."
  }
];

const responsibilities = [
  "Share Ziggy on social media and with your debate community",
  "Refer new debaters to join Ziggy tournaments",
  "Provide feedback to help improve the platform",
  "Represent Ziggy positively at tournaments and events",
  "Help welcome and support new participants"
];

const requirements = [
  "Current or former competitive debater",
  "Active presence in the debate community",
  "Enthusiasm for promoting online debate",
  "Good standing with Ziggy (no conduct violations)",
  "Commitment to ambassador responsibilities for at least one season"
];

const Ambassador = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SectionFX variant="hero" intensity="medium" />
      
      {/* Coming Soon Banner */}
      <div className="bg-primary text-primary-foreground py-3 text-center relative z-20">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <span className="font-semibold">Ambassador Program - Applications Open!</span>
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-border hover:bg-primary/20 animate-fade-in">
            <Star className="h-4 w-4 mr-2" />
            Student Program
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 font-primary animate-fade-in">
            Become a Ziggy <span className="text-primary">Ambassador</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary animate-fade-in">
            Are you passionate about debate? Join our ambassador program and help spread the word about 
            Ziggy while earning exclusive rewards and free tournament entries!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              asChild
            >
              <Link to="/contact?subject=Ambassador%20Program%20Application">
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
              Ambassador <span className="text-primary">Benefits</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-secondary">
              Exclusive perks for representing Ziggy in your community.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ambassadorBenefits.map((benefit, index) => (
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

      {/* What Ambassadors Do */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              What <span className="text-primary">Ambassadors Do</span>
            </h2>
          </div>
          
          <Card className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="space-y-4">
                {responsibilities.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Share2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Requirements */}
      <section className="relative py-16 bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              Who Can <span className="text-primary">Apply?</span>
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

      {/* CTA Section */}
      <section className="relative py-16 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Star className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
            Ready to Join the Team?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-secondary">
            Apply today to become a Ziggy Ambassador and start earning rewards while helping grow the debate community!
          </p>
          
          <Button 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
            asChild
          >
            <Link to="/contact?subject=Ambassador%20Program%20Application">
              Submit Your Application
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Ambassador;
