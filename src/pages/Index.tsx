import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Trophy, Users, BarChart3, Target, Zap, Shield, Globe, DollarSign, Clock, Award, Calendar, TrendingUp } from "lucide-react";

const features = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Worldwide Competition",
    description: "Debate students from around the world. Easy access for remote competitors. Sign up for one or multiple debate leagues."
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
    title: "NCFCA Prep Group",
    description: "Ziggy TP members can apply to an NCFCA Prep Group. Exclusive preparation opportunities for serious competitors."
  }
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      
      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5"></div>
          <div className="absolute top-40 left-10 w-64 h-64 bg-gradient-radial from-primary/3 via-primary/1 to-transparent rounded-full blur-3xl animate-float motion-reduce:animate-none" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-radial from-primary/2 via-primary/1 to-transparent rounded-full blur-3xl animate-float motion-reduce:animate-none" style={{ animationDelay: '3s' }}></div>
          <div className="absolute inset-0 opacity-[0.01] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGZpbHRlciBpZD0ibm9pc2UiPgogICAgPGZlVHVyYnVsZW5jZSBiYXNlRnJlcXVlbmN5PSIwLjgiIG51bU9jdGF2ZXM9IjIiIHNlZWQ9IjMiLz4KICAgIDxmZUNvbG9yTWF0cml4IHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIvPgo8L3N2Zz4K')]"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm sm:text-base">
              <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
              Featured by the Cato Institute
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              Ziggy Online Debate Features
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto font-secondary">
              Check out everything Ziggy has to offer! From worldwide competition to advanced scheduling, 
              we provide comprehensive tools for debaters everywhere.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-border shadow-card hover:shadow-tournament transition-smooth group hover:border-primary/30">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-spring group-hover:bg-primary/20">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-primary text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-subtle relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-tl from-primary/8 via-transparent to-background/10"></div>
          <div className="absolute top-20 right-10 w-56 h-56 bg-gradient-radial from-primary/4 via-primary/2 to-transparent rounded-full blur-3xl animate-float motion-reduce:animate-none" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-10 left-20 w-72 h-72 bg-gradient-radial from-primary/3 via-primary/1 to-transparent rounded-full blur-3xl animate-float motion-reduce:animate-none" style={{ animationDelay: '0s' }}></div>
          <div className="absolute inset-0 opacity-[0.008] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGZpbHRlciBpZD0ibm9pc2UiPgogICAgPGZlVHVyYnVsZW5jZSBiYXNlRnJlcXVlbmN5PSIwLjciIG51bU9jdGF2ZXM9IjEiIHNlZWQ9IjUiLz4KICAgIDxmZUNvbG9yTWF0cml4IHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMSAwIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSIvPgo8L3N2Zz4K')]"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
              What Our Debaters Say
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto font-secondary">
              Real testimonials from competitors who have experienced success with Ziggy Online Debate.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-card/50 border-border shadow-card">
              <CardContent className="p-6">
                <p className="text-foreground/80 mb-4 italic">
                  "I'm going into my third year of competition and Ziggy was one of the best decisions I made to help prepare myself. 
                  It gave me a broader perspective as each region is different in its own way."
                </p>
                <p className="text-primary font-medium">— Zoe Abbott, Competitor</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border shadow-card">
              <CardContent className="p-6">
                <p className="text-foreground/80 mb-4 italic">
                  "I am grateful for Ziggy because it gives you a ton of practice with arguments from all over the world. 
                  If you have a small debate club then Ziggy should be a top investment for you."
                </p>
                <p className="text-primary font-medium">— Kaylee Dodson, Competitor</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border shadow-card">
              <CardContent className="p-6">
                <p className="text-foreground/80 mb-4 italic">
                  "Ziggy is a necessity for any debater. On a personal level, I credit much of my success to honing my skills 
                  in Ziggy tournaments. The experience is unparalleled. 11/10"
                </p>
                <p className="text-primary font-medium">— Nathan Spencer, Competitor</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-hero relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-background/15"></div>
          <div className="absolute top-10 left-20 w-48 h-48 bg-gradient-radial from-primary/6 via-primary/3 to-transparent rounded-full blur-2xl animate-float motion-reduce:animate-none" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-gradient-radial from-primary/5 via-primary/2 to-transparent rounded-full blur-3xl animate-float motion-reduce:animate-none" style={{ animationDelay: '3s' }}></div>
          <div className="absolute inset-0 opacity-[0.012] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZmlsdGVyIGlkPSJub2lzZSI+CiAgICA8ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9IjAuNiIgbnVtT2N0YXZlcz0iMyIgc2VlZD0iMSIvPgogICAgPGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxIDAiLz4KICA8L2ZpbHRlcj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIi8+Cjwvc3ZnPg==')]"></div>
        </div>
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 font-primary">
            Ready to Start Your Championship Journey?
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto font-secondary">
            Join thousands of debaters who trust our platform for competitive excellence.
            Sign up today and take your first step toward victory.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 min-h-[44px] sm:min-h-[56px] transition-all duration-300 hover:scale-105"
              onClick={() => window.location.href = '/getting-started'}
            >
              Get Started Now
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-border text-foreground hover:bg-accent text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 min-h-[44px] sm:min-h-[56px] transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              onClick={() => window.location.href = '/contact'}
            >
              Contact
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
