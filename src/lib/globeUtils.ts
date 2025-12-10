// Project lat/lng to 2D canvas coordinates matching cobe's coordinate system
export function projectToCanvas(
  lat: number, lng: number, phi: number, theta: number,
  canvasWidth: number, canvasHeight: number, globeRadius: number
): { x: number; y: number; visible: boolean; depth: number } {
  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);
  
  // Convert to 3D cartesian coordinates on unit sphere
  let x = Math.cos(latRad) * Math.cos(lngRad);
  let y = Math.sin(latRad);
  let z = Math.cos(latRad) * Math.sin(lngRad);
  
  // Rotate around Y-axis by phi (horizontal rotation) - matches cobe
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const x1 = x * cosP + z * sinP;
  const z1 = -x * sinP + z * cosP;
  
  // Rotate around X-axis by theta (vertical tilt) - matches cobe
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const y2 = y * cosT - z1 * sinT;
  const z2 = y * sinT + z1 * cosT;
  
  return {
    x: canvasWidth / 2 + x1 * globeRadius,
    y: canvasHeight / 2 - y2 * globeRadius,
    visible: z2 > 0,
    depth: z2,
  };
}

// Great circle interpolation
export function interpolateGreatCircle(
  start: { lat: number; lng: number }, end: { lat: number; lng: number }, t: number
): { lat: number; lng: number } {
  const lat1 = start.lat * Math.PI / 180, lng1 = start.lng * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180, lng2 = end.lng * Math.PI / 180;
  const d = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1));
  if (d < 0.0001) return { lat: start.lat, lng: start.lng };
  const A = Math.sin((1 - t) * d) / Math.sin(d), B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
  const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);
  return { lat: Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI, lng: Math.atan2(y, x) * 180 / Math.PI };
}

// Draw animated arc - endpoints touch globe surface exactly
export function drawAnimatedArc(
  ctx: CanvasRenderingContext2D,
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  phi: number,
  theta: number,
  canvasWidth: number,
  canvasHeight: number,
  globeRadius: number,
  progress: number,
  fadeOpacity: number = 1
) {
  const numPoints = 40;
  const points: { x: number; y: number; visible: boolean }[] = [];

  // Clamp progress for drawing to max 1.0
  const drawProgress = Math.min(progress, 1.0);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    if (t > drawProgress) break;
    const pos = interpolateGreatCircle(start, end, t);
    // Small elevation so arcs are visible above surface
    const elevation = 1.02;
    const p = projectToCanvas(pos.lat, pos.lng, phi, theta, canvasWidth, canvasHeight, globeRadius * elevation);
    points.push(p);
  }

  const visiblePoints = points.filter(p => p.visible);
  if (visiblePoints.length < 2) return;

  ctx.save();
  ctx.globalAlpha = fadeOpacity;
  ctx.shadowColor = 'hsla(0, 72%, 50%, 0.6)';
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.moveTo(visiblePoints[0].x, visiblePoints[0].y);
  for (let i = 1; i < visiblePoints.length; i++) {
    ctx.lineTo(visiblePoints[i].x, visiblePoints[i].y);
  }

  const gradient = ctx.createLinearGradient(
    visiblePoints[0].x, visiblePoints[0].y,
    visiblePoints[visiblePoints.length - 1].x, visiblePoints[visiblePoints.length - 1].y
  );
  gradient.addColorStop(0, 'hsla(0, 72%, 50%, 0.3)');
  gradient.addColorStop(0.5, 'hsla(0, 72%, 55%, 0.7)');
  gradient.addColorStop(1, 'hsla(0, 72%, 60%, 0.9)');

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();
}

// Draw static glowing marker (no pulsing)
export function drawGlowingMarker(ctx: CanvasRenderingContext2D, x: number, y: number, depth: number) {
  const opacity = 0.5 + depth * 0.5;

  ctx.save();
  
  // Outer glow halo
  ctx.shadowColor = 'hsl(0, 72%, 50%)';
  ctx.shadowBlur = 12;
  
  // Main red dot
  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(0, 72%, 55%, ${opacity})`;
  ctx.fill();
  
  // Bright center highlight
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(0, 72%, 80%, ${opacity})`;
  ctx.fill();
  
  ctx.restore();
}
