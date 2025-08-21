import { useEffect, useRef, useState } from 'react';

interface Logo {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface ScreenWipeProps {
  show: boolean;
  duration?: number;
  density?: number | 'auto';
  logoSrc?: string;
  onComplete: () => void;
}

export const ScreenWipe = ({
  show,
  duration = 1300,
  density = 'auto',
  logoSrc = '/src/assets/debate-logo.svg',
  onComplete
}: ScreenWipeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const logosRef = useRef<Logo[]>([]);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!show) return;

    // Handle reduced motion - just do a quick fade
    if (prefersReducedMotion) {
      const timer = setTimeout(onComplete, 300);
      return () => clearTimeout(timer);
    }

    // Preload logo image
    const img = new Image();
    img.onload = () => {
      setLogoImage(img);
      startAnimation();
    };
    img.onerror = () => {
      // Fallback - still start animation but without image
      console.warn('Logo image failed to load:', logoSrc);
      startAnimation();
    };
    img.src = logoSrc;

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [show]);

  const initializeLogos = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = canvas;
    
    // Calculate density based on viewport area
    let logoCount = density === 'auto' 
      ? Math.min(600, Math.max(200, Math.floor((width * height) / 8000)))
      : density;

    const logos: Logo[] = [];
    
    for (let i = 0; i < logoCount; i++) {
      logos.push({
        x: Math.random() * (width + 200) - 100, // Start slightly off-screen left/right
        y: Math.random() * height - height * 0.3, // Start above screen
        size: Math.random() * 40 + 16, // 16-56px
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8, // -4 to +4 degrees per frame
        opacity: Math.random() * 0.4 + 0.6 // 0.6 to 1.0
      });
    }
    
    logosRef.current = logos;
  };

  const startAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    initializeLogos();
    startTimeRef.current = performance.now();
    
    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const currentTime = performance.now();
    const elapsed = currentTime - (startTimeRef.current || currentTime);
    const progress = Math.min(elapsed / duration, 1);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw backdrop
    const backdropOpacity = Math.sin(progress * Math.PI) * 0.3; // Peak at middle, fade at start/end
    ctx.fillStyle = `hsla(0, 0%, 0%, ${backdropOpacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw logos
    const logos = logosRef.current;
    const fallSpeed = canvas.height * 1.2; // Move down 120% of screen height over duration
    
    logos.forEach(logo => {
      // Update position - move downward
      const baseY = logo.y + (fallSpeed * progress);
      
      // If logo has fallen off screen, respawn at top (for continuity during long animations)
      if (baseY > canvas.height + logo.size && progress < 0.9) {
        logo.y = -logo.size - Math.random() * 200;
      }
      
      // Update rotation
      logo.rotation += logo.rotationSpeed;
      
      // Calculate current position
      const currentY = logo.y + (fallSpeed * progress);
      
      // Skip if completely off screen
      if (currentY + logo.size < 0 || currentY - logo.size > canvas.height) return;
      
      // Draw logo
      ctx.save();
      ctx.globalAlpha = logo.opacity * (1 - Math.max(0, progress - 0.8) * 5); // Fade out in last 20%
      ctx.translate(logo.x, currentY);
      ctx.rotate((logo.rotation * Math.PI) / 180);
      
      if (logoImage) {
        // Draw the actual logo image
        ctx.drawImage(
          logoImage,
          -logo.size / 2,
          -logo.size / 2,
          logo.size,
          logo.size
        );
      } else {
        // Fallback: draw a circle
        ctx.fillStyle = 'hsl(355, 100%, 55%)';
        ctx.beginPath();
        ctx.arc(0, 0, logo.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete
      setTimeout(onComplete, 100); // Small delay before callback
    }
  };

  if (!show) return null;

  // Reduced motion fallback
  if (prefersReducedMotion) {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black/50 animate-fade-out pointer-events-none"
        style={{ animationDuration: '300ms' }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};