
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
import { toast } from '@/components/ui/use-toast';
import { UserPlus, Edit, Search, Filter } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  user_id: string;
  phone: string | null;
  state: string | null;
  region: string | null;
  time_zone: string | null;
  judge_profile?: {
    id: string;
    name: string;
    email: string;
    experience_level: string;
    bio: string | null;
    qualifications: string | null;
    specializations: string[];
  } | null;
}

interface UserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  state: string;
  region: string;
  time_zone: string;
  // Judge-specific fields
  judge_name: string;
  judge_email: string;
  experience_level: string;
  bio: string;
  qualifications: string;
  specializations: string[];
}

const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West', 'Northwest', 'International'];
const EXPERIENCE_LEVELS = ['novice', 'intermediate', 'experienced', 'expert'];
const SPECIALIZATIONS = ['Parliamentary', 'Policy', 'Public Forum', 'Lincoln-Douglas', 'World Schools', 'Academic', 'British Parliamentary'];

const TIME_ZONES = [
  'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific', 'US/Alaska', 'US/Hawaii',
  'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Australia/Sydney', 'UTC'
];

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'user',
    phone: '',
    state: '',
    region: '',
    time_zone: '',
    judge_name: '',
    judge_email: '',
    experience_level: 'novice',
    bio: '',
    qualifications: '',
    specializations: []
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // First get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Then get judge profiles for users who have them
      const { data: judgeProfiles, error: judgeError } = await supabase
        .from('judge_profiles')
        .select('*');

      if (judgeError) throw judgeError;

      // Combine the data
      const transformedUsers: User[] = profiles?.map(profile => {
        const judgeProfile = judgeProfiles?.find(jp => jp.user_id === profile.user_id);
        return {
          ...profile,
          judge_profile: judgeProfile || null
        };
      }) || [];
      
      setUsers(transformedUsers);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    try {
      // Use admin-create-user edge function
      const { data: result, error: functionError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.first_name,
          lastName: formData.last_name,
          role: formData.role,
          phone: formData.phone || null,
          state: formData.state || null,
          region: formData.region || null,
          timeZone: formData.time_zone || null
        }
      });

      if (functionError) throw functionError;

      // Create judge profile if role is judge
      if (formData.role === 'judge' && result?.user?.id) {
        const { error: judgeError } = await supabase
          .from('judge_profiles')
          .insert({
            user_id: result.user.id,
            name: formData.judge_name || `${formData.first_name} ${formData.last_name}`,
            email: formData.judge_email || formData.email,
            experience_level: formData.experience_level,
            bio: formData.bio || null,
            qualifications: formData.qualifications || null,
            specializations: formData.specializations,
            availability: {
              monday: { morning: false, afternoon: false, evening: false },
              tuesday: { morning: false, afternoon: false, evening: false },
              wednesday: { morning: false, afternoon: false, evening: false },
              thursday: { morning: false, afternoon: false, evening: false },
              friday: { morning: false, afternoon: false, evening: false },
              saturday: { morning: false, afternoon: false, evening: false },
              sunday: { morning: false, afternoon: false, evening: false }
            }
          });

        if (judgeError) throw judgeError;

        // Create welcome notification for judge
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
        description: "User created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const updateUser = async () => {
    if (!editingUser) return;
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          phone: formData.phone || null,
          state: formData.state || null,
          region: formData.region || null,
          time_zone: formData.time_zone || null
        })
        .eq('user_id', editingUser.user_id);

      if (profileError) throw profileError;

      // Handle judge profile
      if (formData.role === 'judge') {
        const { data: existingJudge } = await supabase
          .from('judge_profiles')
          .select('id')
          .eq('user_id', editingUser.user_id)
          .single();

        if (existingJudge) {
          // Update existing judge profile
          const { error: judgeError } = await supabase
            .from('judge_profiles')
            .update({
              name: formData.judge_name,
              email: formData.judge_email,
              experience_level: formData.experience_level,
              bio: formData.bio || null,
              qualifications: formData.qualifications || null,
              specializations: formData.specializations
            })
            .eq('user_id', editingUser.user_id);

          if (judgeError) throw judgeError;
        } else {
          // Create new judge profile
          const { error: judgeError } = await supabase
            .from('judge_profiles')
            .insert({
              user_id: editingUser.user_id,
              name: formData.judge_name || `${formData.first_name} ${formData.last_name}`,
              email: formData.judge_email || formData.email,
              experience_level: formData.experience_level,
              bio: formData.bio || null,
              qualifications: formData.qualifications || null,
              specializations: formData.specializations
            });

          if (judgeError) throw judgeError;
        }
      } else if (editingUser.judge_profile) {
        // Remove judge profile if role changed from judge
        const { error: deleteError } = await supabase
          .from('judge_profiles')
          .delete()
          .eq('user_id', editingUser.user_id);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: '', // Cannot edit email
      password: '', // Password field for new users only
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role,
      phone: user.phone || '',
      state: user.state || '',
      region: user.region || '',
      time_zone: user.time_zone || '',
      judge_name: user.judge_profile?.name || `${user.first_name} ${user.last_name}`,
      judge_email: user.judge_profile?.email || '',
      experience_level: user.judge_profile?.experience_level || 'novice',
      bio: user.judge_profile?.bio || '',
      qualifications: user.judge_profile?.qualifications || '',
      specializations: user.judge_profile?.specializations || []
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'user',
      phone: '',
      state: '',
      region: '',
      time_zone: '',
      judge_name: '',
      judge_email: '',
      experience_level: 'novice',
      bio: '',
      qualifications: '',
      specializations: []
    });
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
                         (user.user_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesRole = true;
    if (roleFilter === 'judge') {
      matchesRole = user.judge_profile !== null && user.judge_profile !== undefined;
    } else if (roleFilter === 'debater') {
      matchesRole = user.role === 'user' && (user.judge_profile === null || user.judge_profile === undefined);
    } else if (roleFilter !== 'all') {
      matchesRole = user.role === roleFilter;
    }
    
    return matchesSearch && matchesRole;
  });

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
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">Create and manage user accounts and roles</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account with role and profile information
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>System Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User (Debater)</SelectItem>
                      <SelectItem value="judge">Judge</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Zone</Label>
                  <Select value={formData.time_zone} onValueChange={(value) => setFormData({...formData, time_zone: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_ZONES.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData({...formData, state: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Region</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({...formData, region: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Judge-specific fields */}
              {formData.role === 'judge' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Judge Information</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="judge_name">Judge Display Name *</Label>
                        <Input
                          id="judge_name"
                          value={formData.judge_name}
                          onChange={(e) => setFormData({...formData, judge_name: e.target.value})}
                          placeholder="Judge display name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="judge_email">Judge Email *</Label>
                        <Input
                          id="judge_email"
                          type="email"
                          value={formData.judge_email}
                          onChange={(e) => setFormData({...formData, judge_email: e.target.value})}
                          placeholder="judge@example.com"
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
                      <Label htmlFor="bio">Bio</Label>
                      <Input
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Judge biography"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="qualifications">Qualifications</Label>
                      <Input
                        id="qualifications"
                        value={formData.qualifications}
                        onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                        placeholder="Judge qualifications"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createUser}>
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user profile and role information
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>System Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User (Debater)</SelectItem>
                      <SelectItem value="judge">Judge</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time Zone</Label>
                  <Select value={formData.time_zone} onValueChange={(value) => setFormData({...formData, time_zone: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_ZONES.map(tz => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData({...formData, state: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Region</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData({...formData, region: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Judge-specific fields for edit */}
              {formData.role === 'judge' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Judge Information</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit_judge_name">Judge Display Name *</Label>
                        <Input
                          id="edit_judge_name"
                          value={formData.judge_name}
                          onChange={(e) => setFormData({...formData, judge_name: e.target.value})}
                          placeholder="Judge display name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit_judge_email">Judge Email *</Label>
                        <Input
                          id="edit_judge_email"
                          type="email"
                          value={formData.judge_email}
                          onChange={(e) => setFormData({...formData, judge_email: e.target.value})}
                          placeholder="judge@example.com"
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
                      <Label htmlFor="edit_bio">Bio</Label>
                      <Input
                        id="edit_bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Judge biography"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit_qualifications">Qualifications</Label>
                      <Input
                        id="edit_qualifications"
                        value={formData.qualifications}
                        onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                        placeholder="Judge qualifications"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateUser}>
                Update User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                  <SelectItem value="judge">Judges</SelectItem>
                  <SelectItem value="debater">Debaters</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium">{user.first_name} {user.last_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{user.user_id?.slice(0, 8)}...</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                      </Badge>
                      {user.judge_profile && (
                        <Badge variant="outline">
                          Judge ({user.judge_profile.experience_level})
                        </Badge>
                      )}
                      {!user.judge_profile && user.role === 'user' && (
                        <Badge variant="outline">Debater</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.phone && <div>📞 {user.phone}</div>}
                      {user.judge_profile?.email && (
                        <div className="text-xs text-muted-foreground">✉️ {user.judge_profile.email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.state && <div>{user.state}</div>}
                      {user.region && <div className="text-xs text-muted-foreground">{user.region}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
