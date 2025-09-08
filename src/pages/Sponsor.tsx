import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Trophy, Zap, Users, Calendar, Target, ArrowRight } from 'lucide-react';
import { SectionFX } from '@/components/SectionFX';

const Sponsor = () => {
  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return <Trophy className="h-6 w-6" />;
      case 'silver': return <Star className="h-6 w-6" />;
      case 'gold': return <Crown className="h-6 w-6" />;
      case 'platinum':
      case 'legacy': return <Zap className="h-6 w-6" />;
      default: return <Trophy className="h-6 w-6" />;
    }
  };

  const sponsorshipTiers = [
    {
      name: "Bronze",
      price: "No Fee*",
      icon: <Trophy className="h-8 w-8 text-primary" />,
      benefits: [
        "Offer prize for at least 1 student per semester",
        "Listed on sponsors page",
        "Basic recognition in tournament materials",
        "*Optional $25 fee if no prize offered"
      ]
    },
    {
      name: "Silver", 
      price: "$75 Fee*",
      icon: <Star className="h-8 w-8 text-primary" />,
      benefits: [
        "Offer prize for at least 2 students per semester",
        "Logo featured on About Us page",
        "Enhanced tournament visibility",
        "*Fee waived if prizes for 4+ students"
      ]
    },
    {
      name: "Gold",
      price: "$150 Fee*", 
      icon: <Crown className="h-8 w-8 text-primary" />,
      benefits: [
        "Offer financial prize for 3+ debate events",
        "Logo featured on home page",
        "Priority sponsor recognition",
        "*Fee waived if prizes for 6+ events"
      ]
    },
    {
      name: "Platinum/Legacy",
      price: "$1,000+ Fee",
      icon: <Zap className="h-8 w-8 text-primary" />,
      benefits: [
        "Financial prize for 5+ events per semester",
        "2+ teams per event requirement",
        "Premium home page placement",
        "Exclusive partnership benefits"
      ]
    }
  ];

  const pastSponsorships = [
    {
      name: "Howard Payne University",
      tier: "Platinum",
      prizes: ["$60,000 scholarships for 1st & 2nd place teams", "$56,000 scholarships for 3rd & 4th place teams"],
      description: "Major university scholarship provider"
    },
    {
      name: "LeTourneau University",
      tier: "Gold", 
      prizes: ["Free dual credit college class", "$17,000/year scholarship upon completion"],
      description: "Educational partnership and tuition assistance"
    },
    {
      name: "Praxis",
      tier: "Gold",
      prizes: ["$1,000 scholarships for all participants", "$2,000 scholarships for 1st place teams"],
      description: "Comprehensive student support program"
    },
    {
      name: "Rhetoric LLC",
      tier: "Bronze",
      prizes: ["Free coaching sessions", "Random participant prizes"],
      description: "Professional debate coaching services"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SectionFX variant="hero" intensity="medium" />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 font-primary animate-fade-in">
            Become a <span className="text-primary">Sponsor</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-8 font-secondary animate-fade-in">
            Partner with us to support the future of competitive debate. Join leading organizations 
            in fostering critical thinking, public speaking, and academic excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLSdWCj-1nnRKUUOD6sPsQ9Le4bY1_Ib15JyhYlzTezCRbOg6ig/viewform?usp=sf_link" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                Apply Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-foreground hover:bg-white/10">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 relative z-10">

          {/* Sponsorship Overview */}
          <section className="relative py-16 bg-gradient-subtle">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <Card className="bg-black/80 border-primary/30 shadow-elegant hover-scale group">
                  <CardHeader>
                    <Users className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-white">Reach & Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80">
                      Connect with thousands of students, educators, and debate enthusiasts 
                      across our tournament network.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 border-primary/30 shadow-elegant hover-scale group">
                  <CardHeader>
                    <Calendar className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-white">Year-Round Exposure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80">
                      Gain visibility through multiple tournaments, events, and our 
                      growing online community platform.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-black/80 border-primary/30 shadow-elegant hover-scale group">
                  <CardHeader>
                    <Target className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-white">Targeted Audience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80">
                      Reach a highly engaged audience of future leaders, academics, 
                      and professionals in education.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Why Sponsor Debate Events */}
          <section className="relative py-16 bg-black/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-white font-primary">Why Sponsor Debate Events?</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Educational Impact</h3>
                  <p className="text-white/80 mb-6">
                    Debate tournaments foster critical thinking, research skills, and public speaking 
                    abilities that prepare students for success in college and careers. Your sponsorship 
                    directly supports educational excellence.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4 text-white">Community Building</h3>
                  <p className="text-white/80">
                    Join a network of organizations committed to intellectual growth and academic 
                    achievement. Build meaningful connections with educators and students.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-white">Brand Visibility</h3>
                  <p className="text-white/80 mb-6">
                    Gain exposure to a diverse, engaged audience through tournament materials, 
                    digital platforms, and event recognition opportunities.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4 text-white">Talent Pipeline</h3>
                  <p className="text-white/80">
                    Connect with high-achieving students who represent the next generation of 
                    leaders in business, law, education, and public service.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sponsorship Tiers */}
          <section className="relative py-16 bg-gradient-subtle">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-white font-primary">Sponsorship <span className="text-primary">Tiers</span></h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {sponsorshipTiers.map((tier, index) => {
                  const getTierGradient = (name: string) => {
                    switch (name.toLowerCase()) {
                      case 'bronze': return 'from-bronze/20 to-bronze/5';
                      case 'silver': return 'from-silver/20 to-silver/5';
                      case 'gold': return 'from-gold/20 to-gold/5';
                      case 'platinum/legacy': return 'from-platinum/20 to-platinum/5';
                      default: return 'from-red-500/20 to-red-500/5';
                    }
                  };

                  const getTierColor = (name: string) => {
                    switch (name.toLowerCase()) {
                      case 'bronze': return 'text-bronze';
                      case 'silver': return 'text-silver';
                      case 'gold': return 'text-gold';
                      case 'platinum/legacy': return 'text-platinum';
                      default: return 'text-primary';
                    }
                  };

                  return (
                    <Card key={index} className="bg-black/80 border-primary/30 shadow-elegant hover-scale group relative overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${getTierGradient(tier.name)} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      <CardHeader className="text-center relative z-10">
                        <div className="flex justify-center mb-4">
                          <div className={getTierColor(tier.name)}>
                            {tier.icon}
                          </div>
                        </div>
                        <CardTitle className="text-xl text-white">{tier.name}</CardTitle>
                        <CardDescription className={`text-2xl font-bold ${getTierColor(tier.name)}`}>
                          {tier.price}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10">
                        <ul className="space-y-2">
                          {tier.benefits.map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="text-sm text-white/80 flex items-start">
                              <span className="text-primary mr-2">•</span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Examples of Past Sponsorships */}
          <section className="relative py-16 bg-black/20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-white font-primary">Success <span className="text-primary">Stories</span></h2>
              <div className="grid md:grid-cols-3 gap-6">
                {pastSponsorships.map((sponsor, index) => (
                  <Card key={index} className="bg-black/80 border-primary/30 shadow-elegant hover-scale group">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg text-white">{sponsor.name}</CardTitle>
                        <Badge variant="secondary" className="flex items-center gap-1 bg-primary/20 text-primary border-primary/30">
                          {getTierIcon(sponsor.tier)}
                          {sponsor.tier}
                        </Badge>
                      </div>
                      <CardDescription className="text-white/70">{sponsor.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Prize Examples:</h4>
                        <ul className="text-sm text-white/80 space-y-1">
                          {sponsor.prizes.map((prize, prizeIndex) => (
                            <li key={prizeIndex}>• {prize}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="relative py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 shadow-elegant backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center gap-3">
                    Ready to Make an Impact?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl text-white/80 leading-relaxed mb-8 max-w-2xl mx-auto">
                    Join our community of sponsors supporting the next generation of leaders. 
                    Start your sponsorship journey today.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a 
                      href="https://docs.google.com/forms/d/e/1FAIpQLSdWCj-1nnRKUUOD6sPsQ9Le4bY1_Ib15JyhYlzTezCRbOg6ig/viewform?usp=sf_link" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                        Submit Application
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </a>
                    <Link to="/contact">
                      <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10">
                        View Guidelines
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    );
  };

export default Sponsor;