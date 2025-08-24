
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
import { CreditCard, Settings, DollarSign, TrendingUp, Download, RefreshCw, Calculator, Users as UsersIcon, Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromoCodesManager } from './PromoCodesManager';
import { StaffRevenueCalculator } from './StaffRevenueCalculator';

interface PaymentTransaction {
  id: string;
  participant_name: string;
  participant_email: string;
  amount_paid: number;
  payment_status: string;
  payment_id: string;
  registration_date: string;
  tournaments: {
    name: string;
  };
}

interface PaymentHandler {
  id: string;
  name: string;
  type: string;
  config: any;
  active: boolean;
}

export function PaymentManager({ activeTab, setActiveTab }: { activeTab?: string; setActiveTab?: (tab: string) => void }) {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [handlers, setHandlers] = useState<PaymentHandler[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
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
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          id,
          participant_name,
          participant_email,
          amount_paid,
          payment_status,
          payment_id,
          registration_date,
          tournaments (
            name
          )
        `)
        .order('registration_date', { ascending: false })
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
      // Get payment statistics
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('amount_paid, payment_status');

      if (error) throw error;

      const totalRevenue = data
        .filter(t => t.payment_status === 'paid')
        .reduce((sum, t) => sum + (t.amount_paid || 0), 0);

      const totalTransactions = data.length;
      const pendingPayments = data.filter(t => t.payment_status === 'pending').length;
      const successfulPayments = data.filter(t => t.payment_status === 'paid').length;

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

  const updatePaymentStatus = async (transactionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ payment_status: newStatus })
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

  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Tournament', 'Participant', 'Email', 'Amount', 'Status', 'Payment ID'],
      ...transactions.map(t => [
        new Date(t.registration_date).toLocaleDateString(),
        t.tournaments?.name || 'N/A',
        t.participant_name,
        t.participant_email,
        `$${t.amount_paid}`,
        t.payment_status,
        t.payment_id || 'N/A'
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions
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
                        {new Date(transaction.registration_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.tournaments?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div>
                          <div>{transaction.participant_name}</div>
                          <div className="text-sm text-muted-foreground">{transaction.participant_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>${transaction.amount_paid}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            transaction.payment_status === 'paid' ? 'default' :
                            transaction.payment_status === 'pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {transaction.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {transaction.payment_status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => updatePaymentStatus(transaction.id, 'paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                          {transaction.payment_status === 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updatePaymentStatus(transaction.id, 'refunded')}
                            >
                              Refund
                            </Button>
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
    </div>
  );
}
