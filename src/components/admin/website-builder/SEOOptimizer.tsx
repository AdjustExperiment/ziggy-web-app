import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Info,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type SitePage = Tables<'site_pages'>;
type SiteBlock = Tables<'site_blocks'>;

interface SEOOptimizerProps {
  page: SitePage;
  blocks: SiteBlock[];
  onUpdate: (data: Partial<SitePage>) => void;
}

interface SEOAnalysis {
  score: number;
  issues: SEOIssue[];
  suggestions: SEOSuggestion[];
  keywords: string[];
}

interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

interface SEOSuggestion {
  field: string;
  current: string;
  suggested: string;
  reason: string;
}

export const SEOOptimizer = ({ page, blocks, onUpdate }: SEOOptimizerProps) => {
  const seoData = page.seo as Record<string, any> || {};
  
  const [formData, setFormData] = useState({
    meta_title: seoData.meta_title || page.title,
    meta_description: seoData.meta_description || page.description || '',
    focus_keyword: seoData.focus_keyword || '',
    og_title: seoData.og_title || page.title,
    og_description: seoData.og_description || page.description || '',
    og_image: seoData.og_image || '',
    twitter_title: seoData.twitter_title || page.title,
    twitter_description: seoData.twitter_description || page.description || '',
    twitter_image: seoData.twitter_image || ''
  });

  const [analysis, setAnalysis] = useState<SEOAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const analyzePage = async () => {
    setAnalyzing(true);
    try {
      // Get page content for analysis
      const pageContent = extractPageContent();
      
      const { data, error } = await supabase.functions.invoke('analyze-seo', {
        body: {
          page: {
            title: page.title,
            description: page.description,
            slug: page.slug,
            seo: formData
          },
          content: pageContent,
          blocks: blocks.filter(b => b.visible)
        }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      
      // Save analysis to database
      await supabase
        .from('ai_seo_analyses')
        .insert([{
          page_id: page.id,
          model: 'gpt-4o-mini',
          analysis: data.analysis
        }]);

      toast.success('SEO analysis completed');
    } catch (error) {
      console.error('Error analyzing SEO:', error);
      toast.error('Failed to analyze SEO');
    } finally {
      setAnalyzing(false);
    }
  };

  const optimizeWithAI = async () => {
    setOptimizing(true);
    try {
      const pageContent = extractPageContent();
      
      const { data, error } = await supabase.functions.invoke('optimize-seo', {
        body: {
          page: {
            title: page.title,
            description: page.description,
            slug: page.slug,
            seo: formData
          },
          content: pageContent,
          blocks: blocks.filter(b => b.visible),
          focus_keyword: formData.focus_keyword
        }
      });

      if (error) throw error;

      setFormData(data.optimized_seo);
      setAnalysis(data.analysis);
      toast.success('SEO optimized with AI');
    } catch (error) {
      console.error('Error optimizing SEO:', error);
      toast.error('Failed to optimize SEO');
    } finally {
      setOptimizing(false);
    }
  };

  const extractPageContent = () => {
    return blocks
      .filter(block => block.visible)
      .map(block => {
        const content = block.content as Record<string, any>;
        switch (block.type) {
          case 'hero':
            return `${content.title} ${content.subtitle}`;
          case 'heading':
            return content.text;
          case 'paragraph':
            return content.text;
          case 'image':
            return content.alt;
          case 'button':
            return content.text;
          default:
            return '';
        }
      })
      .filter(text => text)
      .join(' ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ seo: formData });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const applySuggestion = (suggestion: SEOSuggestion) => {
    setFormData(prev => ({ ...prev, [suggestion.field]: suggestion.suggested }));
    toast.success('Suggestion applied');
  };

  return (
    <div className="space-y-6">
      {/* SEO Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI SEO Analysis
              </CardTitle>
              <CardDescription>
                Get AI-powered insights to improve your page's search engine optimization
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={analyzePage}
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing...' : 'Analyze SEO'}
              </Button>
              <Button
                onClick={optimizeWithAI}
                disabled={optimizing || !formData.focus_keyword}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {optimizing ? 'Optimizing...' : 'AI Optimize'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {analysis && (
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">SEO Score</span>
                  <span className="text-sm text-muted-foreground">{analysis.score}/100</span>
                </div>
                <Progress value={analysis.score} className="h-2" />
              </div>
              <Badge variant={analysis.score >= 80 ? 'default' : analysis.score >= 60 ? 'secondary' : 'destructive'}>
                {analysis.score >= 80 ? 'Good' : analysis.score >= 60 ? 'Fair' : 'Needs Work'}
              </Badge>
            </div>

            {analysis.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Issues Found</h4>
                {analysis.issues.map((issue, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 border rounded">
                    {issue.type === 'error' && <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />}
                    {issue.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                    {issue.type === 'info' && <Info className="h-4 w-4 text-blue-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm">{issue.message}</p>
                      {issue.field && (
                        <p className="text-xs text-muted-foreground">Field: {issue.field}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {analysis.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">AI Suggestions</h4>
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 border rounded space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{suggestion.field}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion(suggestion)}
                      >
                        Apply
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Current:</p>
                      <p className="text-sm bg-muted p-2 rounded">{suggestion.current}</p>
                      <p className="text-xs text-muted-foreground">Suggested:</p>
                      <p className="text-sm bg-green-50 p-2 rounded border border-green-200">{suggestion.suggested}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* SEO Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Meta Tags</CardTitle>
            <CardDescription>
              Configure meta tags for search engines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="focus-keyword">Focus Keyword</Label>
              <Input
                id="focus-keyword"
                value={formData.focus_keyword}
                onChange={(e) => handleChange('focus_keyword', e.target.value)}
                placeholder="main keyword to optimize for"
              />
              <p className="text-xs text-muted-foreground">
                The primary keyword you want this page to rank for
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-title">Meta Title</Label>
              <Input
                id="meta-title"
                value={formData.meta_title}
                onChange={(e) => handleChange('meta_title', e.target.value)}
                placeholder="Page title for search engines"
              />
              <p className="text-xs text-muted-foreground">
                {formData.meta_title.length}/60 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                value={formData.meta_description}
                onChange={(e) => handleChange('meta_description', e.target.value)}
                placeholder="Brief description for search results"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.meta_description.length}/160 characters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Graph</CardTitle>
            <CardDescription>
              Social media sharing appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="og-title">OG Title</Label>
              <Input
                id="og-title"
                value={formData.og_title}
                onChange={(e) => handleChange('og_title', e.target.value)}
                placeholder="Title for social media shares"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og-description">OG Description</Label>
              <Textarea
                id="og-description"
                value={formData.og_description}
                onChange={(e) => handleChange('og_description', e.target.value)}
                placeholder="Description for social media shares"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="og-image">OG Image URL</Label>
              <Input
                id="og-image"
                value={formData.og_image}
                onChange={(e) => handleChange('og_image', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Twitter Cards</CardTitle>
            <CardDescription>
              Twitter-specific sharing settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twitter-title">Twitter Title</Label>
              <Input
                id="twitter-title"
                value={formData.twitter_title}
                onChange={(e) => handleChange('twitter_title', e.target.value)}
                placeholder="Title for Twitter shares"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter-description">Twitter Description</Label>
              <Textarea
                id="twitter-description"
                value={formData.twitter_description}
                onChange={(e) => handleChange('twitter_description', e.target.value)}
                placeholder="Description for Twitter shares"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter-image">Twitter Image URL</Label>
              <Input
                id="twitter-image"
                value={formData.twitter_image}
                onChange={(e) => handleChange('twitter_image', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          Save SEO Settings
        </Button>
      </form>
    </div>
  );
};
