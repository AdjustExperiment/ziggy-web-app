import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, DollarSign, Calendar, Globe, Award, Shield, Clock, Zap, MessageSquare, TrendingUp, Star } from "lucide-react";
import { SectionFX } from "@/components/SectionFX";

const About = () => {
  const features = [
    {
      id: "01",
      icon: <Trophy className="h-8 w-8" />,
      title: "Power Matching",
      description: "You will be randomly matched against other teams for the first four weeks. After that, rounds will be power-matched based on your performance to ensure competitive balance."
    },
    {
      id: "02", 
      icon: <DollarSign className="h-8 w-8" />,
      title: "Convenience and Price",
      description: "Most tournaments cost $40-55 for entry alone. Ziggy provides 10 debates in Fall and 8 in Spring for only $25 - over 250% less expensive!"
    },
    {
      id: "03",
      icon: <Globe className="h-8 w-8" />,
      title: "National Competition", 
      description: "Students from all across the country participate in Ziggy, giving you the opportunity to debate against top competitors nationwide."
    },
    {
      id: "04",
      icon: <Award className="h-8 w-8" />,
      title: "Real-World Success",
      description: "10 Ziggy participants have been NCFCA National Champion finalists! Many debaters find their tournament performance greatly enhanced."
    },
    {
      id: "05",
      icon: <Clock className="h-8 w-8" />,
      title: "Flexibility",
      description: "Choose when to debate during the week that works best for you. Our Judge List shows availability and helps coordinate schedules."
    },
    {
      id: "06",
      icon: <Trophy className="h-8 w-8" />,
      title: "Awards",
      description: "Top 40% of debaters receive rankings. First place teams get free Ziggy t-shirts, first place speakers get $10 vouchers or gift cards."
    },
    {
      id: "07",
      icon: <Calendar className="h-8 w-8" />,
      title: "No Registration Deadline",
      description: "Sign up any time you want! We can guarantee as many rounds as are left when you register. Sign up by noon Saturday for the next round."
    },
    {
      id: "08",
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Quality Customer Service",
      description: "Contact us via Google Hangouts, Facebook Messenger, text, or email. We respond within 24 hours and strive for the best support possible."
    },
    {
      id: "09",
      icon: <Shield className="h-8 w-8" />,
      title: "Privacy & Security", 
      description: "All personal information is password protected and only available to members. We never sell your data to third parties."
    },
    {
      id: "10",
      icon: <Users className="h-8 w-8" />,
      title: "No Maximum Competitor Limit",
      description: "There are no limits on how many people can sign up for Ziggy, so tell all your friends!"
    },
    {
      id: "11",
      icon: <Zap className="h-8 w-8" />,
      title: "Extra Debate Opportunity",
      description: "Option to sign up for an extra debate at no cost when there's an odd number of debaters, instead of getting a bye round."
    },
    {
      id: "12",
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Results & Analytics",
      description: "Access detailed results, rankings, and Aff/Neg win-loss analytics for the entire semester to track performance trends."
    }
  ];

  const teamMembers = [
    {
      name: "Perseus Aryani",
      role: "Director", 
      bio: "Perseus has been in speech and debate since 2016, competing for four years in NCFCA. He credits Ziggy as key to his debate success. Currently pursuing a Bachelor's of Neuroscience at UT Dallas, planning to become an emergency room doctor. In his spare time, he writes stories, plays Irish fiddle, and reads his Bible.",
      image: "/lovable-uploads/perseus-avatar.jpg"
    },
    {
      name: "Justus Aryani", 
      role: "Assistant Director",
      bio: "An experienced debater and sourcebook writer in his sixth year of competition. A four-year Ziggy competitor himself, studying Computer Science and Cybersecurity at Collin College. Plans to study International Relations after graduating. Works as a Barista and plays Uillean Pipes in his spare time.",
      image: "/lovable-uploads/justus-avatar.jpg"
    }
  ];

  const sponsors = [
    { name: "Howard Payne University", level: "Exclusive Platinum Partner", url: "https://www.hputx.edu/" },
    { name: "Rhetoric LLC", level: "Gold Sponsor", url: "https://www.rhetoricllc.com/" },
    { name: "Lasting Impact!", level: "Gold Sponsor", url: "https://www.lastingimpact.info/" },
    { name: "ASDA", level: "Gold Sponsor", url: "https://americanspeech.org/" }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SectionFX variant="hero" intensity="medium" />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="mb-6 bg-primary/10 text-primary border-border hover:bg-primary/20 animate-fade-in">
            <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
            Running Online Debate Tournaments Since 2011
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 font-primary animate-fade-in">
            About <span className="text-primary">Ziggy Online Debate™</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary animate-fade-in">
            A national online debate tournament for junior high, high school, and collegiate debaters. 
            We offer Team Policy, Lincoln-Douglas, Parliamentary, and Moot Court styles with 
            bespoke rules designed specifically for online tournaments.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid gap-8 sm:grid-cols-3">
            <Card className="bg-card border-primary/30 shadow-elegant hover-scale text-center group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto group-hover:bg-red-500/20 transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-3xl font-bold text-card-foreground">13+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Years of Excellence</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/30 shadow-elegant hover-scale text-center group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto group-hover:bg-red-500/20 transition-colors">
                  <Globe className="h-6 w-6" />
                </div>
                <CardTitle className="text-3xl font-bold text-card-foreground">National</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Competition Reach</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-primary/30 shadow-elegant hover-scale text-center group">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto group-hover:bg-red-500/20 transition-colors">
                  <Trophy className="h-6 w-6" />
                </div>
                <CardTitle className="text-3xl font-bold text-card-foreground">10</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">NCFCA National Finalists</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-8 font-primary">
            Founded by Excellence
          </h2>
          <Card className="bg-card/50 border-primary/30 shadow-elegant backdrop-blur-sm">
            <CardContent className="p-8">
              <p className="text-lg text-foreground leading-relaxed font-secondary">
                Ziggy Online Debate™ was founded in 2011 by <strong className="text-red-400">Isaac Sommers</strong>, 
                a highly decorated alumnus of NCFCA and Stoa, former debate instructor and coach, 
                and a graduate of Howard Payne University (Class of 2018) and Harvard Law School (Class of 2021). 
                Isaac is now working full-time as a lawyer.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How Ziggy Works */}
      <section className="relative py-16 bg-black">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-12 text-center font-primary">
            How <span className="text-red-500">Ziggy</span> Works
          </h2>
          
          {/* How Ziggy Works Graphic */}
          <div className="mb-12">
            <img 
              src="/lovable-uploads/8b363ad9-c2c5-4087-bc19-215b5ac99e68.png" 
              alt="How Ziggy Works - Comprehensive overview of Ziggy Online Debate platform process including tournament formats, judging, scheduling, and recognition system"
              className="w-full rounded-lg shadow-elegant border border-red-500/20"
            />
          </div>
          
          <div className="flex justify-center">
            <Card className="bg-black border-red-500/30 shadow-elegant hover-scale max-w-2xl w-full">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold text-white flex items-center justify-center gap-3">
                  <MessageSquare className="h-6 w-6 text-red-500" />
                  Host Your Own Tournament
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-white/80 leading-relaxed mb-4">
                  Interested in hosting tournaments for your league, school, or debate format? 
                  We'd love to help you bring the Ziggy experience to your community!
                </p>
                <p className="text-red-400 font-semibold">
                  Contact us to discuss custom tournament hosting options.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Debate */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-12 text-center font-primary">
            Why Debate in the <span className="text-red-500">First Place?</span>
          </h2>
          
          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm hover-scale">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-white">Academic Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm leading-relaxed">
                  Studies show debate participants have higher GPAs (2.83 vs 3.23 average), 
                  significantly higher ACT scores, and 27% higher likelihood of attending college.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm hover-scale">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-white">Essential Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm leading-relaxed">
                  Develops critical thinking, research, public speaking, communication, 
                  analytical, and leadership skills essential for success in any career.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm hover-scale">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <Star className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold text-white">Alumni Success</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 text-sm leading-relaxed">
                  Our alumni attend T6 law schools, pursue medical and international affairs degrees, 
                  coordinate political campaigns, and run successful businesses.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Ziggy Features */}
      <section className="relative py-20 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-center font-primary">
            Why Choose <span className="text-red-500">Ziggy?</span>
          </h2>
          <p className="text-xl text-white/80 text-center mb-16 max-w-3xl mx-auto font-secondary">
            If you want to improve your debate skills, get national experience, 
            and access up to 10 rounds for only $25* - all from home.
          </p>
          
          <div className="grid gap-8 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={feature.id} className="bg-black border-red-500/30 shadow-elegant hover-scale group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded">
                      {feature.id}
                    </span>
                    <div className="text-red-500 group-hover:text-red-400 transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-white group-hover:text-red-100 transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-white/80 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-12 text-center font-primary">
            Meet Our <span className="text-red-500">Team</span>
          </h2>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {teamMembers.map((member, index) => (
              <Card key={index} className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm hover-scale">
                <CardHeader className="text-center">
                  <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto">
                    <Users className="h-12 w-12" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">{member.name}</CardTitle>
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                    {member.role}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 leading-relaxed text-sm">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="relative py-16 bg-black">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-12 text-center font-primary">
            Our <span className="text-red-500">Sponsors</span>
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {sponsors.map((sponsor, index) => (
              <Card key={index} className="bg-black border-red-500/30 shadow-elegant hover-scale text-center group">
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 mb-4 mx-auto group-hover:bg-red-500/20 transition-colors">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{sponsor.name}</h3>
                  <Badge className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
                    {sponsor.level}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tournament Details */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-12 text-center font-primary">
            Tournament <span className="text-red-500">Details</span>
          </h2>
          
          <div className="space-y-6">
            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-red-500" />
                  Fall Tournament
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 leading-relaxed">
                  Debates start mid-September through first week of December. 
                  10 debates over 11 weeks (Thanksgiving week off). Minimum 12 teams per style.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-red-500" />
                  Spring Tournament
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 leading-relaxed">
                  TP and LD begin first week of January through mid-April. 
                  Parli and Moot Court begin second week, alternating every other week. 
                  8 debates over 16 weeks.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-red-500" />
                  Pricing & Discounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 leading-relaxed">
                  $30 per debater/style ($35 late registration in Fall). 
                  Family discounts: 4+ registrations get each additional after 3rd for only $5.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;