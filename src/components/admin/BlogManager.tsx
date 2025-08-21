import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  tags: string[];
  cover_image_url?: string;
  status: 'draft' | 'published';
  featured: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

export function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: '',
    status: 'draft' as 'draft' | 'published',
    featured: false,
  });

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data || []).map(post => ({
        ...post,
        status: post.status as 'draft' | 'published'
      })));
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch blog posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSave = async () => {
    try {
      const slug = generateSlug(formData.title);
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);

      const postData = {
        title: formData.title,
        slug,
        excerpt: formData.excerpt || null,
        content: formData.content || null,
        tags,
        status: formData.status,
        featured: formData.featured,
        author_id: (await supabase.auth.getUser()).data.user?.id,
      };

      let error;

      if (editingPost) {
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('blog_posts')
          .insert([postData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Post ${editingPost ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingPost(null);
      setFormData({
        title: '',
        excerpt: '',
        content: '',
        tags: '',
        status: 'draft',
        featured: false,
      });
      
      fetchPosts();
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save post',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content || '',
      tags: post.tags.join(', '),
      status: post.status,
      featured: post.featured,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });
      
      fetchPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const toggleStatus = async (post: BlogPost) => {
    try {
      const newStatus = post.status === 'published' ? 'draft' : 'published';
      
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: newStatus })
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`,
      });
      
      fetchPosts();
    } catch (error: any) {
      console.error('Error updating post status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update post status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Blog Posts</h2>
          <p className="text-muted-foreground">Manage your blog content</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingPost(null);
                setFormData({
                  title: '',
                  excerpt: '',
                  content: '',
                  tags: '',
                  status: 'draft',
                  featured: false,
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Edit Post' : 'Create New Post'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter post title"
                />
              </div>
              
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description of the post"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Post content (supports markdown)"
                  rows={8}
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="debate, strategy, tournaments"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                  />
                  <Label htmlFor="featured">Featured</Label>
                </div>
                
                <div className="flex-1">
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: 'draft' | 'published') => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingPost ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                    >
                      {post.status}
                    </Badge>
                    {post.featured && (
                      <Badge variant="outline">Featured</Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(post)}
                  >
                    <Eye className="h-4 w-4" />
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(post)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {post.excerpt && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{post.excerpt}</p>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
        
        {posts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No blog posts yet. Create your first post!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}