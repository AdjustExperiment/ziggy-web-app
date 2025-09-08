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
      price: "$500+",
      icon: <Trophy className="h-8 w-8 text-primary" />,
      benefits: [
        "Logo on tournament materials",
        "Social media recognition",
        "Basic event listing"
      ]
    },
    {
      name: "Silver", 
      price: "$1,000+",
      icon: <Star className="h-8 w-8 text-primary" />,
      benefits: [
        "Everything in Bronze",
        "Prominent logo placement",
        "Judge recruitment priority",
        "Event program inclusion"
      ]
    },
    {
      name: "Gold",
      price: "$2,500+", 
      icon: <Crown className="h-8 w-8 text-primary" />,
      benefits: [
        "Everything in Silver",
        "Speaking opportunities",
        "VIP tournament access",
        "Custom recognition ceremony"
      ]
    },
    {
      name: "Platinum/Legacy",
      price: "$5,000+",
      icon: <Zap className="h-8 w-8 text-primary" />,
      benefits: [
        "Everything in Gold",
        "Tournament naming rights",
        "Exclusive networking events", 
        "Year-round partnership"
      ]
    }
  ];

  const pastSponsorships = [
    {
      name: "Harvard Debate Society",
      tier: "Gold",
      tournaments: ["National Championships 2024", "Regional Qualifiers"],
      description: "Supporting collegiate debate excellence"
    },
    {
      name: "TechCorp Solutions",
      tier: "Silver", 
      tournaments: ["High School Invitational"],
      description: "Empowering the next generation of critical thinkers"
    },
    {
      name: "Education Foundation",
      tier: "Platinum",
      tournaments: ["Summer Debate Camp", "Youth League Championships"],
      description: "Committed to educational excellence and opportunity"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SectionFX variant="hero" intensity="medium" />
      <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
              Become a Sponsor
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Partner with us to support the future of competitive debate. Join leading organizations 
              in fostering critical thinking, public speaking, and academic excellence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/sponsor/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>

          {/* Sponsorship Overview */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Reach & Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with thousands of students, educators, and debate enthusiasts 
                  across our tournament network.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Year-Round Exposure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Gain visibility through multiple tournaments, events, and our 
                  growing online community platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Targeted Audience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Reach a highly engaged audience of future leaders, academics, 
                  and professionals in education.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Why Sponsor Debate Events */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Why Sponsor Debate Events?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Educational Impact</h3>
                <p className="text-muted-foreground mb-6">
                  Debate tournaments foster critical thinking, research skills, and public speaking 
                  abilities that prepare students for success in college and careers. Your sponsorship 
                  directly supports educational excellence.
                </p>
                
                <h3 className="text-xl font-semibold mb-4">Community Building</h3>
                <p className="text-muted-foreground">
                  Join a network of organizations committed to intellectual growth and academic 
                  achievement. Build meaningful connections with educators and students.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4">Brand Visibility</h3>
                <p className="text-muted-foreground mb-6">
                  Gain exposure to a diverse, engaged audience through tournament materials, 
                  digital platforms, and event recognition opportunities.
                </p>
                
                <h3 className="text-xl font-semibold mb-4">Talent Pipeline</h3>
                <p className="text-muted-foreground">
                  Connect with high-achieving students who represent the next generation of 
                  leaders in business, law, education, and public service.
                </p>
              </div>
            </div>
          </div>

          {/* Sponsorship Tiers */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Sponsorship Tiers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sponsorshipTiers.map((tier, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      {tier.icon}
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription className="text-2xl font-bold text-primary">
                      {tier.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tier.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="text-sm text-muted-foreground flex items-start">
                          <span className="text-primary mr-2">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Examples of Past Sponsorships */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Success Stories</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {pastSponsorships.map((sponsor, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">{sponsor.name}</CardTitle>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getTierIcon(sponsor.tier)}
                        {sponsor.tier}
                      </Badge>
                    </div>
                    <CardDescription>{sponsor.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <h4 className="font-semibold mb-2">Sponsored Tournaments:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {sponsor.tournaments.map((tournament, tournamentIndex) => (
                          <li key={tournamentIndex}>• {tournament}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-card rounded-xl p-8 border">
            <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our community of sponsors supporting the next generation of leaders. 
              Start your sponsorship journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/sponsor/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Submit Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Download Sponsorship Package
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default Sponsor;