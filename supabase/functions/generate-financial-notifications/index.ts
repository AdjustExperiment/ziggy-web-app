import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Calculate daily revenue
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyPayments, error: dailyError } = await supabaseClient
      .from('tournament_registrations')
      .select('amount_paid')
      .eq('payment_status', 'paid')
      .gte('updated_at', `${today}T00:00:00.000Z`)
      .lt('updated_at', `${today}T23:59:59.999Z`);

    if (dailyError) throw dailyError;

    const dailyRevenue = dailyPayments?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;

    // Calculate monthly revenue
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthlyPayments, error: monthlyError } = await supabaseClient
      .from('tournament_registrations')
      .select('amount_paid')
      .eq('payment_status', 'paid')
      .gte('updated_at', startOfMonth);

    if (monthlyError) throw monthlyError;

    const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;

    const notifications = [];

    // Daily revenue milestones
    const dailyMilestones = [500, 1000, 2000, 5000];
    for (const milestone of dailyMilestones) {
      if (dailyRevenue >= milestone) {
        // Check if notification already exists for this milestone today
        const { data: existingNotification } = await supabaseClient
          .from('admin_notifications')
          .select('id')
          .eq('type', 'financial_milestone')
          .contains('metadata', { milestone_amount: milestone, period: 'daily', date: today })
          .limit(1);

        if (!existingNotification || existingNotification.length === 0) {
          notifications.push({
            title: `Daily Revenue Milestone: $${milestone}`,
            message: `Great news! Today's revenue has reached $${dailyRevenue.toFixed(2)}, exceeding the $${milestone} milestone.`,
            type: 'financial_milestone',
            priority: milestone >= 2000 ? 'high' : 'medium',
            action_url: '/admin?tab=payments',
            action_text: 'View Payments',
            metadata: {
              milestone_amount: milestone,
              actual_amount: dailyRevenue,
              period: 'daily',
              date: today
            }
          });
        }
      }
    }

    // Monthly revenue milestones
    const monthlyMilestones = [5000, 10000, 25000, 50000, 100000];
    for (const milestone of monthlyMilestones) {
      if (monthlyRevenue >= milestone) {
        const monthKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
        
        // Check if notification already exists for this milestone this month
        const { data: existingNotification } = await supabaseClient
          .from('admin_notifications')
          .select('id')
          .eq('type', 'financial_milestone')
          .contains('metadata', { milestone_amount: milestone, period: 'monthly', month: monthKey })
          .limit(1);

        if (!existingNotification || existingNotification.length === 0) {
          notifications.push({
            title: `Monthly Revenue Milestone: $${milestone}`,
            message: `Congratulations! This month's revenue has reached $${monthlyRevenue.toFixed(2)}, surpassing the $${milestone} milestone.`,
            type: 'financial_milestone',
            priority: milestone >= 25000 ? 'high' : 'medium',
            action_url: '/admin?tab=payments',
            action_text: 'View Revenue Report',
            metadata: {
              milestone_amount: milestone,
              actual_amount: monthlyRevenue,
              period: 'monthly',
              month: monthKey
            }
          });
        }
      }
    }

    // Check for low registration numbers
    const { data: activeTournaments } = await supabaseClient
      .from('tournaments')
      .select('id, name, current_participants, max_participants, start_date')
      .eq('registration_open', true)
      .gte('start_date', new Date().toISOString().split('T')[0]);

    for (const tournament of activeTournaments || []) {
      const registrationRate = (tournament.current_participants / tournament.max_participants) * 100;
      const daysUntilStart = Math.ceil((new Date(tournament.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      // Alert if registration is low and tournament is soon
      if (registrationRate < 30 && daysUntilStart <= 7 && daysUntilStart > 0) {
        const { data: existingAlert } = await supabaseClient
          .from('admin_notifications')
          .select('id')
          .eq('type', 'system_alert')
          .eq('tournament_id', tournament.id)
          .contains('metadata', { alert_type: 'low_registration' })
          .gte('created_at', `${today}T00:00:00.000Z`)
          .limit(1);

        if (!existingAlert || existingAlert.length === 0) {
          notifications.push({
            title: `Low Registration Alert: ${tournament.name}`,
            message: `Tournament "${tournament.name}" starts in ${daysUntilStart} days but only has ${tournament.current_participants} of ${tournament.max_participants} participants (${registrationRate.toFixed(1)}%). Consider marketing efforts.`,
            type: 'system_alert',
            priority: 'high',
            action_url: '/admin?tab=tournaments',
            action_text: 'View Tournament',
            tournament_id: tournament.id,
            metadata: {
              alert_type: 'low_registration',
              registration_rate: registrationRate,
              days_until_start: daysUntilStart,
              current_participants: tournament.current_participants,
              max_participants: tournament.max_participants
            }
          });
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('admin_notifications')
        .insert(notifications);

      if (insertError) throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_created: notifications.length,
        daily_revenue: dailyRevenue,
        monthly_revenue: monthlyRevenue
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error("Error generating financial notifications:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders 
        } 
      }
    );
  }
});