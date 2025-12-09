import React from 'react';
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
  BarChart3
} from 'lucide-react';

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

const menuItems = [
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
      { title: 'Results', url: '/admin/results', icon: BarChart3 },
    ]
  },
  {
    title: 'Financial Management',
    items: [
      { title: 'Payments', url: '/admin/payments', icon: CreditCard },
      { title: 'Payment Links', url: '/admin/payment-links', icon: CreditCard },
      { title: 'Promo Codes', url: '/admin/promos', icon: Tag },
      { title: 'Staff Calculator', url: '/admin/staff', icon: DollarSign },
    ]
  },
  {
    title: 'User Management',
    items: [
      { title: 'Judge Applications', url: '/admin/applications', icon: UserCheck },
      { title: 'Judges Manager', url: '/admin/judges', icon: Gavel },
      { title: 'Users', url: '/admin/users', icon: Users },
      { title: 'Role Access', url: '/admin/roles', icon: UserCog },
    ]
  },
  {
    title: 'Communication',
    items: [
      { title: 'Email Templates', url: '/admin/emails', icon: Mail },
      { title: 'Notifications', url: '/admin/notifications', icon: Bell },
      { title: 'Blog Manager', url: '/admin/blog', icon: BookOpen },
    ]
  },
  {
    title: 'System & Settings',
    items: [
      { title: 'Website Builder', url: '/admin/site', icon: Palette },
      { title: 'Footer Content', url: '/admin/footer', icon: FileX },
      { title: 'Sponsors', url: '/admin/sponsors', icon: Building2 },
      { title: 'Security', url: '/admin/security', icon: Shield },
    ]
  }
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className="w-60" variant="sidebar">
      <SidebarContent className="py-4">
        {menuItems.map((section) => (
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