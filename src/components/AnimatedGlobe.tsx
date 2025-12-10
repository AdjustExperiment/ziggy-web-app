import { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';
import { cn } from '@/lib/utils';
import { WORLD_CAPITALS } from '@/data/capitals';

interface CityCard {
  index: number;
  visible: boolean;
}

export function AnimatedGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const phiRef = useRef(0);
  
  // 4 city cards cycling randomly
  const [cityCards, setCityCards] = useState<CityCard[]>([
    { index: 0, visible: true },
    { index: 21, visible: true },
    { index: 47, visible: true },
    { index: 67, visible: true },
  ]);

  // Convert capitals to cobe marker format
  const cobeMarkers = WORLD_CAPITALS.map(city => ({
    location: [city.lat, city.lng] as [number, number],
    size: 0.06
  }));

  // Cycle city cards randomly
  useEffect(() => {
    const getRandomCity = (exclude: number[]) => {
      let idx;
      do {
        idx = Math.floor(Math.random() * WORLD_CAPITALS.length);
      } while (exclude.includes(idx));
      return idx;
    };

    const interval = setInterval(() => {
      setCityCards(prev => {
        const cardToChange = Math.floor(Math.random() * 4);
        const currentIndices = prev.map(c => c.index);
        const newIndex = getRandomCity(currentIndices);
        
        return prev.map((card, i) => 
          i === cardToChange 
            ? { index: newIndex, visible: true }
            : card
        );
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Initialize user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { phiRef.current = (-pos.coords.longitude) * (Math.PI / 180); },
        () => {}, { timeout: 3000 }
      );
    }
  }, []);

  // Initialize globe
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let globe: ReturnType<typeof createGlobe> | undefined;

    const init = () => {
      const size = Math.min(container.offsetWidth, container.offsetHeight, 600);
      const dpr = Math.min(window.devicePixelRatio, 2);
      
      canvas.width = size * dpr; 
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`; 
      canvas.style.height = `${size}px`;

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
    };

    init();
    const onResize = () => { globe?.destroy(); init(); };
    window.addEventListener('resize', onResize);
    return () => { globe?.destroy(); window.removeEventListener('resize', onResize); };
  }, [cobeMarkers]);

  // Card positions around globe
  const cardPositions = [
    'top-4 left-4',
    'top-4 right-4',
    'bottom-4 left-4',
    'bottom-4 right-4',
  ];

  return (
    <div ref={containerRef} className={cn("relative w-full h-full flex items-center justify-center", className)}>
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
      
      {/* Floating City Cards */}
      {cityCards.map((card, i) => {
        const city = WORLD_CAPITALS[card.index];
        return (
          <div
            key={`${i}-${card.index}`}
            className={cn(
              "absolute pointer-events-none",
              cardPositions[i],
              "animate-fade-in"
            )}
          >
            <div className="backdrop-blur-md bg-background/20 border border-primary/30 rounded-lg px-3 py-2 shadow-lg shadow-primary/10">
              <p className="font-display text-sm md:text-base text-foreground font-semibold leading-tight">
                {city.name}
              </p>
              <p className="font-secondary text-xs text-muted-foreground">
                {city.country}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default AnimatedGlobe;
