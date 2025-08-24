
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type SitePage = Tables<'site_pages'>;

interface PageEditorProps {
  page: SitePage;
  onUpdate: (data: Partial<SitePage>) => void;
  saving: boolean;
}

export const PageEditor = ({ page, onUpdate, saving }: PageEditorProps) => {
  const [formData, setFormData] = useState({
    title: page.title,
    slug: page.slug,
    description: page.description || '',
    canonical_url: page.canonical_url || '',
    robots_noindex: page.robots_noindex,
    robots_nofollow: page.robots_nofollow
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Settings</CardTitle>
        <CardDescription>
          Configure basic page information and SEO settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Enter page title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="/page-url"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Page Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of the page content"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonical">Canonical URL</Label>
            <Input
              id="canonical"
              value={formData.canonical_url}
              onChange={(e) => handleChange('canonical_url', e.target.value)}
              placeholder="https://example.com/canonical-url"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="noindex">No Index (Hide from search engines)</Label>
              <Switch
                id="noindex"
                checked={formData.robots_noindex}
                onCheckedChange={(checked) => handleChange('robots_noindex', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="nofollow">No Follow (Don't follow links)</Label>
              <Switch
                id="nofollow"
                checked={formData.robots_nofollow}
                onCheckedChange={(checked) => handleChange('robots_nofollow', checked)}
              />
            </div>
          </div>

          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Page'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
