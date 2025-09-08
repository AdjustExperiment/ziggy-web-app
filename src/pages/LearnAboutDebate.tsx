import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LazyImage } from "@/components/LazyImage";
import {
  BookOpen,
  Users,
  Clock,
  Gavel,
  MessageSquare,
  UserCheck,
  Trophy,
  Target,
  Brain,
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Scale,
  ScrollText,
  Timer,
  User,
  FileText,
} from "lucide-react";

const debateFormats = [
  {
    title: "Lincoln-Douglas Debate (LD)",
    icon: <User className="h-6 w-6" />,
    participants: "1 vs 1",
    duration: "~45 minutes",
    description: "A philosophical debate between two individuals focusing on value-based topics.",
    details: "LD is all about engaging with philosophical ideas and exploring their real-world implications. What does it mean to value one human right more than another? These are the important questions LDers tackle.",
    topics: "Competition is superior to cooperation as a means of achieving excellence",
    judging: "Judge determines which side better upholds their value framework",
  },
  {
    title: "Team Policy Debate (TP)",
    icon: <Users className="h-6 w-6" />,
    participants: "2 vs 2",
    duration: "Variable",
    description: "Teams debate government policy changes using evidence and research.",
    details: "Teams read evidence from news articles, studies, and official documents to prove either that a policy should be enacted (Affirmative) or that it's not a good idea (Negative).",
    topics: "The United States should significantly reform its criminal justice system",
    judging: "Judge evaluates policy relevance, importance, workability, and benefits",
  },
  {
    title: "Team Parliamentary (Team Parli)",
    icon: <MessageSquare className="h-6 w-6" />,
    participants: "2 vs 2",
    duration: "20 min prep + debate",
    description: "Current event topics given 20 minutes before the round starts.",
    details: "Teams debate topics crafted by Harvard-educated Isaac Sommers. Instead of Cross Examination, debaters may interrupt to ask questions during speeches.",
    topics: "Privacy is less necessary than convenience in the twenty-first century",
    judging: "Open to all high school leagues and collegiate debaters",
  },
  {
    title: "Individual Parliamentary (IPD)",
    icon: <User className="h-6 w-6" />,
    participants: "1 vs 1",
    duration: "20 min prep + debate",
    description: "One-on-one debate about current events with 20 minutes prep time.",
    details: "Similar to Team Parli but individual format. Unlike Team Parli, IPD includes Cross Examination, making it more similar to LD in length and format.",
    topics: "This House should abolish NATO",
    judging: "Topics mix policy, fact, value, and scenarios based on current events",
  },
  {
    title: "Moot Court",
    icon: <Scale className="h-6 w-6" />,
    participants: "2 vs 2",
    duration: "Variable",
    description: "Arguing as attorneys before the Supreme Court on constitutional issues.",
    details: "Involves constitutional problems like student speech rights, prisoner rights, and search and seizure. Judges actively participate by asking questions, just like real court proceedings.",
    topics: "Constitutional rights and judicial precedent",
    judging: "Active judge participation with questions throughout arguments",
  },
];

const skillsGained = [
  {
    icon: <Brain className="h-5 w-5" />,
    title: "Critical Thinking",
    description: "Analyze complex arguments and identify logical fallacies",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Public Speaking",
    description: "Develop confidence and clarity in verbal communication",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Research Skills",
    description: "Learn to find, evaluate, and synthesize information effectively",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Teamwork",
    description: "Collaborate effectively in team formats and partnerships",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Time Management",
    description: "Master the art of organizing thoughts under pressure",
  },
  {
    icon: <Target className="h-5 w-5" />,
    title: "Strategic Thinking",
    description: "Develop tactical approaches to argumentation and persuasion",
  },
];

