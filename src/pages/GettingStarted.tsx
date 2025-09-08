import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Calendar, MessageSquare, Clock, Video, FileText, ExternalLink, CheckCircle, PlayCircle } from "lucide-react";
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
      description: "If you're reading this page, you're well on your way to becoming a Ziggy pro! Fall Tournament assignments come every Sunday morning (one week per round), while Spring Tournament assignments come every other Sunday (two weeks per round). Check your emails regularly for new pairings and visit the Ziggy Tournament Platform to track all rounds."
    },
    {
      id: "02", 
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Talk To Your Opponent",
      description: "When you get your weekly pairing email, click 'View Debate' to go to the pairing page. Post a comment telling your opponent your availability. Example: 'Hi Alexandra! I'm free Monday–Wednesday 12pm–5pm Central Time, Friday 2–6pm CT, and Saturday 10am–2pm CT.' If you can't reach them, use their phone number on the pairing page."
    },
    {
      id: "03",
      icon: <Calendar className="h-8 w-8" />,
      title: "Schedule Your Round", 
      description: "Use the Ziggy Tournament Platform to schedule your debate. After agreeing on a time with your opponent, enter the date/time in your timezone—the platform automatically converts it for everyone else. Example: Isaac sets 12:00pm CT, Katie sees 1:00pm ET on her end."
    },
    {
      id: "04",
      icon: <Users className="h-8 w-8" />,
      title: "Request a Judge",
      description: "After scheduling, click 'Request a Judge' to access the Judge List. Search for judges available at your debate time (like 'Monday Mornings'), check boxes next to judges you want to contact, then click Request. We recommend requesting judges 3-4 days in advance."
    },
    {
      id: "05",
      icon: <Video className="h-8 w-8" />,
      title: "Setting a Room",
      description: "Set up your debate platform—use Zoom, Skype, Google Meet, FaceTime, Discord, etc. Post the meeting link in the 'Room' section on your pairing page so everyone can access it. You can also use free rooms on the Ziggy Discord channel (password in your registration email)."
    },
    {
      id: "06",
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Show Up and Debate Respectfully!",
      description: "You'll get an automated reminder 1 hour before your debate, but it's your responsibility to be on time. Arrive a few minutes early to test your mic and video. Debate respectfully, treat everyone with respect, and have fun! You'll get an email when your judge submits their ballot."
    }
  ];

  const judgeSteps = [
    {
      id: "01",
      icon: <BookOpen className="h-8 w-8" />,
      title: "Get Familiar With Ziggy",
      description: "Students get new debates every Sunday morning with one week to complete each round. Keep this timeline in mind for ballot deadlines. Check your emails regularly for updates and requests."
    },
    {
      id: "02", 
      icon: <Calendar className="h-8 w-8" />,
      title: "List Your Availability",
      description: "After registration, you'll get Ziggy Tournament Platform access. Visit the Judge Availability section, find your name, click 'edit', and check every time slot when you're available. Then click 'Save'—that's it!"
    },
    {
      id: "03",
      icon: <PlayCircle className="h-8 w-8" />,
      title: "View the Judge Orientation",
      description: "Complete our Judge Orientation (15-20 minutes) using either the slides or video format. Even returning judges need to review updated information and helpful tips for judging online debate."
    },
    {
      id: "04",
      icon: <FileText className="h-8 w-8" />,
      title: "Skim the Speaker Points Guide",
      description: "Our Speaker Points Guide helps you determine appropriate scores—whether to give a 4 or 5, when a 3 is appropriate, or when to use 1 or 2. Download it and use it for any round you judge for consistent scoring."
    },
    {
      id: "05",
      icon: <Users className="h-8 w-8" />,
      title: "Finding a Round to Judge",
      description: "Two options: Browse the platform for rounds marked as needing judges (look for yellow highlights), or wait for student email requests. You don't need to reply to automated emails—just click 'View Debate' to sign up or leave a comment if unavailable."
    },
    {
      id: "06",
      icon: <CheckCircle className="h-8 w-8" />,
      title: "Judging & Filling Out Your Ballot",
      description: "You'll get a 1-hour reminder, but add debates to your personal calendar. Join via the room link posted by debaters. Fill out your ballot within 48 hours after the round. Click 'Save Ballot' frequently while editing to prevent data loss."
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
            Complete instructions for debaters and judges to get the most out of your Ziggy Online Debate experience.
          </p>
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
          
          <div className="grid gap-8 lg:grid-cols-2">
            {debaterSteps.map((step) => (
              <Card key={step.id} className="bg-card border-primary/30 shadow-elegant hover-scale group">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-mono text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Step {step.id}
                    </span>
                    <div className="text-primary">{step.icon}</div>
                  </div>
                  <CardTitle className="text-xl font-bold text-card-foreground">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
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
          
          <div className="grid gap-8 lg:grid-cols-2">
            {judgeSteps.map((step) => (
              <Card key={step.id} className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm hover-scale group">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-mono text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Step {step.id}
                    </span>
                    <div className="text-primary">{step.icon}</div>
                  </div>
                  <CardTitle className="text-xl font-bold text-card-foreground">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
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