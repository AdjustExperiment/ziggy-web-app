
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SiteBlock } from '@/types/website-builder';

interface BlockEditorProps {
  pageId: string;
  blocks: SiteBlock[];
  onBlocksChange: (blocks: SiteBlock[]) => void;
}

export const BlockEditor = ({ pageId, blocks, onBlocksChange }: BlockEditorProps) => {
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [newBlockType, setNewBlockType] = useState('text');
  const [saving, setSaving] = useState(false);

  const blockTypes = [
    { value: 'text', label: 'Text Block' },
    { value: 'heading', label: 'Heading' },
    { value: 'image', label: 'Image' },
    { value: 'button', label: 'Button' },
    { value: 'hero', label: 'Hero Section' },
    { value: 'features', label: 'Features' },
    { value: 'testimonials', label: 'Testimonials' },
    { value: 'contact', label: 'Contact Form' }
  ];

  const createBlock = async () => {
    setSaving(true);
    try {
      const newPosition = Math.max(...blocks.map(b => b.position), 0) + 1;
      
      const { data, error } = await supabase
        .from('site_blocks')
        .insert([{
          page_id: pageId,
          type: newBlockType,
          content: getDefaultContent(newBlockType),
          position: newPosition,
          visible: true
        }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        onBlocksChange([...blocks, data]);
        toast.success('Block created successfully');
      }
    } catch (error) {
      console.error('Error creating block:', error);
      toast.error('Failed to create block');
    } finally {
      setSaving(false);
    }
  };

  const updateBlock = async (blockId: string, updates: Partial<SiteBlock>) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('site_blocks')
        .update(updates)
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        const updatedBlocks = blocks.map(b => b.id === blockId ? data : b);
        onBlocksChange(updatedBlocks);
        toast.success('Block updated successfully');
      }
    } catch (error) {
      console.error('Error updating block:', error);
      toast.error('Failed to update block');
    } finally {
      setSaving(false);
      setEditingBlock(null);
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('site_blocks')
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
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);
    const currentIndex = sortedBlocks.findIndex(b => b.id === blockId);
    
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === sortedBlocks.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetBlock = sortedBlocks[targetIndex];

    try {
      // Swap positions
      await Promise.all([
        supabase.from('site_blocks').update({ position: targetBlock.position }).eq('id', block.id),
        supabase.from('site_blocks').update({ position: block.position }).eq('id', targetBlock.id)
      ]);

      // Update local state
      const updatedBlocks = blocks.map(b => {
        if (b.id === block.id) return { ...b, position: targetBlock.position };
        if (b.id === targetBlock.id) return { ...b, position: block.position };
        return b;
      });
      
      onBlocksChange(updatedBlocks);
      toast.success('Block moved successfully');
    } catch (error) {
      console.error('Error moving block:', error);
      toast.error('Failed to move block');
    }
  };

  const toggleBlockVisibility = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    await updateBlock(blockId, { visible: !block.visible });
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'text':
        return { text: 'Your text content here...' };
      case 'heading':
        return { text: 'Your heading text', level: 2 };
      case 'image':
        return { src: '', alt: 'Image description', caption: '' };
      case 'button':
        return { text: 'Click me', url: '#', variant: 'primary' };
      case 'hero':
        return { title: 'Hero Title', subtitle: 'Hero subtitle', backgroundImage: '' };
      case 'features':
        return { title: 'Features', features: [] };
      case 'testimonials':
        return { title: 'Testimonials', testimonials: [] };
      case 'contact':
        return { title: 'Contact Us', fields: ['name', 'email', 'message'] };
      default:
        return {};
    }
  };

  const renderBlockEditor = (block: SiteBlock) => {
    const content = block.content as any;
    
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">Edit {block.type} Block</h4>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => updateBlock(block.id, { content })}
              disabled={saving}
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditingBlock(null)}
            >
              Cancel
            </Button>
          </div>
        </div>

        {block.type === 'text' && (
          <Textarea
            value={content.text || ''}
            onChange={(e) => {
              const updatedContent = { ...content, text: e.target.value };
              const updatedBlocks = blocks.map(b => 
                b.id === block.id ? { ...b, content: updatedContent } : b
              );
              onBlocksChange(updatedBlocks);
            }}
            placeholder="Enter your text content..."
          />
        )}

        {block.type === 'heading' && (
          <div className="space-y-2">
            <Input
              value={content.text || ''}
              onChange={(e) => {
                const updatedContent = { ...content, text: e.target.value };
                const updatedBlocks = blocks.map(b => 
                  b.id === block.id ? { ...b, content: updatedContent } : b
                );
                onBlocksChange(updatedBlocks);
              }}
              placeholder="Heading text..."
            />
            <Select
              value={content.level?.toString() || '2'}
              onValueChange={(value) => {
                const updatedContent = { ...content, level: parseInt(value) };
                const updatedBlocks = blocks.map(b => 
                  b.id === block.id ? { ...b, content: updatedContent } : b
                );
                onBlocksChange(updatedBlocks);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1</SelectItem>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
                <SelectItem value="5">H5</SelectItem>
                <SelectItem value="6">H6</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {block.type === 'button' && (
          <div className="space-y-2">
            <Input
              value={content.text || ''}
              onChange={(e) => {
                const updatedContent = { ...content, text: e.target.value };
                const updatedBlocks = blocks.map(b => 
                  b.id === block.id ? { ...b, content: updatedContent } : b
                );
                onBlocksChange(updatedBlocks);
              }}
              placeholder="Button text..."
            />
            <Input
              value={content.url || ''}
              onChange={(e) => {
                const updatedContent = { ...content, url: e.target.value };
                const updatedBlocks = blocks.map(b => 
                  b.id === block.id ? { ...b, content: updatedContent } : b
                );
                onBlocksChange(updatedBlocks);
              }}
              placeholder="Button URL..."
            />
          </div>
        )}
      </div>
    );
  };

  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Blocks</CardTitle>
        <CardDescription>
          Add and manage content blocks for your page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={newBlockType} onValueChange={setNewBlockType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {blockTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={createBlock} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            Add Block
          </Button>
        </div>

        <div className="space-y-4">
          {sortedBlocks.map((block, index) => (
            <div key={block.id}>
              {editingBlock === block.id ? (
                renderBlockEditor(block)
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{block.type}</Badge>
                    <span className="font-medium">
                      {(block.content as any)?.text || 
                       (block.content as any)?.title || 
                       `${block.type} block`}
                    </span>
                    {!block.visible && (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveBlock(block.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveBlock(block.id, 'down')}
                      disabled={index === sortedBlocks.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleBlockVisibility(block.id)}
                    >
                      {block.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingBlock(block.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteBlock(block.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {blocks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No blocks created yet. Add your first block to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
