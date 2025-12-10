import { useEffect, useRef, useCallback, useState } from 'react';
import createGlobe from 'cobe';
import { cn } from '@/lib/utils';
import { WORLD_CAPITALS, CONNECTION_ROUTES } from '@/data/capitals';
import { projectToCanvas, interpolateGreatCircle, drawArc } from '@/lib/globeUtils';

interface AnimatedGlobeProps {
  className?: string;
}

interface ArcState {
  connectionIndex: number;
  progress: number;
  active: boolean;
}

export function AnimatedGlobe({ className }: AnimatedGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arcCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const phiRef = useRef(0);
  const arcsRef = useRef<ArcState[]>([]);
  const lastArcTimeRef = useRef(0);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Initialize arcs
  useEffect(() => {
    arcsRef.current = CONNECTION_ROUTES.slice(0, 3).map((_, i) => ({
      connectionIndex: i,
      progress: 0,
      active: true,
    }));
  }, []);

  // Main globe effect
  useEffect(() => {
    let globe: ReturnType<typeof createGlobe> | undefined;
    let animationId: number;
    
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const arcCanvas = arcCanvasRef.current;
    
    if (!canvas || !arcCanvas || !container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      const dpr = Math.min(window.devicePixelRatio, 2);
      
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      
      arcCanvas.width = size * dpr;
      arcCanvas.height = size * dpr;
      arcCanvas.style.width = `${size}px`;
      arcCanvas.style.height = `${size}px`;
      
      return { size, dpr };
    };

    const { size, dpr } = updateSize();

    // Create markers for all capitals with red color
    const markers = WORLD_CAPITALS.map(city => ({
      location: [city.lat, city.lng] as [number, number],
      size: 0.04,
    }));

    globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 2.5,
      baseColor: [0.08, 0.08, 0.12], // Dark navy/black
      markerColor: [0.85, 0.15, 0.15], // Ziggy red
      glowColor: [0.15, 0.05, 0.08], // Subtle red glow
      markers,
      onRender: (state) => {
        state.phi = phiRef.current;
        phiRef.current += 0.002; // Slow rotation
      },
    });

    // Arc animation loop
    const arcCtx = arcCanvas.getContext('2d');
    if (!arcCtx) return;

    const animateArcs = (timestamp: number) => {
      const canvasSize = arcCanvas.width;
      const globeRadius = canvasSize * 0.4;
      
      arcCtx.clearRect(0, 0, canvasSize, canvasSize);
      
      // Add new arcs periodically
      if (timestamp - lastArcTimeRef.current > 2000) {
        const usedIndices = new Set(arcsRef.current.map(a => a.connectionIndex));
        const availableIndices = CONNECTION_ROUTES
          .map((_, i) => i)
          .filter(i => !usedIndices.has(i));
        
        if (availableIndices.length > 0) {
          const nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          arcsRef.current.push({
            connectionIndex: nextIndex,
            progress: 0,
            active: true,
          });
          lastArcTimeRef.current = timestamp;
        }
      }
      
      // Update and draw each arc
      arcsRef.current = arcsRef.current.filter(arc => {
        if (!arc.active) return false;
        
        const connection = CONNECTION_ROUTES[arc.connectionIndex];
        const startCity = WORLD_CAPITALS[connection[0]];
        const endCity = WORLD_CAPITALS[connection[1]];
        
        // Generate points along great circle
        const numPoints = 50;
        const points: { x: number; y: number; visible: boolean }[] = [];
        
        for (let i = 0; i <= numPoints; i++) {
          const t = i / numPoints;
          const pos = interpolateGreatCircle(
            { lat: startCity.lat, lng: startCity.lng },
            { lat: endCity.lat, lng: endCity.lng },
            t
          );
          const projected = projectToCanvas(
            pos.lat,
            pos.lng,
            phiRef.current,
            canvasSize,
            canvasSize,
            globeRadius
          );
          points.push(projected);
        }
        
        // Draw arc with current progress
        drawArc(arcCtx, points, arc.progress);
        
        // Update progress
        arc.progress += 0.008;
        
        // Reset arc when complete
        if (arc.progress >= 1.5) {
          // Find new connection
          const usedIndices = new Set(arcsRef.current.map(a => a.connectionIndex));
          const availableIndices = CONNECTION_ROUTES
            .map((_, i) => i)
            .filter(i => !usedIndices.has(i));
          
          if (availableIndices.length > 0) {
            arc.connectionIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            arc.progress = 0;
          } else {
            return false; // Remove this arc
          }
        }
        
        return true;
      });
      
      // Keep minimum number of active arcs
      while (arcsRef.current.length < 3 && CONNECTION_ROUTES.length > arcsRef.current.length) {
        const usedIndices = new Set(arcsRef.current.map(a => a.connectionIndex));
        const availableIndices = CONNECTION_ROUTES
          .map((_, i) => i)
          .filter(i => !usedIndices.has(i));
        
        if (availableIndices.length > 0) {
          arcsRef.current.push({
            connectionIndex: availableIndices[Math.floor(Math.random() * availableIndices.length)],
            progress: 0,
            active: true,
          });
        } else {
          break;
        }
      }
      
      animationId = requestAnimationFrame(animateArcs);
    };
    
    animationId = requestAnimationFrame(animateArcs);

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const { size: newSize, dpr: newDpr } = updateSize();
      if (globe) {
        globe.destroy();
        globe = createGlobe(canvas, {
          devicePixelRatio: newDpr,
          width: newSize * newDpr,
          height: newSize * newDpr,
          phi: phiRef.current,
          theta: 0.25,
          dark: 1,
          diffuse: 1.2,
          mapSamples: 16000,
          mapBrightness: 2.5,
          baseColor: [0.08, 0.08, 0.12],
          markerColor: [0.85, 0.15, 0.15],
          glowColor: [0.15, 0.05, 0.08],
          markers,
          onRender: (state) => {
            state.phi = phiRef.current;
            phiRef.current += 0.002;
          },
        });
      }
    });
    
    resizeObserver.observe(container);

    return () => {
      if (globe) globe.destroy();
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  // Handle mouse move for city hover detection
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.min(rect.width, rect.height);
    const globeRadius = size * 0.4;
    const centerX = size / 2;
    const centerY = size / 2;
    
    setMousePos({ x: e.clientX, y: e.clientY });
    
    // Check proximity to each capital
    let closestCity: string | null = null;
    let closestDist = 15; // Pixel threshold
    
    for (const city of WORLD_CAPITALS) {
      const projected = projectToCanvas(
        city.lat,
        city.lng,
        phiRef.current,
        size,
        size,
        globeRadius
      );
      
      if (!projected.visible) continue;
      
      const dist = Math.sqrt((projected.x - x) ** 2 + (projected.y - y) ** 2);
      if (dist < closestDist) {
        closestDist = dist;
        closestCity = city.name;
      }
    }
    
    setHoveredCity(closestCity);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredCity(null);
    setMousePos(null);
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={cn("relative w-full h-full flex items-center justify-center", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background: 'radial-gradient(ellipse at center, hsl(240 20% 8%) 0%, hsl(0 0% 0%) 100%)',
      }}
    >
      {/* Main globe canvas */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
      />
      
      {/* Arc overlay canvas */}
      <canvas
        ref={arcCanvasRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      />
      
      {/* Tooltip on hover */}
      {hoveredCity && mousePos && (
        <div 
          className="fixed z-50 bg-background/90 text-foreground px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm border border-primary/30 shadow-lg pointer-events-none"
          style={{
            left: mousePos.x + 12,
            top: mousePos.y - 8,
          }}
        >
          <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2" />
          {hoveredCity}
        </div>
      )}
    </div>
  );
}
