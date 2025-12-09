import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Layers } from 'lucide-react';

interface TournamentEvent {
  id: string;
  tournament_id: string;
  format_id: string | null;
  name: string;
  short_code: string;
  is_active: boolean;
  created_at: string;
  debate_formats?: {
    id: string;
    name: string;
    key: string;
  };
}

interface DebateFormat {
  id: string;
  name: string;
  key: string;
}

interface TournamentEventsManagerProps {
  tournamentId: string;
}

export function TournamentEventsManager({ tournamentId }: TournamentEventsManagerProps) {
  const [events, setEvents] = useState<TournamentEvent[]>([]);
  const [formats, setFormats] = useState<DebateFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TournamentEvent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    short_code: '',
    format_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('tournament_events')
        .select(`
          *,
          debate_formats (
            id,
            name,
            key
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('name');

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch formats
      const { data: formatsData, error: formatsError } = await supabase
        .from('debate_formats')
        .select('id, name, key')
        .order('name');

      if (formatsError) throw formatsError;
      setFormats(formatsData || []);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournament events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      short_code: '',
      format_id: '',
      is_active: true
    });
    setEditingEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const eventData = {
        tournament_id: tournamentId,
        name: formData.name,
        short_code: formData.short_code.toUpperCase(),
        format_id: formData.format_id || null,
        is_active: formData.is_active
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('tournament_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('tournament_events')
          .insert([eventData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (event: TournamentEvent) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      short_code: event.short_code,
      format_id: event.format_id || '',
      is_active: event.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This will affect all associated rounds and pairings.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tournament_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const toggleEventActive = async (eventId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('tournament_events')
        .update({ is_active: isActive })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event ${isActive ? 'activated' : 'deactivated'}`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tournament Events</h3>
          <p className="text-sm text-muted-foreground">
            Manage different debate events/formats running in this tournament
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>
              <DialogDescription>
                {editingEvent 
                  ? 'Update the event details below' 
                  : 'Add a new event to this tournament'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Varsity Lincoln-Douglas"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="short_code">Short Code *</Label>
                <Input
                  id="short_code"
                  value={formData.short_code}
                  onChange={(e) => setFormData({ ...formData, short_code: e.target.value.toUpperCase() })}
                  placeholder="e.g., VLD"
                  maxLength={10}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used for quick reference in pairings and schedules
                </p>
              </div>

              <div>
                <Label htmlFor="format_id">Debate Format</Label>
                <Select
                  value={formData.format_id}
                  onValueChange={(value) => setFormData({ ...formData, format_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No specific format</SelectItem>
                    {formats.map((format) => (
                      <SelectItem key={format.id} value={format.id}>
                        {format.name} ({format.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Event is active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Configured</h3>
            <p className="text-muted-foreground mb-4">
              Add events to run multiple debate formats in this tournament
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Events ({events.length})</CardTitle>
            <CardDescription>
              Each event can have its own rounds, pairings, and standings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{event.short_code}</Badge>
                    </TableCell>
                    <TableCell>
                      {event.debate_formats?.name || 'Not specified'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={event.is_active}
                        onCheckedChange={(checked) => toggleEventActive(event.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
