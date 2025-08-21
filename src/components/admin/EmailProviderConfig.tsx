
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Settings, Check, AlertCircle } from 'lucide-react';

interface EmailProviderSettings {
  id: string;
  provider: 'resend' | 'sendgrid';
  from_email: string | null;
  reply_to: string | null;
  singleton: boolean;
  created_at: string;
  updated_at: string;
}

export const EmailProviderConfig = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EmailProviderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'resend' as 'resend' | 'sendgrid',
    from_email: '',
    reply_to: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_provider_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      if (data) {
        setSettings(data);
        setFormData({
          provider: data.provider,
          from_email: data.from_email || '',
          reply_to: data.reply_to || ''
        });
      }
    } catch (error) {
      console.error('Error fetching email provider settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch email provider settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updateData = {
        provider: formData.provider,
        from_email: formData.from_email || null,
        reply_to: formData.reply_to || null,
        singleton: true
      };

      if (settings?.id) {
        const { error } = await supabase
          .from('email_provider_settings')
          .update(updateData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('email_provider_settings')
          .insert(updateData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Email provider settings saved successfully"
      });

      setEditing(false);
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email provider settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getProviderStatus = () => {
    if (!settings) return { status: 'Not Configured', variant: 'destructive' as const };
    
    const hasApiKey = settings.provider === 'resend' ? 'RESEND_API_KEY' : 'SENDGRID_API_KEY';
    // We can't check if the secret exists from the frontend, so we assume it needs to be set
    return { status: `${settings.provider.toUpperCase()} Selected`, variant: 'default' as const };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading email provider settings...</div>
        </CardContent>
      </Card>
    );
  }

  const { status, variant } = getProviderStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Email Provider Configuration
            </CardTitle>
            <CardDescription>
              Configure your email service provider for automated emails
            </CardDescription>
          </div>
          <Badge variant={variant}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-medium">Provider</Label>
                <p className="text-sm text-muted-foreground capitalize">
                  {settings?.provider || 'Not configured'}
                </p>
              </div>
              <div>
                <Label className="font-medium">From Email</Label>
                <p className="text-sm text-muted-foreground">
                  {settings?.from_email || 'Not set'}
                </p>
              </div>
            </div>
            <div>
              <Label className="font-medium">Reply To</Label>
              <p className="text-sm text-muted-foreground">
                {settings?.reply_to || 'Not set'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setEditing(true)}>
                Configure Provider
              </Button>
            </div>

            {settings?.provider && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">API Key Required</p>
                    <p className="text-muted-foreground">
                      You need to set the <code>{settings.provider === 'resend' ? 'RESEND_API_KEY' : 'SENDGRID_API_KEY'}</code> secret in your Supabase project settings for emails to work.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Email Provider</Label>
              <Select 
                value={formData.provider} 
                onValueChange={(value: 'resend' | 'sendgrid') => 
                  setFormData({ ...formData, provider: value })
                }
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
              <Label>From Email</Label>
              <Input
                type="email"
                value={formData.from_email}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                placeholder="noreply@yourdomain.com"
              />
            </div>

            <div>
              <Label>Reply To</Label>
              <Input
                type="email"
                value={formData.reply_to}
                onChange={(e) => setFormData({ ...formData, reply_to: e.target.value })}
                placeholder="support@yourdomain.com"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    provider: settings?.provider || 'resend',
                    from_email: settings?.from_email || '',
                    reply_to: settings?.reply_to || ''
                  });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
