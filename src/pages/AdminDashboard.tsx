
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TournamentManager from "@/components/admin/TournamentManager";
import { UserManager } from "@/components/admin/UserManager";
import { PaymentManager } from "@/components/admin/PaymentManager";
import { ResultsManager } from "@/components/admin/ResultsManager";
import { EmailManager } from "@/components/admin/EmailManager";
import { SiteEditor } from "@/components/admin/SiteEditor";
import { BlogManager } from "@/components/admin/BlogManager";
import { NotificationsManager } from "@/components/admin/NotificationsManager";
import { TournamentCompetitorsManager } from "@/components/admin/TournamentCompetitorsManager";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  CreditCard, 
  BarChart3, 
  Mail, 
  Settings,
  FileText,
  Bell,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "overview";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login?type=admin" replace />;
  }

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage tournaments, users, payments, and site content
          </p>
        </div>

        <Tabs value={defaultTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Tournaments</span>
            </TabsTrigger>
            <TabsTrigger value="competitors" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Competitors</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Emails</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Quick stats would go here */}
              <div className="text-center p-6">
                <h3 className="text-lg font-semibold mb-2">Welcome to Admin Dashboard</h3>
                <p className="text-muted-foreground">
                  Use the tabs above to manage different aspects of your tournament platform.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tournaments">
            <TournamentManager />
          </TabsContent>

          <TabsContent value="competitors">
            <TournamentCompetitorsManager />
          </TabsContent>

          <TabsContent value="users">
            <UserManager />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentManager />
          </TabsContent>

          <TabsContent value="results">
            <ResultsManager />
          </TabsContent>

          <TabsContent value="emails">
            <EmailManager />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManager />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
