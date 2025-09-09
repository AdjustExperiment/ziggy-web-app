
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import WeeklyAvailabilityEditor from '@/components/WeeklyAvailabilityEditor';
import { Plus, Edit2, Trash2, Gavel, Phone, Mail, Calendar } from 'lucide-react';
import { JudgeProfile } from '@/types/database';

export function JudgesManager() {
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<JudgeProfile | null>(null);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [availabilityJudge, setAvailabilityJudge] = useState<JudgeProfile | null>(null);
  const DEFAULT_AVAILABILITY = {
    monday: { morning: false, afternoon: false, evening: false },
    tuesday: { morning: false, afternoon: false, evening: false },
    wednesday: { morning: false, afternoon: false, evening: false },
    thursday: { morning: false, afternoon: false, evening: false },
    friday: { morning: false, afternoon: false, evening: false },
    saturday: { morning: false, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false }
  };
  const [currentAvailability, setCurrentAvailability] = useState(DEFAULT_AVAILABILITY);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience_level: 'novice',
    bio: '',
    qualifications: '',
    specializations: ''
  });

  const experienceLevels = ['novice', 'intermediate', 'experienced', 'expert'];

  useEffect(() => {
    fetchJudges();
  }, []);

  const fetchJudges = async () => {
    try {
      const { data, error } = await supabase
        .from('judge_profiles')
        .select('*')
        .order('name');

      if (error) throw error;
      // Type cast to handle Json type for availability
      const typedJudges = (data || []).map(judge => ({
        ...judge,
        availability: judge.availability as any
      }));
      setJudges(typedJudges);
    } catch (error: any) {
      console.error('Error fetching judges:', error);
      toast({
        title: "Error",
        description: "Failed to fetch judges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const judgeData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        experience_level: formData.experience_level,
        bio: formData.bio || null,
        qualifications: formData.qualifications || null,
        specializations: formData.specializations
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        availability: DEFAULT_AVAILABILITY as any
      };

      if (editingJudge) {
        const { error } = await supabase
          .from('judge_profiles')
          .update(judgeData)
          .eq('id', editingJudge.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Judge updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('judge_profiles')
          .insert([judgeData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Judge created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save judge",
        variant: "destructive",
      });
    }
  };

  const deleteJudge = async (judgeId: string) => {
    if (!confirm('Are you sure you want to delete this judge?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('judge_profiles')
        .delete()
        .eq('id', judgeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Judge deleted successfully",
      });

      fetchJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete judge",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      experience_level: 'novice',
      bio: '',
      qualifications: '',
      specializations: ''
    });
    setEditingJudge(null);
  };

  const openEditDialog = (judge: JudgeProfile) => {
    setEditingJudge(judge);
    setFormData({
      name: judge.name,
      email: judge.email,
      phone: judge.phone || '',
      experience_level: judge.experience_level,
      bio: judge.bio || '',
      qualifications: judge.qualifications || '',
      specializations: judge.specializations?.join(', ') || ''
    });
    setIsDialogOpen(true);
  };

  const openAvailabilityDialog = (judge: JudgeProfile) => {
    setAvailabilityJudge(judge);
    setCurrentAvailability(judge.availability || DEFAULT_AVAILABILITY);
    setIsAvailabilityDialogOpen(true);
  };

  const saveAvailability = async () => {
    if (!availabilityJudge) return;
    try {
      setAvailabilityLoading(true);
      const { error } = await supabase
        .from('judge_profiles')
        .update({ availability: currentAvailability })
        .eq('id', availabilityJudge.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability updated",
      });

      setIsAvailabilityDialogOpen(false);
      fetchJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
          <h3 className="text-lg font-semibold">Judge Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage judge profiles and qualifications
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Judge
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingJudge ? 'Edit Judge' : 'Add New Judge'}
              </DialogTitle>
              <DialogDescription>
                Enter judge information and qualifications
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Judge Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="judge@example.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="experience_level">Experience Level</Label>
                  <Select value={formData.experience_level} onValueChange={(value) => setFormData(prev => ({ ...prev, experience_level: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {experienceLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="specializations">Specializations</Label>
                <Input
                  id="specializations"
                  value={formData.specializations}
                  onChange={(e) => setFormData(prev => ({ ...prev, specializations: e.target.value }))}
                  placeholder="Policy, Public Forum"
                />
              </div>
              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value }))}
                  placeholder="Judge experience, certifications, etc."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Brief biography or background"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingJudge ? 'Update' : 'Add'} Judge
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Weekly Availability - {availabilityJudge?.name}</DialogTitle>
            <DialogDescription>
              Set the judge's general weekly availability for receiving assignments
            </DialogDescription>
          </DialogHeader>
          <WeeklyAvailabilityEditor
            availability={currentAvailability}
            onAvailabilityChange={setCurrentAvailability}
            onSave={saveAvailability}
            loading={availabilityLoading}
          />
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Judges ({judges.length})</CardTitle>
          <CardDescription>
            Manage judge profiles and their information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {judges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p>No judges found. Add your first judge to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {judges.map((judge) => (
                  <TableRow key={judge.id}>
                    <TableCell>
                      <div className="font-medium">{judge.name}</div>
                      {judge.qualifications && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {judge.qualifications}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {judge.email}
                      </div>
                      {judge.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {judge.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {judge.experience_level.charAt(0).toUpperCase() + judge.experience_level.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {judge.specializations?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {judge.specializations.map(spec => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(judge)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAvailabilityDialog(judge)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Availability
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteJudge(judge.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
