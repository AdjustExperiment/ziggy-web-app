import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Image, Eye, Send, Plus, Edit, Trash2, Upload, Clock } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface EnhancedEmailTemplate {
  id?: string;
  tournament_id?: string | null;
  template_name: string;
  template_key: string;
  subject: string;
  html_content: string;
  variables: Record<string, unknown>;
  images: string[];
  from_email?: string;
  reply_to?: string;
  enabled: boolean;
  schedule_at?: string | null;
  automation_trigger?: string | null;
  open_count?: number;
  click_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface ApiKeyConfig {
  id?: string;
  provider: 'resend' | 'sendgrid';
  api_key_name: string;
  is_active: boolean;
  test_email?: string;
}

export const EnhancedEmailTemplateManager = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EnhancedEmailTemplate[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('global');
  const [activeTab, setActiveTab] = useState('templates');
  const [editingTemplate, setEditingTemplate] = useState<EnhancedEmailTemplate | null>(null);
  const [editingApiKey, setEditingApiKey] = useState<ApiKeyConfig | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploading, setUploading] = useState(false);

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

      // Fetch enhanced templates
      const { data: templatesData } = await supabase
        .from('email_templates_enhanced')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Type conversion for templates
      const typedTemplates: EnhancedEmailTemplate[] = (templatesData || []).map(template => ({
        ...template,
        variables: typeof template.variables === 'object' ? template.variables as Record<string, unknown> : {},
        images: Array.isArray(template.images) ? template.images as string[] : []
      }));
      
      setTemplates(typedTemplates);

      // Fetch API key configs
      const { data: apiKeysData } = await supabase
        .from('email_api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Type conversion for API keys
      const typedApiKeys: ApiKeyConfig[] = (apiKeysData || []).map(key => ({
        ...key,
        provider: (key.provider === 'sendgrid' ? 'sendgrid' : 'resend') as 'resend' | 'sendgrid'
      }));
      
      setApiKeys(typedApiKeys);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: "Error", description: "Failed to fetch email data", variant: "destructive" });
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      setUploading(true);
      
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('blog-images') // Reusing existing bucket
        .upload(`email-images/${fileName}`, file);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(`email-images/${fileName}`);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const saveTemplate = async (template: EnhancedEmailTemplate) => {
    try {
      const templateData = {
        tournament_id: template.tournament_id,
        template_name: template.template_name,
        template_key: template.template_key,
        subject: template.subject,
        html_content: template.html_content,
        variables: (template.variables || {}) as any,
        images: (template.images || []) as any,
        from_email: template.from_email || null,
        reply_to: template.reply_to || null,
        enabled: template.enabled,
        schedule_at: template.schedule_at || null,
        automation_trigger: template.automation_trigger || null
      };

      if (template.id) {
        await supabase
          .from('email_templates_enhanced')
          .update(templateData)
          .eq('id', template.id);
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        await supabase
          .from('email_templates_enhanced')
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

  const saveApiKey = async (apiKey: ApiKeyConfig) => {
    try {
      const apiKeyData = {
        provider: apiKey.provider,
        api_key_name: apiKey.api_key_name,
        is_active: apiKey.is_active,
        test_email: apiKey.test_email || null
      };

      if (apiKey.id) {
        await supabase
          .from('email_api_keys')
          .update(apiKeyData)
          .eq('id', apiKey.id);
        toast({ title: "Success", description: "API key config updated successfully" });
      } else {
        await supabase
          .from('email_api_keys')
          .insert(apiKeyData);
        toast({ title: "Success", description: "API key config created successfully" });
      }
      
      setEditingApiKey(null);
      fetchData();
    } catch (error) {
      console.error('Error saving API key config:', error);
      toast({ title: "Error", description: "Failed to save API key config", variant: "destructive" });
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await supabase
        .from('email_templates_enhanced')
        .delete()
        .eq('id', id);
      
      toast({ title: "Success", description: "Template deleted successfully" });
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({ title: "Error", description: "Failed to delete template", variant: "destructive" });
    }
  };

  const filteredTemplates = selectedTournament === 'global' 
    ? templates.filter(t => !t.tournament_id)
    : templates.filter(t => t.tournament_id === selectedTournament);

  const availableVariables = [
    '{{participant_name}}',
    '{{tournament_name}}',
    '{{registration_date}}',
    '{{payment_amount}}',
    '{{payment_deadline}}',
    '{{venue_details}}',
    '{{tournament_start_date}}',
    '{{tournament_end_date}}'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Enhanced Email Templates</h2>
          <p className="text-muted-foreground">
            Create rich email templates with images and advanced formatting
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
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Email Templates</h3>
            <Button onClick={() => setEditingTemplate({
              template_name: '',
              template_key: 'registration_success',
              subject: '',
              html_content: '',
              variables: {},
              images: [],
              enabled: true,
              schedule_at: null,
              automation_trigger: '',
              open_count: 0,
              click_count: 0,
              tournament_id: selectedTournament === 'global' ? null : selectedTournament
            } as EnhancedEmailTemplate)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{template.template_name}</CardTitle>
                      <CardDescription>{template.subject}</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{template.template_key}</Badge>
                        <Badge variant={template.enabled ? "default" : "secondary"}>
                          {template.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        {template.images.length > 0 && (
                          <Badge variant="outline">
                            <Image className="h-3 w-3 mr-1" />
                            {template.images.length} images
                          </Badge>
                        )}
                        {template.schedule_at && (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(template.schedule_at).toLocaleString()}
                          </Badge>
                        )}
                        <Badge variant="outline">Opens: {template.open_count || 0}</Badge>
                        <Badge variant="outline">Clicks: {template.click_count || 0}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteTemplate(template.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
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
                <CardTitle className="flex items-center justify-between">
                  {editingTemplate.id ? 'Edit Template' : 'Create Template'}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPreviewMode(!previewMode)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {previewMode ? 'Edit' : 'Preview'}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!previewMode ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Template Name</Label>
                        <Input 
                          value={editingTemplate.template_name}
                          onChange={(e) => setEditingTemplate({...editingTemplate, template_name: e.target.value})}
                          placeholder="My Email Template"
                        />
                      </div>
                      <div>
                        <Label>Template Type</Label>
                        <Select 
                          value={editingTemplate.template_key} 
                          onValueChange={(value) => setEditingTemplate({...editingTemplate, template_key: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="registration_success">Registration Success</SelectItem>
                            <SelectItem value="payment_pending">Payment Pending</SelectItem>
                            <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                            <SelectItem value="tournament_update">Tournament Update</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Subject Line</Label>
                      <Input 
                        value={editingTemplate.subject}
                        onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                        placeholder="Welcome to {{tournament_name}}!"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Available variables: {availableVariables.join(', ')}
                      </p>
                    </div>

                    <div>
                      <Label>Email Content</Label>
                      <div className="border rounded-md">
                        <ReactQuill
                          theme="snow"
                          value={editingTemplate.html_content}
                          onChange={(content) => setEditingTemplate({...editingTemplate, html_content: content})}
                          modules={quillModules}
                          style={{ minHeight: '300px' }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use the toolbar to format text, add links, and insert images
                      </p>
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Schedule Send</Label>
                        <Input
                          type="datetime-local"
                          value={editingTemplate.schedule_at ? new Date(editingTemplate.schedule_at).toISOString().slice(0,16) : ''}
                          onChange={(e) => setEditingTemplate({
                            ...editingTemplate,
                            schedule_at: e.target.value ? new Date(e.target.value).toISOString() : null
                          })}
                        />
                      </div>
                      <div>
                        <Label>Automation Trigger</Label>
                        <Input
                          value={editingTemplate.automation_trigger || ''}
                          onChange={(e) => setEditingTemplate({
                            ...editingTemplate,
                            automation_trigger: e.target.value
                          })}
                          placeholder="event_key"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingTemplate.enabled}
                        onCheckedChange={(checked) => setEditingTemplate({...editingTemplate, enabled: checked})}
                      />
                      <Label>Template Enabled</Label>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Subject: {editingTemplate.subject}</h4>
                    </div>
                    <div className="border rounded-md p-4 bg-muted/10 min-h-[300px]">
                      <div 
                        dangerouslySetInnerHTML={{ __html: editingTemplate.html_content }}
                        className="prose prose-sm max-w-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => saveTemplate(editingTemplate)}>
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

        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Email API Configuration</h3>
            <Button onClick={() => setEditingApiKey({
              provider: 'resend',
              api_key_name: '',
              is_active: true,
              test_email: ''
            } as ApiKeyConfig)}>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </div>

          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base capitalize">{apiKey.provider}</CardTitle>
                      <CardDescription>Secret: {apiKey.api_key_name}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                        {apiKey.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingApiKey(apiKey)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {editingApiKey && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingApiKey.id ? 'Edit API Key Configuration' : 'Add API Key Configuration'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Provider</Label>
                  <Select 
                    value={editingApiKey.provider} 
                    onValueChange={(value: 'resend' | 'sendgrid') => setEditingApiKey({...editingApiKey, provider: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>API Key Secret Name</Label>
                  <Input 
                    value={editingApiKey.api_key_name}
                    onChange={(e) => setEditingApiKey({...editingApiKey, api_key_name: e.target.value})}
                    placeholder="RESEND_API_KEY or SENDGRID_API_KEY"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This should match the secret name you'll configure in Supabase Edge Functions settings
                  </p>
                </div>

                <div>
                  <Label>Test Email (Optional)</Label>
                  <Input 
                    type="email"
                    value={editingApiKey.test_email || ''}
                    onChange={(e) => setEditingApiKey({...editingApiKey, test_email: e.target.value})}
                    placeholder="test@yourdomain.com"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={editingApiKey.is_active}
                    onCheckedChange={(checked) => setEditingApiKey({...editingApiKey, is_active: checked})}
                  />
                  <Label>Active</Label>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Next Steps:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>1. Get your API key from {editingApiKey.provider === 'resend' ? 'Resend.com' : 'SendGrid'}</li>
                    <li>2. Add it as a secret in your Supabase project settings</li>
                    <li>3. Use the exact secret name: {editingApiKey.api_key_name}</li>
                    <li>4. Configure this in your Edge Functions</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => saveApiKey(editingApiKey)}>
                    Save Configuration
                  </Button>
                  <Button variant="outline" onClick={() => setEditingApiKey(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};