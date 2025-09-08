import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Trophy, Zap, Users, Calendar, Target, ArrowRight } from 'lucide-react';
import { SectionFX } from '@/components/SectionFX';

const Sponsor = () => {

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
                <Card className="bg-card border-primary/30 shadow-elegant hover-scale group">
                  <CardHeader>
                    <Users className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-card-foreground">Reach & Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Connect with thousands of students, educators, and debate enthusiasts 
                      across our tournament network.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-primary/30 shadow-elegant hover-scale group">
                  <CardHeader>
                    <Calendar className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-card-foreground">Year-Round Exposure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Gain visibility through multiple tournaments, events, and our 
                      growing online community platform.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-primary/30 shadow-elegant hover-scale group">
                  <CardHeader>
                    <Target className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-card-foreground">Targeted Audience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Reach a highly engaged audience of future leaders, academics, 
                      and professionals in education.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Why Sponsor Debate Events */}
          <section className="relative py-16 bg-background/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-foreground font-primary">Why Sponsor Debate Events?</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Educational Impact</h3>
                  <p className="text-muted-foreground mb-6">
                    Debate tournaments foster critical thinking, research skills, and public speaking 
                    abilities that prepare students for success in college and careers. Your sponsorship 
                    directly supports educational excellence.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Community Building</h3>
                  <p className="text-muted-foreground">
                    Join a network of organizations committed to intellectual growth and academic 
                    achievement. Build meaningful connections with educators and students.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Brand Visibility</h3>
                  <p className="text-muted-foreground mb-6">
                    Gain exposure to a diverse, engaged audience through tournament materials, 
                    digital platforms, and event recognition opportunities.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Talent Pipeline</h3>
                  <p className="text-muted-foreground">
                    Connect with high-achieving students who represent the next generation of 
                    leaders in business, law, education, and public service.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Sponsorship Tiers */}
          <div className="mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center font-primary">
              Sponsorship <span className="text-primary">Tiers</span>
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Bronze */}
              <Card className="bg-black/80 border-bronze/30 shadow-elegant hover-scale group">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-bronze flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Bronze
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-white/80 text-sm">
                    <div className="text-bronze font-semibold">No Fee*</div>
                    <p>Offer any service or product as a prize for at least <strong>1 student</strong> per semester tournament</p>
                    <p className="text-xs text-white/60">*Optional $25 fee if no prize offered</p>
                    <div className="pt-2">
                      <Badge className="bg-bronze/20 text-bronze border-bronze/30">
                        Entry Level
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Silver */}
              <Card className="bg-black/80 border-silver/30 shadow-elegant hover-scale group">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-silver flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Silver
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-white/80 text-sm">
                    <div className="text-silver font-semibold">$75 Fee</div>
                    <p>Offer any service or product as a prize for at least <strong>2 students</strong> per semester tournament</p>
                    <p className="text-xs text-white/60">Fee waived if prizes offered for 4+ students</p>
                    <div className="pt-2">
                      <Badge className="bg-silver/20 text-silver border-silver/30">
                        Featured on About Page
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gold */}
              <Card className="bg-black/80 border-gold/30 shadow-elegant hover-scale group">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gold flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Gold
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-white/80 text-sm">
                    <div className="text-gold font-semibold">$150 Fee</div>
                    <p>Offer <strong>financial prizes</strong> for at least <strong>3 debate events</strong> per semester tournament</p>
                    <p className="text-xs text-white/60">Fee waived if prizes offered for 6+ events</p>
                    <div className="pt-2">
                      <Badge className="bg-gold/20 text-gold border-gold/30">
                        Featured on Home Page
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platinum */}
              <Card className="bg-black/80 border-platinum/30 shadow-elegant hover-scale group">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-platinum flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Platinum/Legacy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-white/80 text-sm">
                    <div className="text-platinum font-semibold">$1,000+ Fee</div>
                    <p>Offer financial prizes for at least <strong>5 events</strong> and <strong>2+ teams each</strong> per semester</p>
                    <p className="text-xs text-white/60">One year commitment required</p>
                    <div className="pt-2">
                      <Badge className="bg-platinum/20 text-platinum border-platinum/30">
                        Premium Placement
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Examples */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-foreground mb-8 text-center font-primary">
              Past Sponsorship <span className="text-primary">Examples</span>
            </h3>
            
            <Card className="bg-card border-primary/30 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-card-foreground">Prize Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 text-muted-foreground text-sm">
                  <div className="space-y-2">
                    <p>• <strong className="text-primary">$60,000 scholarships</strong> - Howard Payne University (1st & 2nd place teams)</p>
                    <p>• <strong className="text-primary">$17,000/year scholarships</strong> - LeTourneau University (1st place LD)</p>
                    <p>• <strong className="text-primary">Free debate coaching</strong> - Rhetoric LLC (1st place teams)</p>
                    <p>• <strong className="text-primary">Summer camp attendance</strong> - Patrick Henry College (1st place teams)</p>
                  </div>
                  <div className="space-y-2">
                    <p>• <strong className="text-primary">$2,000 scholarships</strong> - Praxis (1st place teams)</p>
                    <p>• <strong className="text-primary">$1,000 scholarships</strong> - Praxis (all participants)</p>
                    <p>• <strong className="text-primary">$8,000 tuition awards</strong> - Criswell College (1st place teams)</p>
                    <p>• <strong className="text-primary">Audition scholarships</strong> - Howard Payne SSB (quarterfinalists)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <section className="relative py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 shadow-elegant backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-card-foreground flex items-center justify-center gap-3">
                    Ready to Make an Impact?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl mx-auto">
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
                      <Button variant="outline" size="lg" className="w-full sm:w-auto">
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