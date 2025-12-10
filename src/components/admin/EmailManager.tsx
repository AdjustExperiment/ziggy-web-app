
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Settings, BarChart3, Send } from 'lucide-react';
import { EmailProviderConfig } from './EmailProviderConfig';
// EnhancedEmailTemplateManager consolidated into this component

interface EmailTemplate {
  id: string;
  tournament_id: string | null;
  template_key: string;
  subject: string;
  html: string;
  text: string | null;
  from_email: string | null;
  reply_to: string | null;
  enabled: boolean;
}

interface EmailSettings {
  id: string;
  tournament_id: string;
  send_success_email: boolean;
  send_pending_reminders: boolean;
  reminder_initial_delay_minutes: number;
  reminder_repeat_minutes: number;
  reminder_max_count: number;
  from_email: string | null;
  reply_to: string | null;
}

interface EmailLog {
  id: string;
  registration_id: string;
  email_type: string;
  status: string;
  error: string | null;
  attempt: number;
  sent_at: string;
  participant_name: string;
  tournament_name: string;
}

export const EmailManager = () => {
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailSettings, setEmailSettings] = useState<EmailSettings[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('global');
  const [activeTab, setActiveTab] = useState('provider');
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingSettings, setEditingSettings] = useState<EmailSettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch tournaments
      const { data: tournamentsData } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('created_at', { ascending: false });
      
      setTournaments(tournamentsData || []);

      // Fetch email templates
      const { data: templatesData } = await supabase
        .from('email_templates')
        .select('*')
        .order('tournament_id', { ascending: true, nullsFirst: true });
      
      setTemplates(templatesData || []);

      // Fetch email settings
      const { data: settingsData } = await supabase
        .from('tournament_email_settings')
        .select('*');
      
      setEmailSettings(settingsData || []);

      // Fetch recent email logs
      const { data: logsData } = await supabase
        .from('email_logs')
        .select(`
          *,
          tournament_registrations(participant_name, tournaments(name))
        `)
        .order('sent_at', { ascending: false })
        .limit(50);
      
      const formattedLogs = logsData?.map(log => ({
        ...log,
        participant_name: log.tournament_registrations?.participant_name || 'Unknown',
        tournament_name: log.tournament_registrations?.tournaments?.name || 'Unknown'
      })) || [];
      
      setEmailLogs(formattedLogs);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Error", description: "Failed to fetch email data", variant: "destructive" });
    }
  };

  const saveTemplate = async (template: Partial<EmailTemplate>) => {
    try {
      // Ensure required fields are present
      const templateData = {
        template_key: template.template_key || '',
        subject: template.subject || '',
        html: template.html || '',
        text: template.text,
        from_email: template.from_email,
        reply_to: template.reply_to,
        enabled: template.enabled ?? true,
        tournament_id: template.tournament_id
      };

      if (editingTemplate?.id) {
        await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        await supabase
          .from('email_templates')
          .insert(templateData);
        toast({ title: "Success", description: "Template created successfully" });
      }
      setEditingTemplate(null);
      fetchData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    }
  };

  const saveSettings = async (settings: Partial<EmailSettings>) => {
    try {
      // Ensure required fields are present
      const settingsData = {
        tournament_id: settings.tournament_id || '',
        send_success_email: settings.send_success_email ?? true,
        send_pending_reminders: settings.send_pending_reminders ?? true,
        reminder_initial_delay_minutes: settings.reminder_initial_delay_minutes ?? 60,
        reminder_repeat_minutes: settings.reminder_repeat_minutes ?? 1440,
        reminder_max_count: settings.reminder_max_count ?? 3,
        from_email: settings.from_email,
        reply_to: settings.reply_to
      };

      if (editingSettings?.id) {
        await supabase
          .from('tournament_email_settings')
          .update(settingsData)
          .eq('id', editingSettings.id);
      } else {
        await supabase
          .from('tournament_email_settings')
          .insert(settingsData);
      }
      toast({ title: "Success", description: "Settings saved successfully" });
      setEditingSettings(null);
      fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
  };

  const sendTestEmail = async (templateId: string) => {
    try {
      // Get current user's email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast({ title: "Error", description: "You must be logged in to send test emails", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { templateId, recipientEmail: user.email }
      });

      if (error) throw error;

      toast({ 
        title: "Test Email Sent", 
        description: `Test email prepared for ${user.email}. Preview: "${data.preview?.subject}"` 
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({ title: "Error", description: "Failed to send test email", variant: "destructive" });
    }
  };

  const filteredTemplates = selectedTournament === 'global' 
    ? templates.filter(t => !t.tournament_id)
    : templates.filter(t => t.tournament_id === selectedTournament);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Manager</h2>
          <p className="text-muted-foreground">
            Manage automated emails for tournament registrations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global Templates</SelectItem>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Provider
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Email Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-4">
          <EmailProviderConfig />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Basic Email Templates</h3>
            <Button onClick={() => setEditingTemplate({} as EmailTemplate)}>
              Create Template
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{template.template_key}</CardTitle>
                      <CardDescription>{template.subject}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.enabled ? "default" : "secondary"}>
                        {template.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => sendTestEmail(template.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {editingTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingTemplate.id ? 'Edit Template' : 'Create Template'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Template Type</Label>
                    <Select 
                      value={editingTemplate.template_key || ''} 
                      onValueChange={(value) => setEditingTemplate({...editingTemplate, template_key: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registration_success">Registration Success</SelectItem>
                        <SelectItem value="payment_pending">Payment Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={editingTemplate.enabled}
                      onCheckedChange={(checked) => setEditingTemplate({...editingTemplate, enabled: checked})}
                    />
                    <Label>Enabled</Label>
                  </div>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input 
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                    placeholder="Use {{participant_name}}, {{tournament_name}}, etc."
                  />
                </div>

                <div>
                  <Label>HTML Content</Label>
                  <Textarea 
                    value={editingTemplate.html || ''}
                    onChange={(e) => setEditingTemplate({...editingTemplate, html: e.target.value})}
                    placeholder="HTML email content with template variables"
                    rows={8}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From Email</Label>
                    <Input 
                      value={editingTemplate.from_email || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, from_email: e.target.value})}
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                  <div>
                    <Label>Reply To</Label>
                    <Input 
                      value={editingTemplate.reply_to || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, reply_to: e.target.value})}
                      placeholder="support@yourdomain.com"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => saveTemplate({
                    ...editingTemplate,
                    tournament_id: selectedTournament === 'global' ? null : selectedTournament
                  })}>
                    Save Template
                  </Button>
                  <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>


        <TabsContent value="settings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tournament Email Settings</h3>
          </div>

          <div className="grid gap-4">
            {tournaments.map((tournament) => {
              const settings = emailSettings.find(s => s.tournament_id === tournament.id);
              return (
                <Card key={tournament.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{tournament.name}</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingSettings(settings || {
                          tournament_id: tournament.id,
                          send_success_email: true,
                          send_pending_reminders: true,
                          reminder_initial_delay_minutes: 60,
                          reminder_repeat_minutes: 1440,
                          reminder_max_count: 3
                        } as EmailSettings)}
                      >
                        {settings ? 'Edit' : 'Configure'}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {editingSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={editingSettings.send_success_email}
                      onCheckedChange={(checked) => setEditingSettings({...editingSettings, send_success_email: checked})}
                    />
                    <Label>Send Success Emails</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={editingSettings.send_pending_reminders}
                      onCheckedChange={(checked) => setEditingSettings({...editingSettings, send_pending_reminders: checked})}
                    />
                    <Label>Send Pending Reminders</Label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Initial Delay (minutes)</Label>
                    <Input 
                      type="number"
                      value={editingSettings.reminder_initial_delay_minutes}
                      onChange={(e) => setEditingSettings({...editingSettings, reminder_initial_delay_minutes: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Repeat Every (minutes)</Label>
                    <Input 
                      type="number"
                      value={editingSettings.reminder_repeat_minutes}
                      onChange={(e) => setEditingSettings({...editingSettings, reminder_repeat_minutes: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Max Reminders</Label>
                    <Input 
                      type="number"
                      value={editingSettings.reminder_max_count}
                      onChange={(e) => setEditingSettings({...editingSettings, reminder_max_count: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => saveSettings(editingSettings)}>
                    Save Settings
                  </Button>
                  <Button variant="outline" onClick={() => setEditingSettings(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Email Activity</h3>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.participant_name}</TableCell>
                      <TableCell>{log.tournament_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.email_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(log.sent_at).toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.error || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
