export function BackgroundFX() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-95" />
      
      {/* Animated glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-red-500/20 via-red-500/10 to-transparent rounded-full blur-3xl animate-float" />
      <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-radial from-red-600/15 via-red-600/8 to-transparent rounded-full blur-2xl animate-float animation-delay-1000" />
      <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-gradient-radial from-red-400/12 via-red-400/6 to-transparent rounded-full blur-xl animate-float animation-delay-2000" />
      
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