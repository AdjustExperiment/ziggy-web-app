import { supabase } from './client';

export async function assignJudgeToPairing(pairingId: string, judgeId: string) {
  const { data, error } = await supabase.rpc('assign_judge_to_pairing', {
    p_pairing_id: pairingId,
    p_judge_id: judgeId,
  });

  if (error) throw error;
  return data;
}
