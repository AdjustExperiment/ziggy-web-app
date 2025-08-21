export function BackgroundFX() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-95" />
      
      {/* Animated glow orbs using semantic tokens */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-primary/20 via-primary/10 to-transparent rounded-full blur-3xl animate-orb-1" />
      <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-radial from-primary-glow/15 via-primary-glow/8 to-transparent rounded-full blur-2xl animate-orb-2" />
      <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-gradient-radial from-primary/12 via-primary/6 to-transparent rounded-full blur-xl animate-orb-3" />
      
      {/* Additional floating elements */}
      <div className="absolute top-10 right-1/3 w-48 h-48 bg-gradient-radial from-accent/8 via-accent/4 to-transparent rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-radial from-primary/6 via-primary/3 to-transparent rounded-full blur-3xl animate-orb-1" />
      
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