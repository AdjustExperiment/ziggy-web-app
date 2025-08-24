import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { UserPlus, Edit, Trash2, Calendar, User, Settings } from 'lucide-react';
import WeeklyAvailabilityEditor from '@/components/WeeklyAvailabilityEditor';

interface Judge {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  experience_level: string;
  qualifications: string | null;
  bio: string | null;
  specializations: string[];
  availability: any;
  created_at: string;
  updated_at: string;
}

interface JudgeFormData {
  email: string;
  password: string;
  name: string;
  phone: string;
  experience_level: string;
  qualifications: string;
  bio: string;
  specializations: string[];
}

const EXPERIENCE_LEVELS = ['novice', 'intermediate', 'experienced', 'expert'];
const SPECIALIZATIONS = ['Parliamentary', 'Policy', 'Public Forum', 'Lincoln-Douglas', 'World Schools', 'Academic', 'British Parliamentary'];

const DEFAULT_AVAILABILITY = {
  monday: { morning: false, afternoon: false, evening: false },
  tuesday: { morning: false, afternoon: false, evening: false },
  wednesday: { morning: false, afternoon: false, evening: false },
  thursday: { morning: false, afternoon: false, evening: false },
  friday: { morning: false, afternoon: false, evening: false },
  saturday: { morning: false, afternoon: false, evening: false },
  sunday: { morning: false, afternoon: false, evening: false }
};

