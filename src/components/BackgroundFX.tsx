export function BackgroundFX() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-90" />
      
      {/* Animated glow orbs using semantic tokens - increased sizes and opacity */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-radial from-primary/40 via-primary/20 to-transparent rounded-full blur-3xl animate-orb-1 motion-reduce:animate-none" />
      <div className="absolute top-3/4 right-1/4 w-[550px] h-[550px] bg-gradient-radial from-primary-glow/35 via-primary-glow/18 to-transparent rounded-full blur-2xl animate-orb-2 motion-reduce:animate-none" />
      <div className="absolute top-1/2 left-3/4 w-[500px] h-[500px] bg-gradient-radial from-primary/30 via-primary/15 to-transparent rounded-full blur-xl animate-orb-3 motion-reduce:animate-none" />
      
      {/* Additional floating elements */}
      <div className="absolute top-10 right-1/3 w-[350px] h-[350px] bg-gradient-radial from-accent/15 via-accent/8 to-transparent rounded-full blur-2xl animate-float motion-reduce:animate-none" />
      <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-gradient-radial from-primary/12 via-primary/6 to-transparent rounded-full blur-3xl animate-orb-1 motion-reduce:animate-none" />
      
      {/* Extra floating blob */}
      <div className="absolute top-1/3 right-1/5 w-[300px] h-[300px] bg-gradient-radial from-primary-glow/18 via-primary-glow/9 to-transparent rounded-full blur-2xl animate-orb-2 motion-reduce:animate-none" />
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}