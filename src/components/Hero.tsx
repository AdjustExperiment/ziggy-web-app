import { ArrowRight, Trophy, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-debate.jpg";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Trophy className="h-3 w-3 mr-1" />
                #1 Tournament Platform
              </Badge>
              
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                Elevate Your
                <span className="block bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent">
                  Debate Game
                </span>
              </h1>
              
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                Join the premier debate tournament platform where champions are made. 
                Advanced analytics, professional tournaments, and comprehensive tracking 
                for debaters at every level.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-white/90 shadow-glow text-lg px-8 py-6"
              >
                Join Tournament
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                View Analytics
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/20">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">1,342+</div>
                <div className="text-sm text-white/70">Active Debaters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">32</div>
                <div className="text-sm text-white/70">Live Tournaments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">94.2%</div>
                <div className="text-sm text-white/70">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
            <img
              src={heroImage}
              alt="Professional debate tournament"
              className="rounded-2xl shadow-tournament w-full h-[600px] object-cover"
            />
            
            {/* Floating Stats Cards */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-card">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Live: 1,342</span>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-card">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Win Rate: 78.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}