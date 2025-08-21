import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Edit, Trash2, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface Tournament {
  id: string;
  name: string;
  description: string;
  format: string;
  debate_style: string;
  start_date: string;
  end_date: string;
  location: string;
  venue_details: string;
  max_participants: number;
  current_participants: number;
  registration_fee: number;
  prize_pool: string;
  sponsors: string[];
  status: string;
  registration_open: boolean;
  registration_deadline: string;
  payment_handler: string;
  paypal_client_id: string;
  additional_info: any;
}

const TournamentManager = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    format: '',
    debate_style: '',
    start_date: new Date(),
    end_date: new Date(),
    location: '',
    venue_details: '',
    max_participants: 100,
    registration_fee: 30.00,
    prize_pool: '',
    sponsors: '',
    status: 'Planning Phase',
    registration_open: false,
    registration_deadline: new Date(),
    payment_handler: 'paypal',
    paypal_client_id: '',
    additional_info: '{}'
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = data?.map(tournament => ({
        ...tournament,
        sponsors: Array.isArray(tournament.sponsors) 
          ? (tournament.sponsors as string[]).filter(s => typeof s === 'string')
          : [],
        additional_info: tournament.additional_info || {}
      })) || [];
      
      setTournaments(transformedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      format: '',
      debate_style: '',
      start_date: new Date(),
      end_date: new Date(),
      location: '',
      venue_details: '',
      max_participants: 100,
      registration_fee: 30.00,
      prize_pool: '',
      sponsors: '',
      status: 'Planning Phase',
      registration_open: false,
      registration_deadline: new Date(),
      payment_handler: 'paypal',
      paypal_client_id: '',
      additional_info: '{}'
    });
    setEditingTournament(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const sponsorsArray = formData.sponsors.split(',').map(s => s.trim()).filter(s => s);
      
      const tournamentData = {
        ...formData,
        sponsors: sponsorsArray,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd'),
        registration_deadline: format(formData.registration_deadline, 'yyyy-MM-dd'),
        additional_info: JSON.parse(formData.additional_info || '{}')
      };

      if (editingTournament) {
        const { error } = await supabase
          .from('tournaments')
          .update(tournamentData)
          .eq('id', editingTournament.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Tournament updated successfully" });
      } else {
        const { error } = await supabase
          .from('tournaments')
          .insert([tournamentData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Tournament created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTournaments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save tournament",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      format: tournament.format,
      debate_style: tournament.debate_style || '',
      start_date: new Date(tournament.start_date),
      end_date: new Date(tournament.end_date),
      location: tournament.location,
      venue_details: tournament.venue_details || '',
      max_participants: tournament.max_participants,
      registration_fee: tournament.registration_fee,
      prize_pool: tournament.prize_pool || '',
      sponsors: tournament.sponsors?.join(', ') || '',
      status: tournament.status,
      registration_open: tournament.registration_open,
      registration_deadline: new Date(tournament.registration_deadline),
      payment_handler: tournament.payment_handler || 'paypal',
      paypal_client_id: tournament.paypal_client_id || '',
      additional_info: JSON.stringify(tournament.additional_info || {}, null, 2)
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Success", description: "Tournament deleted successfully" });
      fetchTournaments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive",
      });
    }
  };

  const toggleRegistration = async (tournament: Tournament) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ 
          registration_open: !tournament.registration_open,
          status: !tournament.registration_open ? 'Registration Open' : 'Registration Closed'
        })
        .eq('id', tournament.id);
      
      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Registration ${!tournament.registration_open ? 'opened' : 'closed'} for ${tournament.name}` 
      });
      fetchTournaments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to toggle registration",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading tournaments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Tournament Management</h2>
          <p className="text-muted-foreground">Manage tournament listings and registrations</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tournament
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
              </DialogTitle>
              <DialogDescription>
                Fill in the tournament details below
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tournament Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="format">Format *</Label>
                  <Select value={formData.format} onValueChange={(value) => setFormData({...formData, format: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Policy Debate">Policy Debate</SelectItem>
                      <SelectItem value="Parliamentary">Parliamentary</SelectItem>
                      <SelectItem value="Public Forum">Public Forum</SelectItem>
                      <SelectItem value="British Parliamentary">British Parliamentary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="debate_style">Debate Style</Label>
                  <Input
                    id="debate_style"
                    value={formData.debate_style}
                    onChange={(e) => setFormData({...formData, debate_style: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.start_date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => date && setFormData({...formData, start_date: date})}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.end_date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.end_date}
                        onSelect={(date) => date && setFormData({...formData, end_date: date})}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="max_participants">Max Participants *</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="registration_fee">Registration Fee ($)</Label>
                  <Input
                    id="registration_fee"
                    type="number"
                    step="0.01"
                    value={formData.registration_fee}
                    onChange={(e) => setFormData({...formData, registration_fee: parseFloat(e.target.value)})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="prize_pool">Prize Pool</Label>
                  <Input
                    id="prize_pool"
                    value={formData.prize_pool}
                    onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                    placeholder="$50,000"
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning Phase">Planning Phase</SelectItem>
                      <SelectItem value="Registration Open">Registration Open</SelectItem>
                      <SelectItem value="Registration Closed">Registration Closed</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Registration Deadline</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.registration_deadline, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.registration_deadline}
                        onSelect={(date) => date && setFormData({...formData, registration_deadline: date})}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="paypal_client_id">PayPal Client ID</Label>
                  <Input
                    id="paypal_client_id"
                    value={formData.paypal_client_id}
                    onChange={(e) => setFormData({...formData, paypal_client_id: e.target.value})}
                    placeholder="For payment processing"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="venue_details">Venue Details</Label>
                <Textarea
                  id="venue_details"
                  value={formData.venue_details}
                  onChange={(e) => setFormData({...formData, venue_details: e.target.value})}
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="sponsors">Sponsors (comma-separated)</Label>
                <Input
                  id="sponsors"
                  value={formData.sponsors}
                  onChange={(e) => setFormData({...formData, sponsors: e.target.value})}
                  placeholder="Harvard Law School, National Debate Association"
                />
              </div>
              
              <div>
                <Label htmlFor="additional_info">Additional Info (JSON)</Label>
                <Textarea
                  id="additional_info"
                  value={formData.additional_info}
                  onChange={(e) => setFormData({...formData, additional_info: e.target.value})}
                  rows={3}
                  placeholder='{"dress_code": "Business formal", "meals_provided": true}'
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="registration_open"
                  checked={formData.registration_open}
                  onCheckedChange={(checked) => setFormData({...formData, registration_open: checked})}
                />
                <Label htmlFor="registration_open">Registration Open</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTournament ? 'Update' : 'Create'} Tournament
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tournaments.map((tournament) => (
          <Card key={tournament.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {tournament.name}
                    <Badge 
                      variant={tournament.registration_open ? "default" : "secondary"}
                      className={tournament.registration_open ? "bg-green-500" : ""}
                    >
                      {tournament.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{tournament.format} • {tournament.location}</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {tournament.current_participants}/{tournament.max_participants}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      ${tournament.registration_fee}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRegistration(tournament)}
                  >
                    {tournament.registration_open ? 'Close' : 'Open'} Registration
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(tournament)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(tournament.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Dates:</strong> {format(new Date(tournament.start_date), "MMM d")} - {format(new Date(tournament.end_date), "MMM d, yyyy")}
                </div>
                <div>
                  <strong>Deadline:</strong> {format(new Date(tournament.registration_deadline), "MMM d, yyyy")}
                </div>
                <div>
                  <strong>Prize Pool:</strong> {tournament.prize_pool || 'TBD'}
                </div>
              </div>
              
              {tournament.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {tournament.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TournamentManager;