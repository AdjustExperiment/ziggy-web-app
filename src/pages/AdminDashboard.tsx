import React, { useState, useMemo } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
import { RoleAccessManager } from '@/components/admin/RoleAccessManager';
import { BallotRevealSettings } from '@/components/admin/BallotRevealSettings';
import { FooterContentManager } from '@/components/admin/FooterContentManager';
import SponsorsManager from '@/components/admin/SponsorsManager';
import { ResultsManager } from '@/components/admin/ResultsManager';

export default function AdminDashboard() {
  const { isAdmin } = useOptimizedAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="tournaments" element={<TournamentManager />} />
        <Route path="tabulation" element={<TabulationPlatform />} />
        <Route path="payments" element={<PaymentManager />} />
        <Route path="applications" element={<JudgeApplicationManager />} />
        <Route path="judges" element={<EnhancedJudgesManager />} />
        <Route path="users" element={<UserManager />} />
        <Route path="emails" element={<EnhancedEmailTemplateManager />} />
        <Route path="notifications" element={<NotificationsManager />} />
        <Route path="blog" element={<BlogManager />} />
        <Route path="site" element={<SiteEditor />} />
        <Route path="promos" element={<PromoCodesManager />} />
        <Route path="staff" element={<StaffRevenueCalculator />} />
        <Route path="security" element={<SecurityDashboard />} />
        <Route path="roles" element={<RoleAccessManager />} />
        <Route path="ballot-reveal" element={<BallotRevealSettings />} />
        <Route path="footer" element={<FooterContentManager />} />
        <Route path="sponsors" element={<SponsorsManager />} />
        <Route path="results" element={<ResultsManager />} />
      </Routes>
    </AdminLayout>
  );
}
