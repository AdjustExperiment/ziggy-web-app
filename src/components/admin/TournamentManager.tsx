
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
import { CalendarIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from '@/components/ui/use-toast';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  status: string;
  opt_outs_enabled: boolean;
}

export function TournamentManager() {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Tournament>({
    id: '',
    name: '',
    description: null,
    start_date: null,
    end_date: null,
    location: null,
    status: 'draft',
    opt_outs_enabled: false,
  });
  const [formats, setFormats] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormats();
    if (tournamentId) {
      fetchTournamentData(tournamentId);
    } else {
      setLoading(false);
    }
  }, [tournamentId]);

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
        .select('id, name, description, start_date, end_date, location, status, opt_outs_enabled')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Convert dates to correct format for the calendar
      setFormData({
        ...data,
        start_date: data.start_date ? format(new Date(data.start_date), 'yyyy-MM-dd') : null,
        end_date: data.end_date ? format(new Date(data.end_date), 'yyyy-MM-dd') : null,
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
        format: 'Standard', // Default format to satisfy database requirement
      };

      if (tournamentId) {
        // Update existing tournament
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
        // Create new tournament
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

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">{tournamentId ? 'Edit Tournament' : 'Create Tournament'}</h1>

      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tournament Name</Label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Debate Format (Optional)</Label>
              <p className="text-sm text-muted-foreground">Format selection will be available after database migration.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opt_outs_enabled">Round Participation Management</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="opt_outs_enabled"
                  checked={formData.opt_outs_enabled || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, opt_outs_enabled: checked }))}
                />
                <Label htmlFor="opt_outs_enabled" className="text-sm font-normal">
                  Enable round opt-outs and extra round requests
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, participants can opt out of specific rounds or request extra spots if available
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    {formData.start_date ? (
                      format(new Date(formData.start_date), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date ? new Date(formData.start_date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, start_date: date ? format(date, 'yyyy-MM-dd') : null })}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.end_date && "text-muted-foreground"
                    )}
                  >
                    {formData.end_date ? (
                      format(new Date(formData.end_date), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date ? new Date(formData.end_date) : undefined}
                    onSelect={(date) => setFormData({ ...formData, end_date: date ? format(date, 'yyyy-MM-dd') : null })}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                type="text"
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Button type="submit" disabled={loading}>
              {tournamentId ? 'Update Tournament' : 'Create Tournament'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
