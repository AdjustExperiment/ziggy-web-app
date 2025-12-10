import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Building2, Star, Award, Trophy, Crown } from 'lucide-react';
import { ErrorDisplay } from '@/components/ErrorDisplay';

interface SponsorProfile {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  user_id: string;
  is_approved: boolean;
  approved_tier: string | null;
}

interface TournamentSponsorLink {
  id: string;
  tournament_id: string;
  sponsor_profile_id: string;
  tier: string;
  is_primary: boolean;
  display_order: number;
  sponsor_profile?: SponsorProfile;
}

interface TournamentSponsorSelectorProps {
  tournamentId: string;
}

const TIER_OPTIONS = [
  { value: 'bronze', label: 'Supporting', icon: Building2 },
  { value: 'silver', label: 'Major', icon: Star },
  { value: 'gold', label: 'Presenting', icon: Award },
  { value: 'platinum', label: 'Title', icon: Crown },
];

export function TournamentSponsorSelector({ tournamentId }: TournamentSponsorSelectorProps) {
  const [linkedSponsors, setLinkedSponsors] = useState<TournamentSponsorLink[]>([]);
  const [availableSponsors, setAvailableSponsors] = useState<SponsorProfile[]>([]);
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('bronze');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch linked sponsors for this tournament
      const { data: links, error: linksError } = await supabase
        .from('tournament_sponsor_links')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('display_order');

      if (linksError) throw linksError;

      // Fetch sponsor profiles for linked sponsors
      const linkedIds = links?.map(l => l.sponsor_profile_id) || [];
      let linkedWithProfiles: TournamentSponsorLink[] = [];
      
      if (linkedIds.length > 0) {
        const { data: profiles } = await supabase
          .from('sponsor_profiles')
          .select('id, name, logo_url, website, user_id, is_approved, approved_tier')
          .in('id', linkedIds);
        
        linkedWithProfiles = (links || []).map(link => ({
          ...link,
          sponsor_profile: profiles?.find(p => p.id === link.sponsor_profile_id)
        }));
      }

      setLinkedSponsors(linkedWithProfiles);

      // Fetch all approved sponsors not yet linked
      const { data: allSponsors, error: sponsorsError } = await supabase
        .from('sponsor_profiles')
        .select('id, name, logo_url, website, user_id, is_approved, approved_tier')
        .eq('is_approved', true);

      if (sponsorsError) throw sponsorsError;

      const available = (allSponsors || []).filter(
        s => !linkedIds.includes(s.id)
      );
      setAvailableSponsors(available);

    } catch (error: any) {
      console.error('Error fetching sponsors:', error);
      toast({
        title: "Error",
        description: "Failed to load sponsors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSponsor = async () => {
    if (!selectedSponsorId) return;

    setSaving(true);
    try {
      const maxOrder = Math.max(...linkedSponsors.map(s => s.display_order), 0);
      
      const { error } = await supabase
        .from('tournament_sponsor_links')
        .insert({
          tournament_id: tournamentId,
          sponsor_profile_id: selectedSponsorId,
          tier: selectedTier,
          display_order: maxOrder + 1,
          is_primary: linkedSponsors.length === 0
        });

      if (error) throw error;

      toast({
        title: "Sponsor Added",
        description: "Sponsor has been linked to this tournament",
      });

      setSelectedSponsorId('');
      fetchData();
    } catch (error: any) {
      console.error('Error adding sponsor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add sponsor",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeSponsor = async (linkId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tournament_sponsor_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast({
        title: "Sponsor Removed",
        description: "Sponsor has been unlinked from this tournament",
      });

      fetchData();
    } catch (error: any) {
      console.error('Error removing sponsor:', error);
      toast({
        title: "Error",
        description: "Failed to remove sponsor",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTier = async (linkId: string, newTier: string) => {
    try {
      const { error } = await supabase
        .from('tournament_sponsor_links')
        .update({ tier: newTier })
        .eq('id', linkId);

      if (error) throw error;

      setLinkedSponsors(prev => prev.map(s => 
        s.id === linkId ? { ...s, tier: newTier } : s
      ));

      toast({
        title: "Tier Updated",
        description: "Sponsor tier has been updated",
      });
    } catch (error: any) {
      console.error('Error updating tier:', error);
    }
  };

  const getTierIcon = (tier: string) => {
    const tierOption = TIER_OPTIONS.find(t => t.value === tier);
    if (!tierOption) return <Building2 className="h-4 w-4" />;
    const Icon = tierOption.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'bronze': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return '';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Tournament Sponsors
        </CardTitle>
        <CardDescription>
          Link approved sponsors to this tournament. Sponsors must apply and be approved first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Sponsor Form */}
        {availableSponsors.length > 0 ? (
          <div className="flex items-end gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex-1 space-y-2">
              <Label>Select Sponsor</Label>
              <Select value={selectedSponsorId} onValueChange={setSelectedSponsorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a sponsor..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSponsors.map(sponsor => (
                    <SelectItem key={sponsor.id} value={sponsor.id}>
                      {sponsor.name}
                      {sponsor.approved_tier && (
                        <span className="ml-2 text-muted-foreground">
                          ({sponsor.approved_tier})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-40 space-y-2">
              <Label>Tier</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map(tier => (
                    <SelectItem key={tier.value} value={tier.value}>
                      <div className="flex items-center gap-2">
                        <tier.icon className="h-4 w-4" />
                        {tier.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={addSponsor} disabled={!selectedSponsorId || saving}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        ) : linkedSponsors.length === 0 ? (
          <ErrorDisplay
            errorCode="ERR_NO_SPONSORS"
            message="No approved sponsors available"
            details="Sponsors must complete an application and be approved before they can be linked to tournaments."
            variant="info"
          />
        ) : null}

        {/* Linked Sponsors Table */}
        {linkedSponsors.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sponsor</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedSponsors.map(link => (
                <TableRow key={link.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {link.sponsor_profile?.logo_url ? (
                        <img 
                          src={link.sponsor_profile.logo_url} 
                          alt={link.sponsor_profile.name}
                          className="h-8 w-8 rounded object-contain bg-muted"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{link.sponsor_profile?.name || 'Unknown'}</p>
                        {link.sponsor_profile?.website && (
                          <a 
                            href={link.sponsor_profile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            {link.sponsor_profile.website}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={link.tier} 
                      onValueChange={(val) => updateTier(link.id, val)}
                    >
                      <SelectTrigger className="w-32">
                        <div className="flex items-center gap-2">
                          {getTierIcon(link.tier)}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {TIER_OPTIONS.map(tier => (
                          <SelectItem key={tier.value} value={tier.value}>
                            <div className="flex items-center gap-2">
                              <tier.icon className="h-4 w-4" />
                              {tier.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {link.is_primary ? (
                      <Badge>Primary</Badge>
                    ) : (
                      <Badge variant="outline">Linked</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSponsor(link.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {linkedSponsors.length === 0 && availableSponsors.length > 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No sponsors linked yet. Add sponsors from the list above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
