import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Clock, User, Share2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface BlogPost {
  id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  created_at: string;
  author_id: string;
  slug: string;
}

export default function BlogPostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState<string>('Unknown Author');

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      // Try to find by ID or slug
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .eq('status', 'published')
        .single();

      if (error) throw error;

      setPost(data);

      // Fetch author name
      if (data?.author_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', data.author_id)
          .single();
        
        if (profile) {
          setAuthorName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown Author');
        }
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || '',
          url,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'The article link has been copied to your clipboard.',
      });
    }
  };

  const estimateReadTime = (content: string | null) => {
    if (!content) return '2 min read';
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/blog')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/blog')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="border-red-500/50 text-red-400"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-primary font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{authorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>{new Date(post.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{estimateReadTime(post.content)}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare}
              className="text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {post.cover_image_url && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="rounded-xl overflow-hidden">
            <img 
              src={post.cover_image_url} 
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="bg-card/50 border-primary/20 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            {post.excerpt && !post.content && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {post.excerpt}
              </p>
            )}
            {post.content && (
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-primary prose-p:text-muted-foreground prose-a:text-red-500"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            )}
            {!post.content && !post.excerpt && (
              <p className="text-muted-foreground text-center py-8">
                This article has no content yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Button 
            onClick={() => navigate('/blog')}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Articles
          </Button>
        </div>
      </div>
    </div>
  );
}