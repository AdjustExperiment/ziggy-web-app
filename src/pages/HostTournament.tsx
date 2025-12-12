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
  Gavel, 
  CheckCircle,
  ArrowRight,
  Building2,
  Sparkles,
  Settings,
  UserPlus,
  Mail,
  Ticket,
  Gift,
  FileSpreadsheet,
  Eye,
  Bell,
  Layout,
  Database,
  Workflow
} from "lucide-react";
import { Link } from "react-router-dom";

const featureCategories = [
  {
    icon: <Workflow className="h-6 w-6" />,
    title: "Complete Tabulation Suite",
    description: "Generate pairings, manage brackets, track standings, and enter ballots—all with powerful algorithms including power-matching and side balancing."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Judge & User Management",
    description: "Create judge accounts, set specializations, auto-assign judges using Hungarian algorithm optimization, and manage conflicts."
  },
  {
    icon: <Ticket className="h-6 w-6" />,
    title: "Registration Control",
    description: "Set registration fees, deadlines, promo codes, and manually add competitors or judges. Full control over who participates."
  },
  {
    icon: <Gift className="h-6 w-6" />,
    title: "Sponsor & Prize Management",
    description: "Link approved sponsors, configure prize pools, manage sponsor tiers, and display sponsor logos on your tournament page."
  },
  {
    icon: <Mail className="h-6 w-6" />,
    title: "Communication Hub",
    description: "Custom email templates, automated reminders, tournament announcements, and real-time notifications to all participants."
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: "Results Publishing",
    description: "Control exactly what results are visible—prelims, elims, breaks, finals. Designate championship status with premium display."
  }
];

const selfServiceSteps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up and request tournament admin access. Once approved, you'll have full control over your events."
  },
  {
    number: "02", 
    title: "Configure Your Tournament",
    description: "Set your debate format, dates, registration fees, venues, sponsors, and customize every detail to your needs."
  },
  {
    number: "03",
    title: "Manage Participants",
    description: "Accept registrations, create promo codes, add judges manually, set up judge panels, and handle payments."
  },
  {
    number: "04",
    title: "Run Your Event",
    description: "Generate pairings, auto-assign judges, enter ballots, publish announcements, and release results—all from your dashboard."
  }
];

const adminTools = [
  {
    icon: <Layout className="h-5 w-5" />,
    title: "Tournament Dashboard",
    description: "Central hub for all tournament operations"
  },
  {
    icon: <FileSpreadsheet className="h-5 w-5" />,
    title: "Spreadsheet View",
    description: "View and edit team stats, records, and speaker points"
  },
  {
    icon: <Gavel className="h-5 w-5" />,
    title: "Judge Auto-Assignment",
    description: "Optimal allocation respecting conflicts and availability"
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Automated Notifications",
    description: "Pairing releases, result alerts, and announcements"
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Legacy Excel Export",
    description: "NCFCA-compatible spreadsheet import/export"
  },
  {
    icon: <Settings className="h-5 w-5" />,
    title: "Granular Permissions",
    description: "Control visibility of results, contacts, and data"
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
          <span className="font-semibold">Self-Service Tournament Hosting</span>
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
        <p className="text-sm text-primary-foreground/80 mt-1">
          Full control over your tournament from setup to results—no middleman required
        </p>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-border hover:bg-primary/20 animate-fade-in">
            <Building2 className="h-4 w-4 mr-2" />
            Complete Self-Service Platform
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 font-primary animate-fade-in">
            Your Tournament, <span className="text-primary">Your Control</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary animate-fade-in">
            Create admin accounts, manage judges and competitors, control sponsors and prizes, 
            handle registrations with promo codes, send communications, and publish results—all 
            from your own dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              asChild
            >
              <Link to="/signup">
                <UserPlus className="mr-2 h-5 w-5" />
                Create Your Account
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-border text-foreground hover:bg-accent"
              asChild
            >
              <Link to="/contact?subject=Tournament%20Admin%20Access%20Request">
                Request Admin Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="relative py-16 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              Everything You <span className="text-primary">Control</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-secondary">
              No waiting on us—manage every aspect of your tournament directly.
            </p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureCategories.map((feature, index) => (
              <Card key={index} className="bg-card border-border/50 shadow-card hover:shadow-tournament transition-smooth group">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-spring group-hover:bg-primary/20">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-primary text-card-foreground">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Self Service */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              Get Started in <span className="text-primary">4 Steps</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-secondary">
              From sign-up to results publishing—you're in the driver's seat.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {selfServiceSteps.map((step, index) => (
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

      {/* Admin Dashboard Tools */}
      <section className="relative py-16 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              Admin Dashboard <span className="text-primary">Features</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-secondary">
              Professional tournament tools at your fingertips.
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {adminTools.map((tool, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border/50 hover:border-primary/50 transition-smooth">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {tool.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Can Host */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              Who Can <span className="text-primary">Host?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-secondary">
              Any organization ready to run their own tournaments.
            </p>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Debate clubs and homeschool co-ops",
              "Schools and universities",
              "Regional and state leagues",
              "Private coaching organizations",
              "Debate camps and workshops",
              "Any organization wanting full control"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/50">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-Format Support */}
      <section className="relative py-16 bg-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              All Formats <span className="text-primary">Supported</span>
            </h2>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Team Policy (TP)",
              "Lincoln-Douglas (LD)",
              "Public Forum (PF)",
              "Parliamentary",
              "Congress",
              "Moot Court",
              "British Parliamentary",
              "World Schools",
              "Custom Formats"
            ].map((format, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="px-4 py-2 text-sm bg-card border border-border/50 text-foreground"
              >
                {format}
              </Badge>
            ))}
          </div>
          
          <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
            Run multi-format tournaments with separate registrations, pairings, standings, 
            and tabulation per event—all under one tournament umbrella.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Trophy className="h-12 w-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
            Ready to Run Your Tournament?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto font-secondary">
            Create your account today and request admin access. For enterprise needs or 
            multi-tournament organizations, contact us for dedicated support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
              asChild
            >
              <Link to="/signup">
                <UserPlus className="mr-2 h-5 w-5" />
                Create Your Account
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-border text-foreground hover:bg-accent"
              asChild
            >
              <Link to="/contact?subject=Enterprise%20Tournament%20Hosting">
                Enterprise Inquiries
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Questions? <a href="mailto:contact@ziggyonlinedebate.com" className="text-primary hover:underline">contact@ziggyonlinedebate.com</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default HostTournament;
