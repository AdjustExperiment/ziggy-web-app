
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users, Award } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  qualifications?: string;
  specializations: string[];
  experience_level: string;
  experience_years: number;
  user_id?: string;
}

const DEBATE_FORMATS = [
  { id: 'IPD', label: 'Individual Parliamentary Debate' },
  { id: 'TPD', label: 'Team Parliamentary Debate' },
  { id: 'TP', label: 'Team Policy' },
  { id: 'LD', label: 'Lincoln Douglas' },
  { id: 'CD', label: 'Coolidge Debate' },
  { id: 'MC', label: 'Moot Court' },
];

export function EnhancedJudgesManager() {
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<JudgeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    bio: '',
    qualifications: '',
    specializations: [] as string[],
    experience_years: 1
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
      // Cast status to proper type
      setJudges((data || []).map(j => ({
        ...j,
        status: j.status as any
      })));
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      bio: '',
      qualifications: '',
      specializations: [],
      experience_years: 1
    });
    setEditingJudge(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingJudge) {
        // Update existing judge profile only
        const judgeData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          bio: formData.bio || null,
          qualifications: formData.qualifications || null,
          specializations: formData.specializations,
          experience_years: formData.experience_years,
          experience_level: getExperienceLevel(formData.experience_years)
        };

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
        // Create new user account first
        const nameParts = formData.name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: createUserResponse, error: createUserError } = await supabase.functions.invoke('admin-create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            firstName,
            lastName,
            role: 'judge'
          }
        });

        if (createUserError) throw createUserError;

        // Then create judge profile with user_id
        const judgeData = {
          user_id: createUserResponse.user.id,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          bio: formData.bio || null,
          qualifications: formData.qualifications || null,
          specializations: formData.specializations,
          experience_years: formData.experience_years,
          experience_level: getExperienceLevel(formData.experience_years),
        };

        const { error: judgeError } = await supabase
          .from('judge_profiles')
          .insert([judgeData]);

        if (judgeError) throw judgeError;

        toast({
          title: "Success",
          description: "Judge account created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchJudges();
    } catch (error: any) {
      console.error('Error saving judge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save judge",
        variant: "destructive",
      });
    }
  };

  const getExperienceLevel = (years: number): string => {
    if (years <= 2) return 'novice';
    if (years <= 5) return 'intermediate';
    if (years <= 10) return 'experienced';
    return 'expert';
  };

  const handleEdit = (judge: JudgeProfile) => {
    setEditingJudge(judge);
    setFormData({
      name: judge.name,
      email: judge.email,
      phone: judge.phone || '',
      password: '', // Don't populate password for editing
      bio: judge.bio || '',
      qualifications: judge.qualifications || '',
      specializations: judge.specializations,
      experience_years: judge.experience_years
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (judgeId: string) => {
    if (!confirm('Are you sure you want to delete this judge? This action cannot be undone.')) {
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
      console.error('Error deleting judge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete judge",
        variant: "destructive",
      });
    }
  };

  // Removed accreditation toggle as the field doesn't exist in the database

  const handleSpecializationChange = (formatId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specializations: checked
        ? [...prev.specializations, formatId]
        : prev.specializations.filter(s => s !== formatId)
    }));
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
          <h2 className="text-2xl font-bold">Enhanced Judges Manager</h2>
          <p className="text-muted-foreground">Manage judge profiles with specializations and experience tracking</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Judge Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingJudge ? 'Edit Judge Profile' : 'Create Judge Account'}</DialogTitle>
              <DialogDescription>
                {editingJudge ? 'Update judge information' : 'Create a new judge account with login credentials'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              {!editingJudge && (
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    placeholder="Enter secure password"
                  />
                </div>
              )}

              <div>
                <Label>Years of Experience: {formData.experience_years} years</Label>
                <div className="px-2">
                  <Slider
                    value={[formData.experience_years]}
                    onValueChange={(value) => setFormData({...formData, experience_years: value[0]})}
                    max={40}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 year</span>
                    <span>40+ years</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>Debate Format Specializations</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {DEBATE_FORMATS.map((format) => (
                    <div key={format.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={format.id}
                        checked={formData.specializations.includes(format.id)}
                        onCheckedChange={(checked) => handleSpecializationChange(format.id, checked as boolean)}
                      />
                      <Label htmlFor={format.id} className="text-sm font-normal">
                        {format.id} - {format.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="qualifications">Qualifications</Label>
                <Textarea
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                  placeholder="Educational background, certifications, etc."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Professional background and judging philosophy"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingJudge ? 'Update Judge' : 'Create Judge Account'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Judge Profiles ({judges.length})
          </CardTitle>
          <CardDescription>
            Manage judge information, specializations, and experience levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          {judges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No judges found. Add your first judge to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judge</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {judges.map((judge) => (
                  <TableRow key={judge.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{judge.name}</div>
                        {judge.qualifications && (
                          <div className="text-sm text-muted-foreground">
                            {judge.qualifications.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{judge.experience_years} years</span>
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {getExperienceLevel(judge.experience_years)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {judge.specializations.length > 0 ? (
                          judge.specializations.slice(0, 3).map((spec) => (
                            <Badge key={spec} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No specializations</span>
                        )}
                        {judge.specializations.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{judge.specializations.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{judge.email}</div>
                        {judge.phone && (
                          <div className="text-muted-foreground">{judge.phone}</div>
                        )}
                      </div>
                    </TableCell>
                     <TableCell>
                       <Badge variant="secondary" className="text-xs">
                         Active
                       </Badge>
                     </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(judge)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(judge.id)}
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
