import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionSearchBar } from "@/components/ui/action-search-bar";
import { BookOpen, Users, Calendar, MessageSquare, Clock, Video, FileText, CheckCircle, PlayCircle, Search } from "lucide-react";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Button } from "@/components/ui/button";
import VideoDialog from "@/components/VideoDialog";
import SlidesViewer from "@/components/SlidesViewer";

const GettingStarted = () => {
  const debaterSteps = [
    {
      id: "01",
      icon: <BookOpen className="h-8 w-8" />,
      title: "Get Familiar With Ziggy",
      description: "Pairings are released Sundays—Fall weekly, Spring bi-weekly. Check emails and visit the Ziggy Tournament Platform to track your rounds."
    },
    {
      id: "02", 
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Talk To Your Opponent",
      description: "Click 'View Debate' from your pairing email and post your availability. Example: 'Hi! I'm free Mon–Wed 12–5pm CT.' Use their phone if needed."
    },
    {
      id: "03",
      icon: <Calendar className="h-8 w-8" />,
      title: "Schedule Your Round", 
      description: "After agreeing on a time, enter the date/time in your timezone on the platform—it auto-converts for everyone else."
    },
    {
      id: "04",
      icon: <Users className="h-8 w-8" />,
      title: "Request a Judge",
      description: "Click 'Request a Judge' to access the Judge List. Search by availability, check boxes for judges you want, then click Request. Request 3-4 days in advance."
    },
    {
      id: "05",
      icon: <Video className="h-8 w-8" />,
      title: "Setting a Room",
      description: "Use Zoom, Google Meet, Discord, or any platform. Post the meeting link in the 'Room' section on your pairing page. Free rooms available on Ziggy Discord."
    },
    {
      id: "06",
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Show Up and Debate!",
      description: "You'll get a 1-hour reminder, but be on time. Arrive early to test mic/video. Debate respectfully and have fun! Ballots sent via email after submission."
    }
  ];

  const judgeSteps = [
    {
      id: "01",
      icon: <BookOpen className="h-8 w-8" />,
      title: "Get Familiar With Ziggy",
      description: "Students get new debates every Sunday with one week per round. Keep this timeline in mind for ballot deadlines. Check emails regularly."
    },
    {
      id: "02", 
      icon: <Calendar className="h-8 w-8" />,
      title: "List Your Availability",
      description: "Visit Judge Availability, find your name, click 'edit', check all available time slots, then click 'Save'—that's it!"
    },
    {
      id: "03",
      icon: <PlayCircle className="h-8 w-8" />,
      title: "View the Judge Orientation",
      description: "Complete our 15-20 minute orientation (slides or video). Even returning judges should review for updated info and tips."
    },
    {
      id: "04",
      icon: <FileText className="h-8 w-8" />,
      title: "Skim the Speaker Points Guide",
      description: "Download our guide to determine appropriate scores. Use it for consistent scoring across all rounds you judge."
    },
    {
      id: "05",
      icon: <Users className="h-8 w-8" />,
      title: "Finding a Round to Judge",
      description: "Browse for rounds needing judges (yellow highlights) or wait for student email requests. Click 'View Debate' to sign up."
    },
    {
      id: "06",
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Judging & Filling Out Your Ballot",
      description: "Add debates to your calendar. Join via the room link posted by debaters. Submit ballot within 48 hours. Click 'Save Ballot' frequently while editing."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <BackgroundFX />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="mb-6 bg-muted/20 text-foreground border-border animate-fade-in">
            <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
            Step-by-Step Instructions
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 font-primary animate-fade-in">
            Getting <span className="text-primary">Started</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary animate-fade-in">
            Quick instructions for debaters and judges to get started with Ziggy Online Debate.
          </p>
        </div>
      </section>

      {/* Quick navigation – search commands and pages */}
      <section className="relative py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-xl">
          <Card className="bg-card/80 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-card-foreground flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Quick navigation
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Search pages and commands. Results respect your role and permissions.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ActionSearchBar
                placeholder="Search pages and commands…"
                label="Search Commands"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Debater Instructions */}
      <section className="relative py-20 bg-background/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-primary">
              Instructions for <span className="text-primary">Debaters</span>
            </h2>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {debaterSteps.map((step) => (
              <Card key={step.id} className="bg-card border-primary/30 shadow-elegant hover-scale group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-mono text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Step {step.id}
                    </span>
                    <div className="text-primary">{step.icon}</div>
                  </div>
                  <CardTitle className="text-lg font-bold text-card-foreground">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Judge Instructions */}
      <section className="relative py-20 bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-primary">
              Instructions for <span className="text-primary">Judges</span>
            </h2>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {judgeSteps.map((step) => (
              <Card key={step.id} className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm hover-scale group">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-sm font-mono text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Step {step.id}
                    </span>
                    <div className="text-primary">{step.icon}</div>
                  </div>
                  <CardTitle className="text-lg font-bold text-card-foreground">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <Card className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm text-center hover-scale">
              <CardHeader>
                <PlayCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-card-foreground">Judge Orientation Video</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoDialog youtubeId="P2yS-NpXb0c" title="Judge Orientation Video">
                  <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Watch Video
                  </Button>
                </VideoDialog>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm text-center hover-scale">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-card-foreground">Orientation Slides</CardTitle>
              </CardHeader>
              <CardContent>
                <SlidesViewer 
                  slidesUrl="https://docs.google.com/presentation/d/1rQjKXZYHm8k9P4QjY8XQjY5YxK7X9QjY8X/embed"
                  downloadUrl="https://ziggyonlinedebate.com/wp-content/uploads/2021/09/JUDGING-Ziggy-Online-Debate-Judge-Orientation.pdf"
                  title="Judge Orientation Slides"
                >
                  <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                    <FileText className="h-4 w-4 mr-2" />
                    View Slides
                  </Button>
                </SlidesViewer>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm text-center hover-scale">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-card-foreground">Speaker Points Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="border-primary/50 text-primary hover:bg-primary/10">
                  <a href="https://ziggyonlinedebate.com/wp-content/uploads/2021/09/Ziggy-Speaker-Points-Guide.pdf" target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    Download Guide
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GettingStarted;
