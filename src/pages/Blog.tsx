import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, User, ArrowRight, TrendingUp, MessageSquare, Share2, Loader2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  slug: string;
  created_at: string;
  author_id: string;
  featured: boolean;
  sponsor_id: string | null;
  sponsor_profiles?: {
    id: string;
    name: string;
    logo_url: string | null;
    website: string | null;
  } | null;
}

export default function Blog() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          sponsor_profiles:sponsor_id(id, name, logo_url, website)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (post: BlogPost) => {
    const url = `${window.location.origin}/blog/${post.slug || post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || '',
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'The article link has been copied to your clipboard.',
      });
    }
  };

  const handleSubscribe = () => {
    toast({
      title: 'Thanks for subscribing!',
      description: 'You\'ll receive updates on new articles and debate insights.',
    });
  };

  // Get unique categories from tags
  const allTags = posts.flatMap(p => p.tags || []);
  const uniqueCategories = ['All', ...Array.from(new Set(allTags))].slice(0, 6);

  // Filter posts by category
  const filteredPosts = selectedCategory === 'All' 
    ? posts 
    : posts.filter(p => p.tags?.includes(selectedCategory));

  const featuredPost = filteredPosts.find(p => p.featured);
  const otherPosts = filteredPosts.filter(p => !p.featured);

  const estimateReadTime = (content: string | null, excerpt: string | null) => {
    const text = content || excerpt || '';
    const words = text.split(/\s+/).length;
    const minutes = Math.max(2, Math.ceil(words / 200));
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      {/* Futuristic Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent"></div>
          <div className="absolute top-20 left-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-red-400/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-primary font-bold text-foreground mb-6">
              Future<span className="text-red-500">Blog</span>
            </h1>
            <p className="text-xl md:text-2xl font-secondary text-muted-foreground mb-8 max-w-3xl mx-auto">
              Exploring the cutting-edge intersection of technology, artificial intelligence, 
              and the future of competitive debate through advanced research and innovation.
            </p>
            {uniqueCategories.length > 1 && (
              <div className="flex flex-wrap justify-center gap-3">
                {uniqueCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`${
                      selectedCategory === category 
                        ? "bg-red-500 hover:bg-red-600 text-white" 
                        : "border-red-500/50 text-foreground hover:bg-red-500 hover:text-white"
                    } font-secondary`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">No Articles Yet</h2>
          <p className="text-muted-foreground mb-8">
            We're working on creating insightful content. Check back soon!
          </p>
        </div>
      )}

      {/* Featured Post */}
      {featuredPost && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="relative">
            <Card className="bg-card/50 border-primary/30 overflow-hidden backdrop-blur-sm">
              <div className="md:flex">
                <div className="md:w-1/2 relative">
                  <div className="h-64 md:h-full bg-gradient-to-br from-red-600/10 to-muted/50 flex items-center justify-center">
                    {featuredPost.cover_image_url ? (
                      <img 
                        src={featuredPost.cover_image_url} 
                        alt={featuredPost.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <TrendingUp className="h-16 w-16 text-red-500" />
                    )}
                  </div>
                  <Badge className="absolute top-4 left-4 bg-red-500 hover:bg-red-600 text-white font-secondary">
                    Featured
                  </Badge>
                  {featuredPost.sponsor_profiles && (
                    <Badge className="absolute top-4 right-4 bg-purple-500/80 text-white font-secondary flex items-center gap-1">
                      {featuredPost.sponsor_profiles.logo_url && (
                        <img src={featuredPost.sponsor_profiles.logo_url} alt="" className="h-3 w-3 rounded-full" />
                      )}
                      Sponsored
                    </Badge>
                  )}
                </div>
                <div className="md:w-1/2 p-8">
                  <CardHeader className="p-0 mb-4">
                    {featuredPost.tags && featuredPost.tags[0] && (
                      <Badge variant="outline" className="border-red-500/50 text-red-400 w-fit mb-2 font-secondary">
                        {featuredPost.tags[0]}
                      </Badge>
                    )}
                    <CardTitle className="text-3xl font-primary text-card-foreground mb-4 leading-tight">
                      {featuredPost.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-lg font-secondary leading-relaxed">
                      {featuredPost.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 mb-6">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground font-secondary">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(featuredPost.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {estimateReadTime(featuredPost.content, featuredPost.excerpt)}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-0">
                    <Button 
                      className="bg-red-500 hover:bg-red-600 text-white font-secondary"
                      onClick={() => navigate(`/blog/${featuredPost.slug || featuredPost.id}`)}
                    >
                      Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Blog Grid */}
      {otherPosts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherPosts.map((post) => (
              <Card key={post.id} className="bg-card/30 border-primary/20 hover:border-primary/40 transition-all duration-300 backdrop-blur-sm group">
                <div className="h-48 bg-gradient-to-br from-red-600/10 to-muted/30 flex items-center justify-center relative overflow-hidden">
                  {post.cover_image_url ? (
                    <img 
                      src={post.cover_image_url} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <MessageSquare className="h-12 w-12 text-red-400 group-hover:text-red-300 transition-colors" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent group-hover:from-background/70 transition-all duration-300"></div>
                  {post.sponsor_profiles && (
                    <Badge className="absolute top-3 left-3 bg-purple-500/80 text-white font-secondary text-xs flex items-center gap-1">
                      {post.sponsor_profiles.logo_url && (
                        <img src={post.sponsor_profiles.logo_url} alt="" className="h-3 w-3 rounded-full" />
                      )}
                      Sponsored
                    </Badge>
                  )}
                  {post.tags && post.tags[0] && (
                    <Badge className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 text-white font-secondary text-xs">
                      {post.tags[0]}
                    </Badge>
                  )}
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl font-primary text-card-foreground group-hover:text-primary transition-colors leading-tight">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-secondary line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="border-red-500/30 text-red-400 text-xs font-secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground font-secondary">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3 w-3" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {estimateReadTime(post.content, post.excerpt)}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="ghost" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-secondary p-2"
                    onClick={() => handleShare(post)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    className="bg-red-500/10 hover:bg-red-500 text-foreground hover:text-white border-red-500/30 font-secondary"
                    onClick={() => navigate(`/blog/${post.slug || post.id}`)}
                  >
                    Read More <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-transparent"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl font-primary font-bold text-foreground mb-4">
            Stay Connected to the Future
          </h2>
          <p className="text-xl font-secondary text-muted-foreground mb-8">
            Subscribe to receive cutting-edge insights on the evolution of debate technology and AI-powered competition analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email..."
              className="flex-1 px-4 py-3 bg-background/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground font-secondary focus:outline-none focus:border-primary"
            />
            <Button 
              className="bg-red-500 hover:bg-red-600 text-white font-secondary"
              onClick={handleSubscribe}
            >
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}