import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { GripVertical, Save, RotateCcw, ListOrdered, X } from 'lucide-react';
import {
  TiebreakerType,
  TIEBREAKER_PRESETS,
  TIEBREAKER_LABELS
} from '@/types/tabulation';

interface TiebreakerConfigProps {
  tournamentId: string;
  eventId?: string | null;
}

// Sortable item component
function SortableTiebreakerItem({
  id,
  label,
  index,
  onRemove
}: {
  id: string;
  label: string;
  index: number;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-background border rounded-lg ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
        {index + 1}
      </Badge>
      <span className="flex-1 font-medium">{label}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TiebreakerConfig({ tournamentId, eventId }: TiebreakerConfigProps) {
  const [tiebreakerOrder, setTiebreakerOrder] = useState<TiebreakerType[]>([
    'wins', 'speaks', 'ranks', 'adjusted_speaks', 'adjusted_ranks', 'opp_wins', 'head_to_head', 'coin_flip'
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch current config
  useEffect(() => {
    fetchConfig();
  }, [tournamentId, eventId]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tournament_tab_config')
        .select('tiebreaker_order')
        .eq('tournament_id', tournamentId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.tiebreaker_order) {
        setTiebreakerOrder(data.tiebreaker_order as TiebreakerType[]);
      }
    } catch (error) {
      console.error('Error fetching tiebreaker config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tiebreakerOrder.indexOf(active.id as TiebreakerType);
      const newIndex = tiebreakerOrder.indexOf(over.id as TiebreakerType);
      setTiebreakerOrder(arrayMove(tiebreakerOrder, oldIndex, newIndex));
      setHasChanges(true);
    }
  };

  const handlePresetSelect = (presetName: string) => {
    const preset = TIEBREAKER_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setTiebreakerOrder([...preset.order]);
      setHasChanges(true);
    }
  };

  const handleRemove = (tiebreaker: TiebreakerType) => {
    setTiebreakerOrder(prev => prev.filter(t => t !== tiebreaker));
    setHasChanges(true);
  };

  const handleAdd = (tiebreaker: TiebreakerType) => {
    if (!tiebreakerOrder.includes(tiebreaker)) {
      setTiebreakerOrder(prev => [...prev, tiebreaker]);
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('tournament_tab_config')
        .upsert({
          tournament_id: tournamentId,
          event_id: eventId || null,
          tiebreaker_order: tiebreakerOrder,
          updated_at: new Date().toISOString()
        }, { onConflict: 'tournament_id,event_id' });

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Tiebreaker order updated successfully',
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving tiebreaker config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save tiebreaker order',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Available tiebreakers not in current order
  const availableTiebreakers = (Object.keys(TIEBREAKER_LABELS) as TiebreakerType[])
    .filter(t => !tiebreakerOrder.includes(t));

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5" />
          Tiebreaker Order
        </CardTitle>
        <CardDescription>
          Drag and drop to reorder tiebreakers. Teams are compared using these criteria in order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset selector */}
        <div className="flex items-center gap-4">
          <Select onValueChange={handlePresetSelect}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Load preset..." />
            </SelectTrigger>
            <SelectContent>
              {TIEBREAKER_PRESETS.map(preset => (
                <SelectItem key={preset.name} value={preset.name}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {availableTiebreakers.length > 0 && (
            <Select onValueChange={(value) => handleAdd(value as TiebreakerType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Add tiebreaker..." />
              </SelectTrigger>
              <SelectContent>
                {availableTiebreakers.map(t => (
                  <SelectItem key={t} value={t}>
                    {TIEBREAKER_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Drag and drop list */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tiebreakerOrder}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tiebreakerOrder.map((tiebreaker, index) => (
                <SortableTiebreakerItem
                  key={tiebreaker}
                  id={tiebreaker}
                  label={TIEBREAKER_LABELS[tiebreaker]}
                  index={index}
                  onRemove={() => handleRemove(tiebreaker)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Order'}
          </Button>
          <Button variant="outline" onClick={fetchConfig}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
