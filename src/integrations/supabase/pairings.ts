import { supabase } from './client';

export async function assignJudgeToPairing(pairingId: string, judgeId: string) {
  // Remove the function call since assign_judge_to_pairing doesn't exist
  // This would be handled through the pairings table updates
  try {
    const { error } = await supabase
      .from('pairings')
      .update({ judge_id: judgeId })
      .eq('id', pairingId);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error };
  }
}
