import React from 'react';
import { cn } from '@/lib/utils';

interface FluidBlobBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  variant?: 'primary' | 'accent' | 'muted';
}

export const FluidBlobBackground: React.FC<FluidBlobBackgroundProps> = ({
  className,
  intensity = 'medium',
  variant = 'primary'
}) => {
  const getBlobStyles = () => {
    const intensityMap = {
      subtle: { opacity: '0.03', blur: 'blur-3xl' },
      medium: { opacity: '0.05', blur: 'blur-3xl' },
      strong: { opacity: '0.08', blur: 'blur-2xl' }
    };

    const variantMap = {
      primary: 'bg-primary',
      accent: 'bg-accent-foreground', 
      muted: 'bg-muted-foreground'
    };

    return {
      opacity: intensityMap[intensity].opacity,
      blur: intensityMap[intensity].blur,
      color: variantMap[variant]
    };
  };

  const { opacity, blur, color } = getBlobStyles();

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-0 overflow-hidden", className)}>
      {/* Large flowing blob */}
      <div 
        className={cn(
          "absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full",
          color,
          blur,
          "animate-orb-1 motion-reduce:animate-none"
        )}
        style={{ opacity }}
      />
      
      {/* Medium blob */}
      <div 
        className={cn(
          "absolute top-1/3 right-10 w-[400px] h-[400px] rounded-full",
          color,
          blur,
          "animate-orb-2 motion-reduce:animate-none"
        )}
        style={{ opacity }}
      />
      
      {/* Small accent blob */}
      <div 
        className={cn(
          "absolute bottom-20 left-1/4 w-[300px] h-[300px] rounded-full",
          color,
          blur,
          "animate-orb-3 motion-reduce:animate-none"
        )}
        style={{ opacity }}
      />

      {/* Additional flowing blobs */}
      <div 
        className={cn(
          "absolute top-2/3 left-2/3 w-[450px] h-[450px] rounded-full",
          color,
          blur,
          "animate-float motion-reduce:animate-none"
        )}
        style={{ opacity: parseFloat(opacity) * 0.7 }}
      />

      <div 
        className={cn(
          "absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full",
          color,
          blur,
          "animate-orb-1 motion-reduce:animate-none"
        )}
        style={{ 
          opacity: parseFloat(opacity) * 0.8,
          animationDelay: '5s'
        }}
      />
    </div>
  );
};