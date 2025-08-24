
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Plus, Trash2, Users, Eye } from 'lucide-react';

interface Observer {
  id: string;
  user_id: string;
  tournament_id: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

interface TournamentObserversManagerProps {
  tournamentId: string;
}

export function TournamentObserversManager({ tournamentId }: TournamentObserversManagerProps) {
  const [observers, setObservers] = useState<Observer[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObservers();
  }, [tournamentId]);

  const fetchObservers = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_observers')
        .select(`
          *,
          profiles!tournament_observers_user_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('tournament_id', tournamentId);

      if (error) throw error;

      // Get user emails through auth.users via a service function
      const observersWithNames = data?.map(observer => ({
        ...observer,
        user_name: observer.profiles 
          ? `${observer.profiles.first_name} ${observer.profiles.last_name}`.trim() 
          : 'Unknown User'
      })) || [];

      setObservers(observersWithNames);
    } catch (error: any) {
      console.error('Error fetching observers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournament observers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addObserver = async () => {
    if (!userEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a user email",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .eq('user_id', `(SELECT id FROM auth.users WHERE email = '${userEmail.toLowerCase()}')`)
        .single();

      if (userError) {
        // Try direct email lookup via service role function
        const { data: lookupData, error: lookupError } = await supabase.functions.invoke('lookup-user-by-email', {
          body: { email: userEmail.toLowerCase() }
        });

        if (lookupError || !lookupData?.user_id) {
          toast({
            title: "Error",
            description: "User not found with that email address",
            variant: "destructive",
          });
          return;
        }

        // Add observer using the found user ID
        const { error: insertError } = await supabase
          .from('tournament_observers')
          .insert([{
            tournament_id: tournamentId,
            user_id: lookupData.user_id
          }]);

        if (insertError) throw insertError;
      } else {
        // Add observer directly
        const { error: insertError } = await supabase
          .from('tournament_observers')
          .insert([{
            tournament_id: tournamentId,
            user_id: userData.user_id
          }]);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Observer added successfully",
      });

      setUserEmail('');
      fetchObservers();
    } catch (error: any) {
      console.error('Error adding observer:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Error",
          description: "User is already an observer for another tournament or this tournament",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add observer",
          variant: "destructive",
        });
      }
    }
  };

  const removeObserver = async (observerId: string) => {
    if (!confirm('Are you sure you want to remove this observer?')) return;

    try {
      const { error } = await supabase
        .from('tournament_observers')
        .delete()
        .eq('id', observerId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Observer removed successfully",
      });

      fetchObservers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove observer",
        variant: "destructive",
      });
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
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5" />
        <div>
          <h3 className="text-lg font-semibold">Tournament Observers</h3>
          <p className="text-sm text-muted-foreground">
            Manage users who can observe tournament content without participating
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Add Observer
          </CardTitle>
          <CardDescription>
            Add a user as an observer for this tournament. Users can only observe one tournament at a time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="user-email" className="sr-only">
                User Email
              </Label>
              <Input
                id="user-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="Enter user email address"
                onKeyPress={(e) => e.key === 'Enter' && addObserver()}
              />
            </div>
            <Button onClick={addObserver} disabled={!userEmail.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Observer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Observers ({observers.length})</CardTitle>
          <CardDescription>
            Users who can observe tournament content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {observers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No observers added for this tournament
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Observer</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {observers.map((observer) => (
                  <TableRow key={observer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{observer.user_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {observer.user_email || 'Email not available'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(observer.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-blue-600">
                        <Eye className="h-3 w-3 mr-1" />
                        Observer
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeObserver(observer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
