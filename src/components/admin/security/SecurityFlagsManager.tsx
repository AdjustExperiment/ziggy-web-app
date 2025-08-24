import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Search, RefreshCw, Eye, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface SecurityFlag {
  id: string;
  type: string;
  status: string;
  severity: string;
  source_table: string | null;
  source_id: string | null;
  related_user_id: string | null;
  raised_by_user_id: string | null;
  reason: string | null;
  details: any;
  created_at: string;
  resolved_at: string | null;
  resolved_by_user_id: string | null;
  resolution_note: string | null;
  related_user_name?: string;
  raised_by_name?: string;
  resolved_by_name?: string;
}

export function SecurityFlagsManager() {
  const [flags, setFlags] = useState<SecurityFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedFlag, setSelectedFlag] = useState<SecurityFlag | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      // Get security flags
      const { data: flagsData, error } = await supabase
        .from('security_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles for all unique user IDs
      const allUserIds = new Set<string>();
      flagsData?.forEach(flag => {
        if (flag.related_user_id) allUserIds.add(flag.related_user_id);
        if (flag.raised_by_user_id) allUserIds.add(flag.raised_by_user_id);
        if (flag.resolved_by_user_id) allUserIds.add(flag.resolved_by_user_id);
      });

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', Array.from(allUserIds));

      if (profilesError) throw profilesError;

      // Create a lookup map
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Transform data to include user names
      const transformedFlags: SecurityFlag[] = (flagsData || []).map(flag => {
        const relatedUser = flag.related_user_id ? profilesMap[flag.related_user_id] : null;
        const raisedBy = flag.raised_by_user_id ? profilesMap[flag.raised_by_user_id] : null;
        const resolvedBy = flag.resolved_by_user_id ? profilesMap[flag.resolved_by_user_id] : null;
        
        return {
          ...flag,
          related_user_name: relatedUser?.first_name && relatedUser?.last_name 
            ? `${relatedUser.first_name} ${relatedUser.last_name}`
            : 'Unknown User',
          raised_by_name: raisedBy?.first_name && raisedBy?.last_name 
            ? `${raisedBy.first_name} ${raisedBy.last_name}`
            : 'System',
          resolved_by_name: resolvedBy?.first_name && resolvedBy?.last_name 
            ? `${resolvedBy.first_name} ${resolvedBy.last_name}`
            : null
        };
      });

      setFlags(transformedFlags);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch security flags",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resolveFlag = async (flagId: string, status: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('security_flags')
        .update({
          status: status,
          resolved_at: new Date().toISOString(),
          resolved_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          resolution_note: resolutionNote || null
        })
        .eq('id', flagId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Flag ${status} successfully`,
      });

      setIsDetailDialogOpen(false);
      setResolutionNote('');
      fetchFlags();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to ${status} flag`,
        variant: "destructive",
      });
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'reviewing':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'dismissed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.related_user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || flag.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || flag.severity === severityFilter;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const openDetailDialog = (flag: SecurityFlag) => {
    setSelectedFlag(flag);
    setIsDetailDialogOpen(true);
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Security Flags</CardTitle>
              <CardDescription>
                Review and manage flagged messages, actions, and suspicious activities
              </CardDescription>
            </div>
            <Button onClick={fetchFlags} variant="outline" size="sm" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by reason, user, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Related User</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(flag.created_at), 'MMM dd, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{flag.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(flag.severity)}>
                        {flag.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(flag.status)}>
                        {flag.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {flag.related_user_name || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-xs">
                        {flag.reason || 'No reason provided'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openDetailDialog(flag)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredFlags.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No security flags found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Security Flag Details</DialogTitle>
            <DialogDescription>
              Review and resolve this security flag
            </DialogDescription>
          </DialogHeader>
          
          {selectedFlag && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Type</h4>
                  <Badge variant="outline">{selectedFlag.type}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Severity</h4>
                  <Badge variant={getSeverityBadgeVariant(selectedFlag.severity)}>
                    {selectedFlag.severity}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedFlag.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Raised By</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedFlag.raised_by_name}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-1">Related User</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedFlag.related_user_name || 'Not specified'}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Reason</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedFlag.reason || 'No reason provided'}
                </p>
              </div>

              {selectedFlag.details && Object.keys(selectedFlag.details).length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Details</h4>
                  <pre className="text-sm bg-muted p-3 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(selectedFlag.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedFlag.status === 'open' && (
                <div className="border-t pt-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="resolution">Resolution Note (optional)</Label>
                      <Textarea
                        id="resolution"
                        placeholder="Add a note about your decision..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => resolveFlag(selectedFlag.id, 'dismissed')}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Dismiss
                      </Button>
                      <Button
                        onClick={() => resolveFlag(selectedFlag.id, 'resolved')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {selectedFlag.status !== 'open' && selectedFlag.resolved_at && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-1">Resolved</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedFlag.resolved_at), 'PPpp')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Resolved By</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedFlag.resolved_by_name || 'System'}
                      </p>
                    </div>
                  </div>
                  {selectedFlag.resolution_note && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-1">Resolution Note</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedFlag.resolution_note}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}