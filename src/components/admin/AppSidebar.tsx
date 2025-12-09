import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  CreditCard,
  Users,
  Mail,
  Bell,
  BookOpen,
  Tag,
  DollarSign,
  Shield,
  UserCog,
  FileX,
  Gavel,
  UserCheck,
  Building2,
  Palette,
  BarChart3,
  Building
} from 'lucide-react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  globalOnly?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuItems: MenuSection[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Tournament Management',
    items: [
      { title: 'Tournaments', url: '/admin/tournaments', icon: Trophy },
      { title: 'Results', url: '/admin/results', icon: BarChart3, globalOnly: true },
    ]
  },
  {
    title: 'Financial Management',
    items: [
      { title: 'Payments', url: '/admin/payments', icon: CreditCard },
      { title: 'Payment Links', url: '/admin/payment-links', icon: CreditCard },
      { title: 'Promo Codes', url: '/admin/promos', icon: Tag, globalOnly: true },
      { title: 'Staff Calculator', url: '/admin/staff', icon: DollarSign, globalOnly: true },
    ]
  },
  {
    title: 'User Management',
    items: [
      { title: 'Judge Applications', url: '/admin/applications', icon: UserCheck },
      { title: 'Judges Manager', url: '/admin/judges', icon: Gavel },
      { title: 'Users', url: '/admin/users', icon: Users, globalOnly: true },
      { title: 'Role Access', url: '/admin/roles', icon: UserCog, globalOnly: true },
    ]
  },
  {
    title: 'Communication',
    items: [
      { title: 'Email Templates', url: '/admin/emails', icon: Mail },
      { title: 'Notifications', url: '/admin/notifications', icon: Bell },
      { title: 'Blog Manager', url: '/admin/blog', icon: BookOpen, globalOnly: true },
    ]
  },
  {
    title: 'System & Settings',
    items: [
      { title: 'Organizations', url: '/admin/organizations', icon: Building, globalOnly: true },
      { title: 'Website Builder', url: '/admin/site', icon: Palette, globalOnly: true },
      { title: 'Footer Content', url: '/admin/footer', icon: FileX, globalOnly: true },
      { title: 'Sponsors', url: '/admin/sponsors', icon: Building2, globalOnly: true },
      { title: 'Security', url: '/admin/security', icon: Shield, globalOnly: true },
    ]
  }
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin, adminScope } = useOptimizedAuth();

  const filteredMenuItems = useMemo(() => {
    if (isAdmin) return menuItems;

    return menuItems
      .map(section => ({
        ...section,
        items: section.items.filter(item => !item.globalOnly)
      }))
      .filter(section => section.items.length > 0);
  }, [isAdmin]);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  const scopeLabel = useMemo(() => {
    if (isAdmin) return null;
    if (adminScope.organizationAdmins.length > 0) {
      return `Org: ${adminScope.organizationAdmins[0].organization_name}`;
    }
    if (adminScope.tournamentAdmins.length > 0) {
      return `${adminScope.tournamentAdmins.length} Tournament(s)`;
    }
    return null;
  }, [isAdmin, adminScope]);

  return (
    <Sidebar className="w-60" variant="sidebar">
      <SidebarContent className="py-4">
        {/* Scope indicator for non-global admins */}
        {scopeLabel && (
          <div className="px-4 pb-4">
            <Badge variant="outline" className="text-xs">
              {scopeLabel}
            </Badge>
          </div>
        )}

        {filteredMenuItems.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls(item.url)}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
