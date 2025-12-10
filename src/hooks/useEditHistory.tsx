import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface EditHistoryEntry {
  pairing_id: string;
  field_changed: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  change_reason?: string;
}

export function useEditHistory() {
  const { user } = useOptimizedAuth();

  const logEdit = useCallback(async (entry: EditHistoryEntry) => {
    if (!user?.id) return;

    const { error } = await supabase
      .from('pairing_edit_history')
      .insert([{
        pairing_id: entry.pairing_id,
        changed_by: user.id,
        field_changed: entry.field_changed,
        old_value: entry.old_value as Json,
        new_value: entry.new_value as Json,
        change_reason: entry.change_reason || null
      }]);

    if (error) {
      console.error('Failed to log edit history:', error);
    }
  }, [user?.id]);

  const undoLastEdit = useCallback(async (pairingId: string) => {
    const { data: lastEdit, error: fetchError } = await supabase
      .from('pairing_edit_history')
      .select('*')
      .eq('pairing_id', pairingId)
      .order('changed_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !lastEdit) {
      toast({ title: 'No edit history found', variant: 'destructive' });
      return null;
    }

    const fieldChanged = lastEdit.field_changed;
    const oldValue = lastEdit.old_value as Record<string, unknown> | null;

    if (!oldValue) {
      toast({ title: 'Cannot undo - no previous value', variant: 'destructive' });
      return null;
    }

    // Revert the field
    const updateData: Record<string, unknown> = {};
    if (fieldChanged === 'judge_id') {
      updateData.judge_id = oldValue.judge_id;
    } else if (fieldChanged === 'room') {
      updateData.room = oldValue.room;
    } else if (fieldChanged === 'aff_registration_id') {
      updateData.aff_registration_id = oldValue.aff_registration_id;
    } else if (fieldChanged === 'neg_registration_id') {
      updateData.neg_registration_id = oldValue.neg_registration_id;
    } else if (fieldChanged === 'status') {
      updateData.status = oldValue.status;
    } else if (fieldChanged === 'scheduled_time') {
      updateData.scheduled_time = oldValue.scheduled_time;
    }

    const { error: updateError } = await supabase
      .from('pairings')
      .update(updateData)
      .eq('id', pairingId);

    if (updateError) {
      toast({ title: 'Failed to undo edit', variant: 'destructive' });
      return null;
    }

    // Log the undo action
    await logEdit({
      pairing_id: pairingId,
      field_changed: fieldChanged,
      old_value: lastEdit.new_value as Record<string, unknown> | null,
      new_value: oldValue,
      change_reason: 'Undo last change'
    });

    toast({ title: 'Edit undone successfully' });
    return { field: fieldChanged, value: oldValue };
  }, [logEdit]);

  const getEditHistory = useCallback(async (pairingId: string) => {
    const { data, error } = await supabase
      .from('pairing_edit_history')
      .select('*')
      .eq('pairing_id', pairingId)
      .order('changed_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch edit history:', error);
      return [];
    }

    return data || [];
  }, []);

  return { logEdit, undoLastEdit, getEditHistory };
}
