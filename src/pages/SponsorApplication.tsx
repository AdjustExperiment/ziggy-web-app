import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Globe, Mail, Phone, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const SponsorApplication = () => {
  const { user } = useOptimizedAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [offerings, setOfferings] = useState('');
  const [motivation, setMotivation] = useState('');
  const [preferredTier, setPreferredTier] = useState('bronze');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    checkExistingProfile();
    prefillFromInvitation();
  }, [user]);

  const checkExistingProfile = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('sponsor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profile) {
      setExistingProfile(profile);
      if (profile.is_approved) {
        navigate('/sponsor/dashboard');
        return;
      }
    }
    
    setLoading(false);
  };

  const prefillFromInvitation = async () => {
    if (!user) return;
    
    // Check for claimed invitation
    const { data: invitation } = await supabase
      .from('pending_sponsor_invitations')
      .select('*')
      .eq('claimed_by_user_id', user.id)
      .maybeSingle();
    
    if (invitation) {
      setName(invitation.organization_name || '');
      setPreferredTier(invitation.suggested_tier || 'bronze');
    }
    
    // Also check URL params
    const orgName = searchParams.get('org');
    const tier = searchParams.get('tier');
    if (orgName) setName(orgName);
    if (tier) setPreferredTier(tier);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!name.trim() || !description.trim() || !motivation.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create sponsor profile with pending status
      const { error } = await supabase
        .from('sponsor_profiles')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim(),
          website: website.trim() || null,
          contact_email: contactEmail.trim() || user.email,
          contact_phone: contactPhone.trim() || null,
          is_approved: false,
          blog_posts_limit: 0,
          blog_posts_used: 0
        });
      
      if (error) throw error;
      
      // Create admin notification
      await supabase
        .from('admin_notifications')
        .insert({
          title: 'New Sponsor Application',
          message: `${name} has applied to become a sponsor. Preferred tier: ${preferredTier}. Motivation: ${motivation.substring(0, 100)}...`,
          type: 'sponsor_application',
          priority: 'medium',
          action_url: '/admin?tab=sponsors',
          action_text: 'Review Application',
          metadata: {
            organization_name: name,
            preferred_tier: preferredTier,
            offerings: offerings,
            motivation: motivation
          }
        });
      
      setSubmitted(true);
      toast({
        title: "Application submitted!",
        description: "We'll review your application and get back to you soon."
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already has a pending profile
  if (existingProfile && !existingProfile.is_approved) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
              </div>
              <CardTitle className="text-2xl">Application Under Review</CardTitle>
              <CardDescription className="text-lg">
                Your sponsor application for <strong>{existingProfile.name}</strong> is being reviewed by our team.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                We typically review applications within 2-3 business days. You'll receive an email once your application has been processed.
              </p>
              <Button variant="outline" onClick={() => navigate('/')}>
                Return Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Successfully submitted
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Application Submitted!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for applying to become a sponsor.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Our team will review your application and get back to you within 2-3 business days.
                You'll receive an email notification once your application has been processed.
              </p>
              <Button onClick={() => navigate('/')}>
                Return Home
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Become a Sponsor
            </div>
            <h1 className="text-3xl font-bold mb-2">Sponsor Application</h1>
            <p className="text-muted-foreground">
              Join our community of sponsors supporting debate education worldwide.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Tell us about your organization and how you'd like to contribute.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your organization name"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">About Your Organization *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe your organization and what you do..."
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tier">Preferred Sponsorship Tier</Label>
                    <Select value={preferredTier} onValueChange={setPreferredTier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze (Supporting)</SelectItem>
                        <SelectItem value="silver">Silver (Major)</SelectItem>
                        <SelectItem value="gold">Gold (Presenting)</SelectItem>
                        <SelectItem value="platinum">Platinum (Title)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactEmail"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder={user?.email || "contact@example.com"}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offerings">What Can You Offer?</Label>
                  <Textarea
                    id="offerings"
                    value={offerings}
                    onChange={(e) => setOfferings(e.target.value)}
                    placeholder="Describe what you can offer as a sponsor (e.g., funding, prizes, resources, mentorship, etc.)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivation">Why Do You Want to Sponsor? *</Label>
                  <Textarea
                    id="motivation"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder="Tell us why you're interested in sponsoring debate tournaments and education..."
                    rows={3}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SponsorApplication;