import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Star, Trophy, Zap, ArrowRight } from 'lucide-react';
import { SectionFX } from '@/components/SectionFX';

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
  content: Record<string, unknown>;
  position: number;
}

const Sponsors = () => {
  const [loading, setLoading] = useState(true);
  const [siteBlocks, setSiteBlocks] = useState<SiteBlock[]>([]);
  const [approvedSponsors, setApprovedSponsors] = useState<{ [key: string]: SponsorApplication[] }>({});
  const [platformPartners, setPlatformPartners] = useState<SponsorProfile[]>([]);
  const [customCss, setCustomCss] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch site blocks for editable content
      const { data: pageData } = await supabase
        .from('site_pages')
        .select('id, custom_css')
        .eq('slug', 'sponsors')
        .single();

      if (pageData) {
        setCustomCss(pageData.custom_css || '');
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
        case 'heading': {
          const HeadingTag = (block.content.level as keyof JSX.IntrinsicElements) || 'h2';
          return (
            <HeadingTag key={block.id} className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-center">
              {block.content.text as string}
            </HeadingTag>
          );
        }
        case 'text':
          return (
            <div
              key={block.id}
              className="text-lg text-muted-foreground text-center mb-8 max-w-3xl mx-auto"
              dangerouslySetInnerHTML={{ __html: block.content.html as string }}
            />
          );
        default:
          return null;
      }
    };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
      case 'legacy':
        return <Zap className="h-5 w-5" />;
      case 'gold':
        return <Crown className="h-5 w-5" />;
      case 'silver':
        return <Star className="h-5 w-5" />;
      case 'bronze':
        return <Trophy className="h-5 w-5" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };

  const renderSponsorCard = (sponsor: SponsorProfile, tier?: string, tournaments?: string[]) => (
    <Card key={sponsor.id} className="hover-scale group">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {sponsor.logo_url ? (
              <img 
                src={sponsor.logo_url} 
                alt={`${sponsor.name} logo`}
                className="h-12 w-12 object-contain rounded"
              />
            ) : (
              <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                {sponsor.name}
              </CardTitle>
              <div className="flex gap-2 mt-1">
                {tier && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getTierIcon(tier)}
                    <span className="ml-1">{tier.toUpperCase()}</span>
                  </Badge>
                )}
                {sponsor.is_platform_partner && (
                  <Badge variant="outline" className="text-xs">
                    Platform Partner
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {sponsor.website && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(sponsor.website, '_blank')}
            >
              Visit Website
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sponsor.description && (
          <p className="text-muted-foreground leading-relaxed mb-4 text-sm">
            {sponsor.description}
          </p>
        )}
        
        {tournaments && tournaments.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-primary mb-2">Sponsoring:</p>
            <div className="flex flex-wrap gap-1">
              {tournaments.map((tournament, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
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
      <style>{customCss}</style>
      <SectionFX variant="hero" intensity="medium" />
      
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {siteBlocks.map(renderSiteBlock)}
          
          {/* Default content if no site blocks */}
          {siteBlocks.length === 0 && (
            <>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 gradient-text">
                Our Sponsors
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                We proudly recognize our platform partners and tournament sponsors who make Ziggy Online Debate possible.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="relative py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Platform Partners */}
          {platformPartners.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
                Platform Partners
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {platformPartners.map((partner) => renderSponsorCard(partner))}
              </div>
            </div>
          )}

          {/* Tournament Sponsors by Tier */}
          {tiers.map((tier) => {
            const tierSponsors = approvedSponsors[tier];
            if (!tierSponsors || tierSponsors.length === 0) return null;

            return (
              <div key={tier} className="mb-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 flex items-center justify-center gap-3">
                  {getTierIcon(tier)}
                  {tier.charAt(0).toUpperCase() + tier.slice(1)} Sponsors
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {tierSponsors.map((sponsorApp) => 
                    renderSponsorCard(
                      sponsorApp.sponsor_profiles, 
                      tier,
                      [sponsorApp.tournaments.name]
                    )
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {Object.keys(approvedSponsors).length === 0 && platformPartners.length === 0 && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold mb-4">No Sponsors Yet</h2>
              <p className="text-muted-foreground mb-8">
                We're currently building our sponsor network. Be the first to join!
              </p>
              <Link to="/sponsor">
                <Button size="lg">
                  Become a Sponsor
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center bg-card rounded-xl p-8 border">
            <h2 className="text-3xl font-bold mb-4">Become a Sponsor</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our community of sponsors and help shape the future of competitive debate.
            </p>
            <Link to="/sponsor">
              <Button size="lg">
                Learn More & Apply
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sponsors;