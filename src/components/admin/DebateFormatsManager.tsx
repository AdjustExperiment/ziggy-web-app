
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit2, FileText } from 'lucide-react';

interface DebateFormat {
  id: string;
  key: string;
  name: string;
  description: string;
  rules: any;
  created_at: string;
  updated_at: string;
}

export function DebateFormatsManager() {
  const [formats, setFormats] = useState<DebateFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFormat, setEditingFormat] = useState<DebateFormat | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    rules: ''
  });

  useEffect(() => {
    fetchFormats();
  }, []);

  const fetchFormats = async () => {
    try {
      const { data, error } = await supabase
        .from('debate_formats')
        .select('*')
        .order('name');

      if (error) throw error;
      setFormats(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch debate formats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let rules = {};
      if (formData.rules.trim()) {
        try {
          rules = JSON.parse(formData.rules);
        } catch {
          toast({
            title: "Error",
            description: "Rules must be valid JSON",
            variant: "destructive",
          });
          return;
        }
      }

      const formatData = {
        key: formData.key,
        name: formData.name,
        description: formData.description,
        rules
      };

      let error;
      if (editingFormat) {
        ({ error } = await supabase
          .from('debate_formats')
          .update(formatData)
          .eq('id', editingFormat.id));
      } else {
        ({ error } = await supabase
          .from('debate_formats')
          .insert([formatData]));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Format ${editingFormat ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchFormats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ key: '', name: '', description: '', rules: '' });
    setEditingFormat(null);
  };

  const openEditDialog = (format: DebateFormat) => {
    setEditingFormat(format);
    setFormData({
      key: format.key,
      name: format.name,
      description: format.description || '',
      rules: JSON.stringify(format.rules, null, 2)
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Debate Formats</h3>
          <p className="text-sm text-muted-foreground">
            Manage available debate formats for tournaments
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Format
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFormat ? 'Edit Format' : 'Create New Format'}
              </DialogTitle>
              <DialogDescription>
                Define a debate format with rules and timing information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="key">Format Key</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                    placeholder="e.g., lincoln_douglas"
                    required
                    disabled={!!editingFormat}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Lincoln-Douglas"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the format"
                />
              </div>
              <div>
                <Label htmlFor="rules">Rules (JSON)</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                  placeholder='{"speeches": ["AC", "NC"], "timings": {"AC": 6, "NC": 7}}'
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFormat ? 'Update' : 'Create'} Format
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {formats.map((format) => (
          <Card key={format.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {format.name}
                  </CardTitle>
                  <CardDescription>{format.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{format.key}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(format)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {format.rules && Object.keys(format.rules).length > 0 && (
              <CardContent>
                <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(format.rules, null, 2)}
                </pre>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
