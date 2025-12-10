import * as THREE from 'three';

export const GLOBE_RADIUS = 1;

/**
 * Convert latitude/longitude to 3D position on sphere
 */
export function latLngToVector3(lat: number, lng: number, radius: number = GLOBE_RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

/**
 * Generate points for a great circle arc between two lat/lng positions
 */
export function createGreatCircleArc(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  segments: number = 50,
  altitude: number = 0.15
): THREE.Vector3[] {
  const startVec = latLngToVector3(start.lat, start.lng);
  const endVec = latLngToVector3(end.lat, end.lng);
  
  const points: THREE.Vector3[] = [];
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    
    // Spherical interpolation
    const point = new THREE.Vector3().lerpVectors(startVec, endVec, t);
    point.normalize();
    
    // Add altitude curve (highest at midpoint)
    const altitudeFactor = Math.sin(t * Math.PI) * altitude;
    point.multiplyScalar(GLOBE_RADIUS + altitudeFactor);
    
    points.push(point);
  }
  
  return points;
}

/**
 * Generate evenly distributed points on a sphere using fibonacci spiral
 */
export function generateSpherePoints(count: number, radius: number = GLOBE_RADIUS): Float32Array {
  const positions = new Float32Array(count * 3);
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle
  
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;
    
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    
    positions[i * 3] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;
  }
  
  return positions;
}

/**
 * Check if a point on the sphere is on land (simplified check)
 * Uses a basic algorithm that approximates continental shapes
 */
export function isOnLand(lat: number, lng: number): boolean {
  // Simplified continental bounds - not perfect but gives good visual distribution
  // North America
  if (lat > 25 && lat < 70 && lng > -130 && lng < -60) return true;
  // South America
  if (lat > -55 && lat < 12 && lng > -80 && lng < -35) return true;
  // Europe
  if (lat > 35 && lat < 70 && lng > -10 && lng < 40) return true;
  // Africa
  if (lat > -35 && lat < 37 && lng > -18 && lng < 52) return true;
  // Asia
  if (lat > 10 && lat < 75 && lng > 40 && lng < 145) return true;
  // Australia
  if (lat > -45 && lat < -10 && lng > 110 && lng < 155) return true;
  // India subcontinent
  if (lat > 5 && lat < 35 && lng > 68 && lng < 97) return true;
  // Japan/Korea
  if (lat > 30 && lat < 45 && lng > 125 && lng < 145) return true;
  // UK/Ireland
  if (lat > 50 && lat < 60 && lng > -10 && lng < 2) return true;
  // Indonesia
  if (lat > -10 && lat < 5 && lng > 95 && lng < 140) return true;
  
  return false;
}

/**
 * Generate land-only points on a sphere
 */
export function generateLandPoints(count: number, radius: number = GLOBE_RADIUS): Float32Array {
  const positions: number[] = [];
  let attempts = 0;
  const maxAttempts = count * 20;
  
  while (positions.length < count * 3 && attempts < maxAttempts) {
    // Random point on sphere
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    
    const lat = 90 - (phi * 180 / Math.PI);
    const lng = (theta * 180 / Math.PI) - 180;
    
    if (isOnLand(lat, lng)) {
      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = Math.cos(phi) * radius;
      const z = Math.sin(phi) * Math.sin(theta) * radius;
      
      positions.push(x, y, z);
    }
    
    attempts++;
  }
  
  return new Float32Array(positions);
}
