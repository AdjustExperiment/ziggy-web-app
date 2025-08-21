import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, FileText, Trophy, Settings, Users } from 'lucide-react';
import { BlogManager } from '@/components/admin/BlogManager';
import { ResultsManager } from '@/components/admin/ResultsManager';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Overview
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
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>Manage your blog content</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab('blog')} 
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
                    onClick={() => setActiveTab('results')} 
                    className="w-full"
                  >
                    Manage Results
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => setActiveTab('users')} 
                    className="w-full"
                    variant="outline"
                  >
                    View Users
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="blog" className="mt-6">
            <BlogManager />
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            <ResultsManager />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  User management features will be implemented here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}