const gettingStartedSteps = [
  {
    step: 1,
    title: "Choose Your Format",
    description: "Explore different debate styles to find what interests you most",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    step: 2,
    title: "Find a Partner or Coach",
    description: "Connect with teammates for team formats or find mentorship",
    icon: <Users className="h-5 w-5" />,
  },
  {
    step: 3,
    title: "Learn the Rules",
    description: "Study format-specific rules and argumentation techniques",
    icon: <ScrollText className="h-5 w-5" />,
  },
  {
    step: 4,
    title: "Practice Rounds",
    description: "Start with practice debates to build confidence and skills",
    icon: <Trophy className="h-5 w-5" />,
  },
  {
    step: 5,
    title: "Join Your First Tournament",
    description: "Apply your skills in competitive tournament settings",
    icon: <CheckCircle className="h-5 w-5" />,
  },
];

export default function LearnAboutDebate() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Learn About Debate
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Discover the art of argumentation, critical thinking, and public speaking through competitive debate. 
            Explore various formats and find your path to intellectual growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="hover-scale">
              <Link to="/getting-started">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="hover-scale">
              <Link to="/tournaments">View Tournaments</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Overview Cards */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Debate?
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="hover-scale animate-fade-in">
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>What is Debate?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Competitive debate is a structured form of argument where participants 
                  research topics, construct logical arguments, and present them persuasively 
                  to judges and audiences.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in">
              <CardHeader>
                <Gavel className="h-8 w-8 text-primary mb-2" />
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Debaters are assigned positions (Affirmative/Negative) on given topics. 
                  They present structured arguments, respond to opponents, and are evaluated 
                  by trained judges on logic, evidence, and delivery.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-scale animate-fade-in">
              <CardHeader>
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Why It Matters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Debate develops critical thinking, research skills, and confidence. 
                  It prepares students for academic success, career advancement, and 
                  informed civic participation in democratic society.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Debate Formats */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Debate Formats at Ziggy
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {debateFormats.map((format, index) => (
              <Card key={index} className="hover-scale animate-fade-in h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    {format.icon}
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{format.participants}</div>
                      <div>{format.duration}</div>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{format.title}</CardTitle>
                  <CardDescription>{format.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {format.details}
                  </p>
                  <div className="space-y-2">
                    <div>
                      <strong className="text-sm">Example Topic:</strong>
                      <p className="text-sm italic text-muted-foreground">
                        "{format.topics}"
                      </p>
                    </div>
                    <div>
                      <strong className="text-sm">Judging:</strong>
                      <p className="text-sm text-muted-foreground">
                        {format.judging}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Skills You'll Develop
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillsGained.map((skill, index) => (
              <Card key={index} className="hover-scale animate-fade-in">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {skill.icon}
                    </div>
                    <CardTitle className="text-lg">{skill.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{skill.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How Tournaments Work */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How Tournaments Work
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Tournament Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Registration:</strong> Sign up for tournaments that match your format and skill level
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Preparation:</strong> Research topics and prepare arguments before tournament day
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Multiple Rounds:</strong> Compete in several preliminary rounds to advance
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Elimination Rounds:</strong> Top performers advance to finals
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="mr-2 h-5 w-5" />
                  Judging & Awards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Expert Judges:</strong> Experienced debaters and coaches evaluate performance
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Detailed Feedback:</strong> Receive constructive criticism to improve
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Recognition:</strong> Awards for top speakers and teams
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <strong>Rankings:</strong> Track progress and compete for season-long titles
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Getting Started Steps */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Your Path to Debate Success
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gettingStartedSteps.map((step, index) => (
              <Card key={index} className="hover-scale animate-fade-in relative">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary text-primary-foreground font-bold min-w-[2rem] text-center">
                      {step.step}
                    </div>
                    {step.icon}
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Helpful Resources
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" size="lg" asChild className="hover-scale">
              <Link to="/rules">
                <ScrollText className="mr-2 h-4 w-4" />
                Rules
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="hover-scale">
              <Link to="/faq">
                <BookOpen className="mr-2 h-4 w-4" />
                FAQ
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="hover-scale">
              <Link to="/getting-started">
                <Target className="mr-2 h-4 w-4" />
                Getting Started
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="hover-scale">
              <Link to="/blog">
                <FileText className="mr-2 h-4 w-4" />
                Blog
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Begin Your Debate Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of students who have discovered the power of debate through Ziggy Online Debate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="hover-scale">
              <Link to="/getting-started">
                Start Learning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="hover-scale">
              <Link to="/tournaments">Browse Tournaments</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}