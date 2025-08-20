import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Trophy, Users, BarChart3, Target, Zap, Shield, Globe, DollarSign, Clock, Award, Calendar, TrendingUp } from "lucide-react";

const features = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "National Competition",
    description: "Debate students from all across the country. Easy access for rural competitors. Sign up for one or multiple debate leagues."
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: "Powermatching",
    description: "Debate against other competitors with similar skill levels using our advanced matching system."
  },
  {
    icon: <DollarSign className="h-6 w-6" />,
    title: "Affordable",
    description: "Ziggy tournaments cost far less than most in-person tournaments—just $30-35! We keep costs low and avoid raising prices."
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Customer Support",
    description: "Contact us at any time, via text, email, Google Chat, or Facebook Messenger. We typically respond within 2 hours."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Privacy",
    description: "We value your privacy and protect pages with contact information. We will never sell your information to anyone, period."
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Flexibility",
    description: "Ziggy lets you and your opponent coordinate when to debate for maximum scheduling flexibility."
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: "Awards & Scholarships",
    description: "Our top competitors get free Ziggy swag! We work with educational institutions to offer scholarship awards for top performing students."
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Advanced Scheduling",
    description: "Select rounds/weeks to opt out of when signing up, and schedule rounds based on your availability."
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Real-World Results",
    description: "Ziggy debaters have proven track records of performing well in league tournaments with measurable success."
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Analytics",
    description: "Get prizes for top teams and comprehensive rankings at the end of each tournament."
  },
  {
    icon: <Trophy className="h-6 w-6" />,
    title: "Multiple Debate Styles",
    description: "We offer LD, TP, junior team debate, Team and Individual Parli (collegiate welcome), and Moot Court for students from various debate leagues."
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "National Prep Group",
    description: "Ziggy TP members can apply to an NCFCA National Prep Group. Exclusive preparation opportunities for serious competitors."
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
              Ziggy Online Debate Features
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
              Check out everything Ziggy has to offer! From national competition to advanced scheduling, 
              we provide comprehensive tools for debaters worldwide.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 font-primary">
              What Our Debaters Say
            </h2>
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto">
              Real testimonials from competitors who have experienced success with Ziggy Online Debate.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-black/50 border-white/10 shadow-card">
              <CardContent className="p-6">
                <p className="text-white/80 mb-4 italic">
                  "I'm going into my third year of competition and Ziggy was one of the best decisions I made to help prepare myself. 
                  It gave me a national perspective as each region is different in its own way."
                </p>
                <p className="text-red-500 font-medium">— Zoe Abbott, Competitor</p>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-white/10 shadow-card">
              <CardContent className="p-6">
                <p className="text-white/80 mb-4 italic">
                  "I am grateful for Ziggy because it gives you a ton of practice with arguments from all over the nation. 
                  If you have a small debate club then Ziggy should be a top investment for you."
                </p>
                <p className="text-red-500 font-medium">— Kaylee Dodson, Competitor</p>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-white/10 shadow-card">
              <CardContent className="p-6">
                <p className="text-white/80 mb-4 italic">
                  "Ziggy is a necessity for any debater. On a personal level, I credit much of my success to honing my skills 
                  in Ziggy tournaments. The experience is unparalleled. 11/10"
                </p>
                <p className="text-red-500 font-medium">— Nathan Spencer, Competitor</p>
              </CardContent>
            </Card>
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
