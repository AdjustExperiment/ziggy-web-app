import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, Calendar, MessageSquare, Clock, Video, FileText, ExternalLink, CheckCircle, PlayCircle } from "lucide-react";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundFX />
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-red-600/15 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-red-400/20 rounded-full blur-2xl animate-ping"></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20 animate-fade-in">
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            Step-by-Step Instructions
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6 font-primary animate-fade-in">
            Getting <span className="text-red-500">Started</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-3xl mx-auto font-secondary animate-fade-in">
            Complete instructions for debaters and judges to get the most out of your Ziggy Online Debate experience.
          </p>
        </div>
      </section>

      {/* Debater Instructions */}
      <section className="relative py-20 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-primary">
              Instructions for <span className="text-red-500">Debaters</span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto font-secondary">
              Follow these steps to successfully participate in Ziggy tournaments
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {debaterSteps.map((step, index) => (
              <Card key={step.id} className="bg-black border-red-500/30 shadow-elegant hover-scale group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-mono text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
                      Step {step.id}
                    </span>
                    <div className="text-red-500 group-hover:text-red-400 transition-colors">
                      {step.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-white group-hover:text-red-100 transition-colors">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-white/80 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm inline-block">
              <CardContent className="p-6">
                <p className="text-white/80 mb-4">
                  <strong className="text-red-400">Pro Tip for TP Debaters:</strong> If you're the Affirmative team, 
                  send your 1AC (or an outline) to your opponent as soon as possible after getting your pairing.
                </p>
                <Button asChild className="bg-red-500 hover:bg-red-600">
                  <a href="http://tournament.ziggyonlinedebate.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Tournament Platform
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Judge Instructions */}
      <section className="relative py-20 bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-primary">
              Instructions for <span className="text-red-500">Judges</span>
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto font-secondary">
              Everything you need to know to effectively judge Ziggy tournaments
            </p>
          </div>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {judgeSteps.map((step, index) => (
              <Card key={step.id} className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm hover-scale group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-mono text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
                      Step {step.id}
                    </span>
                    <div className="text-red-500 group-hover:text-red-400 transition-colors">
                      {step.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-white group-hover:text-red-100 transition-colors">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-white/80 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm text-center hover-scale">
              <CardHeader>
                <PlayCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-white">Judge Orientation Video</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm mb-4">
                  Watch our comprehensive 15-20 minute orientation video
                </p>
                <Button variant="outline" asChild className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <a href="https://youtu.be/P2yS-NpXb0c" target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Watch Video
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm text-center hover-scale">
              <CardHeader>
                <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-white">Orientation Slides</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm mb-4">
                  Download the judge orientation slides PDF
                </p>
                <Button variant="outline" asChild className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <a href="https://ziggyonlinedebate.com/wp-content/uploads/2021/09/JUDGING-Ziggy-Online-Debate-Judge-Orientation.pdf" target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    View Slides
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm text-center hover-scale">
              <CardHeader>
                <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <CardTitle className="text-white">Speaker Points Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm mb-4">
                  Helpful guidelines for consistent speaker point scoring
                </p>
                <Button variant="outline" asChild className="border-red-500/50 text-red-400 hover:bg-red-500/10">
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

      {/* New to Debate Section */}
      <section className="relative py-16 bg-black">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Card className="bg-black border-red-500/30 shadow-elegant">
            <CardHeader>
              <BookOpen className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-white">
                New to Debate?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 mb-6 leading-relaxed">
                If you're completely new to debate, we have resources to help you get started. 
                Check out our FAQ section for beginners to understand the basics of competitive debate.
              </p>
              <div className="flex gap-4 justify-center">
                <Button asChild className="bg-red-500 hover:bg-red-600">
                  <a href="/faq#newtodebate">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Beginner's Guide
                  </a>
                </Button>
                <Button variant="outline" asChild className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <a href="http://tournament.ziggyonlinedebate.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Tournament Platform
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Section */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 font-primary">
            Need <span className="text-red-500">Help?</span>
          </h2>
          <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm">
            <CardContent className="p-8">
              <p className="text-white/80 leading-relaxed mb-6">
                If you encounter any issues or have questions, don't hesitate to reach out to our support team. 
                We're here to help make your Ziggy experience as smooth as possible.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button asChild className="bg-red-500 hover:bg-red-600">
                  <a href="/contact">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
                <Button variant="outline" asChild className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <a href="tel:9794294449">
                    <Clock className="h-4 w-4 mr-2" />
                    Text: (979) 429-4449
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default GettingStarted;