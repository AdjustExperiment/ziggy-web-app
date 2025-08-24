import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Lock, Unlock, Search, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface UserAccount {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_locked: boolean;
  locked_until: string | null;
  lock_reason: string | null;
  locked_by_user_id: string | null;
  created_at: string;
}

export function AccountsManager() {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [lockUntil, setLockUntil] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const lockAccount = async () => {
    if (!selectedAccount) return;

    try {
      const lockUntilDate = lockUntil ? new Date(lockUntil).toISOString() : null;
      
      const { error } = await supabase.rpc('lock_account', {
        _target_user_id: selectedAccount.user_id,
        _until: lockUntilDate,
        _reason: lockReason || null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account locked successfully",
      });

      setIsLockDialogOpen(false);
      setSelectedAccount(null);
      setLockReason('');
      setLockUntil('');
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to lock account",
        variant: "destructive",
      });
    }
  };

  const unlockAccount = async (account: UserAccount) => {
    try {
      const { error } = await supabase.rpc('unlock_account', {
        _target_user_id: account.user_id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account unlocked successfully",
      });

      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unlock account",
        variant: "destructive",
      });
    }
  };

  const openLockDialog = (account: UserAccount) => {
    setSelectedAccount(account);
    setIsLockDialogOpen(true);
  };

  const filteredAccounts = accounts.filter(account => {
    const fullName = `${account.first_name || ''} ${account.last_name || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           account.user_id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const isAccountLocked = (account: UserAccount) => {
    if (account.is_locked) return true;
    if (account.locked_until && new Date(account.locked_until) > new Date()) return true;
    return false;
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
      <Card>
        <CardHeader>
          <CardTitle>Account Security Management</CardTitle>
          <CardDescription>
            Lock or unlock user accounts to prevent unauthorized access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lock Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {account.first_name} {account.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.user_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.role === 'admin' ? 'destructive' : 'secondary'}>
                        {account.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isAccountLocked(account) ? (
                        <Badge variant="destructive">Locked</Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isAccountLocked(account) && (
                        <div className="text-sm">
                          {account.lock_reason && (
                            <div className="text-muted-foreground mb-1">
                              Reason: {account.lock_reason}
                            </div>
                          )}
                          {account.locked_until && (
                            <div className="text-muted-foreground">
                              Until: {format(new Date(account.locked_until), 'PPp')}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isAccountLocked(account) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlockAccount(account)}
                          className="flex items-center gap-2"
                        >
                          <Unlock className="h-4 w-4" />
                          Unlock
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openLockDialog(account)}
                          className="flex items-center gap-2"
                        >
                          <Lock className="h-4 w-4" />
                          Lock
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Account</DialogTitle>
            <DialogDescription>
              Lock the account for {selectedAccount?.first_name} {selectedAccount?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for locking (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for locking this account..."
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="until">Lock until (optional)</Label>
              <Input
                id="until"
                type="datetime-local"
                value={lockUntil}
                onChange={(e) => setLockUntil(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Leave empty for permanent lock
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsLockDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={lockAccount}>
              Lock Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}