export function EnhancedJudgesManager() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
  const [availabilityJudge, setAvailabilityJudge] = useState<Judge | null>(null);
  const [currentAvailability, setCurrentAvailability] = useState(DEFAULT_AVAILABILITY);
  const [formData, setFormData] = useState<JudgeFormData>({
    email: '',
    password: '',
    name: '',
    phone: '',
    experience_level: 'novice',
    qualifications: '',
    bio: '',
    specializations: []
  });

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
      setJudges(data || []);
    } catch (error: any) {
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
      if (editingJudge) {
        // Update existing judge
        const { error } = await supabase
          .from('judge_profiles')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            experience_level: formData.experience_level,
            qualifications: formData.qualifications || null,
            bio: formData.bio || null,
            specializations: formData.specializations
          })
          .eq('id', editingJudge.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Judge updated successfully",
        });
      } else {
        // Create new judge account via admin-create-user function
        const { data: result, error: functionError } = await supabase.functions.invoke('admin-create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            firstName: formData.name.split(' ')[0] || formData.name,
            lastName: formData.name.split(' ').slice(1).join(' ') || '',
            role: 'judge',
            phone: formData.phone || null
          }
        });

        if (functionError) throw functionError;

        // Create judge profile
        const { error: judgeError } = await supabase
          .from('judge_profiles')
          .insert({
            user_id: result?.user?.id,
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            experience_level: formData.experience_level,
            qualifications: formData.qualifications || null,
            bio: formData.bio || null,
            specializations: formData.specializations,
            availability: DEFAULT_AVAILABILITY
          });

        if (judgeError) throw judgeError;

        // Create welcome notification
        if (result?.user?.id) {
          const { error: notificationError } = await supabase
            .from('judge_notifications')
            .insert({
              judge_profile_id: result.user.id,
              title: 'Welcome to the Judging Panel',
              message: 'Please set your weekly availability in your Judge Dashboard to receive appropriate judging assignments.',
              type: 'welcome'
            });

          if (notificationError) console.warn('Failed to create welcome notification:', notificationError);
        }

        toast({
          title: "Success",
          description: "Judge account created successfully",
        });
      }

      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
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
    if (!confirm('Are you sure you want to delete this judge?')) return;

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

  const openEditDialog = (judge: Judge) => {
    setEditingJudge(judge);
    setFormData({
      email: judge.email,
      password: '', // Don't populate password for editing
      name: judge.name,
      phone: judge.phone || '',
      experience_level: judge.experience_level,
      qualifications: judge.qualifications || '',
      bio: judge.bio || '',
      specializations: judge.specializations || []
    });
    setIsEditDialogOpen(true);
  };

  const openAvailabilityDialog = (judge: Judge) => {
    setAvailabilityJudge(judge);
    setCurrentAvailability(judge.availability || DEFAULT_AVAILABILITY);
    setIsAvailabilityDialogOpen(true);
  };

  const saveAvailability = async () => {
    if (!availabilityJudge) return;

    try {
      const { error } = await supabase
        .from('judge_profiles')
        .update({ availability: currentAvailability })
        .eq('id', availabilityJudge.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
      
      setIsAvailabilityDialogOpen(false);
      fetchJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      experience_level: 'novice',
      qualifications: '',
      bio: '',
      specializations: []
    });
    setEditingJudge(null);
  };

  const getExperienceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'expert': return 'default';
      case 'experienced': return 'secondary';
      case 'intermediate': return 'outline';
      case 'novice': return 'outline';
      default: return 'secondary';
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
          <h2 className="text-2xl font-bold">Judge Management</h2>
          <p className="text-muted-foreground">Manage judge profiles, accounts, and availability</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create Judge Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Judge Account</DialogTitle>
              <DialogDescription>
                Create a complete judge account with login credentials and profile
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div>
                <Label>Experience Level</Label>
                <Select value={formData.experience_level} onValueChange={(value) => setFormData({...formData, experience_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Specializations</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {SPECIALIZATIONS.map(spec => (
                    <label key={spec} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(spec)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({...formData, specializations: [...formData.specializations, spec]});
                          } else {
                            setFormData({...formData, specializations: formData.specializations.filter(s => s !== spec)});
                          }
                        }}
                      />
                      <span className="text-sm">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                  placeholder="Judge qualifications and certifications"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Judge biography and background"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Judge Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Judge Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Judge Profile</DialogTitle>
            <DialogDescription>
              Update judge profile information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_name">Full Name *</Label>
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_email">Email Address *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_phone">Phone Number</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div>
              <Label>Experience Level</Label>
              <Select value={formData.experience_level} onValueChange={(value) => setFormData({...formData, experience_level: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Specializations</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {SPECIALIZATIONS.map(spec => (
                  <label key={spec} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(spec)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, specializations: [...formData.specializations, spec]});
                        } else {
                          setFormData({...formData, specializations: formData.specializations.filter(s => s !== spec)});
                        }
                      }}
                    />
                    <span className="text-sm">{spec}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit_qualifications">Qualifications</Label>
              <Textarea
                id="edit_qualifications"
                value={formData.qualifications}
                onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                placeholder="Judge qualifications and certifications"
              />
            </div>
            
            <div>
              <Label htmlFor="edit_bio">Biography</Label>
              <Textarea
                id="edit_bio"
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Judge biography and background"
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Judge
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Weekly Availability Dialog */}
      <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Weekly Availability - {availabilityJudge?.name}</DialogTitle>
            <DialogDescription>
              Set the judge&apos;s general weekly availability for receiving judging assignments
            </DialogDescription>
          </DialogHeader>
          
          <WeeklyAvailabilityEditor
            availability={currentAvailability}
            onAvailabilityChange={setCurrentAvailability}
            onSave={saveAvailability}
          />
        </DialogContent>
      </Dialog>

      {/* Judges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Judges ({judges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {judges.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Judges Yet</h3>
              <p className="text-muted-foreground">
                Create your first judge account to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {judges.map((judge) => (
                  <TableRow key={judge.id}>
                    <TableCell>
                      <div className="font-medium">{judge.name}</div>
                      <div className="text-sm text-muted-foreground">{judge.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getExperienceColor(judge.experience_level)}>
                        {judge.experience_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {judge.phone && <div>📞 {judge.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {judge.specializations?.slice(0, 2).map(spec => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {judge.specializations?.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{judge.specializations.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {judge.availability ? (
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            const available = Object.values(judge.availability || {}).reduce((acc: number, day: any) => {
                              return acc + (day?.morning ? 1 : 0) + (day?.afternoon ? 1 : 0) + (day?.evening ? 1 : 0);
                            }, 0);
                            return `${available}/21 slots`;
                          })()}
                        </div>
                      ) : (
                        <Badge variant="outline">Not Set</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(judge)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAvailabilityDialog(judge)}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteJudge(judge.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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