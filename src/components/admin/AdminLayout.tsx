import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Badge } from '@/components/ui/badge';
import { Building, Trophy } from 'lucide-react';
import { AdminSessionTimeout } from './AdminSessionTimeout';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const pageTitles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/tournaments': 'Tournaments',
  '/admin/payments': 'Payments',
  '/admin/payment-links': 'Payment Links',
  '/admin/applications': 'Judge Applications',
  '/admin/judges': 'Judges Manager',
  '/admin/users': 'Users',
  '/admin/emails': 'Email Templates',
  '/admin/notifications': 'Notifications',
  '/admin/blog': 'Blog Manager',
  '/admin/site': 'Website Builder',
  '/admin/promos': 'Promo Codes',
  '/admin/staff': 'Staff Calculator',
  '/admin/security': 'Security',
  '/admin/roles': 'Role Access',
  '/admin/footer': 'Footer Content',
  '/admin/sponsors': 'Sponsors',
  '/admin/results': 'Results',
  '/admin/organizations': 'Organizations',
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { isAdmin, adminScope } = useOptimizedAuth();
  
  const currentPageTitle = pageTitles[location.pathname] || 'Admin Dashboard';

  return (
    <SidebarProvider>
      <AdminSessionTimeout />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-background px-4 gap-4">
            <SidebarTrigger className="mr-2" />
            <div className="flex items-center gap-3 flex-1">
              <h1 className="text-lg font-semibold">{currentPageTitle}</h1>
              
              {/* Show admin scope context */}
              {isAdmin ? (
                <Badge variant="default" className="text-xs">
                  Global Admin
                </Badge>
              ) : adminScope.organizationAdmins.length > 0 ? (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {adminScope.organizationAdmins[0].organization_name}
                </Badge>
              ) : adminScope.tournamentAdmins.length > 0 ? (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {adminScope.tournamentAdmins.length} Tournament{adminScope.tournamentAdmins.length > 1 ? 's' : ''}
                </Badge>
              ) : null}
            </div>
          </header>

          {/* Scope context banner for non-global admins */}
          {!isAdmin && adminScope.organizationAdmins.length > 0 && (
            <div className="px-4 py-2 bg-secondary/50 border-b text-sm">
              <span className="text-muted-foreground">Organization Admin: </span>
              <span className="font-medium">{adminScope.organizationAdmins.map(o => o.organization_name).join(', ')}</span>
            </div>
          )}
          {!isAdmin && adminScope.organizationAdmins.length === 0 && adminScope.tournamentAdmins.length > 0 && (
            <div className="px-4 py-2 bg-accent/30 border-b text-sm">
              <span className="text-muted-foreground">Tournament Admin: </span>
              <span className="font-medium">{adminScope.tournamentAdmins.map(t => t.tournament_name).join(', ')}</span>
            </div>
          )}

          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
