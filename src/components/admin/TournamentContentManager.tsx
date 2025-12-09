import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Megaphone, Building, BookOpen, Phone } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

interface Sponsor {
  name: string;
  logo_url?: string;
  website?: string;
  tier: 'title' | 'presenting' | 'major' | 'supporting';
}

interface TournamentContent {
  id: string;
  tournament_id: string;
  announcements: Announcement[];
  description?: string;
  sponsors: Sponsor[];
  rules?: string;
  schedule_notes?: string;
  contact_info?: string;
}

interface TournamentContentManagerProps {
  tournamentId: string;
  content: TournamentContent | null;
  onContentUpdate: (content: TournamentContent) => void;
}

export function TournamentContentManager({ 
  tournamentId, 
  content, 
  onContentUpdate 
}: TournamentContentManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [description, setDescription] = useState('');
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [rules, setRules] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // New form states
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [newSponsor, setNewSponsor] = useState({
    name: '',
    logo_url: '',
    website: '',
    tier: 'supporting' as 'title' | 'presenting' | 'major' | 'supporting'
  });

  useEffect(() => {
    if (content) {
      setAnnouncements(content.announcements || []);
      setDescription(content.description || '');
      setSponsors(content.sponsors || []);
      setRules(content.rules || '');
      setScheduleNotes(content.schedule_notes || '');
      setContactInfo(content.contact_info || '');
    }
  }, [content]);

  const saveContent = async () => {
    try {
      setLoading(true);

      const contentData = {
        tournament_id: tournamentId,
        announcements: announcements as any,
        description: description || null,
        sponsors: sponsors as any,
        rules: rules || null,
        schedule_notes: scheduleNotes || null,
        contact_info: contactInfo || null,
      };

      let result;
      if (content) {
        // Update existing content
        result = await supabase
          .from('tournament_content')
          .update(contentData)
          .eq('id', content.id)
          .select()
          .single();
      } else {
        // Create new content
        result = await supabase
          .from('tournament_content')
          .insert(contentData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      onContentUpdate(result.data);
      toast({
        title: 'Success',
        description: 'Tournament content saved successfully',
      });
    } catch (error: any) {
      console.error('Error saving content:', error);
      toast({
        title: 'Error',
        description: 'Failed to save content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all announcement fields',
        variant: 'destructive',
      });
      return;
    }

    const announcement: Announcement = {
      id: Math.random().toString(36).substr(2, 9),
      title: newAnnouncement.title,
      message: newAnnouncement.message,
      priority: newAnnouncement.priority,
      created_at: new Date().toISOString(),
    };

    setAnnouncements([announcement, ...announcements]);
    setNewAnnouncement({ title: '', message: '', priority: 'medium' });

    // Send notifications to all tournament participants
    try {
      const { data: registrations } = await supabase
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tournamentId);

      if (registrations && registrations.length > 0) {
        const notifications = registrations.map(reg => ({
          registration_id: reg.id,
          tournament_id: tournamentId,
          title: `📢 ${newAnnouncement.title}`,
          message: newAnnouncement.message,
          type: 'announcement'
        }));

        await supabase.from('competitor_notifications').insert(notifications);
        
        toast({
          title: 'Announcement Added',
          description: `Notification sent to ${registrations.length} participants`,
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      // Still show success for announcement, just note notification failure
      toast({
        title: 'Announcement Added',
        description: 'Note: Some notifications may not have been sent',
      });
    }
  };

  const removeAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  const addSponsor = () => {
    if (!newSponsor.name) {
      toast({
        title: 'Error',
        description: 'Please enter a sponsor name',
        variant: 'destructive',
      });
      return;
    }

    setSponsors([...sponsors, { ...newSponsor }]);
    setNewSponsor({ name: '', logo_url: '', website: '', tier: 'supporting' });
  };

  const removeSponsor = (index: number) => {
    setSponsors(sponsors.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tournament Content Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage tournament information visible to participants
          </p>
        </div>
        <Button onClick={saveContent} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Description</CardTitle>
          <CardDescription>
            Main tournament description shown on the overview page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter tournament description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Megaphone className="h-5 w-5 mr-2" />
            Announcements
          </CardTitle>
          <CardDescription>
            Add important announcements for tournament participants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="announcement-title">Title</Label>
                <Input
                  id="announcement-title"
                  placeholder="Announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="announcement-priority">Priority</Label>
                <Select value={newAnnouncement.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewAnnouncement({...newAnnouncement, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                placeholder="Announcement message"
                value={newAnnouncement.message}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
              />
            </div>
            <Button onClick={addAnnouncement} className="w-fit">
              <Plus className="h-4 w-4 mr-2" />
              Add Announcement
            </Button>
          </div>

          {announcements.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Current Announcements</h4>
              {announcements.map((announcement) => (
                <div key={announcement.id} className="flex items-start justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium">{announcement.title}</h5>
                      <Badge variant={getPriorityColor(announcement.priority)}>
                        {announcement.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{announcement.message}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeAnnouncement(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sponsors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Sponsors
          </CardTitle>
          <CardDescription>
            Add tournament sponsors and their information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sponsor-name">Name *</Label>
                <Input
                  id="sponsor-name"
                  placeholder="Sponsor name"
                  value={newSponsor.name}
                  onChange={(e) => setNewSponsor({...newSponsor, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="sponsor-tier">Tier</Label>
                <Select value={newSponsor.tier} onValueChange={(value: 'title' | 'presenting' | 'major' | 'supporting') => setNewSponsor({...newSponsor, tier: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title Sponsor</SelectItem>
                    <SelectItem value="presenting">Presenting Sponsor</SelectItem>
                    <SelectItem value="major">Major Sponsor</SelectItem>
                    <SelectItem value="supporting">Supporting Sponsor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sponsor-logo">Logo URL</Label>
                <Input
                  id="sponsor-logo"
                  placeholder="https://example.com/logo.png"
                  value={newSponsor.logo_url}
                  onChange={(e) => setNewSponsor({...newSponsor, logo_url: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="sponsor-website">Website</Label>
                <Input
                  id="sponsor-website"
                  placeholder="https://example.com"
                  value={newSponsor.website}
                  onChange={(e) => setNewSponsor({...newSponsor, website: e.target.value})}
                />
              </div>
            </div>
            <Button onClick={addSponsor} className="w-fit">
              <Plus className="h-4 w-4 mr-2" />
              Add Sponsor
            </Button>
          </div>

          {sponsors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Current Sponsors</h4>
              {sponsors.map((sponsor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {sponsor.logo_url && (
                      <img src={sponsor.logo_url} alt={sponsor.name} className="h-8 w-8 object-contain" />
                    )}
                    <div>
                      <div className="font-medium">{sponsor.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">{sponsor.tier} sponsor</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeSponsor(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Tournament Rules
          </CardTitle>
          <CardDescription>
            Detailed tournament rules and regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter tournament rules and regulations..."
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            rows={8}
          />
        </CardContent>
      </Card>

      {/* Schedule Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Notes</CardTitle>
          <CardDescription>
            Additional scheduling information and notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter schedule notes and important timing information..."
            value={scheduleNotes}
            onChange={(e) => setScheduleNotes(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="h-5 w-5 mr-2" />
            Contact Information
          </CardTitle>
          <CardDescription>
            How participants can contact tournament organizers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter contact information for tournament organizers..."
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}