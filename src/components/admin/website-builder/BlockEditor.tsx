
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Type, 
  Image, 
  Layout,
  Video,
  Code
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SiteBlock {
  id: string;
  page_id: string;
  parent_block_id: string | null;
  type: string;
  content: Record<string, any>;
  position: number;
  visible: boolean;
}

interface BlockEditorProps {
  pageId: string;
  blocks: SiteBlock[];
  onBlocksChange: (blocks: SiteBlock[]) => void;
}

const blockTypes = [
  { value: 'hero', label: 'Hero Section', icon: Layout },
  { value: 'heading', label: 'Heading', icon: Type },
  { value: 'paragraph', label: 'Paragraph', icon: Type },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'button', label: 'Button', icon: Layout },
  { value: 'html', label: 'Custom HTML', icon: Code },
];

export const BlockEditor = ({ pageId, blocks, onBlocksChange }: BlockEditorProps) => {
  const [selectedBlock, setSelectedBlock] = useState<SiteBlock | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);

  const addBlock = async (type: string) => {
    try {
      const defaultContent = getDefaultContent(type);
      const maxPosition = Math.max(...blocks.map(b => b.position), -1);

      const { data, error } = await supabase
        .from('site_blocks')
        .insert([{
          page_id: pageId,
          type,
          content: defaultContent,
          position: maxPosition + 1,
          visible: true
        }])
        .select()
        .single();

      if (error) throw error;

      const updatedBlocks = [...blocks, data].sort((a, b) => a.position - b.position);
      onBlocksChange(updatedBlocks);
      setSelectedBlock(data);
      setShowAddBlock(false);
      toast.success('Block added successfully');
    } catch (error) {
      console.error('Error adding block:', error);
      toast.error('Failed to add block');
    }
  };

  const updateBlock = async (blockId: string, updates: Partial<SiteBlock>) => {
    try {
      const { data, error } = await supabase
        .from('site_blocks')
        .update(updates)
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;

      const updatedBlocks = blocks.map(b => b.id === blockId ? data : b);
      onBlocksChange(updatedBlocks);
      setSelectedBlock(data);
      toast.success('Block updated successfully');
    } catch (error) {
      console.error('Error updating block:', error);
      toast.error('Failed to update block');
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
      setSelectedBlock(null);
      toast.success('Block deleted successfully');
    } catch (error) {
      console.error('Error deleting block:', error);
      toast.error('Failed to delete block');
    }
  };

  const moveBlock = async (blockId: string, direction: 'up' | 'down') => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    try {
      // Swap positions
      const block = blocks[blockIndex];
      const targetBlock = blocks[targetIndex];

      await Promise.all([
        supabase
          .from('site_blocks')
          .update({ position: targetBlock.position })
          .eq('id', block.id),
        supabase
          .from('site_blocks')
          .update({ position: block.position })
          .eq('id', targetBlock.id)
      ]);

      const updatedBlocks = [...blocks];
      updatedBlocks[blockIndex] = { ...block, position: targetBlock.position };
      updatedBlocks[targetIndex] = { ...targetBlock, position: block.position };
      updatedBlocks.sort((a, b) => a.position - b.position);

      onBlocksChange(updatedBlocks);
      toast.success('Block moved successfully');
    } catch (error) {
      console.error('Error moving block:', error);
      toast.error('Failed to move block');
    }
  };

  const getDefaultContent = (type: string): Record<string, any> => {
    switch (type) {
      case 'hero':
        return {
          title: 'Hero Title',
          subtitle: 'Hero subtitle',
          backgroundImage: '',
          ctaText: 'Call to Action',
          ctaUrl: ''
        };
      case 'heading':
        return {
          text: 'Heading Text',
          level: 'h2',
          alignment: 'left'
        };
      case 'paragraph':
        return {
          text: 'Paragraph text content goes here.',
          alignment: 'left'
        };
      case 'image':
        return {
          src: '',
          alt: 'Image description',
          caption: '',
          alignment: 'center'
        };
      case 'video':
        return {
          src: '',
          poster: '',
          caption: ''
        };
      case 'button':
        return {
          text: 'Button Text',
          url: '',
          variant: 'primary',
          alignment: 'left'
        };
      case 'html':
        return {
          html: '<div>Custom HTML content</div>'
        };
      default:
        return {};
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Page Blocks</CardTitle>
              <CardDescription>
                Manage content blocks for this page
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddBlock(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Block
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedBlock?.id === block.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedBlock(block)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{block.type}</Badge>
                  <span className="font-medium">
                    {getBlockTitle(block)}
                  </span>
                  {!block.visible && (
                    <Badge variant="secondary">Hidden</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveBlock(block.id, 'up');
                    }}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveBlock(block.id, 'down');
                    }}
                    disabled={index === blocks.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBlock(block.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {blocks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No blocks added yet. Click "Add Block" to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Editor Panel */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedBlock ? `Edit ${selectedBlock.type} Block` : 'Block Editor'}
          </CardTitle>
          <CardDescription>
            {selectedBlock ? 'Configure block content and settings' : 'Select a block to edit'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedBlock ? (
            <BlockForm 
              block={selectedBlock} 
              onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
            />
          ) : showAddBlock ? (
            <div className="space-y-4">
              <Label>Select Block Type</Label>
              <div className="grid gap-2">
                {blockTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant="outline"
                      className="justify-start"
                      onClick={() => addBlock(type.value)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
              <Button variant="ghost" onClick={() => setShowAddBlock(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a block from the left to edit its content
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const BlockForm = ({ block, onUpdate }: { block: SiteBlock; onUpdate: (updates: Partial<SiteBlock>) => void }) => {
  const [content, setContent] = useState(block.content);
  const [visible, setVisible] = useState(block.visible);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ content, visible });
  };

  const updateContent = (field: string, value: any) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  const renderFields = () => {
    switch (block.type) {
      case 'hero':
        return (
          <>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={content.subtitle || ''}
                onChange={(e) => updateContent('subtitle', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Background Image URL</Label>
              <Input
                value={content.backgroundImage || ''}
                onChange={(e) => updateContent('backgroundImage', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>CTA Text</Label>
              <Input
                value={content.ctaText || ''}
                onChange={(e) => updateContent('ctaText', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>CTA URL</Label>
              <Input
                value={content.ctaUrl || ''}
                onChange={(e) => updateContent('ctaUrl', e.target.value)}
              />
            </div>
          </>
        );

      case 'heading':
        return (
          <>
            <div className="space-y-2">
              <Label>Text</Label>
              <Input
                value={content.text || ''}
                onChange={(e) => updateContent('text', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={content.level} onValueChange={(value) => updateContent('level', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1</SelectItem>
                  <SelectItem value="h2">H2</SelectItem>
                  <SelectItem value="h3">H3</SelectItem>
                  <SelectItem value="h4">H4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'paragraph':
        return (
          <div className="space-y-2">
            <Label>Text</Label>
            <Textarea
              value={content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              rows={4}
            />
          </div>
        );

      case 'image':
        return (
          <>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={content.src || ''}
                onChange={(e) => updateContent('src', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input
                value={content.alt || ''}
                onChange={(e) => updateContent('alt', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input
                value={content.caption || ''}
                onChange={(e) => updateContent('caption', e.target.value)}
              />
            </div>
          </>
        );

      case 'button':
        return (
          <>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input
                value={content.text || ''}
                onChange={(e) => updateContent('text', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={content.url || ''}
                onChange={(e) => updateContent('url', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Variant</Label>
              <Select value={content.variant} onValueChange={(value) => updateContent('variant', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'html':
        return (
          <div className="space-y-2">
            <Label>HTML Content</Label>
            <Textarea
              value={content.html || ''}
              onChange={(e) => updateContent('html', e.target.value)}
              rows={6}
              className="font-mono"
            />
          </div>
        );

      default:
        return <div>No editor available for this block type</div>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderFields()}
      
      <div className="flex items-center justify-between">
        <Label>Visible</Label>
        <Switch
          checked={visible}
          onCheckedChange={setVisible}
        />
      </div>

      <Button type="submit" className="w-full">
        Update Block
      </Button>
    </form>
  );
};

const getBlockTitle = (block: SiteBlock): string => {
  switch (block.type) {
    case 'hero':
      return block.content.title || 'Hero Section';
    case 'heading':
      return block.content.text || 'Heading';
    case 'paragraph':
      return block.content.text?.substring(0, 30) + '...' || 'Paragraph';
    case 'image':
      return block.content.alt || 'Image';
    case 'button':
      return block.content.text || 'Button';
    default:
      return `${block.type} Block`;
  }
};
