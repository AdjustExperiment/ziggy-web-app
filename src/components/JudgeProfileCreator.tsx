import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Gavel, Loader2 } from 'lucide-react';

const DEBATE_FORMATS = [
  { id: 'IPD', label: 'Individual Parliamentary Debate' },
  { id: 'TPD', label: 'Team Parliamentary Debate' },
  { id: 'TP', label: 'Team Policy' },
  { id: 'LD', label: 'Lincoln Douglas' },
  { id: 'CD', label: 'Coolidge Debate' },
  { id: 'MC', label: 'Moot Court' },
  { id: 'PF', label: 'Public Forum' },
  { id: 'BP', label: 'British Parliamentary' },
];

interface JudgeProfileCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function JudgeProfileCreator({ open, onOpenChange, onSuccess }: JudgeProfileCreatorProps) {
  const { user } = useOptimizedAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    qualifications: '',
    experience_level: 'novice',
    experience_years: 0,
    specializations: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a judge profile",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if profile already exists
      const { data: existing } = await supabase
        .from('judge_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast({
          title: "Profile Exists",
          description: "You already have a judge profile",
          variant: "default",
        });
        onOpenChange(false);
        return;
      }

      // Create judge profile
      const { error } = await supabase
        .from('judge_profiles')
        .insert([{
          user_id: user.id,
          email: user.email || '',
          name: formData.name || user.user_metadata?.first_name + ' ' + user.user_metadata?.last_name || '',
          phone: formData.phone || null,
          bio: formData.bio || null,
          qualifications: formData.qualifications || null,
          experience_level: formData.experience_level,
          experience_years: formData.experience_years,
          specializations: formData.specializations,
          status: 'pending_approval' // New judges need admin approval
        }]);

      if (error) throw error;

      toast({
        title: "Profile Created!",
        description: "Your judge profile has been submitted for approval. You'll be notified once approved.",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating judge profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create judge profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialization = (formatId: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(formatId)
        ? prev.specializations.filter(s => s !== formatId)
        : [...prev.specializations, formatId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Create Judge Profile
          </DialogTitle>
          <DialogDescription>
            Complete your judge profile to start judging tournaments. Your profile will be reviewed by administrators.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="For tournament coordination"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience_level">Experience Level *</Label>
              <Select
                value={formData.experience_level}
                onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novice">Novice</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="experienced">Experienced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="experience_years">Years Experience</Label>
              <Input
                id="experience_years"
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
              />
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
                    onCheckedChange={() => toggleSpecialization(format.id)}
                  />
                  <Label htmlFor={format.id} className="text-sm font-normal cursor-pointer">
                    {format.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="qualifications">Qualifications</Label>
            <Input
              id="qualifications"
              value={formData.qualifications}
              onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
              placeholder="e.g., Former national competitor, Coach at..."
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell competitors about your judging philosophy..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit for Approval
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
