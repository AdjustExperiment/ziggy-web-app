
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SitePage, SiteBlock } from '@/types/website-builder';

interface PreviewRendererProps {
  page: SitePage;
  blocks: SiteBlock[];
}

export const PreviewRenderer = ({ page, blocks }: PreviewRendererProps) => {
  const renderBlock = (block: SiteBlock) => {
    if (!block.visible) return null;

    const content = block.content || {};

      switch (block.type) {
        case 'heading': {
          const HeadingTag = `h${content.level || 1}` as keyof JSX.IntrinsicElements;
          return (
            <HeadingTag
              key={block.id}
              className={`font-bold ${
                content.level === 1 ? 'text-4xl' :
                content.level === 2 ? 'text-3xl' :
                content.level === 3 ? 'text-2xl' :
                content.level === 4 ? 'text-xl' :
                content.level === 5 ? 'text-lg' : 'text-base'
              }`}
            >
              {content.text || 'Heading'}
            </HeadingTag>
          );
        }

      case 'text':
        return (
          <div key={block.id} className="prose max-w-none">
            {content.text || 'Text content'}
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className="space-y-2">
            {content.src ? (
              <img 
                src={content.src} 
                alt={content.alt || ''} 
                className="max-w-full h-auto rounded-lg"
              />
            ) : (
              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Image placeholder</span>
              </div>
            )}
            {content.caption && (
              <p className="text-sm text-muted-foreground text-center">
                {content.caption}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div key={block.id} className="space-y-2">
            {content.src ? (
              <video 
                controls 
                className="w-full rounded-lg"
                title={content.title}
              >
                <source src={content.src} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Video placeholder</span>
              </div>
            )}
          </div>
        );

      case 'layout':
        return (
          <div 
            key={block.id}
            className={`grid gap-4 ${
              content.columns === 2 ? 'grid-cols-2' :
              content.columns === 3 ? 'grid-cols-3' :
              content.columns === 4 ? 'grid-cols-4' : 'grid-cols-1'
            }`}
          >
            {Array.from({ length: content.columns || 1 }).map((_, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <span className="text-muted-foreground">Column {index + 1}</span>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <div key={block.id} className="p-4 border border-dashed rounded-lg">
            <span className="text-muted-foreground">
              Unknown block type: {block.type}
            </span>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview: {page.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-background border rounded-lg p-6 min-h-[400px]">
          <style>{page.custom_css || ''}</style>
          <div className="space-y-6">
            {blocks
              .sort((a, b) => a.position - b.position)
              .map(renderBlock)}
            
            {blocks.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                No content blocks to display. Add some blocks in the editor to see them here.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
