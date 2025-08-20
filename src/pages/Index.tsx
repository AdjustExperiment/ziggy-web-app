import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Trophy, Users, BarChart3, Target, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: <Trophy className="h-6 w-6" />,
    title: "Professional Tournaments",
    description: "Compete in high-stakes tournaments with standardized rules and professional judging."
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Advanced Analytics",
    description: "Track performance metrics, win rates, and improvement trends with detailed insights."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Team Management",
    description: "Organize teams, manage schedules, and coordinate training with powerful tools."
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Skill Development",
    description: "Personalized coaching recommendations and targeted practice modules."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Real-time Results",
    description: "Live tournament updates, instant scoring, and automated bracket management."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Platform",
    description: "Enterprise-grade security with protected data and fair play enforcement."
  }
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      
      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-red-500/10 text-red-500 border-red-500/20 text-sm sm:text-base">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Featured by the Cato Institute
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 font-primary">
              Everything You Need to Excel
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
              From tournament registration to performance analytics, our comprehensive platform 
              supports debaters at every level of competition.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="bg-black border-white/10 shadow-card hover:shadow-tournament transition-smooth group hover:border-red-500/30">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 group-hover:scale-110 transition-spring group-hover:bg-red-500/20">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-primary text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 font-primary">
            Ready to Start Your Championship Journey?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of debaters who trust our platform for competitive excellence.
            Sign up today and take your first step toward victory.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-white/90 shadow-glow text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 min-h-[44px] sm:min-h-[56px]"
              onClick={() => window.location.href = '/signup'}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 min-h-[44px] sm:min-h-[56px]"
              onClick={() => window.location.href = '/dashboard'}
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
