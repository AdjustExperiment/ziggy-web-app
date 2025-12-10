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
  ctx: CanvasRenderingContext2D, start: { lat: number; lng: number }, end: { lat: number; lng: number },
  globeRotation: number, canvasWidth: number, canvasHeight: number, globeRadius: number, progress: number
) {
  const numPoints = 40;
  const points: { x: number; y: number; visible: boolean }[] = [];
  const lat1 = start.lat * Math.PI / 180, lng1 = start.lng * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180, lng2 = end.lng * Math.PI / 180;
  const angularDist = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1));
  const maxElevation = Math.min(angularDist * 0.15, 0.2);

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const pos = interpolateGreatCircle(start, end, t);
    const elevation = 4 * maxElevation * t * (1 - t);
    const proj = projectToCanvas(pos.lat, pos.lng, globeRotation, canvasWidth, canvasHeight, globeRadius * (1 + elevation));
    points.push(proj);
  }

  const visiblePoints = points.filter(p => p.visible);
  if (visiblePoints.length < 2) return;

  const pointsToDraw = Math.max(2, Math.ceil(visiblePoints.length * Math.min(progress, 1)));
  
  ctx.save();
  ctx.shadowColor = 'hsla(0, 72%, 50%, 0.6)';
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.strokeStyle = 'hsl(0, 72%, 55%)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.moveTo(visiblePoints[0].x, visiblePoints[0].y);
  for (let i = 1; i < pointsToDraw; i++) ctx.lineTo(visiblePoints[i].x, visiblePoints[i].y);
  ctx.stroke();
  ctx.restore();

  if (progress > 0 && progress < 1 && pointsToDraw > 0) {
    const head = visiblePoints[pointsToDraw - 1];
    ctx.save();
    ctx.shadowColor = 'hsl(0, 72%, 60%)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.fillStyle = 'hsl(0, 72%, 70%)';
    ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Draw pulsing marker
export function drawPulsingMarker(ctx: CanvasRenderingContext2D, x: number, y: number, pulsePhase: number, depth: number) {
  const pulseScale = 1 + Math.sin(pulsePhase) * 0.4;
  const opacity = 0.4 + depth * 0.6;

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 6 * pulseScale, 0, Math.PI * 2);
  ctx.strokeStyle = `hsla(0, 72%, 50%, ${(0.5 - pulseScale * 0.15) * opacity})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowColor = 'hsl(0, 72%, 50%)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(0, 72%, 60%, ${opacity})`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(0, 72%, 85%, ${opacity})`;
  ctx.fill();
  ctx.restore();
}
