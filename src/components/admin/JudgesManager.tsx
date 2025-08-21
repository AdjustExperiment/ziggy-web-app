
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit2, Trash2, Gavel, Phone, Mail } from 'lucide-react';

interface JudgeProfile {
  id: string;
  profile_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  bio: string | null;
  qualifications: string | null;
  created_at: string;
}

export function JudgesManager() {
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<JudgeProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    bio: '',
    qualifications: ''
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
      const judgeData = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        bio: formData.bio || null,
        qualifications: formData.qualifications || null
      };

      let error;
      if (editingJudge) {
        ({ error } = await supabase
          .from('judge_profiles')
          .update(judgeData)
          .eq('id', editingJudge.id));
      } else {
        ({ error } = await supabase
          .from('judge_profiles')
          .insert([judgeData]));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Judge ${editingJudge ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchJudges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteJudge = async (judgeId: string) => {
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
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', bio: '', qualifications: '' });
    setEditingJudge(null);
  };

  const openEditDialog = (judge: JudgeProfile) => {
    setEditingJudge(judge);
    setFormData({
      name: judge.name,
      phone: judge.phone || '',
      email: judge.email || '',
      bio: judge.bio || '',
      qualifications: judge.qualifications || ''
    });
    setIsDialogOpen(true);
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
                  />
                </div>
              </div>
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

      <div className="grid gap-4">
        {judges.map((judge) => (
          <Card key={judge.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    {judge.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    {judge.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {judge.email}
                      </span>
                    )}
                    {judge.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {judge.phone}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {judge.profile_id && (
                    <Badge variant="secondary">Linked Account</Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(judge)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteJudge(judge.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {(judge.qualifications || judge.bio) && (
              <CardContent>
                {judge.qualifications && (
                  <div className="mb-2">
                    <strong>Qualifications:</strong> {judge.qualifications}
                  </div>
                )}
                {judge.bio && (
                  <div>
                    <strong>Bio:</strong> {judge.bio}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
