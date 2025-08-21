
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Plus, Edit, Trash2, Users, DollarSign, Upload, X, Link, Image } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import DOMPurify from 'dompurify';
import TournamentCalendarConfig from './TournamentCalendarConfig';
import 'react-quill/dist/quill.snow.css';

// Dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = React.lazy(() => import('react-quill'));

interface Sponsor {
  name: string;
  link?: string;
  logo_url?: string;
  [key: string]: any; // Add index signature for Json compatibility
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  tournament_info: string;
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
  cash_prize_total: number;
  prize_items: string[];
  sponsors: Sponsor[];
  status: string;
  registration_open: boolean;
  registration_deadline: string;
  additional_info: any;
  // Calendar customization fields
  round_schedule_type: string;
  round_interval_days: number;
  round_count: number;
  rounds_config: any[];
  auto_schedule_rounds: boolean;
  // Payment settings (from separate table)
  payment_handler?: string;
  paypal_client_id?: string;
  paypal_button_html?: string;
  venmo_button_html?: string;
}

const TournamentManager = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newPrizeItem, setNewPrizeItem] = useState('');
  const [newSponsor, setNewSponsor] = useState({ name: '', link: '', logo_url: '' });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tournament_info: '',
    format: '',
    debate_style: '',
    start_date: new Date(),
    end_date: new Date(),
    location: '',
    venue_details: '',
    max_participants: 100,
    registration_fee: 30.00,
    prize_pool: '',
    cash_prize_total: 0,
    prize_items: [] as string[],
    sponsors: [] as Sponsor[],
    status: 'Planning Phase',
    registration_open: false,
    registration_deadline: new Date(),
    payment_handler: 'paypal',
    paypal_client_id: '',
    paypal_button_html: '',
    venmo_button_html: '',
    additional_info: '{}',
    // Calendar customization fields
    round_schedule_type: 'custom',
    round_interval_days: 7,
    round_count: 1,
    rounds_config: [] as any[],
    auto_schedule_rounds: false,
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_payment_settings (
            payment_handler,
            paypal_client_id,
            paypal_button_html,
            venmo_button_html
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = data?.map(tournament => ({
        ...tournament,
        sponsors: Array.isArray(tournament.sponsors) 
          ? tournament.sponsors.map((sponsor: any) => 
              typeof sponsor === 'string' ? { name: sponsor } : sponsor
            )
          : [],
        prize_items: Array.isArray(tournament.prize_items) ? tournament.prize_items : [],
        tournament_info: tournament.tournament_info || '',
        cash_prize_total: tournament.cash_prize_total || 0,
        // Payment settings from separate table
        payment_handler: tournament.tournament_payment_settings?.payment_handler || 'paypal',
        paypal_client_id: tournament.tournament_payment_settings?.paypal_client_id || '',
        paypal_button_html: tournament.tournament_payment_settings?.paypal_button_html || '',
        venmo_button_html: tournament.tournament_payment_settings?.venmo_button_html || '',
        additional_info: tournament.additional_info || {},
        // Calendar fields with defaults
        round_schedule_type: tournament.round_schedule_type || 'custom',
        round_interval_days: tournament.round_interval_days || 7,
        round_count: tournament.round_count || 1,
        rounds_config: Array.isArray(tournament.rounds_config) ? tournament.rounds_config : [],
        auto_schedule_rounds: tournament.auto_schedule_rounds || false,
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
      tournament_info: '',
      format: '',
      debate_style: '',
      start_date: new Date(),
      end_date: new Date(),
      location: '',
      venue_details: '',
      max_participants: 100,
      registration_fee: 30.00,
      prize_pool: '',
      cash_prize_total: 0,
      prize_items: [],
      sponsors: [],
      status: 'Planning Phase',
      registration_open: false,
      registration_deadline: new Date(),
      payment_handler: 'paypal',
      paypal_client_id: '',
      paypal_button_html: '',
      venmo_button_html: '',
      additional_info: '{}',
      // Calendar customization fields
      round_schedule_type: 'custom',
      round_interval_days: 7,
      round_count: 1,
      rounds_config: [],
      auto_schedule_rounds: false,
    });
    setEditingTournament(null);
    setActiveTab('basic');
    setNewPrizeItem('');
    setNewSponsor({ name: '', link: '', logo_url: '' });
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sponsor-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sponsor-logos')
        .getPublicUrl(filePath);

      setNewSponsor(prev => ({ ...prev, logo_url: publicUrl }));
      toast({ title: "Success", description: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const addSponsor = () => {
    if (!newSponsor.name.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      sponsors: [...prev.sponsors, { ...newSponsor }]
    }));
    
    setNewSponsor({ name: '', link: '', logo_url: '' });
  };

  const removeSponsor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index)
    }));
  };

  const addPrizeItem = () => {
    if (!newPrizeItem.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      prize_items: [...prev.prize_items, newPrizeItem.trim()]
    }));
    
    setNewPrizeItem('');
  };

  const removePrizeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prize_items: prev.prize_items.filter((_, i) => i !== index)
    }));
  };

  // Rich text editor modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const tournamentData = {
        name: formData.name,
        description: formData.description,
        tournament_info: DOMPurify.sanitize(formData.tournament_info),
        format: formData.format,
        debate_style: formData.debate_style,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd'),
        location: formData.location,
        venue_details: formData.venue_details,
        max_participants: formData.max_participants,
        registration_fee: formData.registration_fee,
        prize_pool: formData.prize_pool,
        cash_prize_total: formData.cash_prize_total,
        prize_items: formData.prize_items,
        sponsors: formData.sponsors as any, // Cast to any for Json compatibility
        status: formData.status,
        registration_open: formData.registration_open,
        registration_deadline: format(formData.registration_deadline, 'yyyy-MM-dd'),
        additional_info: JSON.parse(formData.additional_info || '{}'),
        // Calendar customization fields
        round_schedule_type: formData.round_schedule_type,
        round_interval_days: formData.round_interval_days,
        round_count: formData.round_count,
        rounds_config: formData.rounds_config,
        auto_schedule_rounds: formData.auto_schedule_rounds,
      };

      // Payment settings data for separate table
      const paymentData = {
        payment_handler: formData.payment_handler,
        paypal_client_id: formData.paypal_client_id,
        paypal_button_html: formData.paypal_button_html,
        venmo_button_html: formData.venmo_button_html,
      };

      if (editingTournament) {
        // Update tournament
        const { error } = await supabase
          .from('tournaments')
          .update(tournamentData)
          .eq('id', editingTournament.id);
        
        if (error) throw error;

        // Upsert payment settings
        const { error: paymentError } = await supabase
          .from('tournament_payment_settings')
          .upsert({
            tournament_id: editingTournament.id,
            ...paymentData,
          });
        
        if (paymentError) throw paymentError;
        toast({ title: "Success", description: "Tournament updated successfully" });
      } else {
        // Create tournament
        const { data: newTournament, error } = await supabase
          .from('tournaments')
          .insert(tournamentData)
          .select()
          .single();
        
        if (error) throw error;

        // Create payment settings for new tournament
        if (newTournament) {
          const { error: paymentError } = await supabase
            .from('tournament_payment_settings')
            .insert({
              tournament_id: newTournament.id,
              ...paymentData,
            });
          
          if (paymentError) throw paymentError;
        }
        
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
      tournament_info: tournament.tournament_info || '',
      format: tournament.format,
      debate_style: tournament.debate_style || '',
      start_date: new Date(tournament.start_date),
      end_date: new Date(tournament.end_date),
      location: tournament.location,
      venue_details: tournament.venue_details || '',
      max_participants: tournament.max_participants,
      registration_fee: tournament.registration_fee,
      prize_pool: tournament.prize_pool || '',
      cash_prize_total: tournament.cash_prize_total || 0,
      prize_items: tournament.prize_items || [],
      sponsors: tournament.sponsors || [],
      status: tournament.status,
      registration_open: tournament.registration_open,
      registration_deadline: new Date(tournament.registration_deadline),
      payment_handler: tournament.payment_handler || 'paypal',
      paypal_client_id: tournament.paypal_client_id || '',
      paypal_button_html: tournament.paypal_button_html || '',
      venmo_button_html: tournament.venmo_button_html || '',
      additional_info: JSON.stringify(tournament.additional_info || {}, null, 2),
      // Calendar customization fields
      round_schedule_type: tournament.round_schedule_type || 'custom',
      round_interval_days: tournament.round_interval_days || 7,
      round_count: tournament.round_count || 1,
      rounds_config: tournament.rounds_config || [],
      auto_schedule_rounds: tournament.auto_schedule_rounds || false,
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
          
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTournament ? 'Edit Tournament' : 'Create New Tournament'}
              </DialogTitle>
              <DialogDescription>
                Fill in the tournament details below
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="calendar">Calendar</TabsTrigger>
                <TabsTrigger value="prizes">Prizes</TabsTrigger>
                <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <TabsContent value="basic" className="space-y-4">
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
                    <Label htmlFor="venue_details">Venue Details</Label>
                    <Textarea
                      id="venue_details"
                      value={formData.venue_details}
                      onChange={(e) => setFormData({...formData, venue_details: e.target.value})}
                      rows={2}
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
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label htmlFor="description">Brief Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      placeholder="Short description for tournament cards"
                    />
                  </div>
                  
                  <div>
                    <Label>Tournament Information (Rich Text)</Label>
                    <div className="border rounded-md">
                      <React.Suspense fallback={<div className="p-4">Loading editor...</div>}>
                        <ReactQuill
                          theme="snow"
                          value={formData.tournament_info}
                          onChange={(value) => setFormData({...formData, tournament_info: value})}
                          modules={quillModules}
                          placeholder="Detailed tournament information, rules, schedule, etc."
                          style={{ minHeight: '200px' }}
                        />
                      </React.Suspense>
                    </div>
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
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                  <TournamentCalendarConfig
                    startDate={formData.start_date}
                    endDate={formData.end_date}
                    roundScheduleType={formData.round_schedule_type}
                    roundIntervalDays={formData.round_interval_days}
                    roundCount={formData.round_count}
                    roundsConfig={formData.rounds_config}
                    autoScheduleRounds={formData.auto_schedule_rounds}
                    onChange={(field, value) => setFormData({...formData, [field]: value})}
                  />
                </TabsContent>

                <TabsContent value="prizes" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prize_pool">Prize Pool Description</Label>
                      <Input
                        id="prize_pool"
                        value={formData.prize_pool}
                        onChange={(e) => setFormData({...formData, prize_pool: e.target.value})}
                        placeholder="e.g., $50,000 Total"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="cash_prize_total">Cash Prize Total ($)</Label>
                      <Input
                        id="cash_prize_total"
                        type="number"
                        step="0.01"
                        value={formData.cash_prize_total}
                        onChange={(e) => setFormData({...formData, cash_prize_total: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Prize Items & Services</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={newPrizeItem}
                          onChange={(e) => setNewPrizeItem(e.target.value)}
                          placeholder="e.g., Scholarships, Coaching sessions, Trophies"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrizeItem())}
                        />
                        <Button type="button" onClick={addPrizeItem}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {formData.prize_items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <span className="text-sm">{item}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removePrizeItem(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sponsors" className="space-y-4">
                  <div>
                    <Label>Add New Sponsor</Label>
                    <div className="space-y-3 p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="sponsor_name">Sponsor Name *</Label>
                        <Input
                          id="sponsor_name"
                          value={newSponsor.name}
                          onChange={(e) => setNewSponsor(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Harvard Law School"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="sponsor_link">Website Link</Label>
                        <Input
                          id="sponsor_link"
                          value={newSponsor.link}
                          onChange={(e) => setNewSponsor(prev => ({ ...prev, link: e.target.value }))}
                          placeholder="https://law.harvard.edu"
                        />
                      </div>
                      
                      <div>
                        <Label>Logo Upload</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoUpload(file);
                            }}
                            disabled={uploadingLogo}
                          />
                          {uploadingLogo && <div className="text-sm text-muted-foreground">Uploading...</div>}
                        </div>
                        {newSponsor.logo_url && (
                          <div className="mt-2">
                            <img src={newSponsor.logo_url} alt="Logo preview" className="h-12 object-contain" />
                          </div>
                        )}
                      </div>
                      
                      <Button type="button" onClick={addSponsor} disabled={!newSponsor.name.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Sponsor
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Current Sponsors</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {formData.sponsors.map((sponsor, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-3 rounded">
                          <div className="flex items-center gap-3">
                            {sponsor.logo_url && (
                              <img src={sponsor.logo_url} alt={sponsor.name} className="h-8 object-contain" />
                            )}
                            <div>
                              <div className="font-medium">{sponsor.name}</div>
                              {sponsor.link && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Link className="h-3 w-3" />
                                  {sponsor.link}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSponsor(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="paypal_button_html">PayPal Button HTML</Label>
                      <Textarea
                        id="paypal_button_html"
                        value={formData.paypal_button_html}
                        onChange={(e) => setFormData({...formData, paypal_button_html: e.target.value})}
                        rows={6}
                        placeholder="Paste your PayPal button HTML here (e.g., from PayPal Button Generator)"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get your PayPal button HTML from{' '}
                        <a 
                          href="https://www.paypal.com/buttons/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          PayPal Button Generator
                        </a>
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="venmo_button_html">Venmo Button HTML</Label>
                      <Textarea
                        id="venmo_button_html"
                        value={formData.venmo_button_html}
                        onChange={(e) => setFormData({...formData, venmo_button_html: e.target.value})}
                        rows={6}
                        placeholder="Paste your custom Venmo button HTML here"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Create custom Venmo buttons or links. Learn more at{' '}
                        <a 
                          href="https://help.venmo.com/hc/en-us/articles/210413477-Venmo-me-links" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Venmo Documentation
                        </a>
                      </p>
                    </div>
                    
                    {(formData.paypal_button_html || formData.venmo_button_html) && (
                      <div className="space-y-3">
                        <Label>Preview</Label>
                        <div className="border rounded-lg p-4 bg-muted/20">
                          <p className="text-sm text-muted-foreground mb-3">Custom payment buttons preview:</p>
                          <div className="space-y-3">
                            {formData.paypal_button_html && (
                              <div className="border rounded p-3">
                                <p className="text-xs text-muted-foreground mb-2">PayPal Button:</p>
                                <div 
                                  dangerouslySetInnerHTML={{ 
                                    __html: DOMPurify.sanitize(formData.paypal_button_html) 
                                  }} 
                                />
                              </div>
                            )}
                            {formData.venmo_button_html && (
                              <div className="border rounded p-3">
                                <p className="text-xs text-muted-foreground mb-2">Venmo Button:</p>
                                <div 
                                  dangerouslySetInnerHTML={{ 
                                    __html: DOMPurify.sanitize(formData.venmo_button_html) 
                                  }} 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                          <p className="text-xs text-yellow-800">
                            <strong>Note:</strong> All HTML is automatically sanitized for security. 
                            These custom buttons will replace the default payment buttons in tournament registration.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTournament ? 'Update' : 'Create'} Tournament
                  </Button>
                </div>
              </form>
            </Tabs>
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
