
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { CreditCard, Settings, DollarSign, TrendingUp, Download, RefreshCw, Calculator, Tag, RotateCcw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromoCodesManager } from './PromoCodesManager';
import { StaffRevenueCalculator } from './StaffRevenueCalculator';

interface PaymentTransaction {
  id: string;
  registration_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_session_id: string | null;
  created_at: string;
  tournament_registrations?: {
    participant_name: string;
    participant_email: string;
    tournaments: { name: string };
  };
}

interface RefundRequest {
  id: string;
  registration_id: string;
  user_id: string;
  reason: string;
  status: string;
  created_at: string;
  tournament_registrations?: {
    participant_name: string;
    participant_email: string;
    tournaments: { name: string };
  };
}

export function PaymentManager({ activeTab, setActiveTab }: { activeTab?: string; setActiveTab?: (tab: string) => void }) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [selectedHandler, setSelectedHandler] = useState<string>('');
  const [handlerConfig, setHandlerConfig] = useState({
    paypal_client_id: '',
    paypal_secret: '',
    stripe_public_key: '',
    stripe_secret_key: '',
    venmo_business_profile: ''
  });

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    pendingPayments: 0,
    successfulPayments: 0
  });

  useEffect(() => {
    fetchTransactions();
    fetchPaymentStats();
    fetchRefundRequests();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`id, registration_id, user_id, amount, currency, status, stripe_session_id, created_at,
          tournament_registrations:registration_id (participant_name, participant_email, tournaments(name))`)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch payment transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentStats = async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('amount, status');

      if (error) throw error;

      const totalRevenue = data
        .filter(t => t.status === 'succeeded')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalTransactions = data.length;
      const pendingPayments = data.filter(t => t.status === 'pending').length;
      const successfulPayments = data.filter(t => t.status === 'succeeded').length;

      setStats({
        totalRevenue,
        totalTransactions,
        pendingPayments,
        successfulPayments
      });
    } catch (error: any) {
      console.error('Error fetching payment stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRefundRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .select(`id, registration_id, user_id, reason, status, created_at,
          tournament_registrations:registration_id (participant_name, participant_email, tournaments(name))`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRefundRequests(data || []);
    } catch (error) {
      console.error('Error fetching refund requests', error);
    }
  };

  const updatePaymentStatus = async (transactionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('payment_transactions')
        .update({ status: newStatus })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment status updated successfully",
      });

      fetchTransactions();
      fetchPaymentStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const handleStripeCheckout = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: { transaction_id: transactionId }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to start Stripe Checkout',
        variant: 'destructive'
      });
    }
  };

  const submitRefundRequest = async () => {
    if (!selectedTransaction) return;
    try {
      const { error } = await supabase.from('refund_requests').insert({
        registration_id: selectedTransaction.registration_id,
        user_id: selectedTransaction.user_id,
        reason: refundReason
      });
      if (error) throw error;
      toast({ title: 'Refund Requested', description: 'Refund request submitted' });
      setIsRefundDialogOpen(false);
      setRefundReason('');
      fetchRefundRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit refund request',
        variant: 'destructive'
      });
    }
  };

  const currencySymbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Tournament', 'Participant', 'Email', 'Amount', 'Status', 'Stripe Session'],
      ...transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.tournament_registrations?.tournaments?.name || 'N/A',
        t.tournament_registrations?.participant_name,
        t.tournament_registrations?.participant_email,
        `${currencySymbols[t.currency] || ''}${t.amount}`,
        t.status,
        t.stripe_session_id || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Transaction data has been exported to CSV",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Management</h2>
          <p className="text-muted-foreground">Monitor transactions, manage promo codes, and calculate staff revenue</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={fetchPaymentStats} variant="outline" disabled={statsLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
          
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Payment Config
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Payment Handler Configuration</DialogTitle>
                <DialogDescription>
                  Configure your payment processing settings and API keys
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Payment Handler</Label>
                  <Select value={selectedHandler} onValueChange={setSelectedHandler}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment handler" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedHandler === 'paypal' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="paypal_client_id">PayPal Client ID</Label>
                      <Input
                        id="paypal_client_id"
                        value={handlerConfig.paypal_client_id}
                        onChange={(e) => setHandlerConfig({...handlerConfig, paypal_client_id: e.target.value})}
                        placeholder="Your PayPal client ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paypal_secret">PayPal Secret</Label>
                      <Input
                        id="paypal_secret"
                        type="password"
                        value={handlerConfig.paypal_secret}
                        onChange={(e) => setHandlerConfig({...handlerConfig, paypal_secret: e.target.value})}
                        placeholder="Your PayPal secret key"
                      />
                    </div>
                  </div>
                )}

                {selectedHandler === 'stripe' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stripe_public_key">Stripe Public Key</Label>
                      <Input
                        id="stripe_public_key"
                        value={handlerConfig.stripe_public_key}
                        onChange={(e) => setHandlerConfig({...handlerConfig, stripe_public_key: e.target.value})}
                        placeholder="pk_test_... or pk_live_..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="stripe_secret_key">Stripe Secret Key</Label>
                      <Input
                        id="stripe_secret_key"
                        type="password"
                        value={handlerConfig.stripe_secret_key}
                        onChange={(e) => setHandlerConfig({...handlerConfig, stripe_secret_key: e.target.value})}
                        placeholder="sk_test_... or sk_live_..."
                      />
                    </div>
                  </div>
                )}

                {selectedHandler === 'venmo' && (
                  <div>
                    <Label htmlFor="venmo_business_profile">Venmo Business Profile</Label>
                    <Input
                      id="venmo_business_profile"
                      value={handlerConfig.venmo_business_profile}
                      onChange={(e) => setHandlerConfig({...handlerConfig, venmo_business_profile: e.target.value})}
                      placeholder="@your-business-venmo"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Configuration Saved",
                    description: "Payment handler settings have been updated",
                  });
                  setIsConfigDialogOpen(false);
                }}>
                  Save Configuration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Refunds
          </TabsTrigger>
          <TabsTrigger value="promo-codes" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Promo Codes
          </TabsTrigger>
          <TabsTrigger value="staff-calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Staff Calculator
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {/* Payment Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful Payments</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.successfulPayments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest payment transactions from tournament registrations</CardDescription>
                </div>
                <Button onClick={exportTransactions} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.tournament_registrations?.tournaments?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div>
                          <div>{transaction.tournament_registrations?.participant_name}</div>
                          <div className="text-sm text-muted-foreground">{transaction.tournament_registrations?.participant_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{currencySymbols[transaction.currency] || ''}{transaction.amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === 'succeeded' ? 'default' :
                            transaction.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {transaction.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleStripeCheckout(transaction.id)}>
                                Stripe Checkout
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updatePaymentStatus(transaction.id, 'succeeded')}
                              >
                                Mark Paid
                              </Button>
                            </>
                          )}
                          {transaction.status === 'succeeded' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updatePaymentStatus(transaction.id, 'refunded')}
                              >
                                Refund
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setIsRefundDialogOpen(true);
                                }}
                              >
                                Request Refund
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Refund Requests</CardTitle>
              <CardDescription>Requests submitted by participants</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Participant</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refundRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{req.tournament_registrations?.tournaments?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div>
                          <div>{req.tournament_registrations?.participant_name}</div>
                          <div className="text-sm text-muted-foreground">{req.tournament_registrations?.participant_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{req.reason}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            req.status === 'approved' ? 'default' :
                            req.status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {req.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promo-codes">
          <PromoCodesManager />
        </TabsContent>

        <TabsContent value="staff-calculator">
          <StaffRevenueCalculator />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Payment Handler Status */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Handler Information</CardTitle>
              <CardDescription>Current payment processing configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">PayPal</h4>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Standard PayPal checkout integration for secure payments
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Venmo</h4>
                    <Badge variant="outline">Available</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mobile-friendly Venmo integration for quick payments
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Stripe</h4>
                    <Badge variant="secondary">Coming Soon</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Advanced payment processing with Stripe Checkout
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Payment Button HTML */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Payment Button HTML</CardTitle>
              <CardDescription>
                Configure custom PayPal and Venmo button HTML for each tournament
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">How to Add Custom Payment Buttons</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    1. Navigate to the <strong>Tournaments</strong> tab above to manage individual tournaments
                  </p>
                  <p>
                    2. Edit a tournament and go to the <strong>Payments</strong> tab
                  </p>
                  <p>
                    3. Add your custom PayPal or Venmo button HTML in the respective fields
                  </p>
                  <p>
                    4. Preview your buttons and save - they'll automatically appear in tournament registration
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium">PayPal Button HTML</h4>
                  <p className="text-sm text-muted-foreground">
                    Get your PayPal button HTML from your PayPal Business account
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href="https://www.paypal.com/buttons/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        PayPal Button Generator
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab && setActiveTab('tournaments')}>
                      Go to Tournaments
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Venmo Button HTML</h4>
                  <p className="text-sm text-muted-foreground">
                    Create custom Venmo payment buttons or links
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href="https://help.venmo.com/hc/en-us/articles/210413477-Venmo-me-links"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Venmo Documentation
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab && setActiveTab('tournaments')}>
                      Go to Tournaments
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Security Note:</strong> All custom HTML is automatically sanitized before display. 
                  Only safe HTML elements and attributes are allowed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Refund</DialogTitle>
            <DialogDescription>
              Provide a reason for the refund request
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Reason for refund"
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRefundRequest}>Submit</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
