import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_CAPITALS, CONNECTION_ROUTES } from '@/data/capitals';
import { 
  latLngToVector3, 
  createGreatCircleArc, 
  generateLandPoints,
  GLOBE_RADIUS 
} from '@/lib/globeGeometry';

interface ThreeGlobeProps {
  className?: string;
}

// Earth surface dots component
function EarthDots() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    return generateLandPoints(8000, GLOBE_RADIUS);
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.008}
        sizeAttenuation
        transparent
        opacity={0.7}
      />
    </points>
  );
}

// Capital city dots component
function CapitalDots({ onHover }: { onHover: (city: string | null, position: THREE.Vector3 | null) => void }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const { matrices, positions } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const positions: THREE.Vector3[] = [];
    
    WORLD_CAPITALS.forEach((capital) => {
      const position = latLngToVector3(capital.lat, capital.lng, GLOBE_RADIUS * 1.005);
      positions.push(position);
      
      const matrix = new THREE.Matrix4();
      matrix.setPosition(position);
      matrices.push(matrix);
    });
    
    return { matrices, positions };
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      matrices.forEach((matrix, i) => {
        meshRef.current!.setMatrixAt(i, matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, WORLD_CAPITALS.length]}
      onPointerOver={(e) => {
        e.stopPropagation();
        const idx = e.instanceId;
        if (idx !== undefined) {
          onHover(
            `${WORLD_CAPITALS[idx].name}, ${WORLD_CAPITALS[idx].country}`,
            positions[idx]
          );
        }
      }}
      onPointerOut={() => onHover(null, null)}
    >
      <sphereGeometry args={[0.015, 8, 8]} />
      <meshBasicMaterial color="#e50914" />
    </instancedMesh>
  );
}

// Animated arc component
function AnimatedArc({ 
  startIdx, 
  endIdx, 
  progress,
  opacity
}: { 
  startIdx: number; 
  endIdx: number; 
  progress: number;
  opacity: number;
}) {
  
  const fullPoints = useMemo(() => {
    const start = WORLD_CAPITALS[startIdx];
    const end = WORLD_CAPITALS[endIdx];
    return createGreatCircleArc(
      { lat: start.lat, lng: start.lng },
      { lat: end.lat, lng: end.lng },
      50,
      0.12
    );
  }, [startIdx, endIdx]);

  const geometry = useMemo(() => {
    const visibleCount = Math.floor(fullPoints.length * progress);
    const visiblePoints = fullPoints.slice(0, Math.max(2, visibleCount));
    return new THREE.BufferGeometry().setFromPoints(visiblePoints);
  }, [fullPoints, progress]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  if (progress <= 0 || opacity <= 0) return null;

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
      color: '#ff6b6b', 
      transparent: true, 
      opacity: opacity * 0.8 
    }))} />
  );
}

// Arc animation manager
function ArcAnimationSystem() {
  const [arcs, setArcs] = useState<Array<{
    id: number;
    startIdx: number;
    endIdx: number;
    progress: number;
    opacity: number;
    phase: 'drawing' | 'holding' | 'fading';
  }>>([]);
  
  const arcIdRef = useRef(0);
  const routeIndexRef = useRef(0);

  useEffect(() => {
    // Initialize with first few arcs
    const initialArcs = [];
    for (let i = 0; i < 3; i++) {
      const route = CONNECTION_ROUTES[i % CONNECTION_ROUTES.length];
      initialArcs.push({
        id: arcIdRef.current++,
        startIdx: route[0],
        endIdx: route[1],
        progress: 0,
        opacity: 1,
        phase: 'drawing' as const
      });
      routeIndexRef.current++;
    }
    setArcs(initialArcs);
  }, []);

  useFrame((_, delta) => {
    setArcs(prevArcs => {
      const updated = prevArcs.map(arc => {
        const newArc = { ...arc };
        
        if (arc.phase === 'drawing') {
          newArc.progress = Math.min(1, arc.progress + delta * 0.5);
          if (newArc.progress >= 1) {
            newArc.phase = 'holding';
          }
        } else if (arc.phase === 'holding') {
          // Hold for a moment then fade
          newArc.phase = 'fading';
        } else if (arc.phase === 'fading') {
          newArc.opacity = Math.max(0, arc.opacity - delta * 0.8);
        }
        
        return newArc;
      });

      // Remove fully faded arcs and add new ones
      const activeArcs = updated.filter(arc => arc.opacity > 0);
      
      if (activeArcs.length < 4 && Math.random() < delta * 2) {
        const route = CONNECTION_ROUTES[routeIndexRef.current % CONNECTION_ROUTES.length];
        routeIndexRef.current++;
        
        activeArcs.push({
          id: arcIdRef.current++,
          startIdx: route[0],
          endIdx: route[1],
          progress: 0,
          opacity: 1,
          phase: 'drawing'
        });
      }

      return activeArcs;
    });
  });

  return (
    <>
      {arcs.map(arc => (
        <AnimatedArc
          key={arc.id}
          startIdx={arc.startIdx}
          endIdx={arc.endIdx}
          progress={arc.progress}
          opacity={arc.opacity}
        />
      ))}
    </>
  );
}

// Main globe scene
function GlobeScene() {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<THREE.Vector3 | null>(null);

  // Auto-rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const handleHover = (city: string | null, position: THREE.Vector3 | null) => {
    setHoveredCity(city);
    setHoverPosition(position);
  };

  return (
    <>
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.5} />
      
      {/* Directional light for subtle shading */}
      <directionalLight position={[5, 3, 5]} intensity={0.3} />
      
      {/* Globe group with rotation */}
      <group ref={groupRef}>
        {/* Core sphere (barely visible, for depth) */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS * 0.99, 32, 32]} />
          <meshBasicMaterial color="#0b0b17" transparent opacity={0.95} />
        </mesh>
        
        {/* Earth land dots */}
        <EarthDots />
        
        {/* Capital city dots */}
        <CapitalDots onHover={handleHover} />
        
        {/* Animated connection arcs */}
        <ArcAnimationSystem />
      </group>

      {/* City tooltip */}
      {hoveredCity && hoverPosition && (
        <Html
          position={[hoverPosition.x * 1.1, hoverPosition.y * 1.1, hoverPosition.z * 1.1]}
          center
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <div className="bg-card/95 backdrop-blur-sm text-card-foreground text-xs px-2 py-1 rounded-md border border-border shadow-lg">
            {hoveredCity}
          </div>
        </Html>
      )}

      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        rotateSpeed={0.3}
        autoRotate={false}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
      />
    </>
  );
}

export function ThreeGlobe({ className }: ThreeGlobeProps) {
  return (
    <div className={className} style={{ background: '#0b0b17' }}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0b0b17']} />
        <GlobeScene />
      </Canvas>
    </div>
  );
}
