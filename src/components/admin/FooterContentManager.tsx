import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Save, RefreshCw } from 'lucide-react';

interface FooterUpdate {
  title: string;
  content: string;
  link_url: string;
  link_text: string;
}

const DEFAULT_FOOTER_UPDATE: FooterUpdate = {
  title: 'Latest Update',
  content: 'Tournament registration is now open! Join hundreds of debaters competing nationally.',
  link_url: '/tournaments',
  link_text: 'Register Now'
};

export const FooterContentManager = () => {
  const [footerUpdate, setFooterUpdate] = useState<FooterUpdate>(DEFAULT_FOOTER_UPDATE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFooterContent();
  }, []);

  const loadFooterContent = async () => {
    try {
      setLoading(true);
      
      // Load from global_settings table
      const { data, error } = await supabase
        .from('global_settings')
        .select('value')
        .eq('key', 'footer_update')
        .maybeSingle();
      
      if (error) {
        console.error('Error loading footer content:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('footer_latest_update');
        if (stored) {
          setFooterUpdate(JSON.parse(stored));
        }
        return;
      }
      
      if (data?.value) {
        const value = data.value as unknown as FooterUpdate;
        if (value.title && value.content) {
          setFooterUpdate(value);
        }
      }
    } catch (error) {
      console.error('Error loading footer content:', error);
      toast({
        title: "Error",
        description: "Failed to load footer content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFooterContent = async () => {
    try {
      setSaving(true);
      
      // Check if record exists first
      const { data: existing } = await supabase
        .from('global_settings')
        .select('id')
        .eq('key', 'footer_update')
        .maybeSingle();
      
      let error;
      const jsonValue = JSON.parse(JSON.stringify(footerUpdate));
      
      if (existing) {
        // Update existing record
        const result = await supabase
          .from('global_settings')
          .update({
            value: jsonValue,
            category: 'content',
            updated_at: new Date().toISOString()
          })
          .eq('key', 'footer_update');
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('global_settings')
          .insert([{
            key: 'footer_update',
            value: jsonValue,
            category: 'content'
          }]);
        error = result.error;
      }
      
      if (error) {
        console.error('Error saving to database:', error);
        // Fallback to localStorage
        localStorage.setItem('footer_latest_update', JSON.stringify(footerUpdate));
        toast({
          title: "Saved Locally",
          description: "Content saved locally. Database sync may require admin access.",
        });
      } else {
        toast({
          title: "Success",
          description: "Footer content updated successfully",
        });
      }

      // Also update localStorage for immediate cross-tab sync
      localStorage.setItem('footer_latest_update', JSON.stringify(footerUpdate));
      
      // Dispatch custom event to notify other components of the change
      window.dispatchEvent(new CustomEvent('footerContentUpdated', { 
        detail: footerUpdate 
      }));

    } catch (error) {
      console.error('Error saving footer content:', error);
      toast({
        title: "Error",
        description: "Failed to save footer content",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Footer Content Manager
              <Badge variant="outline" className="text-xs">
                Latest Update Section
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage the "Latest Update" content displayed in the website footer
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadFooterContent}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Preview Section */}
        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Preview</h4>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="text-card-foreground font-medium mb-2 text-sm">
              {footerUpdate.title || 'Latest Update'}
            </h4>
            <p className="text-muted-foreground text-xs mb-2">
              {footerUpdate.content || 'No content yet...'}
            </p>
            <a 
              href={footerUpdate.link_url || '#'} 
              className="inline-flex items-center text-primary hover:text-primary/80 text-xs font-medium"
            >
              {footerUpdate.link_text || 'Learn More'}
            </a>
          </div>
        </div>

        {/* Edit Form */}
        <div className="grid gap-4">
          <div>
            <Label htmlFor="title">Update Title</Label>
            <Input
              id="title"
              value={footerUpdate.title}
              onChange={(e) => setFooterUpdate(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Latest Update"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="content">Update Content</Label>
            <Textarea
              id="content"
              value={footerUpdate.content}
              onChange={(e) => setFooterUpdate(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter the latest update content..."
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Keep it concise - this appears in the footer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="link_url">Link URL</Label>
              <Input
                id="link_url"
                value={footerUpdate.link_url}
                onChange={(e) => setFooterUpdate(prev => ({ ...prev, link_url: e.target.value }))}
                placeholder="/tournaments"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="link_text">Link Text</Label>
              <Input
                id="link_text"
                value={footerUpdate.link_text}
                onChange={(e) => setFooterUpdate(prev => ({ ...prev, link_text: e.target.value }))}
                placeholder="Register Now"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={saveFooterContent}
            disabled={saving || loading}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
