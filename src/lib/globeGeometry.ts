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
    
    // Spherical linear interpolation (SLERP)
    const point = new THREE.Vector3().lerpVectors(startVec, endVec, t);
    point.normalize();
    
    // Add altitude curve (parabolic - highest at midpoint)
    const altitudeFactor = Math.sin(t * Math.PI) * altitude;
    point.multiplyScalar(GLOBE_RADIUS + altitudeFactor);
    
    points.push(point);
  }
  
  return points;
}

/**
 * Detailed land detection using continental polygons
 * Returns true if the point is approximately on land
 */
export function isOnLand(lat: number, lng: number): boolean {
  // North America (mainland)
  if (lat >= 25 && lat <= 50 && lng >= -125 && lng <= -65) return true;
  // North America (Canada)
  if (lat >= 50 && lat <= 72 && lng >= -140 && lng <= -55) return true;
  // Alaska
  if (lat >= 55 && lat <= 72 && lng >= -170 && lng <= -140) return true;
  // Central America
  if (lat >= 7 && lat <= 25 && lng >= -120 && lng <= -75) return true;
  // Mexico
  if (lat >= 15 && lat <= 32 && lng >= -118 && lng <= -86) return true;
  
  // South America
  if (lat >= -56 && lat <= 12 && lng >= -82 && lng <= -34) return true;
  // Brazil bulge
  if (lat >= -10 && lat <= 5 && lng >= -74 && lng <= -34) return true;
  
  // Europe (Western)
  if (lat >= 36 && lat <= 60 && lng >= -10 && lng <= 25) return true;
  // Europe (Eastern)
  if (lat >= 45 && lat <= 60 && lng >= 25 && lng <= 45) return true;
  // Scandinavia
  if (lat >= 55 && lat <= 71 && lng >= 5 && lng <= 30) return true;
  // UK & Ireland
  if (lat >= 50 && lat <= 59 && lng >= -11 && lng <= 2) return true;
  // Iceland
  if (lat >= 63 && lat <= 66 && lng >= -24 && lng <= -13) return true;
  
  // Russia (European)
  if (lat >= 50 && lat <= 70 && lng >= 30 && lng <= 60) return true;
  // Russia (Siberia)
  if (lat >= 50 && lat <= 75 && lng >= 60 && lng <= 180) return true;
  
  // Africa (North)
  if (lat >= 20 && lat <= 37 && lng >= -17 && lng <= 40) return true;
  // Africa (West bulge)
  if (lat >= 4 && lat <= 20 && lng >= -18 && lng <= 15) return true;
  // Africa (Central & East)
  if (lat >= -5 && lat <= 20 && lng >= 15 && lng <= 52) return true;
  // Africa (South)
  if (lat >= -35 && lat <= -5 && lng >= 10 && lng <= 52) return true;
  // Madagascar
  if (lat >= -26 && lat <= -12 && lng >= 43 && lng <= 50) return true;
  
  // Middle East
  if (lat >= 12 && lat <= 42 && lng >= 35 && lng <= 60) return true;
  // Arabian Peninsula
  if (lat >= 12 && lat <= 32 && lng >= 35 && lng <= 60) return true;
  
  // India subcontinent
  if (lat >= 8 && lat <= 35 && lng >= 68 && lng <= 90) return true;
  // Sri Lanka
  if (lat >= 6 && lat <= 10 && lng >= 79 && lng <= 82) return true;
  
  // Southeast Asia
  if (lat >= 10 && lat <= 28 && lng >= 92 && lng <= 110) return true;
  // Vietnam, Thailand, Malaysia
  if (lat >= -1 && lat <= 25 && lng >= 98 && lng <= 110) return true;
  
  // China
  if (lat >= 20 && lat <= 45 && lng >= 75 && lng <= 125) return true;
  // Mongolia
  if (lat >= 42 && lat <= 52 && lng >= 88 && lng <= 120) return true;
  
  // Japan
  if (lat >= 30 && lat <= 46 && lng >= 129 && lng <= 146) return true;
  // Korea
  if (lat >= 33 && lat <= 43 && lng >= 124 && lng <= 130) return true;
  // Taiwan
  if (lat >= 22 && lat <= 25 && lng >= 120 && lng <= 122) return true;
  
  // Philippines
  if (lat >= 5 && lat <= 20 && lng >= 117 && lng <= 127) return true;
  // Indonesia
  if (lat >= -11 && lat <= 6 && lng >= 95 && lng <= 141) return true;
  // Papua New Guinea
  if (lat >= -12 && lat <= 0 && lng >= 140 && lng <= 155) return true;
  
  // Australia
  if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) return true;
  // New Zealand
  if (lat >= -47 && lat <= -34 && lng >= 166 && lng <= 179) return true;
  
  // Greenland
  if (lat >= 60 && lat <= 84 && lng >= -73 && lng <= -12) return true;
  
  return false;
}

/**
 * Generate uniform grid of land points on the globe
 * Uses a lat/lng grid with consistent spacing for clean appearance
 */
export function generateUniformLandPoints(
  latStep: number = 1.8,
  lngStep: number = 1.8,
  radius: number = GLOBE_RADIUS
): Float32Array {
  const positions: number[] = [];
  
  // Generate points on a uniform lat/lng grid
  for (let lat = -80; lat <= 80; lat += latStep) {
    // Adjust longitude step based on latitude to maintain uniform density
    const adjustedLngStep = lngStep / Math.max(0.3, Math.cos(lat * Math.PI / 180));
    const effectiveLngStep = Math.min(adjustedLngStep, 15); // Cap at 15 degrees
    
    for (let lng = -180; lng < 180; lng += effectiveLngStep) {
      if (isOnLand(lat, lng)) {
        const vec = latLngToVector3(lat, lng, radius);
        positions.push(vec.x, vec.y, vec.z);
      }
    }
  }
  
  return new Float32Array(positions);
}

/**
 * Generate capital city positions as Float32Array for instanced rendering
 */
export function generateCapitalPositions(
  capitals: Array<{ lat: number; lng: number }>,
  radius: number = GLOBE_RADIUS
): Float32Array {
  const positions = new Float32Array(capitals.length * 3);
  
  capitals.forEach((capital, i) => {
    const vec = latLngToVector3(capital.lat, capital.lng, radius * 1.002);
    positions[i * 3] = vec.x;
    positions[i * 3 + 1] = vec.y;
    positions[i * 3 + 2] = vec.z;
  });
  
  return positions;
}
