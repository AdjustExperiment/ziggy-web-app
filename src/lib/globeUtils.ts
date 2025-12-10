// Convert lat/lng to 3D position on sphere
export function latLngToXYZ(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

// Project 3D point to 2D canvas coordinates
export function projectToCanvas(
  lat: number,
  lng: number,
  globeRotation: number,
  canvasWidth: number,
  canvasHeight: number,
  globeRadius: number
): { x: number; y: number; visible: boolean } {
  // Adjust longitude by globe rotation
  const adjustedLng = lng - (globeRotation * 180 / Math.PI);
  
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (adjustedLng + 180) * (Math.PI / 180);
  
  const x = -Math.sin(phi) * Math.cos(theta);
  const y = Math.cos(phi);
  const z = Math.sin(phi) * Math.sin(theta);
  
  // Check if point is on visible hemisphere (z > 0 means facing camera)
  const visible = z > -0.1;
  
  // Project to 2D
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  
  return {
    x: centerX + x * globeRadius,
    y: centerY - y * globeRadius,
    visible,
  };
}

// Great circle interpolation for smooth arcs
export function interpolateGreatCircle(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  t: number // 0 to 1
): { lat: number; lng: number } {
  const lat1 = start.lat * Math.PI / 180;
  const lng1 = start.lng * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const lng2 = end.lng * Math.PI / 180;
  
  // Calculate angular distance
  const d = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
  );
  
  if (d < 0.0001) {
    return { lat: start.lat, lng: start.lng };
  }
  
  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  
  const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
  const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);
  
  return {
    lat: Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI,
    lng: Math.atan2(y, x) * 180 / Math.PI,
  };
}

// Draw an animated arc between two projected points
export function drawArc(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number; visible: boolean }[],
  progress: number, // 0 to 1
  color: string = 'hsl(0, 72%, 51%)' // Primary red
) {
  if (points.length < 2) return;
  
  // Filter to only visible points
  const visibleSegments: { x: number; y: number }[][] = [];
  let currentSegment: { x: number; y: number }[] = [];
  
  for (const point of points) {
    if (point.visible) {
      currentSegment.push({ x: point.x, y: point.y });
    } else if (currentSegment.length > 0) {
      visibleSegments.push(currentSegment);
      currentSegment = [];
    }
  }
  if (currentSegment.length > 0) {
    visibleSegments.push(currentSegment);
  }
  
  // Draw each visible segment
  for (const segment of visibleSegments) {
    if (segment.length < 2) continue;
    
    const pointsToDraw = Math.ceil(segment.length * progress);
    if (pointsToDraw < 2) continue;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Create gradient along arc
    const gradient = ctx.createLinearGradient(
      segment[0].x, segment[0].y,
      segment[pointsToDraw - 1].x, segment[pointsToDraw - 1].y
    );
    gradient.addColorStop(0, 'hsla(0, 72%, 51%, 0.3)');
    gradient.addColorStop(0.5, 'hsla(0, 72%, 51%, 0.8)');
    gradient.addColorStop(1, 'hsla(0, 72%, 61%, 1)');
    ctx.strokeStyle = gradient;
    
    ctx.moveTo(segment[0].x, segment[0].y);
    
    for (let i = 1; i < pointsToDraw; i++) {
      ctx.lineTo(segment[i].x, segment[i].y);
    }
    
    ctx.stroke();
    
    // Draw glowing dot at the end of the arc
    if (progress > 0 && progress < 1) {
      const endPoint = segment[pointsToDraw - 1];
      ctx.beginPath();
      ctx.fillStyle = 'hsl(0, 72%, 61%)';
      ctx.shadowColor = 'hsl(0, 72%, 51%)';
      ctx.shadowBlur = 6;
      ctx.arc(endPoint.x, endPoint.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
