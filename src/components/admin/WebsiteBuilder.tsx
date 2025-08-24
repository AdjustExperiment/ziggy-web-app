
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Save, 
  Eye, 
  Plus, 
  Trash2, 
  Edit, 
  Globe,
  Sparkles,
  History,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PageEditor } from './website-builder/PageEditor';
import { BlockEditor } from './website-builder/BlockEditor';
import { SEOOptimizer } from './website-builder/SEOOptimizer';
import { PreviewRenderer } from './website-builder/PreviewRenderer';

interface SitePage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  seo: Record<string, any>;
  canonical_url: string | null;
  robots_noindex: boolean;
  robots_nofollow: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SiteBlock {
  id: string;
  page_id: string;
  parent_block_id: string | null;
  type: string;
  content: Record<string, any>;
  position: number;
  visible: boolean;
}

export const WebsiteBuilder = () => {
  const [activeTab, setActiveTab] = useState('pages');
  const [pages, setPages] = useState<SitePage[]>([]);
  const [selectedPage, setSelectedPage] = useState<SitePage | null>(null);
  const [blocks, setBlocks] = useState<SiteBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      loadBlocks(selectedPage.id);
    }
  }, [selectedPage]);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('site_pages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error loading pages:', error);
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const loadBlocks = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('site_blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('position', { ascending: true });

      if (error) throw error;
      setBlocks(data || []);
    } catch (error) {
      console.error('Error loading blocks:', error);
      toast.error('Failed to load blocks');
    }
  };

  const createPage = async () => {
    try {
      const { data, error } = await supabase
        .from('site_pages')
        .insert([{
          slug: '/new-page',
          title: 'New Page',
          description: 'A new page',
          status: 'draft',
          seo: {}
        }])
        .select()
        .single();

      if (error) throw error;
      setPages([data, ...pages]);
      setSelectedPage(data);
      toast.success('Page created successfully');
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Failed to create page');
    }
  };

  const updatePage = async (pageData: Partial<SitePage>) => {
    if (!selectedPage) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('site_pages')
        .update(pageData)
        .eq('id', selectedPage.id)
        .select()
        .single();

      if (error) throw error;
      
      const updatedPages = pages.map(p => p.id === selectedPage.id ? data : p);
      setPages(updatedPages);
      setSelectedPage(data);
      toast.success('Page updated successfully');
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error('Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  const publishPage = async (pageId: string) => {
    setSaving(true);
    try {
      // Create version snapshot
      const page = pages.find(p => p.id === pageId);
      if (!page) throw new Error('Page not found');

      const pageBlocks = await supabase
        .from('site_blocks')
        .select('*')
        .eq('page_id', pageId)
        .order('position');

      const snapshot = {
        page,
        blocks: pageBlocks.data || [],
        published_at: new Date().toISOString()
      };

      const { error: versionError } = await supabase
        .from('site_page_versions')
        .insert([{
          page_id: pageId,
          snapshot
        }]);

      if (versionError) throw versionError;

      // Update page status
      const { data, error } = await supabase
        .from('site_pages')
        .update({ 
          status: 'published',
          published_at: new Date().toISOString()
        })
        .eq('id', pageId)
        .select()
        .single();

      if (error) throw error;
      
      const updatedPages = pages.map(p => p.id === pageId ? data : p);
      setPages(updatedPages);
      if (selectedPage?.id === pageId) {
        setSelectedPage(data);
      }
      
      toast.success('Page published successfully');
    } catch (error) {
      console.error('Error publishing page:', error);
      toast.error('Failed to publish page');
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from('site_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;
      
      const updatedPages = pages.filter(p => p.id !== pageId);
      setPages(updatedPages);
      
      if (selectedPage?.id === pageId) {
        setSelectedPage(null);
        setBlocks([]);
      }
      
      toast.success('Page deleted successfully');
    } catch (error) {
      console.error('Error deleting page:', error);
      toast.error('Failed to delete page');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Website Builder</h2>
          <p className="text-muted-foreground">
            Create and manage your website with AI-powered SEO optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button 
            onClick={createPage}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Page
          </Button>
        </div>
      </div>

      {previewMode && selectedPage ? (
        <PreviewRenderer page={selectedPage} blocks={blocks} />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="editor" disabled={!selectedPage}>Editor</TabsTrigger>
            <TabsTrigger value="seo" disabled={!selectedPage}>SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pages</CardTitle>
                <CardDescription>
                  Manage your website pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{page.title}</h3>
                          <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                            {page.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{page.slug}</p>
                        {page.description && (
                          <p className="text-sm text-muted-foreground mt-1">{page.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPage(page)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {page.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => publishPage(page.id)}
                            disabled={saving}
                          >
                            <Globe className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePage(page.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {pages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No pages created yet. Click "New Page" to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            {selectedPage && (
              <>
                <PageEditor 
                  page={selectedPage} 
                  onUpdate={updatePage}
                  saving={saving}
                />
                <BlockEditor 
                  pageId={selectedPage.id}
                  blocks={blocks}
                  onBlocksChange={setBlocks}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            {selectedPage && (
              <SEOOptimizer 
                page={selectedPage}
                blocks={blocks}
                onUpdate={updatePage}
              />
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
                <CardDescription>
                  Configure global site settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Global site settings coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
