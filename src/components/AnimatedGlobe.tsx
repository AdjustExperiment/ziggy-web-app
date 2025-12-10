import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { cn } from '@/lib/utils';
import { WORLD_CITIES } from '@/data/capitals';

interface CityLightState {
  intensity: number;
  direction: 'rising' | 'falling' | 'idle';
  delay: number;
}

export function AnimatedGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const phiRef = useRef(0);
  const cityStatesRef = useRef<CityLightState[]>([]);

  // Initialize city states with random staggering
  useEffect(() => {
    cityStatesRef.current = WORLD_CITIES.map(() => ({
      intensity: Math.random() < 0.15 ? Math.random() * 0.5 : 0,
      direction: Math.random() < 0.2 ? 'rising' : 'idle',
      delay: Math.floor(Math.random() * 180)
    }));
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { phiRef.current = (-pos.coords.longitude) * (Math.PI / 180); },
        () => {}, { timeout: 3000 }
      );
    }
  }, []);

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

      // Initialize markers with starting colors
      const initialMarkers = WORLD_CITIES.map((city) => ({
        location: [city.lat, city.lng] as [number, number],
        size: 0.03
      }));

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr, 
        width: size * dpr, 
        height: size * dpr,
        phi: phiRef.current, 
        theta: 0.15, 
        dark: 1, 
        diffuse: 1.2,
        mapSamples: 24000, 
        mapBrightness: 6,
        baseColor: [0.12, 0.12, 0.18], 
        markerColor: [0.9, 0.2, 0.2], 
        glowColor: [0.1, 0.1, 0.15],
        markers: initialMarkers,
        onRender: (state) => {
          phiRef.current += 0.0008;
          state.phi = phiRef.current;

          // Update city light states and markers
          const updatedMarkers = WORLD_CITIES.map((city, i) => {
            const cityState = cityStatesRef.current[i];
            if (!cityState) return {
              location: [city.lat, city.lng] as [number, number],
              size: 0.02
            };

            // Animate intensity based on direction
            if (cityState.direction === 'rising') {
              cityState.intensity = Math.min(1, cityState.intensity + 0.015);
              if (cityState.intensity >= 1) {
                cityState.direction = 'falling';
                cityState.delay = 20 + Math.random() * 40;
              }
            } else if (cityState.direction === 'falling') {
              cityState.intensity = Math.max(0, cityState.intensity - 0.008);
              if (cityState.intensity <= 0) {
                cityState.direction = 'idle';
                cityState.delay = 60 + Math.random() * 240;
              }
            } else if (cityState.direction === 'idle') {
              cityState.delay--;
              if (cityState.delay <= 0) {
                cityState.direction = 'rising';
              }
            }

            // Size pulses slightly with intensity
            const pulseSize = 0.02 + cityState.intensity * 0.015;

            return {
              location: [city.lat, city.lng] as [number, number],
              size: pulseSize
            };
          });

          state.markers = updatedMarkers;
        },
      });
    };

    init();
    const onResize = () => { globe?.destroy(); init(); };
    window.addEventListener('resize', onResize);
    return () => { globe?.destroy(); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full h-full flex items-center justify-center", className)}>
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
}

export default AnimatedGlobe;
