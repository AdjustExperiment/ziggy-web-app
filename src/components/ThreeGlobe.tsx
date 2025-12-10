import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_CAPITALS, CONNECTION_ROUTES } from '@/data/capitals';
import { 
  generateUniformLandPoints, 
  createGreatCircleArc,
  latLngToVector3,
  GLOBE_RADIUS 
} from '@/lib/globeGeometry';

interface ThreeGlobeProps {
  className?: string;
}

// Earth surface dots component - denser grid
function EarthDots() {
  const positions = useMemo(() => generateUniformLandPoints(1.8, 1.8), []);
  
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.008}
        color="#ffffff"
        transparent
        opacity={0.9}
        sizeAttenuation={true}
      />
    </points>
  );
}

// Capital city dots with glow effect
function CapitalDots({ onHover }: { onHover: (city: string | null, position: THREE.Vector3 | null) => void }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const positions = useMemo(() => {
    const posArr: THREE.Vector3[] = [];
    WORLD_CAPITALS.forEach((capital) => {
      posArr.push(latLngToVector3(capital.lat, capital.lng, GLOBE_RADIUS * 1.003));
    });
    return posArr;
  }, []);
  
  useEffect(() => {
    if (!meshRef.current || !glowRef.current) return;
    
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      glowRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    glowRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);
  
  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && WORLD_CAPITALS[instanceId]) {
      const capital = WORLD_CAPITALS[instanceId];
      onHover(`${capital.name}, ${capital.country}`, positions[instanceId]);
    }
  };
  
  return (
    <group>
      {/* Glow layer (behind) */}
      <instancedMesh ref={glowRef} args={[undefined, undefined, WORLD_CAPITALS.length]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshBasicMaterial color="#e50914" transparent opacity={0.25} />
      </instancedMesh>
      
      {/* Main capital dots */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, WORLD_CAPITALS.length]}
        onPointerOver={handlePointerOver}
        onPointerOut={() => onHover(null, null)}
      >
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial color="#e50914" />
      </instancedMesh>
    </group>
  );
}

// Single animated arc with proper line rendering
function AnimatedArc({ 
  startIdx, 
  endIdx, 
  onComplete 
}: { 
  startIdx: number; 
  endIdx: number; 
  onComplete: () => void;
}) {
  const lineRef = useRef<THREE.Line>(null);
  const progressRef = useRef(0);
  const opacityRef = useRef(1);
  const phaseRef = useRef<'drawing' | 'holding' | 'fading'>('drawing');
  const holdTimeRef = useRef(0);
  
  const fullPoints = useMemo(() => {
    const start = WORLD_CAPITALS[startIdx];
    const end = WORLD_CAPITALS[endIdx];
    if (!start || !end) return [];
    return createGreatCircleArc(start, end, 50, 0.12);
  }, [startIdx, endIdx]);
  
  const geometry = useMemo(() => new THREE.BufferGeometry(), []);
  const material = useMemo(() => new THREE.LineBasicMaterial({ 
    color: new THREE.Color('#ff6b6b'),
    transparent: true,
    opacity: 1,
  }), []);
  
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);
  
  useFrame((_, delta) => {
    if (fullPoints.length === 0) return;
    
    if (phaseRef.current === 'drawing') {
      progressRef.current = Math.min(1, progressRef.current + delta * 0.5);
      const pointCount = Math.max(2, Math.floor(progressRef.current * fullPoints.length));
      const visiblePoints = fullPoints.slice(0, pointCount);
      geometry.setFromPoints(visiblePoints);
      
      if (progressRef.current >= 1) {
        phaseRef.current = 'holding';
      }
    } else if (phaseRef.current === 'holding') {
      holdTimeRef.current += delta;
      if (holdTimeRef.current > 1.2) {
        phaseRef.current = 'fading';
      }
    } else if (phaseRef.current === 'fading') {
      opacityRef.current = Math.max(0, opacityRef.current - delta * 1.5);
      material.opacity = opacityRef.current;
      
      if (opacityRef.current <= 0) {
        onComplete();
      }
    }
  });
  
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);
  
  if (fullPoints.length === 0) return null;
  
  return <primitive object={line} />;
}

// Arc animation system
function ArcAnimationSystem() {
  const [activeArcs, setActiveArcs] = useState<Array<{ id: number; startIdx: number; endIdx: number }>>([]);
  const arcIdRef = useRef(0);
  const routeIndexRef = useRef(0);
  
  useEffect(() => {
    const addArc = () => {
      const route = CONNECTION_ROUTES[routeIndexRef.current % CONNECTION_ROUTES.length];
      routeIndexRef.current++;
      
      const newArc = {
        id: arcIdRef.current++,
        startIdx: route[0],
        endIdx: route[1]
      };
      
      setActiveArcs(prev => [...prev.slice(-4), newArc]);
    };
    
    // Initial arc
    addArc();
    
    // Add new arcs periodically
    const interval = setInterval(addArc, 1800);
    return () => clearInterval(interval);
  }, []);
  
  const handleArcComplete = (id: number) => {
    setActiveArcs(prev => prev.filter(arc => arc.id !== id));
  };
  
  return (
    <group>
      {activeArcs.map(arc => (
        <AnimatedArc
          key={arc.id}
          startIdx={arc.startIdx}
          endIdx={arc.endIdx}
          onComplete={() => handleArcComplete(arc.id)}
        />
      ))}
    </group>
  );
}

// Main globe scene
function GlobeScene() {
  const globeRef = useRef<THREE.Group>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<THREE.Vector3 | null>(null);
  
  const handleHover = (city: string | null, position: THREE.Vector3 | null) => {
    setHoveredCity(city);
    setHoverPosition(position);
  };
  
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.0008;
    }
  });
  
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={0.6} />
      
      <group ref={globeRef}>
        {/* Dark core sphere */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS * 0.99, 48, 48]} />
          <meshBasicMaterial color="#080812" />
        </mesh>
        
        {/* Land dots */}
        <EarthDots />
        
        {/* Capital markers */}
        <CapitalDots onHover={handleHover} />
        
        {/* Arc connections */}
        <ArcAnimationSystem />
      </group>
      
      {/* Tooltip */}
      {hoveredCity && hoverPosition && (
        <Html position={[hoverPosition.x * 1.12, hoverPosition.y * 1.12, hoverPosition.z * 1.12]} center>
          <div className="bg-black/90 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none border border-white/20 shadow-lg">
            {hoveredCity}
          </div>
        </Html>
      )}
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.3}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
      />
    </>
  );
}

export function ThreeGlobe({ className }: ThreeGlobeProps) {
  return (
    <div className={`w-full h-full ${className || ''}`}>
      <Canvas
        camera={{ position: [0, 0, 2.4], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0b0b17']} />
        <GlobeScene />
      </Canvas>
    </div>
  );
}
