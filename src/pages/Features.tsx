import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Target, DollarSign, Users, Shield, Clock, Award, Calendar, TrendingUp, BarChart3, Trophy, Zap } from "lucide-react";
import { SectionFX } from "@/components/SectionFX";

const features = [
  {
    icon: <Globe className="h-8 w-8" />,
    title: "National Competition",
    description: "Debate students from all across the country. Easy access for rural competitors. Sign up for one or multiple debate leagues.",
    highlight: "Connect with debaters nationwide"
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: "Powermatching",
    description: "Debate against other competitors with similar skill levels using our advanced matching system.",
    highlight: "Fair competition at your level"
  },
  {
    icon: <DollarSign className="h-8 w-8" />,
    title: "Affordable",
    description: "Ziggy tournaments cost far less than most in-person tournaments—just $30-35! We keep costs low and avoid raising prices.",
    highlight: "Only $30-35 per tournament"
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Customer Support",
    description: "Contact us at any time, via text, email, Google Chat, or Facebook Messenger. We typically respond within 2 hours.",
    highlight: "2-hour response guarantee"
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Privacy",
    description: "We value your privacy and protect pages with contact information. We will never sell your information to anyone, period.",
    highlight: "Your data stays private"
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: "Flexibility",
    description: "Ziggy lets you and your opponent coordinate when to debate for maximum scheduling flexibility.",
    highlight: "Debate on your schedule"
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Awards & Scholarships",
    description: "Our top competitors get free Ziggy swag! We work with educational institutions to offer scholarship awards for top performing students.",
    highlight: "$2.4M+ in scholarships awarded"
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    title: "Advanced Scheduling",
    description: "Select rounds/weeks to opt out of when signing up, and schedule rounds based on your availability.",
    highlight: "Complete control over your schedule"
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Real-World Results",
    description: "Ziggy debaters have proven track records of performing well in league tournaments with measurable success.",
    highlight: "Proven competitive advantage"
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Analytics",
    description: "Get prizes for top teams and comprehensive rankings at the end of each tournament.",
    highlight: "Track your progress"
  },
  {
    icon: <Trophy className="h-8 w-8" />,
    title: "Multiple Debate Styles",
    description: "We offer LD, TP, junior team debate, Team and Individual Parli (collegiate welcome), and Moot Court for students from various debate leagues.",
    highlight: "5+ debate formats supported"
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "National Prep Group",
    description: "Ziggy TP members can apply to an NCFCA National Prep Group. Exclusive preparation opportunities for serious competitors.",
    highlight: "Elite preparation opportunities"
  }
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="relative">
        <SectionFX variant="hero" intensity="medium" />
        
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Badge className="mb-6 bg-primary/10 text-primary border-border hover:bg-primary/20">
              <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
              12 Core Features
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-primary">
              Ziggy Online Debate Features
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary">
              Check out everything Ziggy has to offer! From national competition to advanced scheduling, 
              we provide comprehensive tools for debaters worldwide.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="relative py-16">
          <SectionFX variant="default" intensity="low" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="bg-gradient-card border-border/50 shadow-card hover:shadow-tournament transition-smooth group">
                  <CardHeader>
                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-spring group-hover:bg-primary/20">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-primary text-card-foreground mb-2">{feature.title}</CardTitle>
                    <Badge className="bg-primary/10 text-primary border-border text-xs w-fit">
                      {feature.highlight}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Features;