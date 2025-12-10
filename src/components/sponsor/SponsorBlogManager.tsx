import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Clock, CheckCircle, Edit, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SponsorProfile {
  id: string;
  blog_posts_limit: number;
  blog_posts_used: number;
  is_approved: boolean;
  approved_tier: string | null;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  slug: string;
  status: string;
  created_at: string;
  tags: string[] | null;
}

interface SponsorBlogManagerProps {
  sponsorProfile: SponsorProfile;
  onPostCreated?: () => void;
}

const SponsorBlogManager = ({ sponsorProfile, onPostCreated }: SponsorBlogManagerProps) => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  
  const [postForm, setPostForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    tags: ""
  });

  const postsRemaining = sponsorProfile.blog_posts_limit - sponsorProfile.blog_posts_used;
  const canCreatePost = postsRemaining > 0 && sponsorProfile.is_approved;

  useEffect(() => {
    fetchPosts();
  }, [sponsorProfile.id]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('sponsor_id', sponsorProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!canCreatePost) {
      toast({
        title: 'Quota Exceeded',
        description: 'You have reached your blog post limit for your sponsorship tier.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const slug = postForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: postForm.title,
          excerpt: postForm.excerpt || null,
          content: postForm.content || null,
          slug: `${slug}-${Date.now()}`,
          status: 'draft',
          sponsor_id: sponsorProfile.id,
          author_id: userData.user?.id,
          tags: postForm.tags ? postForm.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Blog post created as draft. An admin will review and publish it.',
      });

      setPostForm({ title: "", excerpt: "", content: "", tags: "" });
      setShowNewPostDialog(false);
      fetchPosts();
      onPostCreated?.();
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create blog post',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePost = async () => {
    if (!editingPost) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          title: postForm.title,
          excerpt: postForm.excerpt || null,
          content: postForm.content || null,
          tags: postForm.tags ? postForm.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        })
        .eq('id', editingPost.id)
        .eq('status', 'draft'); // Can only edit drafts

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Blog post updated',
      });

      setEditingPost(null);
      setPostForm({ title: "", excerpt: "", content: "", tags: "" });
      fetchPosts();
    } catch (error: any) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update blog post',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId)
        .eq('status', 'draft'); // Can only delete drafts

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Blog post deleted',
      });

      fetchPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete blog post',
        variant: 'destructive',
      });
    }
  };

  const startEditing = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content || "",
      tags: post.tags?.join(', ') || ""
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!sponsorProfile.is_approved) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your sponsorship must be approved before you can create blog posts.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Blog Posts
            </CardTitle>
            <CardDescription>
              Create and manage your sponsored content
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{postsRemaining}</span> / {sponsorProfile.blog_posts_limit} posts remaining
            </div>
            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
              <DialogTrigger asChild>
                <Button disabled={!canCreatePost} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Blog Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={postForm.title}
                      onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                      placeholder="Enter post title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Textarea
                      id="excerpt"
                      value={postForm.excerpt}
                      onChange={(e) => setPostForm({...postForm, excerpt: e.target.value})}
                      placeholder="Brief summary of your post"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={postForm.content}
                      onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                      placeholder="Write your post content here..."
                      rows={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={postForm.tags}
                      onChange={(e) => setPostForm({...postForm, tags: e.target.value})}
                      placeholder="e.g., debate, education, tournament"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowNewPostDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePost}>
                      Create Post
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Posts are created as drafts and must be approved by an admin before publication.
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No blog posts yet.</p>
            {canCreatePost && (
              <p className="text-sm mt-2">Click "New Post" to create your first sponsored article.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{post.title}</h3>
                      {getStatusBadge(post.status)}
                    </div>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {post.status === 'draft' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => startEditing(post)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Post Dialog */}
        <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Blog Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={postForm.title}
                  onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-excerpt">Excerpt</Label>
                <Textarea
                  id="edit-excerpt"
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm({...postForm, excerpt: e.target.value})}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={postForm.content}
                  onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                  rows={8}
                />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={postForm.tags}
                  onChange={(e) => setPostForm({...postForm, tags: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPost(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdatePost}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SponsorBlogManager;
