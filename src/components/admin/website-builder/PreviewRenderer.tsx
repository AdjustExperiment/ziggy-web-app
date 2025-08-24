
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/integrations/supabase/types';

type SitePage = Tables<'site_pages'>;
type SiteBlock = Tables<'site_blocks'>;

interface PreviewRendererProps {
  page: SitePage;
  blocks: SiteBlock[];
}

export const PreviewRenderer = ({ page, blocks }: PreviewRendererProps) => {
  const visibleBlocks = blocks.filter(block => block.visible);

  const renderBlock = (block: SiteBlock) => {
    const content = block.content as Record<string, any>;
    
    switch (block.type) {
      case 'hero':
        return (
          <div 
            key={block.id} 
            className="relative min-h-[400px] flex items-center justify-center bg-gradient-to-br from-primary to-primary-foreground text-white"
            style={{
              backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-bold">
                {content.title}
              </h1>
              {content.subtitle && (
                <p className="text-lg md:text-xl opacity-90">
                  {content.subtitle}
                </p>
              )}
              {content.ctaText && (
                <Button 
                  size="lg"
                  variant={content.backgroundImage ? 'secondary' : 'outline'}
                  asChild
                >
                  <a href={content.ctaUrl || '#'}>
                    {content.ctaText}
                  </a>
                </Button>
              )}
            </div>
          </div>
        );

      case 'heading':
        const HeadingTag = content.level || 'h2';
        return (
          <div key={block.id} className="py-4">
            <HeadingTag 
              className={`font-bold ${
                HeadingTag === 'h1' ? 'text-4xl' :
                HeadingTag === 'h2' ? 'text-3xl' :
                HeadingTag === 'h3' ? 'text-2xl' : 'text-xl'
              } ${
                content.alignment === 'center' ? 'text-center' :
                content.alignment === 'right' ? 'text-right' : 'text-left'
              }`}
            >
              {content.text}
            </HeadingTag>
          </div>
        );

      case 'paragraph':
        return (
          <div key={block.id} className="py-2">
            <p className={`leading-relaxed ${
              content.alignment === 'center' ? 'text-center' :
              content.alignment === 'right' ? 'text-right' : 'text-left'
            }`}>
              {content.text}
            </p>
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className={`py-4 ${
            content.alignment === 'center' ? 'text-center' :
            content.alignment === 'right' ? 'text-right' : 'text-left'
          }`}>
            {content.src && (
              <img
                src={content.src}
                alt={content.alt || ''}
                className="max-w-full h-auto rounded-lg"
              />
            )}
            {content.caption && (
              <p className="text-sm text-muted-foreground mt-2">
                {content.caption}
              </p>
            )}
          </div>
        );

      case 'button':
        return (
          <div key={block.id} className={`py-4 ${
            content.alignment === 'center' ? 'text-center' :
            content.alignment === 'right' ? 'text-right' : 'text-left'
          }`}>
            <Button
              variant={content.variant === 'primary' ? 'default' : 
                      content.variant === 'secondary' ? 'secondary' : 'outline'}
              asChild
            >
              <a href={content.url || '#'}>
                {content.text}
              </a>
            </Button>
          </div>
        );

      case 'html':
        return (
          <div 
            key={block.id} 
            className="py-4"
            dangerouslySetInnerHTML={{ __html: content.html || '' }}
          />
        );

      default:
        return (
          <div key={block.id} className="py-4 p-4 border border-dashed border-muted-foreground/30 rounded">
            <p className="text-muted-foreground">
              Unknown block type: {block.type}
            </p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="bg-background min-h-screen">
          {/* Page Header */}
          <div className="border-b bg-muted/50 p-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold">{page.title}</h1>
              <p className="text-muted-foreground">Preview: {page.slug}</p>
            </div>
          </div>

          {/* Page Content */}
          <div className="max-w-4xl mx-auto">
            {visibleBlocks.length > 0 ? (
              visibleBlocks.map(renderBlock)
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No visible content blocks. Add some blocks in the editor to see them here.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
