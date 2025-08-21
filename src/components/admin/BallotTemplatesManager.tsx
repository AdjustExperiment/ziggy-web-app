import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Plus, Edit, Star, FileText, Trash2 } from 'lucide-react';
import { BallotTemplate } from '@/types/database';

interface Tournament {
  id: string;
  name: string;
}

export function BallotTemplatesManager() {
  const [templates, setTemplates] = useState<BallotTemplate[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('global');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BallotTemplate | null>(null);
  const [formData, setFormData] = useState({
    event_style: '',
    template_key: '',
    schema: '{}',
    html: '',
    is_default: false
  });

  const eventStyles = [
    'Lincoln-Douglas',
    'Public Forum', 
    'Parliamentary',
    'Policy',
    'World Schools',
    'Academic',
    'British Parliamentary'
  ];

  useEffect(() => {
    fetchTournaments();
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setTournaments(data || []);
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      });
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('ballot_templates').select('*');
      
      if (selectedTournament === 'global') {
        query = query.is('tournament_id', null);
      } else {
        query = query.eq('tournament_id', selectedTournament);
      }
      
      const { data, error } = await query.order('event_style');

      if (error) throw error;
      setTemplates(data || []);
      
    } catch (error: any) {
      console.error('Error fetching ballot templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ballot templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    try {
      let schema;
      try {
        schema = JSON.parse(formData.schema);
      } catch {
        throw new Error('Invalid JSON in schema field');
      }

      const templateData = {
        tournament_id: selectedTournament === 'global' ? null : selectedTournament,
        event_style: formData.event_style,
        template_key: formData.template_key,
        schema,
        html: formData.html || null,
        is_default: formData.is_default
      };

      const { error } = await supabase
        .from('ballot_templates')
        .insert([templateData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ballot template created successfully",
      });

      setIsCreateDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create ballot template",
        variant: "destructive",
      });
    }
  };

  const updateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      let schema;
      try {
        schema = JSON.parse(formData.schema);
      } catch {
        throw new Error('Invalid JSON in schema field');
      }

      const templateData = {
        event_style: formData.event_style,
        template_key: formData.template_key,
        schema,
        html: formData.html || null,
        is_default: formData.is_default
      };

      const { error } = await supabase
        .from('ballot_templates')
        .update(templateData)
        .eq('id', editingTemplate.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ballot template updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update ballot template",
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this ballot template?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ballot_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Ballot template deleted successfully",
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete ballot template",
        variant: "destructive",
      });
    }
  };

  const toggleDefault = async (templateId: string, isDefault: boolean) => {
    try {
      const { error } = await supabase
        .from('ballot_templates')
        .update({ is_default: isDefault })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Template ${isDefault ? 'set as' : 'removed as'} default`,
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (template: BallotTemplate) => {
    setEditingTemplate(template);
    setFormData({
      event_style: template.event_style,
      template_key: template.template_key,
      schema: JSON.stringify(template.schema, null, 2),
      html: template.html || '',
      is_default: template.is_default
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      event_style: '',
      template_key: '',
      schema: '{}',
      html: '',
      is_default: false
    });
  };

  const defaultSchema = JSON.stringify({
    fields: [
      { name: 'speaker1_points', label: 'Speaker 1 Points', type: 'number', min: 0, max: 30 },
      { name: 'speaker2_points', label: 'Speaker 2 Points', type: 'number', min: 0, max: 30 },
      { name: 'winner', label: 'Winner', type: 'select', options: ['Affirmative', 'Negative'] },
      { name: 'comments', label: 'Comments', type: 'textarea' }
    ]
  }, null, 2);

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
          <h3 className="text-lg font-semibold">Ballot Templates</h3>
          <p className="text-muted-foreground">Create and manage ballot templates for different event styles</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Ballot Template</DialogTitle>
              <DialogDescription>
                Create a new ballot template for judges to use
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Style</Label>
                  <Select value={formData.event_style} onValueChange={(value) => setFormData({...formData, event_style: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event style" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventStyles.map(style => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template_key">Template Key</Label>
                  <Input
                    id="template_key"
                    value={formData.template_key}
                    onChange={(e) => setFormData({...formData, template_key: e.target.value})}
                    placeholder="e.g., standard-ld-ballot"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
                />
                <Label>Set as default template for this event style</Label>
              </div>
              
              <div>
                <Label htmlFor="schema">Schema (JSON)</Label>
                <Textarea
                  id="schema"
                  value={formData.schema}
                  onChange={(e) => setFormData({...formData, schema: e.target.value})}
                  placeholder={defaultSchema}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Define the ballot structure using JSON. Include fields, labels, types, and validation rules.
                </p>
              </div>
              
              <div>
                <Label htmlFor="html">Custom HTML (Optional)</Label>
                <Textarea
                  id="html"
                  value={formData.html}
                  onChange={(e) => setFormData({...formData, html: e.target.value})}
                  placeholder="<style>...</style><div>Custom ballot layout</div>"
                  rows={5}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional custom HTML for ballot layout and styling.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createTemplate}>
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template Scope</CardTitle>
          <CardDescription>Choose whether to view global templates or tournament-specific ones</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global Templates</SelectItem>
              {tournaments.map(tournament => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates ({templates.length})</CardTitle>
          <CardDescription>
            Ballot templates for the selected scope
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p>No ballot templates found. Create your first template to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Style</TableHead>
                  <TableHead>Template Key</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Badge variant="outline">{template.event_style}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">{template.template_key}</TableCell>
                    <TableCell>
                      <Badge variant={template.tournament_id ? 'default' : 'secondary'}>
                        {template.tournament_id ? 'Tournament' : 'Global'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={template.is_default}
                          onCheckedChange={(checked) => toggleDefault(template.id, checked)}
                        />
                        {template.is_default && <Star className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTemplate(template.id)}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Ballot Template</DialogTitle>
            <DialogDescription>
              Modify the ballot template
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Event Style</Label>
                <Select value={formData.event_style} onValueChange={(value) => setFormData({...formData, event_style: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventStyles.map(style => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_template_key">Template Key</Label>
                <Input
                  id="edit_template_key"
                  value={formData.template_key}
                  onChange={(e) => setFormData({...formData, template_key: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({...formData, is_default: checked})}
              />
              <Label>Set as default template for this event style</Label>
            </div>
            
            <div>
              <Label htmlFor="edit_schema">Schema (JSON)</Label>
              <Textarea
                id="edit_schema"
                value={formData.schema}
                onChange={(e) => setFormData({...formData, schema: e.target.value})}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            
            <div>
              <Label htmlFor="edit_html">Custom HTML (Optional)</Label>
              <Textarea
                id="edit_html"
                value={formData.html}
                onChange={(e) => setFormData({...formData, html: e.target.value})}
                rows={5}
                className="font-mono text-sm"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateTemplate}>
              Update Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
