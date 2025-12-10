import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Save, Globe, Palette, Settings2, Shield } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/i18n';

interface SiteSettings {
  site_name: string;
  site_tagline: string;
  logo_url: string;
  favicon_url: string;
  default_language: string;
  primary_color: string;
  secondary_color: string;
  meta_title_template: string;
  meta_description: string;
  enable_spectators: boolean;
  enable_sponsors: boolean;
  enable_blog: boolean;
  enable_analytics: boolean;
  maintenance_mode: boolean;
  custom_css: string;
}

const defaultSettings: SiteSettings = {
  site_name: 'Ziggy Online Debate',
  site_tagline: 'Excellence in Online Debate',
  logo_url: '',
  favicon_url: '',
  default_language: 'en',
  primary_color: '#dc2626',
  secondary_color: '#1f2937',
  meta_title_template: '{page} | Ziggy Online Debate',
  meta_description: 'Your all-in-one online debate tournament host and resource provider.',
  enable_spectators: true,
  enable_sponsors: true,
  enable_blog: true,
  enable_analytics: true,
  maintenance_mode: false,
  custom_css: ''
};

export function GlobalSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('key, value')
        .eq('category', 'site');

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedSettings: Record<string, unknown> = {};
        data.forEach((row) => {
          const key = row.key.replace('site_', '');
          if (key in defaultSettings) {
            loadedSettings[key] = row.value;
          }
        });
        setSettings({ ...defaultSettings, ...loadedSettings as Partial<SiteSettings> });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Upsert each setting
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key: `site_${key}`,
        value: value as any,
        category: 'site'
      }));

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('global_settings')
          .upsert(
            { key: setting.key, value: setting.value, category: setting.category },
            { onConflict: 'key' }
          );
        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Site settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic site configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={(e) => updateSetting('site_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_tagline">Tagline</Label>
              <Input
                id="site_tagline"
                value={settings.site_tagline}
                onChange={(e) => updateSetting('site_tagline', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={settings.logo_url}
                onChange={(e) => updateSetting('logo_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_language">Default Language</Label>
              <Select
                value={settings.default_language}
                onValueChange={(value) => updateSetting('default_language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Colors and styling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="primary_color"
                  value={settings.primary_color}
                  onChange={(e) => updateSetting('primary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => updateSetting('primary_color', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="secondary_color"
                  value={settings.secondary_color}
                  onChange={(e) => updateSetting('secondary_color', e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => updateSetting('secondary_color', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom_css">Custom CSS</Label>
            <Textarea
              id="custom_css"
              value={settings.custom_css}
              onChange={(e) => updateSetting('custom_css', e.target.value)}
              placeholder=".custom-class { ... }"
              className="font-mono text-sm"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            SEO Settings
          </CardTitle>
          <CardDescription>Search engine optimization defaults</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meta_title_template">Title Template</Label>
            <Input
              id="meta_title_template"
              value={settings.meta_title_template}
              onChange={(e) => updateSetting('meta_title_template', e.target.value)}
              placeholder="{page} | Site Name"
            />
            <p className="text-xs text-muted-foreground">Use {'{page}'} as placeholder for page title</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta_description">Default Meta Description</Label>
            <Textarea
              id="meta_description"
              value={settings.meta_description}
              onChange={(e) => updateSetting('meta_description', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Feature Flags
          </CardTitle>
          <CardDescription>Enable or disable features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Spectators</Label>
                <p className="text-xs text-muted-foreground">Allow observers to request viewing debates</p>
              </div>
              <Switch
                checked={settings.enable_spectators}
                onCheckedChange={(checked) => updateSetting('enable_spectators', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Sponsors</Label>
                <p className="text-xs text-muted-foreground">Enable sponsor features</p>
              </div>
              <Switch
                checked={settings.enable_sponsors}
                onCheckedChange={(checked) => updateSetting('enable_sponsors', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Blog</Label>
                <p className="text-xs text-muted-foreground">Enable blog features</p>
              </div>
              <Switch
                checked={settings.enable_blog}
                onCheckedChange={(checked) => updateSetting('enable_blog', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label>Analytics</Label>
                <p className="text-xs text-muted-foreground">Collect usage analytics</p>
              </div>
              <Switch
                checked={settings.enable_analytics}
                onCheckedChange={(checked) => updateSetting('enable_analytics', checked)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/5">
            <div>
              <Label className="text-destructive">Maintenance Mode</Label>
              <p className="text-xs text-muted-foreground">Show maintenance page to non-admins</p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
