import { useEffect, useRef, useCallback, useState } from 'react';
import createGlobe from 'cobe';
import { cn } from '@/lib/utils';
import { WORLD_CAPITALS, CONNECTION_ROUTES } from '@/data/capitals';
import { projectToCanvas, drawAnimatedArc, drawPulsingMarker } from '@/lib/globeUtils';

interface ArcState { routeIndex: number; progress: number; active: boolean; }

export function AnimatedGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arcCanvasRef = useRef<HTMLCanvasElement>(null);
  const markerCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const phiRef = useRef(0);
  const pulseRef = useRef(0);
  const arcsRef = useRef<ArcState[]>([
    { routeIndex: 0, progress: 0, active: true },
    { routeIndex: 10, progress: 0.3, active: true },
    { routeIndex: 20, progress: 0.6, active: true },
    { routeIndex: 30, progress: 0.4, active: true },
  ]);
  const [hoveredCity, setHoveredCity] = useState<{ name: string; country: string; x: number; y: number } | null>(null);

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
    const arcCanvas = arcCanvasRef.current, markerCanvas = markerCanvasRef.current;
    if (!container || !canvas || !arcCanvas || !markerCanvas) return;

    let globe: ReturnType<typeof createGlobe> | undefined;
    let animId: number;

    const init = () => {
      const size = Math.min(container.offsetWidth, container.offsetHeight, 600);
      const dpr = Math.min(window.devicePixelRatio, 2);
      [canvas, arcCanvas, markerCanvas].forEach(c => {
        c.width = size * dpr; c.height = size * dpr;
        c.style.width = `${size}px`; c.style.height = `${size}px`;
      });
      const arcCtx = arcCanvas.getContext('2d')!, markerCtx = markerCanvas.getContext('2d')!;
      arcCtx.scale(dpr, dpr); markerCtx.scale(dpr, dpr);

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr, width: size * dpr, height: size * dpr,
        phi: phiRef.current, theta: 0.15, dark: 1, diffuse: 1.6,
        mapSamples: 32000, mapBrightness: 8,
        baseColor: [0.08, 0.08, 0.12], markerColor: [0.9, 0.2, 0.2], glowColor: [0.15, 0.15, 0.2],
        markers: [],
        onRender: (state) => { phiRef.current += 0.0008; state.phi = phiRef.current; },
      });

      const animate = () => {
        const r = size * 0.4;
        arcCtx.clearRect(0, 0, size, size);
        markerCtx.clearRect(0, 0, size, size);
        pulseRef.current += 0.06;

        for (const city of WORLD_CAPITALS) {
          const p = projectToCanvas(city.lat, city.lng, phiRef.current, size, size, r);
          if (p.visible) drawPulsingMarker(markerCtx, p.x, p.y, pulseRef.current, p.depth);
        }

        for (const arc of arcsRef.current) {
          if (!arc.active) continue;
          const route = CONNECTION_ROUTES[arc.routeIndex];
          if (!route) continue;
          const start = WORLD_CAPITALS[route[0]], end = WORLD_CAPITALS[route[1]];
          if (!start || !end) continue;
          drawAnimatedArc(arcCtx, { lat: start.lat, lng: start.lng }, { lat: end.lat, lng: end.lng }, phiRef.current, size, size, r, arc.progress);
          arc.progress += 0.008;
          if (arc.progress >= 1.2) { arc.progress = 0; arc.routeIndex = Math.floor(Math.random() * CONNECTION_ROUTES.length); }
        }
        animId = requestAnimationFrame(animate);
      };
      animate();
    };

    init();
    const onResize = () => { globe?.destroy(); cancelAnimationFrame(animId); init(); };
    window.addEventListener('resize', onResize);
    return () => { globe?.destroy(); cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const size = Math.min(rect.width, rect.height), r = size * 0.4;
    let closest: typeof hoveredCity = null, dist = 20;
    for (const city of WORLD_CAPITALS) {
      const p = projectToCanvas(city.lat, city.lng, phiRef.current, size, size, r);
      if (!p.visible) continue;
      const d = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
      if (d < dist) { dist = d; closest = { name: city.name, country: city.country, x: p.x, y: p.y }; }
    }
    setHoveredCity(closest);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full flex items-center justify-center", className)}
      onMouseMove={handleMouseMove} onMouseLeave={() => setHoveredCity(null)}>
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
      <canvas ref={markerCanvasRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <canvas ref={arcCanvasRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      {hoveredCity && (
        <div className="absolute z-10 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm border border-primary/30 shadow-lg pointer-events-none"
          style={{ left: hoveredCity.x, top: hoveredCity.y - 40, transform: 'translateX(-50%)' }}>
          <p className="text-sm font-medium text-foreground">{hoveredCity.name}</p>
          <p className="text-xs text-muted-foreground">{hoveredCity.country}</p>
        </div>
      )}
    </div>
  );
}

export default AnimatedGlobe;
