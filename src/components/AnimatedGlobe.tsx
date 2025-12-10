import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { cn } from '@/lib/utils';
import { WORLD_CAPITALS, CONNECTION_ROUTES } from '@/data/capitals';
import { drawAnimatedArc } from '@/lib/globeUtils';

interface ArcState { routeIndex: number; progress: number; active: boolean; }

export function AnimatedGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arcCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const phiRef = useRef(0);
  const sizeRef = useRef(0);
  const arcsRef = useRef<ArcState[]>([
    { routeIndex: 0, progress: 0, active: true },
    { routeIndex: 7, progress: 0.2, active: true },
    { routeIndex: 14, progress: 0.4, active: true },
    { routeIndex: 21, progress: 0.6, active: true },
    { routeIndex: 28, progress: 0.8, active: true },
    { routeIndex: 35, progress: 1.0, active: true },
    { routeIndex: 42, progress: 0.3, active: true },
    { routeIndex: 49, progress: 0.7, active: true },
  ]);

  // Convert capitals to cobe marker format
  const cobeMarkers = WORLD_CAPITALS.map(city => ({
    location: [city.lat, city.lng] as [number, number],
    size: 0.025
  }));

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { phiRef.current = (-pos.coords.longitude) * (Math.PI / 180); },
        () => {}, { timeout: 3000 }
      );
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current, canvas = canvasRef.current;
    const arcCanvas = arcCanvasRef.current;
    if (!container || !canvas || !arcCanvas) return;

    let globe: ReturnType<typeof createGlobe> | undefined;
    let animId: number;

    const init = () => {
      const size = Math.min(container.offsetWidth, container.offsetHeight, 600);
      sizeRef.current = size;
      const dpr = Math.min(window.devicePixelRatio, 2);
      
      canvas.width = size * dpr; 
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`; 
      canvas.style.height = `${size}px`;
      
      arcCanvas.width = size * dpr; 
      arcCanvas.height = size * dpr;
      arcCanvas.style.width = `${size}px`; 
      arcCanvas.style.height = `${size}px`;
      
      const arcCtx = arcCanvas.getContext('2d')!;
      arcCtx.scale(dpr, dpr);

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr, 
        width: size * dpr, 
        height: size * dpr,
        phi: phiRef.current, 
        theta: 0.15, 
        dark: 1, 
        diffuse: 1.6,
        mapSamples: 32000, 
        mapBrightness: 8,
        baseColor: [0.08, 0.08, 0.12], 
        markerColor: [0.9, 0.2, 0.2], 
        glowColor: [0.15, 0.15, 0.2],
        markers: cobeMarkers,
        onRender: (state) => {
          phiRef.current += 0.0008;
          state.phi = phiRef.current;
        },
      });

      const animate = () => {
        const r = size * 0.425;
        arcCtx.clearRect(0, 0, size, size);

        for (const arc of arcsRef.current) {
          if (!arc.active) continue;
          const route = CONNECTION_ROUTES[arc.routeIndex];
          if (!route) continue;
          const start = WORLD_CAPITALS[route[0]], end = WORLD_CAPITALS[route[1]];
          if (!start || !end) continue;
          
          const fadeOpacity = arc.progress > 1.0 ? Math.max(0, 1 - (arc.progress - 1.0) * 2) : 1;
          drawAnimatedArc(arcCtx, { lat: start.lat, lng: start.lng }, { lat: end.lat, lng: end.lng }, phiRef.current, size, size, r, Math.min(arc.progress, 1), fadeOpacity);
          
          arc.progress += 0.002;
          if (arc.progress >= 1.5) { 
            arc.progress = 0; 
            arc.routeIndex = (arc.routeIndex + 1) % CONNECTION_ROUTES.length;
          }
        }
        animId = requestAnimationFrame(animate);
      };
      animate();
    };

    init();
    const onResize = () => { globe?.destroy(); cancelAnimationFrame(animId); init(); };
    window.addEventListener('resize', onResize);
    return () => { globe?.destroy(); cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, [cobeMarkers]);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full flex items-center justify-center", className)}>
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
      <canvas ref={arcCanvasRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export default AnimatedGlobe;
