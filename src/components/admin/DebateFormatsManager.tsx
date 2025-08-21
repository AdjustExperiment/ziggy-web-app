
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
import { DebateFormat } from '@/types/database';

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
      // Use raw SQL query until types are updated
      const { data, error } = await supabase
        .from('tournaments') // Use existing table temporarily
        .select('*')
        .limit(0); // Get no results, just test connection

      if (error && !error.message.includes('relation "debate_formats" does not exist')) {
        throw error;
      }

      // For now, show predefined formats until the table is accessible
      const predefinedFormats: DebateFormat[] = [
        {
          id: '1',
          key: 'lincoln_douglas',
          name: 'Lincoln-Douglas',
          description: 'One-on-one value debate format',
          rules: {
            speeches: ['AC', 'NC', '1AR', '1NR', '2AR'],
            timings: { 'AC': 6, 'NC': 7, '1AR': 4, '1NR': 6, '2AR': 3 }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          key: 'team_policy',
          name: 'Team Policy',
          description: 'Team-based policy debate format',
          rules: {
            speeches: ['1AC', '1NC', '2AC', '2NC', '1AR', '1NR', '2AR', '2NR'],
            timings: { '1AC': 8, '1NC': 8, '2AC': 8, '2NC': 8, '1AR': 5, '1NR': 5, '2AR': 5, '2NR': 5 }
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setFormats(predefinedFormats);
    } catch (error: any) {
      console.error('Error fetching formats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch debate formats. Using default formats.",
        variant: "destructive",
      });
      
      // Set empty array on error
      setFormats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Info",
      description: "Debate format management will be available once the database migration is complete.",
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
