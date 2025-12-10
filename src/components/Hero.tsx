import { ArrowRight, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BoxedText } from "@/components/ui/boxed-text";
import { AnimatedGlobe } from "@/components/AnimatedGlobe";
export function Hero() {
  return <section className="relative overflow-hidden bg-gradient-hero">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-background/5" />
        
        {/* Floating Particles */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-xl animate-float" style={{
        animationDelay: '0s'
      }}></div>
        <div className="absolute top-20 right-20 w-48 h-48 bg-primary/8 rounded-full blur-2xl animate-float" style={{
        animationDelay: '2s'
      }}></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-primary/6 rounded-full blur-xl animate-float" style={{
        animationDelay: '4s'
      }}></div>
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-primary/4 rounded-full blur-3xl animate-float" style={{
        animationDelay: '1s'
      }}></div>
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-background/10"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-primary/5 via-transparent to-background/10"></div>
        
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZmlsdGVyIGlkPSJub2lzZSI+CiAgICA8ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iMSIgc2VlZD0iMiIvPgogICAgPGZlQ29sb3JNYXRyaXggdmFsdWVzPSIwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAxIDAiLz4KICA8L2ZpbHRlcj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIi8+Cjwvc3ZnPg==')]"></div>
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-32">
        <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <div className="space-y-4 sm:space-y-6">
              <Badge className="bg-card/20 text-foreground border-border hover:bg-card/30 text-sm sm:text-base backdrop-blur-sm">
                <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                Founded 2011 • $2.4M+ in Scholarships
              </Badge>
              
              {/* Boxed Text Headline */}
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-primary leading-tight">
                <span className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-2">
                  <BoxedText variant="bordered" size="hero" shape="default">
                    The Best
                  </BoxedText>
                  <BoxedText variant="ghost" size="hero">
                    Online
                  </BoxedText>
                </span>
                <span className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
                  <BoxedText variant="filled" size="hero" shape="default">
                    Debate
                  </BoxedText>
                  <BoxedText variant="bordered" size="hero">
                    Tournament
                  </BoxedText>
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0 font-secondary">
                Connecting debaters worldwide. Practice with competitors from all across the country with powermatching, 
                flexible scheduling, and affordable tournaments starting at just $30-35. Access exclusive member resources 
                including coaches, sourcebooks, and training materials. Multiple formats: LD, TP, Parli, and Moot Court.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start flex-wrap">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 min-h-[44px] sm:min-h-[56px] transition-all duration-300 hover:scale-105" onClick={() => window.location.href = '/tournaments'}>
                Sign Up Now
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              <Button variant="outline" size="lg" className="border-border text-foreground hover:bg-accent text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 min-h-[44px] sm:min-h-[56px] transition-all duration-300 hover:scale-105 backdrop-blur-sm" onClick={() => window.location.href = '/login'}>
                Members Page
              </Button>

              <Button variant="outline" size="lg" className="border-primary/50 text-primary hover:bg-primary/10 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-6 min-h-[44px] sm:min-h-[56px] transition-all duration-300 hover:scale-105 backdrop-blur-sm" onClick={() => window.location.href = '/host-tournament'}>
                Host Your Tournament
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-border">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">2,712+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Signups</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">$2.4M+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Scholarships Awarded</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-foreground">2011</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Founded</div>
              </div>
            </div>
          </div>

          {/* Animated Globe */}
          <div className="relative order-first lg:order-last">
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-3xl pointer-events-none z-10" />
            
            <AnimatedGlobe 
              className="rounded-3xl shadow-tournament w-full h-[300px] sm:h-[400px] lg:h-[500px] xl:h-[600px]"
            />
            
            {/* Floating Stats Cards */}
            <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20 bg-card/90 backdrop-blur-sm rounded-2xl p-2 sm:p-4 shadow-card border border-border/50">
              <div className="flex items-center gap-1 sm:gap-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-card-foreground">Live: 1,342</span>
              </div>
            </div>
            
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-20 bg-card/90 backdrop-blur-sm rounded-2xl p-2 sm:p-4 shadow-card border border-border/50">
              <div className="flex items-center gap-1 sm:gap-2">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-card-foreground">Win Rate: 78.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}