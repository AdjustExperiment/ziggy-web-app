import { ExternalLink, Trophy, Users, Target, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Individual Debater",
    price: "Free",
    description: "Perfect for students getting started",
    features: [
      "Tournament registration",
      "Basic performance tracking",
      "Community access",
      "Mobile app access"
    ],
    popular: false,
    icon: <Users className="h-5 w-5" />
  },
  {
    name: "Team Package",
    price: "$49/month",
    description: "Ideal for schools and debate teams",
    features: [
      "Everything in Individual",
      "Team management dashboard",
      "Advanced analytics",
      "Custom tournaments",
      "Priority support"
    ],
    popular: true,
    icon: <Trophy className="h-5 w-5" />
  },
  {
    name: "Tournament Organizer",
    price: "$199/month",
    description: "For professional tournament management",
    features: [
      "Everything in Team",
      "Multi-tournament management",
      "Real-time broadcasting",
      "Judging tools",
      "Revenue sharing",
      "White-label solution"
    ],
    popular: false,
    icon: <Star className="h-5 w-5" />
  }
];

export function SignUp() {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Join the Championship
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your debate journey. From individual competitors 
            to tournament organizers, we have solutions for every level.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative bg-gradient-card shadow-card hover:shadow-tournament transition-smooth ${
                plan.popular ? 'border-primary shadow-glow' : ''
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-accent text-white border-0">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-primary mb-2">{plan.price}</div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-accent hover:opacity-90 text-white shadow-glow' 
                      : 'border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => window.open('https://forms.google.com/your-form-link', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Google Form Integration */}
        <Card className="bg-gradient-card shadow-tournament max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Ready to Compete?</CardTitle>
            <p className="text-muted-foreground">
              Complete our registration form to join the next tournament cycle
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                <Trophy className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Quick Setup</div>
                  <div className="text-sm text-muted-foreground">5 minute form</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                <Users className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Team Support</div>
                  <div className="text-sm text-muted-foreground">Coach guidance</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                <Star className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Championship Path</div>
                  <div className="text-sm text-muted-foreground">Rank tracking</div>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-gradient-accent hover:opacity-90 text-white shadow-glow text-lg px-12 py-6"
              onClick={() => window.open('https://forms.google.com/your-tournament-registration-form', '_blank')}
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Open Registration Form
            </Button>
            
            <p className="text-sm text-muted-foreground">
              By registering, you agree to our tournament rules and code of conduct
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}