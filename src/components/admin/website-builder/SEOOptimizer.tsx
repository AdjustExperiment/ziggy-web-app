
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Search, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SitePage, SiteBlock } from '@/types/website-builder';

interface SEOOptimizerProps {
  page: SitePage;
  blocks: SiteBlock[];
  onUpdate: (data: Partial<SitePage>) => Promise<void>;
}

export const SEOOptimizer = ({ page, blocks, onUpdate }: SEOOptimizerProps) => {
  const [seoData, setSeoData] = useState({
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.description || '',
    keywords: page.seo?.keywords || '',
    ogTitle: page.seo?.ogTitle || '',
    ogDescription: page.seo?.ogDescription || '',
    ogImage: page.seo?.ogImage || ''
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const runSEOAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-seo', {
        body: {
          page,
          blocks,
          seo: seoData
        }
      });

      if (error) throw error;
      setAnalysis(data.analysis);
      toast.success('SEO analysis completed');
    } catch (error) {
      console.error('Error running SEO analysis:', error);
      toast.error('Failed to run SEO analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const optimizeSEO = async () => {
    setOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-seo', {
        body: {
          page,
          blocks,
          currentSeo: seoData
        }
      });

      if (error) throw error;
      
      setSeoData(data.optimizedSeo);
      toast.success('SEO optimization completed');
    } catch (error) {
      console.error('Error optimizing SEO:', error);
      toast.error('Failed to optimize SEO');
    } finally {
      setOptimizing(false);
    }
  };

  const saveSEO = async () => {
    const updatedSeo = {
      ...page.seo,
      ...seoData,
      lastOptimized: new Date().toISOString()
    };

    await onUpdate({ seo: updatedSeo });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>SEO Optimization</CardTitle>
              <CardDescription>
                Optimize your page for search engines with AI assistance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={runSEOAnalysis}
                disabled={analyzing}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {analyzing ? 'Analyzing...' : 'Analyze SEO'}
              </Button>
              <Button 
                onClick={optimizeSEO}
                disabled={optimizing}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {optimizing ? 'Optimizing...' : 'AI Optimize'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis && (
            <div className="mb-6 p-4 border rounded-lg">
              <h3 className="font-medium mb-2">SEO Analysis Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                    {analysis.overallScore}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.titleScore)}`}>
                    {analysis.titleScore}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Title</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.descriptionScore)}`}>
                    {analysis.descriptionScore}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Description</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.keywordScore)}`}>
                    {analysis.keywordScore}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Keywords</div>
                </div>
              </div>
              
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Suggestions</h4>
                  <ul className="space-y-1">
                    {analysis.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-yellow-500">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seo-title">SEO Title</Label>
              <Input
                id="seo-title"
                value={seoData.title}
                onChange={(e) => setSeoData({ ...seoData, title: e.target.value })}
                placeholder="Page title for search engines"
              />
              <div className="text-xs text-muted-foreground">
                {seoData.title.length}/60 characters (optimal: 50-60)
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={seoData.keywords}
                onChange={(e) => setSeoData({ ...seoData, keywords: e.target.value })}
                placeholder="keyword1, keyword2, keyword3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo-description">Meta Description</Label>
            <Textarea
              id="seo-description"
              value={seoData.description}
              onChange={(e) => setSeoData({ ...seoData, description: e.target.value })}
              placeholder="Brief description for search results"
              rows={3}
            />
            <div className="text-xs text-muted-foreground">
              {seoData.description.length}/160 characters (optimal: 150-160)
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-4">Open Graph (Social Media)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="og-title">OG Title</Label>
                <Input
                  id="og-title"
                  value={seoData.ogTitle}
                  onChange={(e) => setSeoData({ ...seoData, ogTitle: e.target.value })}
                  placeholder="Title for social media sharing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image">OG Image URL</Label>
                <Input
                  id="og-image"
                  value={seoData.ogImage}
                  onChange={(e) => setSeoData({ ...seoData, ogImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="og-description">OG Description</Label>
              <Textarea
                id="og-description"
                value={seoData.ogDescription}
                onChange={(e) => setSeoData({ ...seoData, ogDescription: e.target.value })}
                placeholder="Description for social media sharing"
                rows={2}
              />
            </div>
          </div>

          <Button onClick={saveSEO} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save SEO Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
