
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Tournaments from '@/pages/Tournaments';
import Results from '@/pages/Results';
import Blog from '@/pages/Blog';
import Teams from '@/pages/Teams';
import Login from '@/pages/Login';
import SignUpPage from '@/pages/SignUpPage';
import Dashboard from '@/pages/Dashboard';
import UserAccount from '@/pages/UserAccount';
import AdminDashboard from '@/pages/AdminDashboard';
import GettingStarted from '@/pages/GettingStarted';
import Features from '@/pages/Features';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Testimonials from '@/pages/Testimonials';
import FAQ from '@/pages/FAQ';
import Analytics from '@/pages/Analytics';
import NotFound from '@/pages/NotFound';
import TournamentRegistration from '@/pages/TournamentRegistration';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/toaster"
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MyPairings } from '@/components/MyPairings';
import { Navbar } from '@/components/Navbar';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Toaster />
          <div className="min-h-screen bg-background">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournaments/:id/register" element={<TournamentRegistration />} />
                <Route path="/results" element={<Results />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/my-pairings" element={
                  <ProtectedRoute>
                    <div className="container mx-auto px-4 py-8">
                      <MyPairings />
                    </div>
                  </ProtectedRoute>
                } />
                <Route path="/account" element={
                  <ProtectedRoute>
                    <UserAccount />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
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
                <Route path="/analytics" element={<Analytics />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
