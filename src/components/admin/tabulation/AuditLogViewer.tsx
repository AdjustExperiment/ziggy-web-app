import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  Search,
  Eye,
  RefreshCw,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import type { TabAuditEntry, TabAuditAction, TabAuditEntityType } from '@/types/tabulation';

interface AuditLogViewerProps {
  tournamentId: string;
}

interface AuditEntryWithUser extends TabAuditEntry {
  user_name?: string;
}

// Action type display colors
const ACTION_COLORS: Record<TabAuditAction, string> = {
  score_override: 'bg-yellow-500/20 text-yellow-700',
  forfeit: 'bg-red-500/20 text-red-700',
  dq: 'bg-red-500/20 text-red-700',
  manual_rank: 'bg-blue-500/20 text-blue-700',
  bye_assigned: 'bg-purple-500/20 text-purple-700',
  result_correction: 'bg-orange-500/20 text-orange-700',
  speaker_points_edit: 'bg-green-500/20 text-green-700',
  tiebreaker_override: 'bg-indigo-500/20 text-indigo-700',
};

// Friendly action names
const ACTION_LABELS: Record<TabAuditAction, string> = {
  score_override: 'Score Override',
  forfeit: 'Forfeit',
  dq: 'Disqualification',
  manual_rank: 'Manual Rank',
  bye_assigned: 'Bye Assigned',
  result_correction: 'Result Correction',
  speaker_points_edit: 'Speaker Points Edit',
  tiebreaker_override: 'Tiebreaker Override',
};

// Entity type labels
const ENTITY_LABELS: Record<TabAuditEntityType, string> = {
  pairing: 'Pairing',
  registration: 'Registration',
  round_result: 'Round Result',
  speaker_result: 'Speaker Result',
  computed_standing: 'Standing',
  head_to_head: 'Head-to-Head',
};

export function AuditLogViewer({ tournamentId }: AuditLogViewerProps) {
  const [entries, setEntries] = useState<AuditEntryWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntryWithUser | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  useEffect(() => {
    fetchAuditLog();
  }, [tournamentId]);

  const fetchAuditLog = async () => {
    setLoading(true);
    try {
      // Fetch audit log entries - using type assertion for table not in generated types
      const { data: logsData, error: logsError } = await (supabase
        .from('tab_audit_log' as any)
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false })
        .limit(200) as any);

      if (logsError) throw logsError;

      const typedLogs = (logsData || []) as TabAuditEntry[];

      // Get user profiles for all unique user IDs
      const userIds = [...new Set(typedLogs.map(log => log.user_id).filter(Boolean))] as string[];

      let profilesMap: Record<string, { first_name: string; last_name: string }> = {};

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, { first_name: string; last_name: string }>);
        }
      }

      // Transform data to include user names
      const transformedEntries: AuditEntryWithUser[] = typedLogs.map(log => {
        const profile = log.user_id ? profilesMap[log.user_id] : null;
        return {
          ...log,
          user_name: profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : log.user_id
              ? 'Unknown User'
              : 'System'
        };
      });

      setEntries(transformedEntries);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
    if (entityFilter !== 'all' && entry.entity_type !== entityFilter) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        entry.action.toLowerCase().includes(searchLower) ||
        entry.entity_type.toLowerCase().includes(searchLower) ||
        entry.reason?.toLowerCase().includes(searchLower) ||
        entry.user_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Render difference between old and new values
  const renderValueDiff = (entry: AuditEntryWithUser) => {
    return (
      <div className="space-y-2 text-sm">
        {entry.old_value && (
          <div>
            <span className="font-medium text-red-600">Old:</span>
            <pre className="bg-red-50 dark:bg-red-950/30 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(entry.old_value, null, 2)}
            </pre>
          </div>
        )}
        {entry.new_value && (
          <div>
            <span className="font-medium text-green-600">New:</span>
            <pre className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(entry.new_value, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  const openDetailDialog = (entry: AuditEntryWithUser) => {
    setSelectedEntry(entry);
    setIsDetailDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Audit Log
            </CardTitle>
            <CardDescription>
              Track all tabulation changes and modifications
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAuditLog}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action, entity, reason, or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Action type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {Object.entries(ACTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Entity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {Object.entries(ENTITY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entries table */}
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No audit log entries found</p>
            <p className="text-sm">Changes will appear here as they are made</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead className="hidden md:table-cell">Reason</TableHead>
                  <TableHead className="w-[80px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.user_name}
                    </TableCell>
                    <TableCell>
                      <Badge className={ACTION_COLORS[entry.action] || 'bg-gray-500/20'}>
                        {ACTION_LABELS[entry.action] || entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {ENTITY_LABELS[entry.entity_type] || entry.entity_type.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[200px] truncate">
                      {entry.reason || '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailDialog(entry)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Showing {filteredEntries.length} of {entries.length} entries
        </p>
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Audit Entry Details</DialogTitle>
            <DialogDescription>
              {selectedEntry && format(new Date(selectedEntry.created_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Action</span>
                  <div className="mt-1">
                    <Badge className={ACTION_COLORS[selectedEntry.action]}>
                      {ACTION_LABELS[selectedEntry.action]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Entity</span>
                  <p className="mt-1">
                    {ENTITY_LABELS[selectedEntry.entity_type] || selectedEntry.entity_type.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">User</span>
                  <p className="mt-1">{selectedEntry.user_name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Entity ID</span>
                  <p className="mt-1 text-sm font-mono truncate">{selectedEntry.entity_id}</p>
                </div>
              </div>
              {selectedEntry.reason && (
                <div>
                  <span className="text-sm text-muted-foreground">Reason</span>
                  <p className="mt-1">{selectedEntry.reason}</p>
                </div>
              )}
              {(selectedEntry.old_value || selectedEntry.new_value) && (
                <div>
                  <span className="text-sm text-muted-foreground">Changes</span>
                  <div className="mt-1">
                    {renderValueDiff(selectedEntry)}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
