
import { supabase } from '@/integrations/supabase/client';

export const resolveJudgeRequest = async (requestId: string, action: 'approve' | 'reject') => {
  try {
    // First get the request details
    const { data: request, error: fetchError } = await supabase
      .from('judge_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    // Update the request status
    const { error: updateError } = await supabase
      .from('judge_requests')
      .update({ 
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_response: `Request ${action}d by admin`,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // If approved, we might want to update the pairing judge assignment
    // This would depend on the specific business logic
    
    return { success: true };
  } catch (error) {
    console.error('Error resolving judge request:', error);
    throw error;
  }
};

export const finalizeScheduleProposal = async (proposalId: string, action: 'approve' | 'reject') => {
  try {
    // First get the proposal details
    const { data: proposal, error: fetchError } = await supabase
      .from('schedule_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw fetchError;

    // Update the proposal status
    const { error: updateError } = await supabase
      .from('schedule_proposals')
      .update({ 
        status: action === 'approve' ? 'approved' : 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (updateError) throw updateError;

    // If approved, update the pairing schedule
    if (action === 'approve') {
      const updateData: any = {};
      if (proposal.proposed_time) updateData.scheduled_time = proposal.proposed_time;
      if (proposal.proposed_room) updateData.room = proposal.proposed_room;

      if (Object.keys(updateData).length > 0) {
        const { error: pairingError } = await supabase
          .from('pairings')
          .update(updateData)
          .eq('id', proposal.pairing_id);

        if (pairingError) throw pairingError;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error finalizing schedule proposal:', error);
    throw error;
  }
};
