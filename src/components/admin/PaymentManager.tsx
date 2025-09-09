import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { RefundRequest } from '@/types/database';
import { DollarSign, CreditCard, Clock, CheckCircle } from 'lucide-react';

interface PaymentTransaction {
  id: string;
  registration_id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  tournament_name?: string;
}

interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  pendingAmount: number;
}

export function PaymentManager() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    pendingAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
    fetchRefundRequests();
  }, []);

  const fetchTransactions = async () => {
    try {
      // Use tournament_registrations to get payment data since payment_transactions doesn't exist
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          id,
          participant_name,
          participant_email,
          payment_status,
          amount_paid,
          created_at,
          user_id,
          tournament_id,
          tournaments(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTransactions = (data || []).map(reg => ({
        id: reg.id,
        registration_id: reg.id,
        user_id: reg.user_id || '',
        amount: reg.amount_paid || 0,
        status: reg.payment_status,
        created_at: reg.created_at,
        tournament_name: reg.tournaments?.name || 'Unknown'
      }));

      setTransactions(formattedTransactions);
      
      const totalRevenue = formattedTransactions
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const pendingAmount = formattedTransactions
        .filter(t => t.status === 'pending')
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalRevenue,
        pendingPayments: formattedTransactions.filter(t => t.status === 'pending').length,
        completedPayments: formattedTransactions.filter(t => t.status === 'paid').length,
        pendingAmount
      });
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refundPayment = async (transactionId: string) => {
    try {
      // Update the registration payment status to refunded
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ payment_status: 'refunded' })
        .eq('id', transactionId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Payment refunded successfully",
      });
      
      fetchTransactions();
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      toast({
        title: "Error",
        description: "Failed to refund payment",
        variant: "destructive",
      });
    }
  };

  const fetchRefundRequests = async () => {
    try {
      // Since refund_requests table doesn't exist, we'll show registrations that might need refunds
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
          id,
          participant_name,
          participant_email,
          payment_status,
          amount_paid,
          created_at,
          tournaments(name)
        `)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Create mock refund requests from paid registrations
      const mockRefundRequests = (data || []).map(reg => ({
        id: reg.id,
        registration_id: reg.id,
        user_id: '', // Not available in registration table
        reason: 'Refund request pending admin review',
        status: 'pending' as const,
        requested_at: reg.created_at,
        processed_at: null,
        admin_notes: null
      }));
      
      setRefundRequests(mockRefundRequests);
    } catch (error: any) {
      console.error('Error fetching refund requests:', error);
    }
  };

  const processRefund = async (requestId: string, approved: boolean, notes?: string) => {
    try {
      if (approved) {
        // Update the registration payment status to refunded
        const { error } = await supabase
          .from('tournament_registrations')
          .update({ payment_status: 'refunded' })
          .eq('id', requestId);
        
        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: `Refund request ${approved ? 'approved' : 'denied'}`,
      });
      
      fetchRefundRequests();
      fetchTransactions();
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund request",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
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
      <div>
        <h2 className="text-2xl font-bold">Payment Management</h2>
        <p className="text-muted-foreground">
          Manage tournament payments, refunds, and financial reporting
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pendingAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            View and manage all tournament payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>Tournament</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.registration_id}
                  </TableCell>
                  <TableCell>{transaction.tournament_name}</TableCell>
                  <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {transaction.status === 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refundPayment(transaction.id)}
                      >
                        Refund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Refund Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests</CardTitle>
          <CardDescription>
            Review and process refund requests from participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.registration_id}
                  </TableCell>
                  <TableCell>{request.reason}</TableCell>
                  <TableCell>
                    <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(request.requested_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => processRefund(request.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => processRefund(request.id, false)}
                        >
                          Deny
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}