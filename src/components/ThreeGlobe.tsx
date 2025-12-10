import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_CAPITALS, CONNECTION_ROUTES } from '@/data/capitals';
import { 
  latLngToVector3, 
  createGreatCircleArc, 
  generateUniformLandPoints,
  GLOBE_RADIUS 
} from '@/lib/globeGeometry';

interface ThreeGlobeProps {
  className?: string;
}

// Earth surface dots component
function EarthDots() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    return generateUniformLandPoints(2.5, 2.5, GLOBE_RADIUS);
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
        size={0.012}
        sizeAttenuation
        transparent
        opacity={0.8}
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
      const position = latLngToVector3(capital.lat, capital.lng, GLOBE_RADIUS * 1.008);
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
      <sphereGeometry args={[0.018, 12, 12]} />
      <meshBasicMaterial color="#e50914" transparent opacity={0.95} />
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
      64,
      0.15
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
    holdTime: number;
  }>>([]);
  
  const arcIdRef = useRef(0);
  const routeIndexRef = useRef(0);
  const lastAddTimeRef = useRef(0);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    setArcs(prevArcs => {
      const updated = prevArcs.map(arc => {
        const newArc = { ...arc };
        
        if (arc.phase === 'drawing') {
          newArc.progress = Math.min(1, arc.progress + delta * 0.5);
          if (newArc.progress >= 1) {
            newArc.phase = 'holding';
            newArc.holdTime = 0;
          }
        } else if (arc.phase === 'holding') {
          newArc.holdTime = (arc.holdTime || 0) + delta;
          if (newArc.holdTime > 0.8) {
            newArc.phase = 'fading';
          }
        } else if (arc.phase === 'fading') {
          newArc.opacity = Math.max(0, arc.opacity - delta * 1.2);
        }
        
        return newArc;
      });

      // Remove fully faded arcs
      const activeArcs = updated.filter(arc => arc.opacity > 0);
      
      // Add new arc every 1.5 seconds
      if (time - lastAddTimeRef.current > 1.5 && activeArcs.length < 5) {
        lastAddTimeRef.current = time;
        const route = CONNECTION_ROUTES[routeIndexRef.current % CONNECTION_ROUTES.length];
        routeIndexRef.current++;
        
        activeArcs.push({
          id: arcIdRef.current++,
          startIdx: route[0],
          endIdx: route[1],
          progress: 0,
          opacity: 1,
          phase: 'drawing',
          holdTime: 0
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
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  const handleHover = (city: string | null, position: THREE.Vector3 | null) => {
    setHoveredCity(city);
    setHoverPosition(position);
  };

  return (
    <>
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.6} />
      
      {/* Directional light for subtle shading */}
      <directionalLight position={[5, 3, 5]} intensity={0.4} />
      
      {/* Globe group with rotation */}
      <group ref={groupRef}>
        {/* Core sphere (barely visible, for depth) */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS * 0.98, 32, 32]} />
          <meshBasicMaterial color="#0b0b17" transparent opacity={0.9} />
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
          position={[hoverPosition.x * 1.15, hoverPosition.y * 1.15, hoverPosition.z * 1.15]}
          center
          style={{
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          <div className="bg-background/95 backdrop-blur-sm text-foreground text-sm px-3 py-1.5 rounded-md border border-border shadow-lg font-medium">
            {hoveredCity}
          </div>
        </Html>
      )}

      {/* Camera controls */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={true}
        rotateSpeed={0.4}
        autoRotate={false}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.75}
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
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#0b0b17']} />
        <GlobeScene />
      </Canvas>
    </div>
  );
}
