
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
import { Plus, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { DebateFormat } from '@/types/database';

export function DebateFormatsManager() {
  const [formats, setFormats] = useState<DebateFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<DebateFormat | null>(null);
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
      // Since debate_formats table doesn't exist yet, show empty state
      console.log('Debate formats table not available yet');
      setFormats([]);
    } catch (error: any) {
      console.error('Error fetching debate formats:', error);
      toast({
        title: "Info",
        description: "Debate format management will be available after database migration",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Info",
      description: "Debate format management will be available after database migration",
      variant: "default",
    });
  };

  const deleteFormat = async (formatId: string) => {
    toast({
      title: "Info",
      description: "Debate format management will be available after database migration",
      variant: "default",
    });
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
            Manage available debate formats and their rules
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Format
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingFormat ? 'Edit Debate Format' : 'Add New Debate Format'}
              </DialogTitle>
              <DialogDescription>
                Define a new debate format with its rules and structure
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
                    placeholder="e.g., british-parliamentary"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Format Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., British Parliamentary"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the debate format"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="rules">Rules (JSON)</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData(prev => ({ ...prev, rules: e.target.value }))}
                  placeholder='{"rounds": 3, "speakers": 4, "time_limit": 7}'
                  rows={6}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFormat ? 'Update' : 'Add'} Format
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Debate Formats Coming Soon</h3>
          <p className="text-muted-foreground">
            Debate format management features will be available after the database migration is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
