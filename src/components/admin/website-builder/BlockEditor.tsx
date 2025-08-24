
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit, 
  ArrowUp,
  ArrowDown,
  Type,
  Image,
  Video,
  Layout
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SiteBlock } from '@/types/website-builder';

interface BlockEditorProps {
  pageId: string;
  blocks: SiteBlock[];
  onBlocksChange: (blocks: SiteBlock[]) => void;
}

const BLOCK_TYPES = [
  { key: 'heading', label: 'Heading', icon: Type },
  { key: 'text', label: 'Text', icon: Type },
  { key: 'image', label: 'Image', icon: Image },
  { key: 'video', label: 'Video', icon: Video },
  { key: 'layout', label: 'Layout', icon: Layout }
];

export const BlockEditor = ({ pageId, blocks, onBlocksChange }: BlockEditorProps) => {
  const [editingBlock, setEditingBlock] = useState<SiteBlock | null>(null);

  const addBlock = async (type: string) => {
    try {
      const { data, error } = await supabase
        .from('site_blocks' as any)
        .insert([{
          page_id: pageId,
          type,
          content: getDefaultContent(type),
          position: blocks.length,
          visible: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      const newBlock = data as SiteBlock;
      onBlocksChange([...blocks, newBlock]);
      toast.success('Block added successfully');
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Failed to add block');
    }
  };

  const updateBlock = async (blockId: string, updates: Partial<SiteBlock>) => {
    try {
      const { data, error } = await supabase
        .from('site_blocks' as any)
        .update(updates)
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;
      
      const updatedBlock = data as SiteBlock;
      const updatedBlocks = blocks.map(b => b.id === blockId ? updatedBlock : b);
      onBlocksChange(updatedBlocks);
      toast.success('Block updated successfully');
    } catch (error) {
      console.error('Error updating block:', error);
      toast.error('Failed to update block');
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('site_blocks' as any)
        .delete()
        .eq('id', blockId);

      if (error) throw error;
      
      const updatedBlocks = blocks.filter(b => b.id !== blockId);
      onBlocksChange(updatedBlocks);
      toast.success('Block deleted successfully');
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Failed to delete block');
    }
  };

  const moveBlock = async (blockId: string, direction: 'up' | 'down') => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const newBlocks = [...blocks];
    [newBlocks[blockIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[blockIndex]];

    // Update positions in database
    try {
      const updates = newBlocks.map((block, index) => ({ id: block.id, position: index }));
      
      for (const update of updates) {
        await supabase
          .from('site_blocks' as any)
          .update({ position: update.position })
          .eq('id', update.id);
      }

      onBlocksChange(newBlocks.map((block, index) => ({ ...block, position: index })));
      toast.success('Block moved successfully');
    } catch (error) {
      console.error('Error moving block:', error);
      toast.error('Failed to move block');
    }
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'heading':
        return { text: 'New Heading', level: 1 };
      case 'text':
        return { text: 'Enter your text here...' };
      case 'image':
        return { src: '', alt: '', caption: '' };
      case 'video':
        return { src: '', title: '' };
      case 'layout':
        return { columns: 2, children: [] };
      default:
        return {};
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Content Blocks</CardTitle>
            <CardDescription>
              Build your page with drag-and-drop blocks
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {BLOCK_TYPES.map((blockType) => {
              const Icon = blockType.icon;
              return (
                <Button
                  key={blockType.key}
                  variant="outline"
                  size="sm"
                  onClick={() => addBlock(blockType.key)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {blockType.label}
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {blocks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No content blocks yet. Add a block to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, index) => (
              <div key={block.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{block.type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      Position: {block.position + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(block.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBlock(block.id, 'down')}
                      disabled={index === blocks.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingBlock(block)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBlock(block.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-sm">
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(block.content, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
