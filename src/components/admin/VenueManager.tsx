import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Plus, MapPin, Edit, Trash2, Building, Users } from 'lucide-react';

interface VenueManagerProps {
  tournamentId: string;
}

interface Venue {
  id: string;
  tournament_id: string;
  room_name: string;
  room_number: string | null;
  building: string | null;
  floor: string | null;
  capacity: number | null;
  is_available: boolean;
  notes: string | null;
  created_at: string;
}

const emptyVenue = {
  room_name: '',
  room_number: '',
  building: '',
  floor: '',
  capacity: null as number | null,
  is_available: true,
  notes: '',
};

export function VenueManager({ tournamentId }: VenueManagerProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState(emptyVenue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, [tournamentId]);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_venues')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('building', { ascending: true })
        .order('room_name', { ascending: true });

      if (error) throw error;
      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venues',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingVenue(null);
    setFormData(emptyVenue);
    setDialogOpen(true);
  };

  const openEditDialog = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      room_name: venue.room_name,
      room_number: venue.room_number || '',
      building: venue.building || '',
      floor: venue.floor || '',
      capacity: venue.capacity,
      is_available: venue.is_available,
      notes: venue.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.room_name.trim()) {
      toast({
        title: 'Error',
        description: 'Room name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const venueData = {
        tournament_id: tournamentId,
        room_name: formData.room_name.trim(),
        room_number: formData.room_number.trim() || null,
        building: formData.building.trim() || null,
        floor: formData.floor.trim() || null,
        capacity: formData.capacity,
        is_available: formData.is_available,
        notes: formData.notes.trim() || null,
      };

      if (editingVenue) {
        const { error } = await supabase
          .from('tournament_venues')
          .update(venueData)
          .eq('id', editingVenue.id);

        if (error) throw error;
        toast({
          title: 'Venue updated',
          description: `${formData.room_name} has been updated.`,
        });
      } else {
        const { error } = await supabase
          .from('tournament_venues')
          .insert(venueData);

        if (error) throw error;
        toast({
          title: 'Venue added',
          description: `${formData.room_name} has been added to the tournament.`,
        });
      }

      setDialogOpen(false);
      fetchVenues();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save venue',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteVenue = async (venue: Venue) => {
    if (!confirm(`Are you sure you want to delete "${venue.room_name}"?`)) return;

    try {
      const { error } = await supabase
        .from('tournament_venues')
        .delete()
        .eq('id', venue.id);

      if (error) throw error;

      toast({
        title: 'Venue deleted',
        description: `${venue.room_name} has been removed.`,
      });
      fetchVenues();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete venue',
        variant: 'destructive',
      });
    }
  };

  const toggleAvailability = async (venue: Venue) => {
    try {
      const { error } = await supabase
        .from('tournament_venues')
        .update({ is_available: !venue.is_available })
        .eq('id', venue.id);

      if (error) throw error;
      fetchVenues();
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const availableCount = venues.filter(v => v.is_available).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Venue Management
            </CardTitle>
            <CardDescription>
              Manage rooms and venues for in-person rounds
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingVenue ? 'Edit Room' : 'Add New Room'}</DialogTitle>
                <DialogDescription>
                  {editingVenue ? 'Update room details' : 'Add a new room to the tournament venue'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="room_name">Room Name *</Label>
                    <Input
                      id="room_name"
                      value={formData.room_name}
                      onChange={(e) => setFormData({ ...formData, room_name: e.target.value })}
                      placeholder="e.g., Main Hall A"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room_number">Room Number</Label>
                    <Input
                      id="room_number"
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      placeholder="e.g., 101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="building">Building</Label>
                    <Input
                      id="building"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      placeholder="e.g., Science Building"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor</Label>
                    <Input
                      id="floor"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="e.g., 2nd Floor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity || ''}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="e.g., 30"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Switch
                      id="is_available"
                      checked={formData.is_available}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                    />
                    <Label htmlFor="is_available">Available for use</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes about this room..."
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : editingVenue ? 'Update Room' : 'Add Room'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {venues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No rooms added yet</p>
              <p className="text-sm">Add rooms to assign them to pairings</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {venues.length} Total Rooms
                </Badge>
                <Badge variant="default" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {availableCount} Available
                </Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Building</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {venues.map((venue) => (
                    <TableRow key={venue.id}>
                      <TableCell className="font-medium">
                        {venue.room_name}
                        {venue.room_number && (
                          <span className="text-muted-foreground ml-1">#{venue.room_number}</span>
                        )}
                      </TableCell>
                      <TableCell>{venue.building || '-'}</TableCell>
                      <TableCell>{venue.floor || '-'}</TableCell>
                      <TableCell>{venue.capacity || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={venue.is_available ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleAvailability(venue)}
                        >
                          {venue.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(venue)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteVenue(venue)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
