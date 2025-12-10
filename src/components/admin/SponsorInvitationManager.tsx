import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { 
  Send, 
  Copy, 
  Trash2, 
  RefreshCw, 
  Mail, 
  Building2, 
  Clock, 
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2
} from "lucide-react";

interface Invitation {
  id: string;
  email: string;
  organization_name: string;
  tournament_id: string | null;
  suggested_tier: string;
  personal_message: string | null;
  invite_token: string;
  expires_at: string;
  claimed_at: string | null;
  claimed_by_user_id: string | null;
  created_at: string;
  tournaments?: {
    id: string;
    name: string;
  } | null;
}

interface Tournament {
  id: string;
  name: string;
}

export default function SponsorInvitationManager() {
  const { user } = useOptimizedAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [selectedTournament, setSelectedTournament] = useState<string>("none");
  const [suggestedTier, setSuggestedTier] = useState("bronze");
  const [personalMessage, setPersonalMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("pending_sponsor_invitations")
        .select(`
          *,
          tournaments:tournament_id (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (invitationsError) throw invitationsError;
      setInvitations((invitationsData || []) as Invitation[]);

      // Fetch tournaments for dropdown
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from("tournaments")
        .select("id, name")
        .order("start_date", { ascending: false })
        .limit(50);

      if (tournamentsError) throw tournamentsError;
      setTournaments(tournamentsData || []);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!email || !organizationName) {
      toast({
        title: "Missing fields",
        description: "Email and organization name are required",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Create invitation
      const { data: invitation, error: createError } = await supabase
        .from("pending_sponsor_invitations")
        .insert({
          email: email.toLowerCase().trim(),
          organization_name: organizationName.trim(),
          tournament_id: selectedTournament === "none" ? null : selectedTournament,
          suggested_tier: suggestedTier,
          personal_message: personalMessage.trim() || null,
          invited_by: user?.id
        })
        .select()
        .single();

      if (createError) throw createError;

      // Try to send email (will gracefully handle missing API key)
      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke(
          "send-sponsor-invitation",
          { body: { invitation_id: invitation.id } }
        );

        if (emailError) {
          console.warn("Email send warning:", emailError);
          toast({
            title: "Invitation created",
            description: "Email could not be sent - share the link manually.",
          });
        } else if (emailResult?.warning) {
          toast({
            title: "Invitation created",
            description: emailResult.warning,
          });
        } else {
          toast({
            title: "Invitation sent!",
            description: `Email sent to ${email}`,
          });
        }
      } catch (emailErr) {
        console.warn("Email send error:", emailErr);
        toast({
          title: "Invitation created",
          description: "Email service unavailable - share the link manually.",
        });
      }

      // Reset form
      setEmail("");
      setOrganizationName("");
      setSelectedTournament("none");
      setSuggestedTier("bronze");
      setPersonalMessage("");

      fetchData();
    } catch (err: any) {
      console.error("Error creating invitation:", err);
      toast({
        title: "Error",
        description: "Failed to create invitation",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleResendEmail = async (invitationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-sponsor-invitation",
        { body: { invitation_id: invitationId } }
      );

      if (error) throw error;

      toast({
        title: data?.warning ? "Partial success" : "Email resent!",
        description: data?.warning || "Invitation email has been resent.",
      });
    } catch (err: any) {
      console.error("Error resending email:", err);
      toast({
        title: "Error",
        description: "Failed to resend email",
        variant: "destructive"
      });
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/sponsor/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Invitation link copied to clipboard",
    });
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) return;

    try {
      const { error } = await supabase
        .from("pending_sponsor_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast({
        title: "Invitation deleted",
        description: "The invitation has been removed",
      });

      fetchData();
    } catch (err: any) {
      console.error("Error deleting invitation:", err);
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive"
      });
    }
  };

  const getInvitationStatus = (invitation: Invitation) => {
    if (invitation.claimed_at) {
      return { label: "Claimed", variant: "default" as const, icon: CheckCircle2 };
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return { label: "Expired", variant: "destructive" as const, icon: XCircle };
    }
    return { label: "Pending", variant: "secondary" as const, icon: Clock };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send New Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="sponsor@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization Name *</Label>
              <Input
                id="organization"
                placeholder="Company or Organization"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tournament (Optional)</Label>
              <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tournament..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific tournament</SelectItem>
                  {tournaments.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Suggested Tier</Label>
              <Select value={suggestedTier} onValueChange={setSuggestedTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personalized message for the sponsor..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleCreateInvitation} disabled={sending} className="w-full md:w-auto">
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Sent Invitations ({invitations.length})
            </span>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No invitations sent yet. Create your first invitation above.
            </p>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => {
                const status = getInvitationStatus(invitation);
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={invitation.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{invitation.organization_name}</span>
                        <Badge variant={status.variant} className="text-xs">
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {invitation.suggested_tier}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{invitation.email}</div>
                      {invitation.tournaments && (
                        <div className="text-xs text-muted-foreground">
                          Tournament: {invitation.tournaments.name}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Sent: {new Date(invitation.created_at).toLocaleDateString()}
                        {" · "}
                        Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!invitation.claimed_at && new Date(invitation.expires_at) >= new Date() && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLink(invitation.invite_token)}
                            title="Copy invite link"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendEmail(invitation.id)}
                            title="Resend email"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="Preview invite page"
                          >
                            <a href={`/sponsor/invite/${invitation.invite_token}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInvitation(invitation.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
