
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryProvider } from '@/providers/QueryProvider';
import { OptimizedAuthProvider } from '@/hooks/useOptimizedAuth';
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/toaster"
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';

import { Footer } from '@/components/Footer';

// Conditionally load PerformanceMonitor only in development
const PerformanceMonitor = import.meta.env.DEV 
  ? React.lazy(() => import('@/components/PerformanceMonitor').then(module => ({ default: module.PerformanceMonitor })))
  : null;

// Lazy load all pages for better code splitting
const Index = React.lazy(() => import('@/pages/Index'));
const Tournaments = React.lazy(() => import('@/pages/Tournaments'));
const Results = React.lazy(() => import('@/pages/Results'));
const Blog = React.lazy(() => import('@/pages/Blog'));
const Teams = React.lazy(() => import('@/pages/Teams'));
const Login = React.lazy(() => import('@/pages/Login'));
const SignUpPage = React.lazy(() => import('@/pages/SignUpPage'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const UserAccount = React.lazy(() => import('@/pages/UserAccount'));
const AdminDashboard = React.lazy(() => import('@/pages/AdminDashboard'));
const GettingStarted = React.lazy(() => import('@/pages/GettingStarted'));
const Features = React.lazy(() => import('@/pages/Features'));
const About = React.lazy(() => import('@/pages/About'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const Testimonials = React.lazy(() => import('@/pages/Testimonials'));
const FAQ = React.lazy(() => import('@/pages/FAQ'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const NotFound = React.lazy(() => import('@/pages/NotFound'));
const TournamentRegistration = React.lazy(() => import('@/pages/TournamentRegistration'));
const MyTournaments = React.lazy(() => import('@/pages/MyTournaments'));
const TournamentLanding = React.lazy(() => import('@/pages/TournamentLanding'));
const TournamentRounds = React.lazy(() => import('@/pages/TournamentRounds'));
const TournamentMyMatch = React.lazy(() => import('@/pages/TournamentMyMatch'));
const TournamentPostings = React.lazy(() => import('@/pages/TournamentPostings'));
const PairingDetail = React.lazy(() => import('@/pages/PairingDetail'));
const JudgeDashboard = React.lazy(() => import('@/pages/JudgeDashboard'));
const Privacy = React.lazy(() => import('@/pages/Privacy'));
const Rules = React.lazy(() => import('@/pages/Rules'));
const Sponsor = React.lazy(() => import('@/pages/Sponsor'));
const SponsorDashboard = React.lazy(() => import('@/pages/SponsorDashboard'));
const Sponsors = React.lazy(() => import('@/pages/Sponsors'));
const LearnAboutDebate = React.lazy(() => import('@/pages/LearnAboutDebate'));
const TournamentDashboard = React.lazy(() => import('@/pages/TournamentDashboard'));
const ParticipantPortal = React.lazy(() => import('@/pages/ParticipantPortal'));
const MyDashboard = React.lazy(() => import('@/pages/MyDashboard'));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <QueryProvider>
      <Router>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Toaster />
            <div className="min-h-screen bg-background">
              <Navbar />
              {import.meta.env.DEV && PerformanceMonitor && (
                <Suspense fallback={null}>
                  <PerformanceMonitor />
                </Suspense>
              )}
              <main className="pt-16">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/tournaments" element={<Tournaments />} />
                    <Route path="/tournaments/:tournamentId" element={<TournamentLanding />} />
                    <Route path="/tournaments/:id/register" element={
                      <ProtectedRoute>
                        <TournamentRegistration />
                      </ProtectedRoute>
                    } />
                    <Route path="/tournament/:id/register" element={
                      <ProtectedRoute>
                        <TournamentRegistration />
                      </ProtectedRoute>
                    } />
                    <Route path="/results" element={<Results />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <MyDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/my-tournaments" element={
                      <ProtectedRoute>
                        <MyTournaments />
                      </ProtectedRoute>
                    } />
                    <Route path="/tournaments/:tournamentId/rounds" element={
                      <ProtectedRoute>
                        <TournamentRounds />
                      </ProtectedRoute>
                    } />
                    <Route path="/tournaments/:tournamentId/my-match" element={
                      <ProtectedRoute>
                        <TournamentMyMatch />
                      </ProtectedRoute>
                    } />
                    <Route path="/tournaments/:tournamentId/postings" element={
                      <ProtectedRoute>
                        <TournamentPostings />
                      </ProtectedRoute>
                    } />
                    <Route path="/tournaments/:tournamentId/dashboard" element={
                      <ProtectedRoute>
                        <TournamentDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/portal" element={
                      <ProtectedRoute>
                        <ParticipantPortal />
                      </ProtectedRoute>
                    } />
                    <Route path="/pairings/:pairingId" element={
                      <ProtectedRoute>
                        <PairingDetail />
                      </ProtectedRoute>
                    } />
                    <Route path="/sponsors" element={<Sponsors />} />
                    <Route path="/sponsor" element={<Sponsor />} />
                    <Route path="/sponsor/dashboard" element={
                      <ProtectedRoute>
                        <SponsorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/account" element={
                      <ProtectedRoute>
                        <UserAccount />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/*" element={
                      <ProtectedRoute>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/getting-started" element={<GettingStarted />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/testimonials" element={<Testimonials />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/rules" element={<Rules />} />
                    <Route path="/learn-about-debate" element={<LearnAboutDebate />} />
                    <Route path="/terms" element={<Navigate to="/rules" replace />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </Router>
    </QueryProvider>
  );
}

export default App;
