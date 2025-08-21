import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, FileText, Trophy, Settings, Users, CreditCard, Mail } from 'lucide-react';
import { BlogManager } from '@/components/admin/BlogManager';
import { ResultsManager } from '@/components/admin/ResultsManager';
import { UserManager } from '@/components/admin/UserManager';
import { PaymentManager } from '@/components/admin/PaymentManager';
import { EmailManager } from '@/components/admin/EmailManager';
import TournamentManager from '@/components/admin/TournamentManager';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'overview';
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', tab);
    }
    setSearchParams(newParams);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {profile?.first_name || user?.email}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Tournaments
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Blog Posts
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Emails
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Tournaments</CardTitle>
                  <CardDescription>Create and manage tournaments</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTabChange('tournaments')} 
                    className="w-full"
                  >
                    Manage Tournaments
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>Manage your blog content</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTabChange('blog')} 
                    className="w-full"
                  >
                    Manage Blog
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tournament Results</CardTitle>
                  <CardDescription>Update competition results</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTabChange('results')} 
                    className="w-full"
                  >
                    Manage Results
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Create and manage user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTabChange('users')} 
                    className="w-full"
                  >
                    Manage Users
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Management</CardTitle>
                  <CardDescription>Monitor payments and configure handlers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTabChange('payments')} 
                    className="w-full"
                  >
                    Manage Payments
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Management</CardTitle>
                  <CardDescription>Configure automated emails and templates</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleTabChange('emails')} 
                    className="w-full"
                  >
                    Manage Emails
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure platform settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    className="w-full"
                  >
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tournaments" className="mt-6">
            <TournamentManager />
          </TabsContent>

          <TabsContent value="blog" className="mt-6">
            <BlogManager />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <ResultsManager />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManager />
          </TabsContent>

          <TabsContent value="payments" className="mt-6">
            <PaymentManager activeTab={activeTab} setActiveTab={handleTabChange} />
          </TabsContent>

          <TabsContent value="emails" className="mt-6">
            <EmailManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
