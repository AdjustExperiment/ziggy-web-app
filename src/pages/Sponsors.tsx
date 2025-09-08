import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Building, Star, Heart, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { SectionFX } from "@/components/SectionFX";
import { Link } from "react-router-dom";

interface SponsorProfile {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  website?: string;
  is_platform_partner: boolean;
  partnership_notes?: string;
}

interface SponsorApplication {
  id: string;
  tier: string;
  sponsor_profiles: SponsorProfile;
  tournaments: {
    name: string;
  };
}

interface SiteBlock {
  id: string;
  type: string;
  content: any;
  position: number;
}

const Sponsors = () => {
  const { user } = useOptimizedAuth();
  const [loading, setLoading] = useState(true);
  const [siteBlocks, setSiteBlocks] = useState<SiteBlock[]>([]);
  const [approvedSponsors, setApprovedSponsors] = useState<{ [key: string]: SponsorApplication[] }>({});
  const [platformPartners, setPlatformPartners] = useState<SponsorProfile[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch site blocks for editable content
      const { data: pageData } = await supabase
        .from('site_pages')
        .select('id')
        .eq('slug', 'sponsors')
        .single();

      if (pageData) {
        const { data: blocksData } = await supabase
          .from('site_blocks')
          .select('*')
          .eq('page_id', pageData.id)
          .eq('visible', true)
          .order('position');

        setSiteBlocks(blocksData || []);
      }

      // Fetch approved sponsor applications grouped by tier
      const { data: applicationsData } = await supabase
        .from('sponsor_applications')
        .select(`
          *,
          sponsor_profiles(*),
          tournaments(name, status)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      // Group by tier
      const groupedByTier: { [key: string]: SponsorApplication[] } = {};
      applicationsData?.forEach((app) => {
        const tier = app.tier.toLowerCase();
        if (!groupedByTier[tier]) {
          groupedByTier[tier] = [];
        }
        groupedByTier[tier].push(app);
      });

      setApprovedSponsors(groupedByTier);

      // Fetch platform partners
      const { data: partnersData } = await supabase
        .from('sponsor_profiles')
        .select('*')
        .eq('is_platform_partner', true);

      setPlatformPartners(partnersData || []);
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderSiteBlock = (block: SiteBlock) => {
    switch (block.type) {
      case 'heading':
        const HeadingTag = block.content.level || 'h2';
        return (
          <HeadingTag key={block.id} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 text-center font-primary">
            {block.content.text}
          </HeadingTag>
        );
      case 'text':
        return (
          <div 
            key={block.id} 
            className="text-lg text-white/80 text-center mb-8 max-w-3xl mx-auto font-secondary"
            dangerouslySetInnerHTML={{ __html: block.content.html }}
          />
        );
      default:
        return null;
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return <Star className="h-5 w-5 text-platinum" />;
      case 'gold':
        return <Trophy className="h-5 w-5 text-gold" />;
      case 'silver':
        return <Trophy className="h-5 w-5 text-silver" />;
      case 'bronze':
        return <Trophy className="h-5 w-5 text-bronze" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };

  const getTierGradient = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 'from-platinum/20 to-platinum/5';
      case 'gold':
        return 'from-gold/20 to-gold/5';
      case 'silver':
        return 'from-silver/20 to-silver/5';
      case 'bronze':
        return 'from-bronze/20 to-bronze/5';
      default:
        return 'from-red-500/20 to-red-500/5';
    }
  };

  const renderSponsorCard = (sponsor: SponsorProfile, tier?: string, tournaments?: string[]) => (
    <Card 
      key={sponsor.id} 
      className="bg-black border-red-500/30 shadow-elegant hover-scale group relative overflow-hidden"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${getTierGradient(tier || '')} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {sponsor.logo_url ? (
              <img 
                src={sponsor.logo_url} 
                alt={`${sponsor.name} logo`}
                className="h-12 w-12 object-contain rounded"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-red-500/10 flex items-center justify-center">
                <Building className="h-6 w-6 text-red-500" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-bold text-white group-hover:text-red-100 transition-colors">
                {sponsor.name}
              </CardTitle>
              <div className="flex gap-2 mt-1">
                {tier && (
                  <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-xs">
                    {getTierIcon(tier)}
                    <span className="ml-1">{tier.toUpperCase()}</span>
                  </Badge>
                )}
                {sponsor.is_platform_partner && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                    <Heart className="h-3 w-3 mr-1" />
                    Partner
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {sponsor.website && (
            <Button 
              size="sm" 
              variant="outline"
              className="border-red-500/30 hover:bg-red-500/10"
              onClick={() => window.open(sponsor.website, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        {sponsor.description && (
          <p className="text-white/80 leading-relaxed mb-4 text-sm">
            {sponsor.description}
          </p>
        )}
        
        {tournaments && tournaments.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-red-400 mb-2">Sponsoring:</p>
            <div className="flex flex-wrap gap-1">
              {tournaments.map((tournament, idx) => (
                <Badge key={idx} variant="outline" className="text-xs border-white/20 text-white/70">
                  {tournament}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {sponsor.is_platform_partner && sponsor.partnership_notes && (
          <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded">
            <p className="text-xs text-primary/80">
              {sponsor.partnership_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tiers = ['platinum', 'gold', 'silver', 'bronze'];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SectionFX variant="hero" intensity="medium" />
      
      {/* Hero Section with Editable Content */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {siteBlocks.map(renderSiteBlock)}
          
          {/* Default content if no site blocks */}
          {siteBlocks.length === 0 && (
            <>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-foreground mb-6 font-primary animate-fade-in">
                Our <span className="text-primary">Sponsors</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-secondary animate-fade-in">
                We proudly recognize our platform partners and tournament sponsors who make Ziggy Online Debate possible.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Sponsorship Information */}
      <section className="relative py-16 bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 font-primary">
              Become a <span className="text-primary">Sponsor</span>
            </h2>
            <p className="text-lg text-white/80 max-w-3xl mx-auto font-secondary">
              Partner with Ziggy Online Debate® and support accessible, high-quality debate education nationwide.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 mb-16">
            {/* Overview */}
            <Card className="bg-black/80 border-primary/30 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <Building className="h-6 w-6 text-primary" />
                  Sponsorship Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-white/80">
                  <p>
                    Sponsorship agreements are determined on a yearly basis and by default include both of 
                    Ziggy's premiere offerings: the Fall Semester Tournament and the Spring Semester Tournament.
                  </p>
                  <p>
                    The Ziggy Online Debate® website features all current sponsors on this dedicated page. 
                    Higher tier sponsorships also feature sponsors' logos prominently throughout the site.
                  </p>
                  <p>
                    Sponsors are encouraged to offer services that students can use immediately or in the coming years, 
                    such as college scholarships, training programs, and coaching services.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Debate Events */}
            <Card className="bg-black/80 border-primary/30 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  Debate Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-white/80 text-sm">
                  <p className="text-white font-medium mb-3">We typically recognize awards for:</p>
                  <ul className="space-y-2">
                    <li>• NCFCA Team Policy (TP) - 2 individuals per team</li>
                    <li>• Stoa Team Policy - 2 individuals per team</li>
                    <li>• NCFCA Lincoln-Douglas (LD) - Individual event</li>
                    <li>• Stoa Lincoln-Douglas - Individual event</li>
                    <li>• Team Parliamentary Debate - 2 individuals per team</li>
                    <li>• Individual Parliamentary - Individual event</li>
                    <li>• Moot Court (Spring only) - 2 individuals per team</li>
                  </ul>
                  <p className="text-primary/80 mt-4">
                    Most popular: NCFCA LD, NCFCA TP, Stoa LD, and Stoa TP
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

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
            <h3 className="text-2xl font-bold text-white mb-8 text-center font-primary">
              Past Sponsorship <span className="text-primary">Examples</span>
            </h3>
            
            <Card className="bg-black/80 border-primary/30 shadow-elegant">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">Prize Examples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 text-white/80 text-sm">
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

          {/* CTA */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 shadow-elegant backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                  <Heart className="h-6 w-6 text-primary" />
                  Ready to Partner with Ziggy?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 leading-relaxed mb-6 max-w-2xl mx-auto">
                  Join our mission to provide accessible, high-quality debate education nationwide. 
                  Help shape the next generation of critical thinkers and public speakers.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {user ? (
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                      <Link to="/sponsor">Create Sponsor Account</Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                      <Link to="/login?sponsor=true">Create Sponsor Account</Link>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSdWCj-1nnRKUUOD6sPsQ9Le4bY1_Ib15JyhYlzTezCRbOg6ig/viewform?usp=sf_link', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Submit Application Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Platform Partners */}
      {platformPartners.length > 0 && (
        <section className="relative py-16 bg-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-12 text-center font-primary">
              Platform <span className="text-primary">Partners</span>
            </h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {platformPartners.map((partner) => renderSponsorCard(partner))}
            </div>
          </div>
        </section>
      )}

      {/* Tournament Sponsors by Tier */}
      {Object.keys(approvedSponsors).length > 0 && (
        <section className="relative py-16 bg-gradient-subtle">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-12 text-center font-primary">
              Tournament <span className="text-primary">Sponsors</span>
            </h2>
            
            {tiers.map((tier) => {
              const tierSponsors = approvedSponsors[tier];
              if (!tierSponsors || tierSponsors.length === 0) return null;
              
              // Group sponsors by profile (a sponsor might sponsor multiple tournaments)
              const sponsorMap = new Map<string, { profile: SponsorProfile; tournaments: string[] }>();
              
              tierSponsors.forEach((app) => {
                const profileId = app.sponsor_profiles.id;
                if (sponsorMap.has(profileId)) {
                  sponsorMap.get(profileId)!.tournaments.push(app.tournaments.name);
                } else {
                  sponsorMap.set(profileId, {
                    profile: app.sponsor_profiles,
                    tournaments: [app.tournaments.name]
                  });
                }
              });

              return (
                <div key={tier} className="mb-12">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center capitalize">
                    {getTierIcon(tier)}
                    <span className="ml-2">{tier} Sponsors</span>
                  </h3>
                  
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from(sponsorMap.values()).map(({ profile, tournaments }) =>
                      renderSponsorCard(profile, tier, tournaments)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {Object.keys(approvedSponsors).length === 0 && platformPartners.length === 0 && (
        <section className="relative py-16 bg-black">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <Card className="bg-black/50 border-red-500/30 shadow-elegant backdrop-blur-sm">
              <CardContent className="p-12">
                <Building className="h-16 w-16 text-red-500/50 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-4">No Sponsors Yet</h3>
                <p className="text-white/80 leading-relaxed">
                  We're actively seeking partners to support our mission. 
                  Be among the first to sponsor Ziggy Online Debate!
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="relative py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
            Ready to Make an Impact?
          </h3>
          <p className="text-white/80 mb-6">
            Join our community of sponsors and help provide accessible debate education nationwide.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to="/sponsor">Sponsor Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link to="/login?sponsor=true">Create Sponsor Account</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sponsors;