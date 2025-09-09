
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { DebateFormat } from '@/types/database';
import { FORMAT_TEMPLATES } from '@/lib/formats/templates';

export function DebateFormatsManager() {
  const [formats, setFormats] = useState<DebateFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFormat, setEditingFormat] = useState<DebateFormat | null>(null);
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    rules: '',
    timing_rules: '',
    judging_criteria: ''
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
      console.error('Error fetching debate formats:', error);
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
      let rules, timingRules, judgingCriteria;
      try {
        rules = formData.rules ? JSON.parse(formData.rules) : {};
      } catch {
        throw new Error('Invalid JSON in rules field');
      }
      try {
        timingRules = formData.timing_rules ? JSON.parse(formData.timing_rules) : {};
      } catch {
        throw new Error('Invalid JSON in timing rules field');
      }
      try {
        judgingCriteria = formData.judging_criteria ? JSON.parse(formData.judging_criteria) : {};
      } catch {
        throw new Error('Invalid JSON in judging criteria field');
      }

      const formatData = {
        key: formData.key,
        name: formData.name,
        description: formData.description || null,
        rules,
        timing_rules: timingRules,
        judging_criteria: judgingCriteria
      };

      if (editingFormat) {
        const { error } = await supabase
          .from('debate_formats')
          .update(formatData)
          .eq('id', editingFormat.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Debate format updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('debate_formats')
          .insert([formatData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Debate format created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchFormats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save debate format",
        variant: "destructive",
      });
    }
  };

  const deleteFormat = async (formatId: string) => {
    if (!confirm('Are you sure you want to delete this debate format?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('debate_formats')
        .delete()
        .eq('id', formatId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Debate format deleted successfully",
      });

      fetchFormats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete debate format",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ key: '', name: '', description: '', rules: '', timing_rules: '', judging_criteria: '' });
    setEditingFormat(null);
  };

  const openEditDialog = (format: DebateFormat) => {
    setEditingFormat(format);
    setFormData({
      key: format.key,
      name: format.name,
      description: format.description || '',
      rules: JSON.stringify(format.rules, null, 2),
      timing_rules: JSON.stringify(format.timing_rules || {}, null, 2),
      judging_criteria: JSON.stringify(format.judging_criteria || {}, null, 2)
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
              <div>
                <Label htmlFor="template">Import Template</Label>
                <Select onValueChange={(value) => {
                  const tmpl = FORMAT_TEMPLATES[value];
                  if (tmpl) {
                    setFormData({
                      key: tmpl.key,
                      name: tmpl.name,
                      description: tmpl.description,
                      rules: JSON.stringify(tmpl.rules, null, 2),
                      timing_rules: JSON.stringify(tmpl.timing_rules, null, 2),
                      judging_criteria: JSON.stringify(tmpl.judging_criteria, null, 2)
                    });
                  }
                }}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Choose template" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FORMAT_TEMPLATES).map((t) => (
                      <SelectItem key={t.key} value={t.key}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <div>
                <Label htmlFor="timing_rules">Timing Rules (JSON)</Label>
                <Textarea
                  id="timing_rules"
                  value={formData.timing_rules}
                  onChange={(e) => setFormData(prev => ({ ...prev, timing_rules: e.target.value }))}
                  placeholder='{"AC":6, "NC":7}'
                  rows={6}
                />
              </div>
              <div>
                <Label htmlFor="judging_criteria">Judging Criteria (JSON)</Label>
                <Textarea
                  id="judging_criteria"
                  value={formData.judging_criteria}
                  onChange={(e) => setFormData(prev => ({ ...prev, judging_criteria: e.target.value }))}
                  placeholder='{"persuasion":30, "evidence":30}'
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
        <CardHeader>
          <CardTitle>Available Formats ({formats.length})</CardTitle>
          <CardDescription>
            Debate formats that can be used in tournaments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p>No debate formats found. Add your first format to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Format</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formats.map((format) => (
                  <TableRow key={format.id}>
                    <TableCell>
                      <div className="font-medium">{format.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{format.key}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {format.description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(format)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteFormat(format.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
