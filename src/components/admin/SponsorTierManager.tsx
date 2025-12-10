import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Trophy, Zap, Save, Settings } from "lucide-react";

interface TierSettings {
  id: string;
  tier: string;
  blog_posts_limit: number;
  display_priority: number;
  features: {
    show_logo?: boolean;
    show_description?: boolean;
    featured_badge?: boolean;
    highlighted?: boolean;
  };
}

const SponsorTierManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tiers, setTiers] = useState<TierSettings[]>([]);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('sponsor_tier_settings')
        .select('*')
        .order('display_priority', { ascending: true });

      if (error) throw error;
      
      // Parse features from JSON
      const parsedTiers = (data || []).map(tier => ({
        ...tier,
        features: typeof tier.features === 'string' 
          ? JSON.parse(tier.features) 
          : tier.features || {}
      }));
      
      setTiers(parsedTiers);
    } catch (error) {
      console.error('Error fetching tiers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tier settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (tier: TierSettings) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sponsor_tier_settings')
        .update({
          blog_posts_limit: tier.blog_posts_limit,
          display_priority: tier.display_priority,
          features: tier.features
        })
        .eq('id', tier.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)} tier updated`,
      });
    } catch (error) {
      console.error('Error saving tier:', error);
      toast({
        title: 'Error',
        description: 'Failed to save tier settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTier = (tierId: string, updates: Partial<TierSettings>) => {
    setTiers(prev => prev.map(t => 
      t.id === tierId ? { ...t, ...updates } : t
    ));
  };

  const updateTierFeature = (tierId: string, feature: string, value: boolean) => {
    setTiers(prev => prev.map(t => 
      t.id === tierId 
        ? { ...t, features: { ...t.features, [feature]: value } } 
        : t
    ));
  };

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return <Zap className="h-5 w-5 text-purple-500" />;
      case 'gold':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'silver':
        return <Star className="h-5 w-5 text-gray-400" />;
      case 'bronze':
        return <Trophy className="h-5 w-5 text-orange-600" />;
      default:
        return <Trophy className="h-5 w-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'gold':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'silver':
        return 'border-gray-400/30 bg-gray-400/5';
      case 'bronze':
        return 'border-orange-600/30 bg-orange-600/5';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Sponsor Tier Settings
        </CardTitle>
        <CardDescription>
          Configure blog post limits and features for each sponsorship tier
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {tiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`p-4 border rounded-lg ${getTierColor(tier.tier)}`}
            >
              <div className="flex items-center gap-2 mb-4">
                {getTierIcon(tier.tier)}
                <h3 className="font-bold text-lg capitalize">{tier.tier}</h3>
                <Badge variant="outline" className="ml-auto">
                  Priority: {tier.display_priority}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${tier.id}-posts`}>Blog Posts Limit</Label>
                    <Input
                      id={`${tier.id}-posts`}
                      type="number"
                      min="0"
                      value={tier.blog_posts_limit}
                      onChange={(e) => updateTier(tier.id, { blog_posts_limit: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${tier.id}-priority`}>Display Order</Label>
                    <Input
                      id={`${tier.id}-priority`}
                      type="number"
                      min="1"
                      value={tier.display_priority}
                      onChange={(e) => updateTier(tier.id, { display_priority: parseInt(e.target.value) || 1 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Lower = shown first</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Features</Label>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Logo</span>
                    <Switch
                      checked={tier.features.show_logo ?? true}
                      onCheckedChange={(checked) => updateTierFeature(tier.id, 'show_logo', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Description</span>
                    <Switch
                      checked={tier.features.show_description ?? false}
                      onCheckedChange={(checked) => updateTierFeature(tier.id, 'show_description', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Featured Badge</span>
                    <Switch
                      checked={tier.features.featured_badge ?? false}
                      onCheckedChange={(checked) => updateTierFeature(tier.id, 'featured_badge', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Highlighted Display</span>
                    <Switch
                      checked={tier.features.highlighted ?? false}
                      onCheckedChange={(checked) => updateTierFeature(tier.id, 'highlighted', checked)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={() => handleSave(tier)} 
                  disabled={saving}
                  className="w-full"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save {tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)} Settings
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SponsorTierManager;
