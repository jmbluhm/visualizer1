import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { SpirographParams, GradientColor, FixedShapeConfig } from '../types';

interface Props {
  params: SpirographParams;
  isPlaying: boolean;
}

export interface SpirographCanvasRef {
  clearCanvas: () => void;
  downloadImage: () => void;
}

const getColorFromGradient = (color: string | GradientColor, progress: number): string => {
  if (typeof color === 'string') {
    return color;
  }

  const { colors } = color;
  if (colors.length === 1) {
    return colors[0].color;
  }

  // Find the two colors to interpolate between
  let startIndex = 0;
  for (let i = 0; i < colors.length - 1; i++) {
    if (progress >= colors[i].position && progress <= colors[i + 1].position) {
      startIndex = i;
      break;
    }
  }

  const color1 = colors[startIndex].color;
  const color2 = colors[startIndex + 1].color;
  const t = (progress - colors[startIndex].position) / (colors[startIndex + 1].position - colors[startIndex].position);

  // Parse hex colors
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const getFixedShapeRadius = (fixedShape: FixedShapeConfig): number => {
  switch (fixedShape.type) {
    case 'circle':
      return fixedShape.params.radius;
    case 'square': {
      const { edgeLength } = fixedShape.params;
      return (edgeLength * Math.sqrt(2)) / 2;
    }
    case 'star':
      return fixedShape.params.outerRadius;
    case 'hexagon':
      return fixedShape.params.sideLength;
    case 'ellipse':
      return fixedShape.params.majorAxis / 2;
    default:
      return 0;
  }
};

export const SpirographCanvas = forwardRef<SpirographCanvasRef, Props>(({ params, isPlaying }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const overlayContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const angleRef = useRef<number>(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const requestRef = useRef<number | undefined>(undefined);

  // Add state for pan and zoom
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1
  });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    // Clear the entire canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = params.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Reset drawing state but keep angle for continuous drawing
    lastPointRef.current = null;

    // Redraw guide shapes
    if (params.fixedShape.type === 'ellipse') {
      ctx.save();
      ctx.rotate(params.fixedShape.params.rotation * Math.PI / 180);
    }
    
    drawFixedShape(ctx, params.fixedShape);
    drawMovingCircle(ctx, angleRef.current);

    if (params.fixedShape.type === 'ellipse') {
      ctx.restore();
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'spirograph.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  useImperativeHandle(ref, () => ({
    clearCanvas,
    downloadImage
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const context = canvas.getContext('2d');
    const overlayContext = overlayCanvas.getContext('2d');
    if (!context || !overlayContext) return;

    contextRef.current = context;
    overlayContextRef.current = overlayContext;

    const resizeCanvas = () => {
      // Set up main canvas
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      context.translate(canvas.width / 2, canvas.height / 2);
      context.fillStyle = '#ffffff';
      context.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

      // Set up overlay canvas
      overlayCanvas.width = window.innerWidth;
      overlayCanvas.height = window.innerHeight;
      overlayContext.translate(overlayCanvas.width / 2, overlayCanvas.height / 2);
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;

      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      const scaleFactor = delta > 0 ? 0.9 : 1.1;
      
      // Calculate mouse position relative to canvas center
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - canvas.width / 2;
      const mouseY = e.clientY - rect.top - canvas.height / 2;

      setTransform(prev => ({
        x: prev.x + mouseX * (1 - scaleFactor),
        y: prev.y + mouseY * (1 - scaleFactor),
        scale: Math.max(0.1, Math.min(10, prev.scale * scaleFactor))
      }));
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const drawFixedShape = (ctx: CanvasRenderingContext2D, fixedShape: FixedShapeConfig) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
    ctx.lineWidth = 1;

    switch (fixedShape.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, fixedShape.params.radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'square': {
        const { edgeLength, cornerRadius } = fixedShape.params;
        const halfEdge = edgeLength / 2;
        if (cornerRadius > 0) {
          ctx.beginPath();
          ctx.moveTo(-halfEdge + cornerRadius, -halfEdge);
          ctx.lineTo(halfEdge - cornerRadius, -halfEdge);
          ctx.arc(halfEdge - cornerRadius, -halfEdge + cornerRadius, cornerRadius, -Math.PI / 2, 0);
          ctx.lineTo(halfEdge, halfEdge - cornerRadius);
          ctx.arc(halfEdge - cornerRadius, halfEdge - cornerRadius, cornerRadius, 0, Math.PI / 2);
          ctx.lineTo(-halfEdge + cornerRadius, halfEdge);
          ctx.arc(-halfEdge + cornerRadius, halfEdge - cornerRadius, cornerRadius, Math.PI / 2, Math.PI);
          ctx.lineTo(-halfEdge, -halfEdge + cornerRadius);
          ctx.arc(-halfEdge + cornerRadius, -halfEdge + cornerRadius, cornerRadius, Math.PI, -Math.PI / 2);
          ctx.stroke();
        } else {
          ctx.strokeRect(-halfEdge, -halfEdge, edgeLength, edgeLength);
        }
        break;
      }
      case 'star': {
        const { outerRadius, innerRadius, points } = fixedShape.params;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / points;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'hexagon': {
        const { sideLength, cornerRadius } = fixedShape.params;
        const radius = sideLength;
        if (cornerRadius > 0) {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const nextAngle = ((i + 1) * Math.PI) / 3;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            const nextX = radius * Math.cos(nextAngle);
            const nextY = radius * Math.sin(nextAngle);
            
            if (i === 0) {
              ctx.moveTo(x, y);
            }
            
            const dx = nextX - x;
            const dy = nextY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const radiusRatio = cornerRadius / distance;
            
            const p1x = x + dx * radiusRatio;
            const p1y = y + dy * radiusRatio;
            const p2x = nextX - dx * radiusRatio;
            const p2y = nextY - dy * radiusRatio;
            
            ctx.lineTo(p1x, p1y);
            ctx.arcTo(nextX, nextY, p2x, p2y, cornerRadius);
            ctx.lineTo(p2x, p2y);
          }
          ctx.closePath();
        } else {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        }
        ctx.stroke();
        break;
      }
      case 'ellipse': {
        const { majorAxis, minorAxis, rotation } = fixedShape.params;
        ctx.beginPath();
        ctx.ellipse(0, 0, majorAxis / 2, minorAxis / 2, rotation * Math.PI / 180, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  };

  const drawMovingCircle = (ctx: CanvasRenderingContext2D, currentAngle: number) => {
    const { movingShape, penDistance, fixedShape } = params;
    const movingRadius = movingShape.params.radius;
    const R = getFixedShapeRadius(fixedShape);

    // Calculate center of moving circle
    const centerX = (R - movingRadius) * Math.cos(currentAngle);
    const centerY = (R - movingRadius) * Math.sin(currentAngle);

    // Draw moving circle
    ctx.save();
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, movingRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw pen point
    const penX = centerX + penDistance * Math.cos(((R - movingRadius) / movingRadius) * currentAngle);
    const penY = centerY - penDistance * Math.sin(((R - movingRadius) / movingRadius) * currentAngle);
    ctx.beginPath();
    ctx.arc(penX, penY, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fill();

    // Draw line from center to pen
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(penX, penY);
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.1)';
    ctx.stroke();
    ctx.restore();
  };

  useEffect(() => {
    if (!contextRef.current) return;

    const calculatePoint = (angle: number) => {
      const { movingShape, penDistance, fixedShape } = params;
      const movingRadius = movingShape.params.radius;
      const R = getFixedShapeRadius(fixedShape);

      let baseX: number;
      let baseY: number;

      switch (fixedShape.type) {
        case 'circle': {
          baseX = R * Math.cos(angle);
          baseY = R * Math.sin(angle);
          break;
        }
        case 'square': {
          const { edgeLength, cornerRadius } = fixedShape.params;
          const halfEdge = edgeLength / 2;
          const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const sideAngle = Math.PI / 2;

          if (cornerRadius > 0) {
            // Handle rounded corners
            const cornerAngle = Math.atan2(cornerRadius, halfEdge - cornerRadius);
            if (normalizedAngle < cornerAngle || normalizedAngle >= 2 * Math.PI - cornerAngle) {
              // Right edge
              baseX = halfEdge;
              baseY = -halfEdge + cornerRadius + (normalizedAngle * (edgeLength - 2 * cornerRadius)) / sideAngle;
            } else if (normalizedAngle < Math.PI / 2 + cornerAngle) {
              // Bottom edge
              baseX = halfEdge - cornerRadius - ((normalizedAngle - cornerAngle) * (edgeLength - 2 * cornerRadius)) / sideAngle;
              baseY = halfEdge;
            } else if (normalizedAngle < Math.PI + cornerAngle) {
              // Left edge
              baseX = -halfEdge;
              baseY = halfEdge - cornerRadius - ((normalizedAngle - (Math.PI / 2 + cornerAngle)) * (edgeLength - 2 * cornerRadius)) / sideAngle;
            } else if (normalizedAngle < 3 * Math.PI / 2 + cornerAngle) {
              // Top edge
              baseX = -halfEdge + cornerRadius + ((normalizedAngle - (Math.PI + cornerAngle)) * (edgeLength - 2 * cornerRadius)) / sideAngle;
              baseY = -halfEdge;
            } else {
              // Corner arcs
              const cornerCenter = {
                x: Math.sign(Math.cos(normalizedAngle)) * (halfEdge - cornerRadius),
                y: Math.sign(Math.sin(normalizedAngle)) * (halfEdge - cornerRadius)
              };
              const cornerAngleOffset = normalizedAngle - Math.floor(normalizedAngle / sideAngle) * sideAngle;
              baseX = cornerCenter.x + cornerRadius * Math.cos(cornerAngleOffset);
              baseY = cornerCenter.y + cornerRadius * Math.sin(cornerAngleOffset);
            }
          } else {
            // Handle sharp corners
            const side = Math.floor(normalizedAngle / sideAngle);
            const sideProgress = (normalizedAngle % sideAngle) / sideAngle;

            switch (side) {
              case 0: // Right side
                baseX = halfEdge;
                baseY = -halfEdge + edgeLength * sideProgress;
                break;
              case 1: // Bottom side
                baseX = halfEdge - edgeLength * sideProgress;
                baseY = halfEdge;
                break;
              case 2: // Left side
                baseX = -halfEdge;
                baseY = halfEdge - edgeLength * sideProgress;
                break;
              default: // Top side
                baseX = -halfEdge + edgeLength * sideProgress;
                baseY = -halfEdge;
                break;
            }
          }
          break;
        }
        case 'ellipse': {
          const { majorAxis, minorAxis, rotation } = fixedShape.params;
          const rotatedAngle = angle - rotation * Math.PI / 180;
          baseX = (majorAxis / 2) * Math.cos(rotatedAngle);
          baseY = (minorAxis / 2) * Math.sin(rotatedAngle);
          
          // Rotate the point back
          const cos = Math.cos(rotation * Math.PI / 180);
          const sin = Math.sin(rotation * Math.PI / 180);
          const rotatedX = baseX * cos - baseY * sin;
          const rotatedY = baseX * sin + baseY * cos;
          baseX = rotatedX;
          baseY = rotatedY;
          break;
        }
        case 'star': {
          const { outerRadius, innerRadius, points } = fixedShape.params;
          const pointAngle = Math.PI / points;
          const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const currentPoint = Math.floor(normalizedAngle / pointAngle);
          const progress = (normalizedAngle % pointAngle) / pointAngle;

          const radius1 = currentPoint % 2 === 0 ? outerRadius : innerRadius;
          const radius2 = currentPoint % 2 === 0 ? innerRadius : outerRadius;
          const currentRadius = radius1 + (radius2 - radius1) * progress;
          baseX = currentRadius * Math.cos(normalizedAngle);
          baseY = currentRadius * Math.sin(normalizedAngle);
          break;
        }
        case 'hexagon': {
          const { sideLength, cornerRadius } = fixedShape.params;
          const angleStep = Math.PI / 3;
          const normalizedAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const currentVertex = Math.floor(normalizedAngle / angleStep);
          const progress = (normalizedAngle % angleStep) / angleStep;

          if (cornerRadius > 0) {
            const angle1 = currentVertex * angleStep;
            const angle2 = (currentVertex + 1) * angleStep;
            const point1 = {
              x: sideLength * Math.cos(angle1),
              y: sideLength * Math.sin(angle1)
            };
            const point2 = {
              x: sideLength * Math.cos(angle2),
              y: sideLength * Math.sin(angle2)
            };

            // Handle rounded corners
            const cornerAngle = Math.atan2(cornerRadius, sideLength);
            if (progress < cornerAngle / angleStep) {
              // Start of corner
              const cornerCenter = {
                x: point1.x - cornerRadius * Math.cos(angle1 - Math.PI / 2),
                y: point1.y - cornerRadius * Math.sin(angle1 - Math.PI / 2)
              };
              const cornerProgress = progress * angleStep / cornerAngle;
              baseX = cornerCenter.x + cornerRadius * Math.cos(angle1 + cornerProgress * Math.PI / 2);
              baseY = cornerCenter.y + cornerRadius * Math.sin(angle1 + cornerProgress * Math.PI / 2);
            } else if (progress > 1 - cornerAngle / angleStep) {
              // End of corner
              const cornerCenter = {
                x: point2.x - cornerRadius * Math.cos(angle2 + Math.PI / 2),
                y: point2.y - cornerRadius * Math.sin(angle2 + Math.PI / 2)
              };
              const cornerProgress = (progress - 1 + cornerAngle / angleStep) * angleStep / cornerAngle;
              baseX = cornerCenter.x + cornerRadius * Math.cos(angle2 - (1 - cornerProgress) * Math.PI / 2);
              baseY = cornerCenter.y + cornerRadius * Math.sin(angle2 - (1 - cornerProgress) * Math.PI / 2);
            } else {
              // Straight edge
              const edgeProgress = (progress - cornerAngle / angleStep) / (1 - 2 * cornerAngle / angleStep);
              baseX = point1.x + (point2.x - point1.x) * edgeProgress;
              baseY = point1.y + (point2.y - point1.y) * edgeProgress;
            }
          } else {
            // Sharp corners
            const angle1 = currentVertex * angleStep;
            const angle2 = (currentVertex + 1) * angleStep;
            const x1 = sideLength * Math.cos(angle1);
            const y1 = sideLength * Math.sin(angle1);
            const x2 = sideLength * Math.cos(angle2);
            const y2 = sideLength * Math.sin(angle2);

            baseX = x1 + (x2 - x1) * progress;
            baseY = y1 + (y2 - y1) * progress;
          }
          break;
        }
        default:
          baseX = R * Math.cos(angle);
          baseY = R * Math.sin(angle);
      }

      // Calculate pen position relative to the moving circle center
      const penAngle = ((R - movingRadius) / movingRadius) * angle;
      const penX = baseX - movingRadius * Math.cos(angle) + penDistance * Math.cos(penAngle);
      const penY = baseY - movingRadius * Math.sin(angle) - penDistance * Math.sin(penAngle);

      return { x: penX, y: penY };
    };

    const animate = (timestamp: number) => {
      const ctx = contextRef.current;
      const overlayCtx = overlayContextRef.current;
      if (!ctx || !overlayCtx || !overlayCanvasRef.current) return;

      // Clear only the overlay canvas for guide shapes
      overlayCtx.save();
      overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
      overlayCtx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);
      overlayCtx.restore();

      // Apply transform to both canvases
      ctx.save();
      overlayCtx.save();

      // Center the canvas
      ctx.translate(canvasRef.current!.width / 2, canvasRef.current!.height / 2);
      overlayCtx.translate(overlayCanvasRef.current.width / 2, overlayCanvasRef.current.height / 2);

      // Apply pan and zoom
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.scale, transform.scale);
      overlayCtx.translate(transform.x, transform.y);
      overlayCtx.scale(transform.scale, transform.scale);

      // Draw guide shapes on the overlay canvas
      drawFixedShape(overlayCtx, params.fixedShape);
      drawMovingCircle(overlayCtx, angleRef.current);

      // Use timestamp for smoother animation with adjusted speed calculation
      const t = timestamp * 0.0005; // Reduced from 0.005 to slow down the base speed
      const currentAngle = angleRef.current;
      const nextAngle = currentAngle + (params.animationSpeed * t * 0.1); // Added 0.1 multiplier to allow for much slower speeds

      // Draw the actual spirograph on the main canvas
      if (lastPointRef.current) {
        const steps = Math.max(1, Math.ceil(params.animationSpeed * 20));
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);

        for (let i = 1; i <= steps; i++) {
          const progress = i / steps;
          const interpolatedAngle = currentAngle + (params.animationSpeed * t * 0.1 * progress);
          const point = calculatePoint(interpolatedAngle);
          
          const colorProgress = (interpolatedAngle % (Math.PI * 2)) / (Math.PI * 2);
          ctx.strokeStyle = getColorFromGradient(params.penColor.value, colorProgress);
          ctx.lineWidth = params.lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.lineTo(point.x, point.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
        }
      }

      // Update last point and angle
      const newPoint = calculatePoint(nextAngle);
      lastPointRef.current = newPoint;
      angleRef.current = nextAngle;

      ctx.restore();
      overlayCtx.restore();

      if (isPlaying) {
        requestRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [params, isPlaying, transform]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: params.backgroundColor,
          cursor: isDraggingRef.current ? 'grabbing' : 'grab'
        }}
      />
      <canvas
        ref={overlayCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
});