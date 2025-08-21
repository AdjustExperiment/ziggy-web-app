import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Save, 
  Eye, 
  Palette, 
  Type, 
  Layout, 
  Globe, 
  Code,
  Image,
  Settings
} from 'lucide-react';

interface SiteSettings {
  id: string;
  site_title: string;
  site_description: string;
  site_logo: string;
  primary_font: string;
  secondary_font: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  dark_mode_enabled: boolean;
  custom_css: string;
  footer_text: string;
  contact_email: string;
  social_links: Record<string, string>;
  seo_meta: Record<string, string>;
  is_published: boolean;
  version: number;
}

interface PageContent {
  id: string;
  page_key: string;
  title: string;
  content: Record<string, any>;
  is_published: boolean;
  version: number;
}

export const SiteEditor = () => {
  const [activeTab, setActiveTab] = useState('theme');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [pageContent, setPageContent] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fontOptions = [
    { value: 'unbounded', label: 'Unbounded (Primary)' },
    { value: 'space-grotesk', label: 'Space Grotesk (Secondary)' },
    { value: 'inter', label: 'Inter' },
    { value: 'roboto', label: 'Roboto' },
    { value: 'open-sans', label: 'Open Sans' },
    { value: 'lato', label: 'Lato' }
  ];

  useEffect(() => {
    loadSiteSettings();
    loadPageContent();
  }, []);

  const loadSiteSettings = async () => {
    // TODO: Implement Supabase query
    setLoading(false);
  };

  const loadPageContent = async () => {
    // TODO: Implement Supabase query
  };

  const saveSiteSettings = async () => {
    setSaving(true);
    try {
      // TODO: Implement Supabase update
      toast.success('Site settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const publishChanges = async () => {
    setSaving(true);
    try {
      // TODO: Implement publish logic
      toast.success('Changes published successfully!');
    } catch (error) {
      toast.error('Failed to publish changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Site Editor</h2>
          <p className="text-muted-foreground">
            Customize your website's appearance and content
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button 
            onClick={saveSiteSettings}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button 
            onClick={publishChanges}
            disabled={saving}
            variant="hero"
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="theme" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Color Scheme</CardTitle>
                <CardDescription>
                  Customize your site's color palette
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      className="w-16 h-10 border-border"
                      defaultValue="#dc2626"
                    />
                    <Input
                      className="flex-1"
                      placeholder="#dc2626"
                      defaultValue="#dc2626"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accent-color"
                      type="color"
                      className="w-16 h-10 border-border"
                      defaultValue="#991b1b"
                    />
                    <Input
                      className="flex-1"
                      placeholder="#991b1b"
                      defaultValue="#991b1b"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode">Dark Mode Support</Label>
                  <Switch id="dark-mode" defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Background Effects</CardTitle>
                <CardDescription>
                  Configure fluid blob animations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Blob Intensity</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subtle">Subtle</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="strong">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Animation Speed</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="reduced-motion">Respect Reduced Motion</Label>
                  <Switch id="reduced-motion" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Font Selection</CardTitle>
                <CardDescription>
                  Choose fonts for headings and body text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Font (Headings)</Label>
                  <Select defaultValue="unbounded">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Font (Body)</Label>
                  <Select defaultValue="space-grotesk">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map(font => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography Scale</CardTitle>
                <CardDescription>
                  Preview and adjust font sizes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 p-4 border border-border rounded-lg">
                  <div className="text-4xl font-primary font-bold text-foreground">
                    Heading 1
                  </div>
                  <div className="text-2xl font-primary font-semibold text-foreground">
                    Heading 2
                  </div>
                  <div className="text-xl font-primary font-medium text-foreground">
                    Heading 3
                  </div>
                  <div className="text-base text-foreground">
                    Body text with regular weight and proper line spacing for readability.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Small text and captions
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>Layout Configuration</CardTitle>
              <CardDescription>
                Coming soon - Visual layout editor with drag-and-drop components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Layout className="h-16 w-16 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Visual layout editor will be available in the next version
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                Coming soon - Direct content editing for all pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Code className="h-16 w-16 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Page content editor will be available in the next version
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Site Information</CardTitle>
                <CardDescription>
                  Basic site settings and metadata
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-title">Site Title</Label>
                  <Input
                    id="site-title"
                    placeholder="Tournament Platform"
                    defaultValue="Tournament Platform"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site-description">Site Description</Label>
                  <Textarea
                    id="site-description"
                    placeholder="Platform for managing debate tournaments"
                    defaultValue="Platform for managing debate tournaments"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="contact@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
                <CardDescription>
                  Control site visibility and versioning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="site-published">Site Published</Label>
                  <Switch id="site-published" defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>Current Version</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v1.0.0</Badge>
                    <Button variant="outline" size="sm">
                      Create New Version
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-css">Custom CSS</Label>
                  <Textarea
                    id="custom-css"
                    placeholder="/* Your custom CSS here */"
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};