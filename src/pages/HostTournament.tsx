import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionFX } from "@/components/SectionFX";
import { 
  Calendar, 
  Users, 
  Trophy, 
  BarChart3, 
  Shield, 
  Clock, 
  Gavel, 
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Building2,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Flexible Scheduling",
    description: "Let competitors schedule their own debates within your tournament timeframe."
  },
  {
    icon: <Gavel className="h-6 w-6" />,
    title: "Judge Management",
    description: "Access our network of experienced judges or bring your own—we handle all logistics."
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Live Results & Analytics",
    description: "Real-time standings, ballots, and comprehensive analytics for all participants."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Platform",
    description: "Privacy-first approach with secure data handling and protected contact information."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Unlimited Participants",
    description: "No cap on competitors—scale from small club tournaments to large invitationals."
  },
  {
    icon: <Trophy className="h-6 w-6" />,
    title: "Multiple Formats",
    description: "Support for LD, TP, Parliamentary, Moot Court, and custom debate formats."
  }
];

const steps = [
  {
    number: "01",
    title: "Contact Us",
    description: "Reach out with your tournament details, format preferences, and timeline."
  },
  {
    number: "02", 
    title: "Custom Setup",
    description: "We configure your tournament with your rules, branding, and specific requirements."
  },
  {
    number: "03",
    title: "Registration Opens",
    description: "Competitors register through our platform with your custom registration options."
  },
  {
    number: "04",
    title: "We Handle the Rest",
    description: "Pairings, scheduling, judging, ballots, and results—all managed seamlessly."
  }
];

const HostTournament = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SectionFX variant="hero" intensity="medium" />
      
      {/* Announcement Banner */}
      <div className="bg-primary text-primary-foreground py-3 text-center relative z-20">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <span className="font-semibold">Host Your Tournament With Ziggy</span>
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <p className="text-sm text-primary-foreground/80 mt-1">
          Contact us to get started with tournament hosting on our platform!
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-border hover:bg-primary/20 animate-fade-in">
            <Building2 className="h-4 w-4 mr-2" />
            For Organizations & Clubs
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 font-primary animate-fade-in">
            Host Your <span className="text-primary">Tournament</span> With Ziggy
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary animate-fade-in">
            Bring the power of Ziggy's tournament platform to your league, school, or organization. 
            We handle the logistics so you can focus on your debaters.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              asChild
            >
              <Link to="/contact?subject=Tournament%20Hosting%20Inquiry">
                Get Started
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
                Learn More About Us
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
              Why Host With <span className="text-primary">Ziggy?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-secondary">
              Everything you need to run a successful online debate tournament.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
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

      {/* How It Works */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              How It <span className="text-primary">Works</span>
            </h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Card key={index} className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm text-center">
                <CardHeader>
                  <span className="text-4xl font-mono font-bold text-primary mb-2">
                    {step.number}
                  </span>
                  <CardTitle className="text-lg font-primary text-card-foreground">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Host */}
      <section className="relative py-16 bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              Who Can <span className="text-primary">Host?</span>
            </h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Debate clubs and homeschool co-ops",
              "Schools and universities",
              "Regional and state leagues",
              "Private coaching organizations",
              "Debate camps and workshops",
              "Any organization wanting to run tournaments"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <MessageSquare className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
            Ready to Host Your Tournament?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-secondary">
            Contact us today to discuss your tournament needs. We'll create a custom solution 
            that works for your organization and debaters.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              asChild
            >
              <Link to="/contact?subject=Tournament%20Hosting%20Inquiry">
                Contact Us Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Email: <a href="mailto:contact@ziggyonlinedebate.com" className="text-primary hover:underline">contact@ziggyonlinedebate.com</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default HostTournament;
