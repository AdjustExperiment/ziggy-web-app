export interface SectionFXProps {
  variant?: "default" | "hero" | "accent" | "muted";
  intensity?: "low" | "medium" | "high";
  className?: string;
}

export function SectionFX({ 
  variant = "default", 
  intensity = "medium",
  className 
}: SectionFXProps) {
  const getIntensityMultiplier = () => {
    switch (intensity) {
      case "low": return { opacity: "15", blur: "2xl" };
      case "medium": return { opacity: "25", blur: "3xl" };
      case "high": return { opacity: "40", blur: "3xl" };
      default: return { opacity: "25", blur: "3xl" };
    }
  };

  const { opacity, blur } = getIntensityMultiplier();

  const getBlobColors = () => {
    switch (variant) {
      case "hero":
        return {
          blob1: `from-primary/${opacity} via-primary/${Math.floor(Number(opacity) / 2)} to-transparent`,
          blob2: `from-primary-glow/${Math.floor(Number(opacity) * 0.8)} via-primary-glow/${Math.floor(Number(opacity) / 3)} to-transparent`,
          blob3: `from-accent/${Math.floor(Number(opacity) * 0.6)} via-accent/${Math.floor(Number(opacity) / 4)} to-transparent`
        };
      case "accent":
        return {
          blob1: `from-accent/${opacity} via-accent/${Math.floor(Number(opacity) / 2)} to-transparent`,
          blob2: `from-primary/${Math.floor(Number(opacity) * 0.7)} via-primary/${Math.floor(Number(opacity) / 3)} to-transparent`,
          blob3: `from-primary-glow/${Math.floor(Number(opacity) * 0.5)} via-primary-glow/${Math.floor(Number(opacity) / 4)} to-transparent`
        };
      case "muted":
        return {
          blob1: `from-muted/${opacity} via-muted/${Math.floor(Number(opacity) / 2)} to-transparent`,
          blob2: `from-primary/${Math.floor(Number(opacity) * 0.4)} via-primary/${Math.floor(Number(opacity) / 5)} to-transparent`,
          blob3: `from-accent/${Math.floor(Number(opacity) * 0.3)} via-accent/${Math.floor(Number(opacity) / 6)} to-transparent`
        };
      default:
        return {
          blob1: `from-primary/${Math.floor(Number(opacity) * 0.8)} via-primary/${Math.floor(Number(opacity) / 2)} to-transparent`,
          blob2: `from-primary-glow/${Math.floor(Number(opacity) * 0.6)} via-primary-glow/${Math.floor(Number(opacity) / 3)} to-transparent`,
          blob3: `from-accent/${Math.floor(Number(opacity) * 0.4)} via-accent/${Math.floor(Number(opacity) / 4)} to-transparent`
        };
    }
  };

  const { blob1, blob2, blob3 } = getBlobColors();

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Primary animated blob */}
      <div 
        className={`absolute top-1/4 left-1/6 w-[400px] h-[400px] bg-gradient-radial ${blob1} rounded-full blur-${blur} animate-orb-1 motion-reduce:animate-none`} 
      />
      
      {/* Secondary floating blob */}
      <div 
        className={`absolute top-3/4 right-1/5 w-[300px] h-[300px] bg-gradient-radial ${blob2} rounded-full blur-${blur} animate-orb-2 motion-reduce:animate-none`} 
      />
      
      {/* Accent blob */}
      <div 
        className={`absolute top-1/2 right-1/3 w-[250px] h-[250px] bg-gradient-radial ${blob3} rounded-full blur-2xl animate-float motion-reduce:animate-none`} 
      />

      {/* Additional subtle texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}