import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BackgroundFX } from "@/components/BackgroundFX";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import SignUpPage from "./pages/SignUpPage";
import Tournaments from "./pages/Tournaments";
import Analytics from "./pages/Analytics";
import Results from "./pages/Results";
import Teams from "./pages/Teams";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Features from "./pages/Features";
import Contact from "./pages/Contact";
import Testimonials from "./pages/Testimonials";
import Blog from "./pages/Blog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen">
          <BackgroundFX />
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/results" element={<Results />} />
            <Route path="/features" element={<Features />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Login />} />
            <Route path="/signup" element={<SignUpPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
