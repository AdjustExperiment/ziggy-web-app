import React, { useState, useMemo } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Trophy,
  BarChart3,
  CreditCard,
  ClipboardList,
  Gavel,
  Users,
  Mail,
  Bell,
  FileText,
  Globe,
  Tag,
  Briefcase,
  Shield,
  SquareStack,
} from 'lucide-react';
import { Dashboard } from '@/components/admin/Dashboard';
import { TournamentManager } from '@/components/admin/TournamentManager';
import { TabulationPlatform } from '@/components/admin/TabulationPlatform';
import { PaymentManager } from '@/components/admin/PaymentManager';
import { JudgeApplicationManager } from '@/components/admin/JudgeApplicationManager';
import { EnhancedJudgesManager } from '@/components/admin/EnhancedJudgesManager';
import { UserManager } from '@/components/admin/UserManager';
import { EnhancedEmailTemplateManager } from '@/components/admin/EnhancedEmailTemplateManager';
import { NotificationsManager } from '@/components/admin/NotificationsManager';
import { BlogManager } from '@/components/admin/BlogManager';
import { SiteEditor } from '@/components/admin/SiteEditor';
import { PromoCodesManager } from '@/components/admin/PromoCodesManager';
import { StaffRevenueCalculator } from '@/components/admin/StaffRevenueCalculator';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';
import { FooterContentManager } from '@/components/admin/FooterContentManager';

export default function AdminDashboard() {
  const { signOut, isAdmin } = useOptimizedAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const menuItems = [
    { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { value: 'tournaments', label: 'Tournaments', icon: Trophy },
    { value: 'tabulation', label: 'Tabulation', icon: BarChart3 },
    { value: 'payments', label: 'Payments', icon: CreditCard },
    { value: 'applications', label: 'Applications', icon: ClipboardList },
    { value: 'judges', label: 'Judges', icon: Gavel },
    { value: 'users', label: 'Users', icon: Users },
    { value: 'emails', label: 'Emails', icon: Mail },
    { value: 'notifications', label: 'Notifications', icon: Bell },
    { value: 'blog', label: 'Blog', icon: FileText },
    { value: 'site', label: 'Site Editor', icon: Globe },
    { value: 'promos', label: 'Promo Codes', icon: Tag },
    { value: 'staff', label: 'Staff Calc', icon: Briefcase },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'footer', label: 'Footer', icon: SquareStack },
  ];

  const renderTabContent = useMemo(() => {
    const components = {
      dashboard: <Dashboard />,
      tournaments: <TournamentManager />,
      tabulation: <TabulationPlatform />,
      payments: <PaymentManager activeTab={activeTab} setActiveTab={setActiveTab} />,
      applications: <JudgeApplicationManager />,
      judges: <EnhancedJudgesManager />,
      users: <UserManager />,
      emails: <EnhancedEmailTemplateManager />,
      notifications: <NotificationsManager />,
      blog: <BlogManager />,
      site: <SiteEditor />,
      promos: <PromoCodesManager />,
      staff: <StaffRevenueCalculator />,
      security: <SecurityDashboard />,
      footer: <FooterContentManager />,
    };

    return components[activeTab as keyof typeof components] || <Dashboard />;
  }, [activeTab]);

  const sidebar = (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.value}>
          <SidebarMenuButton
            isActive={activeTab === item.value}
            onClick={() => setActiveTab(item.value)}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <AdminLayout title="Admin Dashboard" onLogout={signOut} sidebar={sidebar}>
      {renderTabContent}
    </AdminLayout>
  );
}
