import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import cron from "npm:node-cron@3.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

cron.schedule("* * * * *", async () => {
  const { data: ballots } = await supabase
    .from("ballots")
    .select("id, submitted_at, revealed, status, pairings:tournament_id")
    .eq("revealed", false)
    .eq("status", "submitted");

  if (!ballots) return;

  for (const ballot of ballots) {
    const tournamentId = (ballot as any).pairings?.tournament_id;
    if (!tournamentId || !ballot.submitted_at) continue;

    const { data: tournament } = await supabase
      .from("tournaments")
      .select("reveal_delay")
      .eq("id", tournamentId)
      .single();

    if (!tournament) continue;

    const revealTime = new Date(ballot.submitted_at);
    revealTime.setMinutes(
      revealTime.getMinutes() + (tournament.reveal_delay || 0)
    );

    if (new Date() >= revealTime) {
      await supabase
        .from("ballots")
        .update({ revealed: true })
        .eq("id", ballot.id);
    }
  }
});

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return new Response(
    JSON.stringify({ message: "Ballot publish scheduler running" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
