import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from '@/components/AuthModal';
import { CheckCircle, AlertCircle, Loader2, Trophy, Calendar, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface InvitationDetails {
  id: string;
  name: string;
  email: string;
  role: string;
  tournament: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    location: string;
  };
  event?: {
    name: string;
    short_code: string;
  } | null;
  claimed_at: string | null;
  expires_at: string | null;
}

export default function ClaimRegistration() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useOptimizedAuth();
  
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query the pending_registrant_invitations table with cart_items for role
      const { data, error: fetchError } = await supabase
        .from('pending_registrant_invitations')
        .select(`
          id,
          name,
          email,
          claimed_at,
          expires_at,
          tournament_id,
          cart_items!pending_registrant_invitations_cart_item_id_fkey (
            role,
            event_id,
            tournament_events (
              name,
              short_code
            )
          ),
          tournaments!pending_registrant_invitations_tournament_id_fkey (
            id,
            name,
            start_date,
            end_date,
            location
          )
        `)
        .eq('claim_token', token)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Invalid or expired invitation link. Please check your email for the correct link.');
        return;
      }

      if (data.claimed_at) {
        setError('This invitation has already been claimed.');
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired. Please contact the tournament organizer.');
        return;
      }

      // Transform the data - handle the nested relationships
      const cartItem = data.cart_items as any;
      const tournament = data.tournaments as any;
      const eventData = cartItem?.tournament_events;

      const invitationData: InvitationDetails = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: cartItem?.role || 'competitor',
        tournament: {
          id: tournament?.id || data.tournament_id,
          name: tournament?.name || 'Tournament',
          start_date: tournament?.start_date || '',
          end_date: tournament?.end_date || '',
          location: tournament?.location || ''
        },
        event: eventData ? {
          name: eventData.name,
          short_code: eventData.short_code
        } : null,
        claimed_at: data.claimed_at,
        expires_at: data.expires_at
      };

      setInvitation(invitationData);
    } catch (err: any) {
      console.error('Error fetching invitation:', err);
      setError('Failed to load invitation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!invitation || !token) return;

    try {
      setClaiming(true);

      const { data, error: claimError } = await supabase.functions.invoke('claim-registration', {
        body: {
          claim_token: token,
          user_id: user.id
        }
      });

      if (claimError) throw claimError;

      if (data?.error) {
        throw new Error(data.error);
      }

      setClaimed(true);
      toast({
        title: "Registration Claimed!",
        description: `You have successfully claimed your registration for ${invitation.tournament.name}.`,
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/my-tournaments');
      }, 2000);
    } catch (err: any) {
      console.error('Error claiming registration:', err);
      toast({
        title: "Failed to Claim",
        description: err.message || "An error occurred while claiming your registration.",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  // Show auth modal after successful sign up
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false);
      // Auto-claim after authentication
      handleClaim();
    }
  }, [user]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/tournaments')}>
                Browse Tournaments
              </Button>
              <Button onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Registration Claimed!</CardTitle>
            <CardDescription>
              You have successfully claimed your registration.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Redirecting you to your tournaments...
            </p>
            <Button onClick={() => navigate('/my-tournaments')}>
              Go to My Tournaments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        title="Sign In to Claim Registration"
        description={`Create an account or sign in to claim your registration for ${invitation?.tournament.name}.`}
        defaultTab="signup"
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />

      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Claim Your Tournament Registration</CardTitle>
            <CardDescription>
              You've been registered for a tournament! Claim your spot below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {invitation && (
              <>
                {/* Tournament Info */}
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h3 className="text-xl font-semibold">{invitation.tournament.name}</h3>
                  
                  <div className="grid gap-3 text-sm">
                    {invitation.tournament.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(invitation.tournament.start_date).toLocaleDateString()}
                          {invitation.tournament.end_date && ` - ${new Date(invitation.tournament.end_date).toLocaleDateString()}`}
                        </span>
                      </div>
                    )}
                    {invitation.tournament.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{invitation.tournament.location}</span>
                      </div>
                    )}
                  </div>

                  {invitation.event && (
                    <Badge variant="secondary">
                      {invitation.event.name} ({invitation.event.short_code})
                    </Badge>
                  )}
                </div>

                {/* Registration Details */}
                <div className="space-y-3">
                  <h4 className="font-medium">Your Registration Details</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{invitation.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{invitation.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="outline" className="capitalize">{invitation.role}</Badge>
                    </div>
                  </div>
                </div>

                {/* User Status */}
                {user ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Signed in as <strong>{user.email}</strong>
                      </AlertDescription>
                    </Alert>
                    
                    {user.email?.toLowerCase() !== invitation.email.toLowerCase() && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          The email on this invitation ({invitation.email}) doesn't match your account email. 
                          Please sign in with the correct account or contact the tournament organizer.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      You'll need to create an account or sign in to claim this registration.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => navigate('/tournaments')}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleClaim}
                    disabled={claiming || (user && user.email?.toLowerCase() !== invitation.email.toLowerCase())}
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Claiming...
                      </>
                    ) : user ? (
                      'Claim Registration'
                    ) : (
                      'Sign In & Claim'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
