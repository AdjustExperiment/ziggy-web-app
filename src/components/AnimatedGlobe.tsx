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
    { routeIndex: 10, progress: 0.15, active: true },
    { routeIndex: 20, progress: 0.3, active: true },
    { routeIndex: 30, progress: 0.45, active: true },
    { routeIndex: 40, progress: 0.6, active: true },
    { routeIndex: 50, progress: 0.75, active: true },
    { routeIndex: 60, progress: 0.9, active: true },
    { routeIndex: 70, progress: 0.1, active: true },
    { routeIndex: 5, progress: 0.5, active: true },
    { routeIndex: 15, progress: 0.65, active: true },
  ]);

  // Convert capitals to cobe marker format
  const cobeMarkers = WORLD_CAPITALS.map(city => ({
    location: [city.lat, city.lng] as [number, number],
    size: 0.04
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
        // Arc radius calibrated to match cobe's visible globe
        const r = size * 0.46;
        const theta = 0.15; // Match cobe's theta value
        arcCtx.clearRect(0, 0, size, size);

        for (const arc of arcsRef.current) {
          if (!arc.active) continue;
          const route = CONNECTION_ROUTES[arc.routeIndex % CONNECTION_ROUTES.length];
          if (!route) continue;
          const start = WORLD_CAPITALS[route[0]], end = WORLD_CAPITALS[route[1]];
          if (!start || !end) continue;
          
          // Arc lifecycle:
          // 0.0 → 1.0: Drawing the arc
          // 1.0 → 1.4: Hold at destination (fully drawn)
          // 1.4 → 1.7: Fade out
          // 1.7+: Reset to new route
          let fadeOpacity = 1;
          if (arc.progress > 1.4) {
            fadeOpacity = Math.max(0, 1 - (arc.progress - 1.4) * 3.33);
          }
          
          drawAnimatedArc(
            arcCtx, 
            { lat: start.lat, lng: start.lng }, 
            { lat: end.lat, lng: end.lng }, 
            phiRef.current,
            theta,
            size, size, r, 
            arc.progress, 
            fadeOpacity
          );
          
          arc.progress += 0.003;
          if (arc.progress >= 1.7) { 
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
