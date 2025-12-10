// Project lat/lng to 2D canvas coordinates
export function projectToCanvas(
  lat: number, lng: number, globeRotation: number,
  canvasWidth: number, canvasHeight: number, globeRadius: number
): { x: number; y: number; visible: boolean; depth: number } {
  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);
  const adjustedLng = lngRad + globeRotation;
  
  const x = Math.cos(latRad) * Math.sin(adjustedLng);
  const y = Math.sin(latRad);
  const z = Math.cos(latRad) * Math.cos(adjustedLng);
  
  return {
    x: canvasWidth / 2 + x * globeRadius,
    y: canvasHeight / 2 - y * globeRadius,
    visible: z > 0.05,
    depth: z,
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

// Draw animated arc
export function drawAnimatedArc(
  ctx: CanvasRenderingContext2D,
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  globeRotation: number,
  canvasWidth: number,
  canvasHeight: number,
  globeRadius: number,
  progress: number,
  fadeOpacity: number = 1
) {
  const numPoints = 40;
  const points: { x: number; y: number; visible: boolean }[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    if (t > progress) break;
    const pos = interpolateGreatCircle(start, end, t);
    const elevation = 1 + Math.sin(t * Math.PI) * 0.15;
    const p = projectToCanvas(pos.lat, pos.lng, globeRotation, canvasWidth, canvasHeight, globeRadius * elevation);
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
