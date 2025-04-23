import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { SpirographParams, GradientColor, FixedShapeConfig } from '../types';

interface Props {
  params: SpirographParams;
  isPlaying: boolean;
}

export interface SpirographCanvasRef {
  clearCanvas: () => void;
  downloadImage: () => void;
}

const getColorFromGradient = (gradient: GradientColor | string, progress: number): string => {
  if (typeof gradient === 'string') {
    return gradient;
  }

  const { colors } = gradient;
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
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const angleRef = useRef<number>(0);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastTimeRef = useRef<number>(0);
  const requestRef = useRef<number | undefined>(undefined);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    lastPointRef.current = null;
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
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    contextRef.current = context;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      context.translate(canvas.width / 2, canvas.height / 2);
      
      // Clear canvas with white background
      context.fillStyle = '#ffffff';
      context.fillRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      
      // Draw fixed shape guide
      drawFixedShape(context, params.fixedShape);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [params.fixedShape]);

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

      const x = (R - movingRadius) * Math.cos(angle) + penDistance * Math.cos(((R - movingRadius) / movingRadius) * angle);
      const y = (R - movingRadius) * Math.sin(angle) - penDistance * Math.sin(((R - movingRadius) / movingRadius) * angle);
      
      return { x, y };
    };

    const animate = (timestamp: number) => {
      const ctx = contextRef.current;
      if (!ctx) return;

      // Calculate delta time for smooth animation
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const { fixedShape } = params;

      if (fixedShape.type === 'ellipse') {
        ctx.save();
        ctx.rotate(fixedShape.params.rotation * Math.PI / 180);
      }

      // Draw guide shapes
      drawFixedShape(ctx, fixedShape);
      drawMovingCircle(ctx, angleRef.current);

      // Use timestamp for smoother animation
      const t = deltaTime * 0.005;
      const currentAngle = angleRef.current;
      const nextAngle = currentAngle + (params.animationSpeed * t);

      // Add line smoothing settings
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 0.5;
      ctx.shadowColor = typeof params.color === 'string' ? params.color : params.color.colors[0].color;

      // Interpolate points for smoother lines at high speeds
      if (lastPointRef.current) {
        const steps = Math.max(1, Math.ceil(params.animationSpeed * 20)); // More interpolation points at higher speeds
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);

        for (let i = 1; i <= steps; i++) {
          const progress = i / steps;
          const interpolatedAngle = currentAngle + (params.animationSpeed * t * progress);
          const point = calculatePoint(interpolatedAngle);
          
          // Get color for this segment
          const colorProgress = (interpolatedAngle % (Math.PI * 2)) / (Math.PI * 2);
          ctx.strokeStyle = getColorFromGradient(params.color, colorProgress);
          ctx.lineWidth = params.lineWidth;
          
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

      if (fixedShape.type === 'ellipse') {
        ctx.restore();
      }

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
  }, [params, isPlaying]);

  return <canvas ref={canvasRef} style={{ background: '#ffffff' }} />;
});