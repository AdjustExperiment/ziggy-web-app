import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, CreditCard, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface TournamentPayPalSettingsProps {
  tournamentId: string;
}

interface PayPalSettings {
  paypal_enabled: boolean;
  paypal_mode: 'sandbox' | 'production';
  paypal_client_id: string;
  has_secret: boolean;
}

export function TournamentPayPalSettings({ tournamentId }: TournamentPayPalSettingsProps) {
  const [settings, setSettings] = useState<PayPalSettings>({
    paypal_enabled: false,
    paypal_mode: 'sandbox',
    paypal_client_id: '',
    has_secret: false,
  });
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('tournament_payment_settings')
          .select('paypal_enabled, paypal_mode, paypal_client_id, paypal_secret_ciphertext')
          .eq('tournament_id', tournamentId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching PayPal settings:', error);
          toast({
            title: 'Error',
            description: 'Failed to load payment settings',
            variant: 'destructive',
          });
          return;
        }

        if (data) {
          setSettings({
            paypal_enabled: data.paypal_enabled ?? false,
            paypal_mode: (data.paypal_mode as 'sandbox' | 'production') ?? 'sandbox',
            paypal_client_id: data.paypal_client_id ?? '',
            has_secret: !!data.paypal_secret_ciphertext,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, [tournamentId]);

  // Test credentials
  const handleTestCredentials = async () => {
    if (!settings.paypal_client_id || !clientSecret) {
      toast({
        title: 'Missing credentials',
        description: 'Please enter both Client ID and Client Secret to test',
        variant: 'destructive',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('paypal-upsert-credentials', {
        body: {
          tournament_id: tournamentId,
          paypal_enabled: settings.paypal_enabled,
          paypal_mode: settings.paypal_mode,
          paypal_client_id: settings.paypal_client_id,
          paypal_client_secret: clientSecret,
          test_credentials: true,
        },
      });

      if (error) {
        setTestResult({ success: false, message: error.message });
        return;
      }

      if (data.test_failed) {
        setTestResult({ success: false, message: data.error });
        return;
      }

      if (data.error) {
        setTestResult({ success: false, message: data.error });
        return;
      }

      setTestResult({ success: true, message: 'Credentials are valid!' });
      setSettings(prev => ({ ...prev, has_secret: true }));
      setClientSecret('');
      setIsDirty(false);

      toast({
        title: 'Success',
        description: 'PayPal credentials verified and saved',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to test credentials';
      setTestResult({ success: false, message });
    } finally {
      setIsTesting(false);
    }
  };

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);
    setTestResult(null);

    try {
      // If enabling and no secret stored yet, require one
      if (settings.paypal_enabled && !settings.has_secret && !clientSecret) {
        toast({
          title: 'Secret required',
          description: 'Please enter the PayPal Client Secret when enabling PayPal',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('paypal-upsert-credentials', {
        body: {
          tournament_id: tournamentId,
          paypal_enabled: settings.paypal_enabled,
          paypal_mode: settings.paypal_mode,
          paypal_client_id: settings.paypal_client_id,
          ...(clientSecret ? { paypal_client_secret: clientSecret } : {}),
          test_credentials: !!clientSecret, // Test if providing new secret
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (clientSecret) {
        setSettings(prev => ({ ...prev, has_secret: true }));
        setClientSecret('');
      }
      setIsDirty(false);

      toast({
        title: 'Settings saved',
        description: 'PayPal settings updated successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading payment settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          PayPal Configuration
        </CardTitle>
        <CardDescription>
          Configure PayPal checkout for tournament registration payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="paypal-enabled" className="text-base font-medium">
              Enable PayPal Checkout
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow participants to pay via PayPal during registration
            </p>
          </div>
          <Switch
            id="paypal-enabled"
            checked={settings.paypal_enabled}
            onCheckedChange={(checked) => {
              setSettings(prev => ({ ...prev, paypal_enabled: checked }));
              setIsDirty(true);
            }}
          />
        </div>

        {/* Environment Selection */}
        <div className="space-y-2">
          <Label htmlFor="paypal-mode">Environment</Label>
          <Select
            value={settings.paypal_mode}
            onValueChange={(value: 'sandbox' | 'production') => {
              setSettings(prev => ({ ...prev, paypal_mode: value }));
              setIsDirty(true);
            }}
          >
            <SelectTrigger id="paypal-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">
                <span className="flex items-center gap-2">
                  🧪 Sandbox (Testing)
                </span>
              </SelectItem>
              <SelectItem value="production">
                <span className="flex items-center gap-2">
                  🚀 Production (Live)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {settings.paypal_mode === 'sandbox'
              ? 'Use sandbox for testing - no real money will be processed'
              : 'Production mode - real payments will be processed'}
          </p>
        </div>

        {/* Client ID */}
        <div className="space-y-2">
          <Label htmlFor="paypal-client-id">PayPal Client ID</Label>
          <Input
            id="paypal-client-id"
            placeholder="Enter your PayPal Client ID"
            value={settings.paypal_client_id}
            onChange={(e) => {
              setSettings(prev => ({ ...prev, paypal_client_id: e.target.value }));
              setIsDirty(true);
            }}
          />
          <p className="text-xs text-muted-foreground">
            Found in your PayPal Developer Dashboard under your app credentials
          </p>
        </div>

        {/* Client Secret */}
        <div className="space-y-2">
          <Label htmlFor="paypal-client-secret">
            PayPal Client Secret
            {settings.has_secret && (
              <span className="ml-2 text-xs text-green-600 font-normal">
                ✓ Securely stored
              </span>
            )}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="paypal-client-secret"
                type={showSecret ? 'text' : 'password'}
                placeholder={settings.has_secret ? '••••••••••••••••' : 'Enter your PayPal Client Secret'}
                value={clientSecret}
                onChange={(e) => {
                  setClientSecret(e.target.value);
                  setIsDirty(true);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {settings.has_secret
              ? 'Leave blank to keep existing secret, or enter a new one to update'
              : 'Required to enable PayPal payments'}
          </p>
        </div>

        {/* Security Note */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your PayPal Client Secret is encrypted before storage and never exposed to the frontend.
            Only server-side Edge Functions can decrypt and use it for PayPal API calls.
          </AlertDescription>
        </Alert>

        {/* Test Result */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleTestCredentials}
            disabled={isTesting || isSaving || !settings.paypal_client_id || !clientSecret}
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Test & Save Credentials
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || isTesting || !isDirty}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>

        {/* Help Links */}
        <div className="pt-4 border-t text-sm text-muted-foreground">
          <p className="font-medium mb-2">Need help?</p>
          <ul className="space-y-1">
            <li>
              <a
                href="https://developer.paypal.com/dashboard/applications/sandbox"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                PayPal Developer Dashboard (Sandbox) →
              </a>
            </li>
            <li>
              <a
                href="https://developer.paypal.com/dashboard/applications/live"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                PayPal Developer Dashboard (Live) →
              </a>
            </li>
            <li>
              <a
                href="https://developer.paypal.com/docs/api/overview/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                PayPal API Documentation →
              </a>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
