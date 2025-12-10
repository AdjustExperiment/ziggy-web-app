import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Plus, X, ChevronRight, AlertCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import MultiJudgePanelManager from './MultiJudgePanelManager';
import { TournamentContentManager } from './TournamentContentManager';
import { TournamentObserversManager } from './TournamentObserversManager';
import { TournamentSettingsManager } from './TournamentSettingsManager';
import { TournamentSponsorSelector } from './TournamentSponsorSelector';
import TabulationDashboard from './tabulation/TabulationDashboard';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  status: string;
  opt_outs_enabled: boolean;
  format: string;
  registration_fee: number | null;
  max_participants: number;
  current_participants: number;
  registration_deadline: string | null;
  cash_prize_total: number | null;
  prize_pool: string | null;
  prize_items: string[];
  sponsors: any[];
  tournament_info: string | null;
  registration_open: boolean;
}

export function TournamentManager() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, adminScope } = useOptimizedAuth();
  const [formData, setFormData] = useState<Tournament>({
    id: '',
    name: '',
    description: null,
    start_date: null,
    end_date: null,
    location: null,
    status: 'Planning Phase',
    opt_outs_enabled: false,
    format: 'Standard',
    registration_fee: null,
    max_participants: 100,
    current_participants: 0,
    registration_deadline: null,
    cash_prize_total: null,
    prize_pool: null,
    prize_items: [],
    sponsors: [],
    tournament_info: null,
    registration_open: false,
  });
  const [formats, setFormats] = useState<{ id: string; name: string }[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormats();
    fetchTournaments();
    if (tournamentId) {
      fetchTournamentData(tournamentId);
      setSelectedTournamentId(tournamentId);
    } else {
      setLoading(false);
    }
  }, [tournamentId]);

  const fetchTournaments = async () => {
    try {
      let query = supabase
        .from('tournaments')
        .select(`
          id, name, description, start_date, end_date, location, status, opt_outs_enabled,
          format, registration_fee, max_participants, current_participants, registration_deadline,
          cash_prize_total, prize_pool, prize_items, sponsors, tournament_info, registration_open
        `);

      // Filter to accessible tournaments for non-global admins
      if (!isAdmin && adminScope.accessibleTournamentIds.length > 0) {
        query = query.in('id', adminScope.accessibleTournamentIds);
      } else if (!isAdmin && adminScope.accessibleTournamentIds.length === 0) {
        // No access to any tournaments
        setTournaments([]);
        return;
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      setTournaments((data || []).map(t => ({
        ...t,
        sponsors: Array.isArray(t.sponsors) ? t.sponsors : [],
        prize_items: Array.isArray(t.prize_items) ? t.prize_items : [],
      })));
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
    }
  };

  const fetchFormats = async () => {
    try {
      const { data, error } = await supabase
        .from('debate_formats')
        .select('id, name');
      if (error) throw error;
      setFormats(data || []);
    } catch (error: any) {
      console.error('Error fetching formats:', error);
      toast({
        title: "Error",
        description: "Failed to load debate formats",
        variant: "destructive",
      });
    }
  };

  const fetchTournamentData = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          id, name, description, start_date, end_date, location, status, opt_outs_enabled,
          format, registration_fee, max_participants, current_participants, registration_deadline,
          cash_prize_total, prize_pool, prize_items, sponsors, tournament_info, registration_open
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Convert dates to correct format for the calendar and ensure proper typing
      setFormData({
        ...data,
        start_date: data.start_date ? format(new Date(data.start_date), 'yyyy-MM-dd') : null,
        end_date: data.end_date ? format(new Date(data.end_date), 'yyyy-MM-dd') : null,
        registration_deadline: data.registration_deadline ? format(new Date(data.registration_deadline), 'yyyy-MM-dd') : null,
        sponsors: Array.isArray(data.sponsors) ? data.sponsors : [],
        prize_items: Array.isArray(data.prize_items) ? data.prize_items : [],
      });
    } catch (error: any) {
      console.error('Error fetching tournament:', error);
      toast({
        title: "Error",
        description: "Failed to load tournament information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const submitData = {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        location: formData.location,
        status: formData.status,
        opt_outs_enabled: formData.opt_outs_enabled,
        format: formData.format,
        registration_fee: formData.registration_fee ? Number(formData.registration_fee) : null,
        max_participants: Number(formData.max_participants),
        registration_deadline: formData.registration_deadline,
        cash_prize_total: formData.cash_prize_total ? Number(formData.cash_prize_total) : null,
        prize_pool: formData.prize_pool,
        prize_items: formData.prize_items,
        sponsors: formData.sponsors,
        tournament_info: formData.tournament_info,
        registration_open: formData.status === 'Registration Open',
      };

      if (tournamentId) {
        const { error } = await supabase
          .from('tournaments')
          .update(submitData)
          .eq('id', tournamentId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Tournament updated successfully",
        });
      } else {
        const { data, error } = await supabase
          .from('tournaments')
          .insert(submitData)
          .select()
          .single();

        if (error) throw error;
        toast({
          title: "Success", 
          description: "Tournament created successfully",
        });
        navigate(`/tournament/${data.id}`);
      }
    } catch (error: any) {
      console.error('Error saving tournament:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save tournament",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activeTournamentId = tournamentId || selectedTournamentId;
  const activeTournament = tournaments.find(t => t.id === activeTournamentId);
  const isPlanningPhase = formData.status === 'Planning Phase';
  const isEditingDisabled = activeTournamentId && !isPlanningPhase;
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Ongoing': return 'default';
      case 'Completed': return 'secondary';
      case 'Registration Open': return 'default';
      case 'Registration Closed': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tournament Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-4">
          {activeTournamentId && activeTournament ? (
            <>
              <Badge variant={getStatusVariant(formData.status)} className="text-sm">
                {formData.status}
              </Badge>
              <div>
                <h2 className="text-xl font-bold">Managing: {formData.name || activeTournament.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {formData.format} • {formData.location || 'Location TBD'}
                </p>
              </div>
            </>
          ) : (
            <h2 className="text-xl font-bold">Tournament Manager</h2>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!tournamentId && (
            <Select 
              value={selectedTournamentId} 
              onValueChange={(value) => {
                setSelectedTournamentId(value);
                setShowCreateForm(false);
                if (value) {
                  fetchTournamentData(value);
                }
              }}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select a tournament..." />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((tournament) => (
                  <SelectItem key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Only global admins or org admins can create tournaments */}
          {(isAdmin || adminScope.organizationAdmins.length > 0) && (
            <>
              {activeTournamentId && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedTournamentId('');
                    setShowCreateForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New
                </Button>
              )}

              {!activeTournamentId && !showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Tournament
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Active Tournament Warning */}
      {isEditingDisabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This tournament is active ({formData.status}). Core settings like name, format, and dates are locked.
            You can still update content, settings, and manage tabulation.
          </AlertDescription>
        </Alert>
      )}

      {activeTournamentId ? (
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tabulation">
              Tabulation
              <ChevronRight className="h-3 w-3 ml-1" />
            </TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="panels">Panels</TabsTrigger>
            <TabsTrigger value="observers">Observers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            {renderTournamentForm()}
          </TabsContent>

          <TabsContent value="tabulation">
            <TabulationDashboard tournamentId={activeTournamentId} />
          </TabsContent>

          <TabsContent value="content">
            <TournamentContentManager 
              tournamentId={activeTournamentId} 
              content={null}
              onContentUpdate={(content) => console.log('Content updated:', content)}
            />
          </TabsContent>

          <TabsContent value="panels">
            <MultiJudgePanelManager tournamentId={activeTournamentId} />
          </TabsContent>

          <TabsContent value="observers">
            <TournamentObserversManager tournamentId={activeTournamentId} />
          </TabsContent>

          <TabsContent value="settings">
            <TournamentSettingsManager tournamentId={activeTournamentId} />
          </TabsContent>
        </Tabs>
      ) : showCreateForm ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create New Tournament</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
          {renderTournamentForm()}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-4">Select a tournament to manage or create a new one</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Tournament
          </Button>
        </div>
      )}
    </div>
  );

  function renderTournamentForm() {
    return (
      loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isEditingDisabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning Phase">Planning Phase</SelectItem>
                      <SelectItem value="Registration Open">Registration Open</SelectItem>
                      <SelectItem value="Registration Closed">Registration Closed</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((format) => (
                        <SelectItem key={format.id} value={format.name}>
                          {format.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    type="text"
                    id="location"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={isEditingDisabled}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground")}>
                        {formData.start_date ? format(new Date(formData.start_date), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date ? new Date(formData.start_date) : undefined}
                        onSelect={(date) => setFormData({ ...formData, start_date: date ? format(date, 'yyyy-MM-dd') : null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.end_date && "text-muted-foreground")}>
                        {formData.end_date ? format(new Date(formData.end_date), "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.end_date ? new Date(formData.end_date) : undefined}
                        onSelect={(date) => setFormData({ ...formData, end_date: date ? format(date, 'yyyy-MM-dd') : null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="registration_fee">Registration Fee ($)</Label>
                <Input
                  type="number"
                  id="registration_fee"
                  step="0.01"
                  value={formData.registration_fee || ''}
                  onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value ? Number(e.target.value) : null })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input
                  type="number"
                  id="max_participants"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Registration Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.registration_deadline && "text-muted-foreground")}>
                      {formData.registration_deadline ? format(new Date(formData.registration_deadline), "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.registration_deadline ? new Date(formData.registration_deadline) : undefined}
                      onSelect={(date) => setFormData({ ...formData, registration_deadline: date ? format(date, 'yyyy-MM-dd') : null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Current Participants (Read-only)</Label>
                <Input type="number" value={formData.current_participants} disabled />
              </div>
            </CardContent>
          </Card>

          {/* Prizes */}
          <Card>
            <CardHeader>
              <CardTitle>Prizes & Awards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cash_prize_total">Total Cash Prizes ($)</Label>
                  <Input
                    type="number"
                    id="cash_prize_total"
                    step="0.01"
                    value={formData.cash_prize_total || ''}
                    onChange={(e) => setFormData({ ...formData, cash_prize_total: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prize_pool">Prize Pool Description</Label>
                  <Input
                    type="text"
                    id="prize_pool"
                    value={formData.prize_pool || ''}
                    onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prize Items</Label>
                <div className="space-y-2">
                  {formData.prize_items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newItems = [...formData.prize_items];
                          newItems[index] = e.target.value;
                          setFormData({ ...formData, prize_items: newItems });
                        }}
                        placeholder="Prize item"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newItems = formData.prize_items.filter((_, i) => i !== index);
                          setFormData({ ...formData, prize_items: newItems });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, prize_items: [...formData.prize_items, ''] })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Prize Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Info */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Tournament Information (Rich Text)</Label>
                <ReactQuill
                  value={formData.tournament_info || ''}
                  onChange={(value) => setFormData({ ...formData, tournament_info: value })}
                  theme="snow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sponsors - Now linked to real sponsor profiles */}
          {activeTournamentId && (
            <TournamentSponsorSelector tournamentId={activeTournamentId} />
          )}

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="opt_outs_enabled"
                  checked={formData.opt_outs_enabled || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, opt_outs_enabled: checked }))}
                />
                <Label htmlFor="opt_outs_enabled">Enable round opt-outs and extra round requests</Label>
              </div>
            </CardContent>
          </Card>

          <div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (tournamentId ? 'Update Tournament' : 'Create Tournament')}
            </Button>
          </div>
        </form>
      )
    );
  }
}
