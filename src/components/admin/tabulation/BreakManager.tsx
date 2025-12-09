import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Download, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { BreakGenerator, BreakCategory, BreakResult, TeamStanding, BreakRule } from '@/lib/tabulation/breakGenerator';

interface BreakManagerProps {
  tournamentId: string;
  standings: TeamStanding[];
  onRefreshStandings: () => void;
}

interface CategoryEligibility {
  categoryId: string;
  teamId: string;
  isEligible: boolean;
}

export function BreakManager({ tournamentId, standings, onRefreshStandings }: BreakManagerProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<BreakCategory[]>([]);
  const [eligibility, setEligibility] = useState<CategoryEligibility[]>([]);
  const [breakResults, setBreakResults] = useState<Map<string, BreakResult[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    breakSize: 8,
    rule: 'standard' as BreakRule,
    institutionCap: 3,
    isGeneral: true,
  });

  useEffect(() => {
    fetchCategories();
  }, [tournamentId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('break_categories')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('priority');

      if (error) throw error;

      const mapped: BreakCategory[] = (data || []).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        breakSize: c.break_size,
        rule: c.rule as BreakRule,
        institutionCap: c.institution_cap || 3,
        isGeneral: c.is_general,
        priority: c.priority,
      }));

      setCategories(mapped);
      await fetchEligibility(mapped);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibility = async (cats: BreakCategory[]) => {
    try {
      const { data, error } = await supabase
        .from('team_break_eligibility')
        .select('*')
        .in('break_category_id', cats.map(c => c.id));

      if (error) throw error;

      setEligibility((data || []).map(e => ({
        categoryId: e.break_category_id,
        teamId: e.registration_id,
        isEligible: e.is_eligible,
      })));
    } catch (error) {
      console.error('Error fetching eligibility:', error);
    }
  };

  const addCategory = async () => {
    try {
      const { error } = await supabase
        .from('break_categories')
        .insert({
          tournament_id: tournamentId,
          name: newCategory.name,
          slug: newCategory.slug || newCategory.name.toLowerCase().replace(/\s+/g, '-'),
          break_size: newCategory.breakSize,
          rule: newCategory.rule,
          institution_cap: newCategory.institutionCap,
          is_general: newCategory.isGeneral,
          priority: categories.length,
        });

      if (error) throw error;

      toast({ title: "Success", description: "Break category created" });
      setShowAddCategory(false);
      setNewCategory({ name: '', slug: '', breakSize: 8, rule: 'standard', institutionCap: 3, isGeneral: true });
      fetchCategories();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('break_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Deleted", description: "Break category removed" });
      fetchCategories();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleEligibility = async (categoryId: string, teamId: string, currentlyEligible: boolean) => {
    try {
      if (currentlyEligible) {
        // Mark as ineligible
        const { error } = await supabase
          .from('team_break_eligibility')
          .upsert({
            break_category_id: categoryId,
            registration_id: teamId,
            is_eligible: false,
          }, { onConflict: 'break_category_id,registration_id' });

        if (error) throw error;
      } else {
        // Remove ineligibility or mark as eligible
        const { error } = await supabase
          .from('team_break_eligibility')
          .upsert({
            break_category_id: categoryId,
            registration_id: teamId,
            is_eligible: true,
          }, { onConflict: 'break_category_id,registration_id' });

        if (error) throw error;
      }

      setEligibility(prev => {
        const filtered = prev.filter(e => !(e.categoryId === categoryId && e.teamId === teamId));
        return [...filtered, { categoryId, teamId, isEligible: !currentlyEligible }];
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const generateBreak = async (category: BreakCategory) => {
    try {
      setGenerating(true);

      // Build eligibility map for this category
      const eligibilityMap = new Map<string, boolean>();
      for (const e of eligibility) {
        if (e.categoryId === category.id) {
          eligibilityMap.set(e.teamId, e.isEligible);
        }
      }

      // Get teams already breaking in other categories
      const otherBreaks = new Map<string, string>();
      breakResults.forEach((results, catId) => {
        if (catId !== category.id) {
          results.forEach(r => {
            if (r.isBreaking) {
              otherBreaks.set(r.teamId, catId);
            }
          });
        }
      });

      const generator = new BreakGenerator({
        standings,
        category,
        eligibility: eligibilityMap,
        otherBreaks,
      });

      const results = generator.generate();

      setBreakResults(prev => new Map(prev).set(category.id, results));

      // Save to database
      const breakingTeams = results.filter(r => r.isBreaking);
      for (const result of breakingTeams) {
        await supabase
          .from('team_break_eligibility')
          .upsert({
            break_category_id: category.id,
            registration_id: result.teamId,
            is_eligible: true,
            break_rank: result.breakRank,
            remark: result.remark,
          }, { onConflict: 'break_category_id,registration_id' });
      }

      toast({ 
        title: "Break Generated", 
        description: `${breakingTeams.length} teams breaking in ${category.name}` 
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const exportBreak = (category: BreakCategory) => {
    const results = breakResults.get(category.id) || [];
    const breaking = results.filter(r => r.isBreaking);

    const csv = [
      ['Rank', 'Team', 'Institution', 'Remark'].join(','),
      ...breaking.map(r => [
        r.breakRank,
        `"${r.teamName}"`,
        `"${r.institution}"`,
        r.remark || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `break-${category.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isTeamEligible = (categoryId: string, teamId: string): boolean => {
    const record = eligibility.find(e => e.categoryId === categoryId && e.teamId === teamId);
    return record?.isEligible !== false; // Default to eligible
  };

  const getRemarkBadge = (remark: string | null) => {
    if (!remark) return null;
    
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      'capped': { variant: 'secondary', icon: <AlertCircle className="h-3 w-3" /> },
      'ineligible': { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      'different_break': { variant: 'outline', icon: <Star className="h-3 w-3" /> },
      'coin_flip': { variant: 'secondary', icon: <AlertCircle className="h-3 w-3" /> },
      'promoted': { variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
    };

    const config = variants[remark] || { variant: 'outline' as const, icon: null };
    return (
      <Badge variant={config.variant} className="text-xs flex items-center gap-1">
        {config.icon}
        {remark.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Break Categories
              </CardTitle>
              <CardDescription>
                Configure break categories and generate breaks
              </CardDescription>
            </div>
            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Break Category</DialogTitle>
                  <DialogDescription>
                    Create a new break category for this tournament
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Category Name</Label>
                    <Input
                      value={newCategory.name}
                      onChange={e => setNewCategory(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g., Open Break, Novice Break"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Break Size</Label>
                      <Input
                        type="number"
                        min={2}
                        max={64}
                        value={newCategory.breakSize}
                        onChange={e => setNewCategory(p => ({ ...p, breakSize: parseInt(e.target.value) || 8 }))}
                      />
                    </div>
                    <div>
                      <Label>Institution Cap</Label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={newCategory.institutionCap}
                        onChange={e => setNewCategory(p => ({ ...p, institutionCap: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Break Rule</Label>
                    <Select
                      value={newCategory.rule}
                      onValueChange={v => setNewCategory(p => ({ ...p, rule: v as BreakRule }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (Top N)</SelectItem>
                        <SelectItem value="aida-1996">AIDA-1996</SelectItem>
                        <SelectItem value="aida-2016">AIDA-2016 (Australs)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newCategory.isGeneral}
                      onCheckedChange={v => setNewCategory(p => ({ ...p, isGeneral: v }))}
                    />
                    <Label>General Break (all teams eligible by default)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddCategory(false)}>Cancel</Button>
                  <Button onClick={addCategory} disabled={!newCategory.name}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No break categories defined</p>
              <p className="text-sm">Create a category to start managing breaks</p>
            </div>
          ) : (
            <Tabs defaultValue={categories[0]?.id}>
              <TabsList className="mb-4">
                {categories.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    {cat.name} ({cat.breakSize})
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map(category => (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.breakSize} teams • {category.rule} rule • 
                        {category.institutionCap > 0 ? ` ${category.institutionCap} per institution` : ' no institution cap'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => generateBreak(category)}
                        disabled={generating || standings.length === 0}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                        Generate Break
                      </Button>
                      {breakResults.has(category.id) && (
                        <Button size="sm" variant="outline" onClick={() => exportBreak(category)}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Break Results */}
                  {breakResults.has(category.id) && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Break Results</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">Rank</TableHead>
                              <TableHead>Team</TableHead>
                              <TableHead>Institution</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {breakResults.get(category.id)?.slice(0, category.breakSize + 5).map(result => (
                              <TableRow 
                                key={result.teamId}
                                className={result.isBreaking ? 'bg-primary/5' : ''}
                              >
                                <TableCell>
                                  {result.isBreaking ? (
                                    <Badge variant="default">{result.breakRank}</Badge>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">{result.teamName}</TableCell>
                                <TableCell className="text-muted-foreground">{result.institution}</TableCell>
                                <TableCell>
                                  {result.isBreaking ? (
                                    <Badge variant="default" className="flex items-center gap-1 w-fit">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Breaking
                                    </Badge>
                                  ) : (
                                    getRemarkBadge(result.remark)
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Eligibility Management */}
                  {!category.isGeneral && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">Team Eligibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {standings.map(team => (
                            <div key={team.teamId} className="flex items-center gap-2 p-2 rounded border">
                              <Switch
                                checked={isTeamEligible(category.id, team.teamId)}
                                onCheckedChange={() => 
                                  toggleEligibility(category.id, team.teamId, isTeamEligible(category.id, team.teamId))
                                }
                              />
                              <span className="text-sm truncate">{team.teamName}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
