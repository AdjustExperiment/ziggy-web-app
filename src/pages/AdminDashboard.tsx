import React from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useNavigate, Navigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Dashboard } from '@/components/admin/Dashboard';
import { TournamentManager } from '@/components/admin/TournamentManager';
import { PaymentManager } from '@/components/admin/PaymentManager';
import { JudgeApplicationManager } from '@/components/admin/JudgeApplicationManager';
import { EnhancedJudgesManager } from '@/components/admin/EnhancedJudgesManager';
import { UserManager } from '@/components/admin/UserManager';
import { EnhancedEmailTemplateManager } from '@/components/admin/EnhancedEmailTemplateManager';
import { NotificationsManager } from '@/components/admin/NotificationsManager';
import { BlogManager } from '@/components/admin/BlogManager';
import { WebsiteBuilder } from '@/components/admin/WebsiteBuilder';
import { PromoCodesManager } from '@/components/admin/PromoCodesManager';
import { StaffRevenueCalculator } from '@/components/admin/StaffRevenueCalculator';
import { SecurityDashboard } from '@/components/admin/SecurityDashboard';
import { RoleAccessManager } from '@/components/admin/RoleAccessManager';
import { FooterContentManager } from '@/components/admin/FooterContentManager';
import SponsorsManager from '@/components/admin/SponsorsManager';
import { ResultsManager } from '@/components/admin/ResultsManager';
import PaymentLinksManager from '@/components/admin/PaymentLinksManager';
import { OrganizationManager } from '@/components/admin/OrganizationManager';

// Wrapper component for global-admin-only routes
function GlobalAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useOptimizedAuth();
  
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/admin" replace />;
  
  return <>{children}</>;
}

export default function AdminDashboard() {
  const { isAdmin, hasAnyAdminAccess, loading } = useOptimizedAuth();
  const navigate = useNavigate();

  // Wait for auth to load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if no admin access at all
  if (!hasAnyAdminAccess) {
    navigate('/');
    return null;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="tournaments" element={<TournamentManager />} />
        <Route path="payments" element={<PaymentManager />} />
        <Route path="payment-links" element={<PaymentLinksManager />} />
        <Route path="applications" element={<JudgeApplicationManager />} />
        <Route path="judges" element={<EnhancedJudgesManager />} />
        
        {/* Global admin only routes */}
        <Route path="users" element={
          <GlobalAdminRoute><UserManager /></GlobalAdminRoute>
        } />
        <Route path="roles" element={
          <GlobalAdminRoute><RoleAccessManager /></GlobalAdminRoute>
        } />
        <Route path="promos" element={
          <GlobalAdminRoute><PromoCodesManager /></GlobalAdminRoute>
        } />
        <Route path="staff" element={
          <GlobalAdminRoute><StaffRevenueCalculator /></GlobalAdminRoute>
        } />
        <Route path="blog" element={
          <GlobalAdminRoute><BlogManager /></GlobalAdminRoute>
        } />
        <Route path="site" element={
          <GlobalAdminRoute><WebsiteBuilder /></GlobalAdminRoute>
        } />
        <Route path="footer" element={
          <GlobalAdminRoute><FooterContentManager /></GlobalAdminRoute>
        } />
        <Route path="sponsors" element={
          <GlobalAdminRoute><SponsorsManager /></GlobalAdminRoute>
        } />
        <Route path="security" element={
          <GlobalAdminRoute><SecurityDashboard /></GlobalAdminRoute>
        } />
        <Route path="results" element={
          <GlobalAdminRoute><ResultsManager /></GlobalAdminRoute>
        } />
        <Route path="organizations" element={
          <GlobalAdminRoute><OrganizationManager /></GlobalAdminRoute>
        } />

        {/* Available to all admin types */}
        <Route path="emails" element={<EnhancedEmailTemplateManager />} />
        <Route path="notifications" element={<NotificationsManager />} />
        
        {/* Legacy routes - redirect to tournaments */}
        <Route path="tabulation" element={<Navigate to="/admin/tournaments" replace />} />
        <Route path="ballot-reveal" element={<Navigate to="/admin/tournaments" replace />} />
      </Routes>
    </AdminLayout>
  );
}
