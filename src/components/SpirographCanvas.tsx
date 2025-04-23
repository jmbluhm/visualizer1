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
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  useEffect(() => {
    if (!contextRef.current) return;

    const animate = (timestamp: number) => {
      const ctx = contextRef.current;
      if (!ctx) return;

      // Calculate delta time for smooth animation
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const { movingShape, penDistance, fixedShape } = params;
      const movingRadius = movingShape.params.radius;
      const R = getFixedShapeRadius(fixedShape);

      if (fixedShape.type === 'ellipse') {
        ctx.save();
        ctx.rotate(fixedShape.params.rotation * Math.PI / 180);
      }

      // Use timestamp for smoother animation
      const t = deltaTime * 0.005; // Increase time scaling factor for faster animation
      const interpolatedAngle = angleRef.current + (params.animationSpeed * t);
      angleRef.current = interpolatedAngle;

      const x = (R - movingRadius) * Math.cos(interpolatedAngle) + penDistance * Math.cos(((R - movingRadius) / movingRadius) * interpolatedAngle);
      const y = (R - movingRadius) * Math.sin(interpolatedAngle) - penDistance * Math.sin(((R - movingRadius) / movingRadius) * interpolatedAngle);

      // Draw the line
      if (lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = getColorFromGradient(params.color, (interpolatedAngle % (Math.PI * 2)) / (Math.PI * 2));
        ctx.lineWidth = params.lineWidth;
        ctx.stroke();
      }

      lastPointRef.current = { x, y };

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