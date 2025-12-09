import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Save, Edit2, X } from 'lucide-react';

interface JudgeProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  experience_level: string;
  experience_years?: number;
  qualifications: string;
  bio: string;
  specializations?: string[];
  alumni?: boolean;
}

interface JudgeProfileEditorProps {
  judgeProfile: JudgeProfile;
  onUpdate: () => void;
}

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

export function JudgeProfileEditor({ judgeProfile, onUpdate }: JudgeProfileEditorProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: judgeProfile.name || '',
    phone: judgeProfile.phone || '',
    experience_level: judgeProfile.experience_level || 'novice',
    experience_years: judgeProfile.experience_years || 0,
    qualifications: judgeProfile.qualifications || '',
    bio: judgeProfile.bio || '',
    specializations: judgeProfile.specializations || [],
    alumni: judgeProfile.alumni || false
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('judge_profiles')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          experience_level: formData.experience_level,
          experience_years: formData.experience_years,
          qualifications: formData.qualifications || null,
          bio: formData.bio || null,
          specializations: formData.specializations,
          alumni: formData.alumni
        })
        .eq('id', judgeProfile.id);

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your judge profile has been saved.',
      });
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
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

  const cancelEdit = () => {
    setFormData({
      name: judgeProfile.name || '',
      phone: judgeProfile.phone || '',
      experience_level: judgeProfile.experience_level || 'novice',
      experience_years: judgeProfile.experience_years || 0,
      qualifications: judgeProfile.qualifications || '',
      bio: judgeProfile.bio || '',
      specializations: judgeProfile.specializations || [],
      alumni: judgeProfile.alumni || false
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Profile Management</CardTitle>
            <CardDescription>
              View and update your judge profile information
            </CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {judgeProfile.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {judgeProfile.email}
                </div>
                {judgeProfile.phone && (
                  <div>
                    <span className="font-medium">Phone:</span> {judgeProfile.phone}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Experience</h4>
              <div className="flex gap-2 items-center flex-wrap">
                <Badge variant="outline" className="capitalize">
                  {judgeProfile.experience_level}
                </Badge>
                {judgeProfile.experience_years !== undefined && judgeProfile.experience_years > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {judgeProfile.experience_years} years
                  </span>
                )}
                {judgeProfile.alumni && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    [A] Alumni
                  </Badge>
                )}
              </div>
            </div>

            {judgeProfile.specializations && judgeProfile.specializations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  {judgeProfile.specializations.map(spec => (
                    <Badge key={spec} variant="secondary">
                      {DEBATE_FORMATS.find(f => f.id === spec)?.label || spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {judgeProfile.qualifications && (
              <div>
                <h4 className="font-medium mb-2">Qualifications</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {judgeProfile.qualifications}
                </p>
              </div>
            )}

            {judgeProfile.bio && (
              <div>
                <h4 className="font-medium mb-2">Biography</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {judgeProfile.bio}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="For tournament coordination"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience_level">Experience Level</Label>
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
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2 border-t">
              <Checkbox
                id="alumni"
                checked={formData.alumni}
                onCheckedChange={(checked) => setFormData({ ...formData, alumni: !!checked })}
              />
              <Label htmlFor="alumni" className="text-sm font-normal cursor-pointer">
                I am an alumni (former debate competitor)
              </Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}