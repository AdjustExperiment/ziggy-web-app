import { ArrowRight, Trophy, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-debate.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-32">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="space-y-4 sm:space-y-6">
              <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-sm sm:text-base">
                <span className="inline-block w-2 h-2 bg-white rounded-full mr-2"></span>
                Founded 2011 • $2.4M+ in Scholarships
              </Badge>
              
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-primary leading-tight">
                The Best Online
                <span className="block bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
                  Debate Tournament
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-secondary">
                Connecting debaters worldwide. Practice with competitors from all across the country with powermatching, 
                flexible scheduling, and affordable tournaments starting at just $30-35. Multiple debate formats including 
                LD, TP, Parli, and Moot Court.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-red-500 text-white hover:bg-red-600 shadow-glow text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 min-h-[44px] sm:min-h-[56px]"
              >
                Sign Up Now
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 min-h-[44px] sm:min-h-[56px]"
              >
                Members Page
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">2,712+</div>
                <div className="text-xs sm:text-sm text-white/70">Total Signups</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">$2.4M+</div>
                <div className="text-xs sm:text-sm text-white/70">Scholarships Awarded</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">2011</div>
                <div className="text-xs sm:text-sm text-white/70">Founded</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative order-first lg:order-last">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
            <img
              src={heroImage}
              alt="Professional debate tournament"
              className="rounded-2xl shadow-tournament w-full h-[300px] sm:h-[400px] lg:h-[500px] xl:h-[600px] object-cover"
            />
            
            {/* Floating Stats Cards */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-4 shadow-card">
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium">Live: 1,342</span>
              </div>
            </div>
            
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-4 shadow-card">
              <div className="flex items-center gap-1 sm:gap-2">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium">Win Rate: 78.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}